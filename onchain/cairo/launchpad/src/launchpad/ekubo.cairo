use afk_launchpad::exchanges::ekubo::launcher::{
    IEkuboLauncherDispatcher, IEkuboLauncherDispatcherTrait, EkuboLP
};

use afk_launchpad::launchpad::calcul::{
    calculate_starting_price_launch, calculate_slope, calculate_pricing,
    get_amount_by_type_of_coin_or_quote, get_coin_amount_by_quote_amount
};
use afk_launchpad::launchpad::errors;
use afk_launchpad::launchpad::helpers::{distribute_team_alloc, check_common_launch_parameters};
use afk_launchpad::launchpad::math::{PercentageMath, pow_256};
use afk_launchpad::launchpad::utils::{
    sort_tokens, get_initial_tick_from_starting_price, get_next_tick_bounds, unique_count,
    calculate_aligned_bound_mag
};
use afk_launchpad::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyCoin, TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch,
    SetJediswapNFTRouterV2, SetJediswapV2Factory, SupportedExchanges, LiquidityCreated,
    LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters,
    LaunchParameters, EkuboLP, CallbackData, EkuboLaunchParameters, LaunchCallback, LiquidityType,
    EkuboLiquidityParameters, LiquidityParameters,
    // MemecoinCreated, MemecoinLaunched
};
use afk_launchpad::utils::{sqrt};
use core::num::traits::Zero;
use ekubo::components::shared_locker::{call_core_with_callback, consume_callback_data};
use ekubo::interfaces::core::{ICoreDispatcher, ICoreDispatcherTrait, ILocker};
use ekubo::interfaces::erc20::{
    IERC20Dispatcher as EKIERC20Dispatcher, IERC20DispatcherTrait as EKIERC20DispatcherTrait
};
use ekubo::interfaces::positions::{IPositions, IPositionsDispatcher, IPositionsDispatcherTrait};
use ekubo::interfaces::router::{IRouterDispatcher, IRouterDispatcherTrait};
use ekubo::interfaces::token_registry::{ITokenRegistryDispatcher, ITokenRegistryDispatcherTrait,};
use ekubo::types::bounds::{Bounds};
use ekubo::types::keys::PoolKey;
use ekubo::types::{i129::i129};

use starknet::{get_contract_address, ContractAddress, ClassHash};

#[starknet::interface]
trait IEkuboAdapter<TContractState> {
    fn add_liquidity_ekubo_bonding_curve(
        ref self: TContractState,
        launch: TokenLaunch,
        ekubo_core_address: ContractAddress,
        ekubo_exchange_address: ContractAddress,
        positions_ekubo: ContractAddress
        // params: EkuboLaunchParameters
    ) -> (u64, EkuboLP);
}


#[starknet::component]
pub mod ekubo_adapter {
    use core::num::traits::Zero;
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::starknet::{ContractAddress, get_caller_address};
    use super::Errors;

    #[storage]
    pub struct Storage {
        owner: ContractAddress,
        factory_address: ContractAddress,
        ekubo_registry: ContractAddress,
        core: ContractAddress,
        positions: ContractAddress,
        ekubo_exchange_address: ContractAddress
    }


    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn initializer(
            ref self: ComponentState<TContractState>,
            owner: ContractAddress,
            factory_address: ContractAddress,
            ekubo_registry: ContractAddress,
            core: ContractAddress,
            positions: ContractAddress,
            ekubo_exchange_address: ContractAddress
        ) {
            self.factory_address.write(factory_address);
            self.ekubo_registry.write(ekubo_registry);
            self.core.write(core);
            self.positions.write(positions);
            self.ekubo_exchange_address.write(ekubo_exchange_address);
        }
    }

    #[embeddable_as(EkuboAdapter)]
    impl EkuboAdapterImpl<
        TContractState, +HasComponent<TContractState>
    > of super::IEkuboAdapter<ComponentState<TContractState>> {
        fn add_liquidity_ekubo_bonding_curve(
            ref self: ComponentState<TContractState>,
            launch: TokenLaunch,
            ekubo_core_address: ContractAddress,
            ekubo_exchange_address: ContractAddress,
            positions_ekubo: ContractAddress
            // params: EkuboLaunchParameters
        ) -> (u64, EkuboLP) {
            // TODO params of Ekubo launch
            // Init price and params of liquidity

            // TODO assert of threshold and MC reached
            // let launch = self.launched_coins.read(coin_address);
            assert(launch.liquidity_raised >= launch.threshold_liquidity, 'no threshold raised');
            assert(launch.is_liquidity_launch == false, 'liquidity already launch');

            // TODO calculate price

            let starting_price: i129 = calculate_starting_price_launch(
                launch.initial_pool_supply.clone(), launch.threshold_liquidity.clone()
            );
            let lp_meme_supply = launch.initial_pool_supply;

            // let lp_meme_supply = launch.initial_available_supply - launch.available_supply;

            let params: EkuboLaunchParameters = EkuboLaunchParameters {
                owner: launch.owner,
                token_address: launch.token_address,
                quote_address: launch.token_quote.token_address,
                lp_supply: lp_meme_supply,
                // lp_supply: launch.liquidity_raised,
                pool_params: EkuboPoolParameters {
                    fee: 0xc49ba5e353f7d00000000000000000,
                    tick_spacing: 5000,
                    starting_price,
                    bound: calculate_aligned_bound_mag(starting_price, 2, 5000),
                }
            };

            // println!("Bound computed: {}", params.pool_params.bound);

            // Register the token in Ekubo Registry
            let memecoin = EKIERC20Dispatcher { contract_address: params.token_address };
            //TODO token decimal, amount of 1 token?
            // println!("RIGHT HERE: {}", 1);

            // let dex_address = self.core.read();
            // let positions_ekubo = self.positions.read();
            memecoin.approve(ekubo_exchange_address, lp_meme_supply);
            memecoin.approve(ekubo_core_address, lp_meme_supply);
            memecoin.approve(positions_ekubo, lp_meme_supply);
            assert!(memecoin.contract_address == params.token_address, "Token address mismatch");
            let base_token = EKIERC20Dispatcher { contract_address: params.quote_address };
            //TODO token decimal, amount of 1 token?
            // let pool = self.launched_coins.read(coin_address);
            base_token.approve(ekubo_exchange_address, launch.liquidity_raised);
            base_token.approve(ekubo_core_address, launch.liquidity_raised);
            let core = ICoreDispatcher { contract_address: ekubo_core_address };
            // Call the core with a callback to deposit and mint the LP tokens.

            // println!("HERE launch callback: {}", 2);

            let (id, position) = call_core_with_callback::<
                // let span = call_core_with_callbac00k::<
                CallbackData, (u64, EkuboLP)
            >(core, @CallbackData::LaunchCallback(LaunchCallback { params }));
            // let (id,position) = self._supply_liquidity_ekubo_and_mint(coin_address, params);
            //TODO emit event
            let id_cast: u256 = id.try_into().unwrap();

            // println!("RIGHT HERE: {}", 3);

            // let mut launch_to_update = self.launched_coins.read(coin_address);
            // launch_to_update.is_liquidity_launch = true;
            // self.launched_coins.entry(coin_address).write(launch_to_update.clone());

            // println!("RIGHT HERE: {}", 4);

            // self
            //     .emit(
            //         LiquidityCreated {
            //             id: id_cast,
            //             pool: coin_address,
            //             asset: coin_address,
            //             quote_token_address: base_token.contract_address,
            //             owner: launch.owner,
            //             exchange: SupportedExchanges::Ekubo,
            //             is_unruggable: false
            //         }
            //     );

            (id, position)
        }
    }

    #[external(v0)]
    impl LockerImpl of ILocker<ContractState> {
        /// Callback function called by the core contract.
        fn locked(ref self: ContractState, id: u32, data: Span<felt252>) -> Span<felt252> {
            let core_address = self.core.read();
            let core = ICoreDispatcher { contract_address: core_address };
            // Register the token in Ekubo Registry
            let registry_address = self.ekubo_registry.read();
            println!("registry_address : {:?}", registry_address);
            // let dex_address = self.core.read();
            let ekubo_core_address = self.core.read();
            let ekubo_exchange_address = self.ekubo_exchange_address.read();
            let positions_address = self.positions.read();

            println!("locked caller address: {:?}", get_caller_address());
            println!("core address in locked: {:?}", core_address);

            match consume_callback_data::<CallbackData>(core, data) {
                CallbackData::LaunchCallback(params) => {
                    println!("step: {}", 1);
                    let launch_params: EkuboLaunchParameters = params.params;
                    let (token0, token1) = sort_tokens(
                        launch_params.token_address, launch_params.quote_address
                    );
                    println!("step: {}", 2);
                    let memecoin = EKIERC20Dispatcher {
                        contract_address: launch_params.token_address
                    };
                    println!("step: {}", 3);
                    let base_token = EKIERC20Dispatcher {
                        contract_address: launch_params.quote_address
                    };
                    println!("step: {}", 4);
                    let registry = ITokenRegistryDispatcher { contract_address: registry_address };
                    println!("step: {}", 5);
                    // println!("IN HERE: {}", 2);

                    let pool_key = PoolKey {
                        token0: token0,
                        token1: token1,
                        fee: launch_params.pool_params.fee,
                        tick_spacing: launch_params.pool_params.tick_spacing,
                        extension: 0.try_into().unwrap(),
                    };
                    println!("step: {}", 6);

                    let lp_supply = launch_params.lp_supply.clone();
                    println!("step: {}", 7);
                    // println!("IN HERE: {}", 3);

                    // The initial_tick must correspond to the wanted initial price in quote/MEME
                    // The ekubo prices are always in TOKEN1/TOKEN0.
                    // The initial_tick is the lower bound if the quote is token1, the upper bound
                    // otherwise.
                    let is_token1_quote = launch_params.quote_address == token1;
                    println!("step: {}", 8);
                    let (initial_tick, full_range_bounds) = get_initial_tick_from_starting_price(
                        launch_params.pool_params.starting_price,
                        launch_params.pool_params.bound,
                        is_token1_quote
                    );
                    println!("step: {}", 9);

                    let pool = self.launched_coins.read(launch_params.token_address);
                    println!("step: {}", 10);

                    // println!("IN HERE: {}", 4);

                    // base_token.approve(registry.contract_address, pool.liquidity_raised);
                    base_token.approve(ekubo_core_address, pool.liquidity_raised);
                    base_token.approve(positions_address, pool.liquidity_raised);
                    base_token.transfer(positions_address, pool.liquidity_raised);
                    println!("step: {}", 11);

                    let memecoin_balance = IERC20Dispatcher {
                        contract_address: launch_params.token_address
                    }
                        .balance_of(launch_params.token_address);
                    println!("memecoin_balance of token: {}", memecoin_balance);
                    println!("step: {}", 12);

                    // memecoin.approve(registry.contract_address, lp_supply);
                    memecoin.approve(positions_address, lp_supply);
                    // memecoin.approve(dex_address, lp_supply);
                    println!("registry contract address: {:?}", registry.contract_address);
                    memecoin.approve(ekubo_core_address, lp_supply);
                    // memecoin.transfer(registry.contract_address, 1);
                    // memecoin.transfer(registry.contract_address, 10);
                    println!("step: {}", 13);
                    // memecoin.transfer(registry.contract_address, pool.available_supply);
                    // memecoin.transfer(registry.contract_address, pool.available_supply);
                    // println!("transfer before register");
                    // registry
                    //     .register_token(
                    //         EKIERC20Dispatcher { contract_address: launch_params.token_address }
                    //     );
                    println!("step: {}", 14);

                    // println!("initial tick {:?}", initial_tick);
                    // Initialize the pool at the initial tick.
                    // println!("init pool");

                    println!("step: {}", 15);
                    core.maybe_initialize_pool(:pool_key, :initial_tick);
                    // println!("init pool");

                    // println!("IN HERE: {}", 5);
                    // println!("supply liq");

                    // 2. Provide the liquidity to actually initialize the public pool with
                    // The pool bounds must be set according to the tick spacing.
                    // The bounds were previously computed to provide yield covering the entire
                    // interval [lower_bound, starting_price]  or [starting_price, upper_bound]
                    // depending on the quote.

                    println!("step: {}", 16);
                    let balance = IERC20Dispatcher { contract_address: launch_params.token_address }
                        .balance_of(launch_params.token_address);

                    println!("balance of token: {}", balance);

                    println!("step: {}", 17);
                    let id = self
                        ._supply_liquidity_ekubo(
                            pool_key,
                            launch_params.token_address,
                            launch_params.lp_supply,
                            full_range_bounds
                        );

                    // println!("IN HERE: {}", 6);

                    println!("step: {}", 18);
                    let position = EkuboLP {
                        // let position = @EkuboLP {
                        owner: launch_params.owner,
                        quote_address: launch_params.quote_address,
                        pool_key,
                        bounds: full_range_bounds
                    };
                    // println!("position owner {:?}", owner);
                    // println!("position quote_address {:?}", quote_address);

                    // At this point, the pool is composed by:
                    // n% of liquidity at precise starting tick, reserved for the team to buy
                    // the rest of the liquidity, in bounds [starting_price, +inf];
                    println!("step: {}", 19);

                    let mut return_data: Array<felt252> = Default::default();
                    Serde::serialize(@id, ref return_data);
                    Serde::serialize(
                        @EkuboLP {
                            owner: launch_params.owner,
                            quote_address: launch_params.quote_address,
                            pool_key,
                            bounds: full_range_bounds
                        },
                        ref return_data
                    );
                    println!("step: {}", 20);
                    return_data.span()
                }
                // CallbackData::WithdrawFeesCallback(params) => {
            //     let WithdrawFeesCallback{id, liquidity_type, recipient } = params;
            //     let positions = self.positions.read();
            //     let EkuboLP{owner, quote_address: _, pool_key, bounds } = liquidity_type;
            //     let pool_key = PoolKey {
            //         token0: pool_key.token0,
            //         token1: pool_key.token1,
            //         fee: pool_key.fee,
            //         tick_spacing: pool_key.tick_spacing,
            //         extension: pool_key.extension,
            //     };
            //     let bounds = Bounds { lower: bounds.lower, upper: bounds.upper, };
            //     positions.collect_fees(id, pool_key, bounds);

                //     // Transfer to recipient is done after the callback
            //     let mut return_data = Default::default();
            //     Serde::serialize(@pool_key.token0, ref return_data);
            //     Serde::serialize(@pool_key.token1, ref return_data);
            //     return_data
            // },
            }
        }
    }
}

fn buy_tokens_from_pool(
    ekubo_launchpad: IEkuboLauncherDispatcher,
    pool_key: PoolKey,
    amount: u256,
    token_to_buy: ContractAddress,
    quote_address: ContractAddress,
) {
    let ekubo_router = IRouterDispatcher {
        contract_address: ekubo_launchpad.ekubo_router_address()
    };
    let ekubo_clearer = IClearDispatcher {
        contract_address: ekubo_launchpad.ekubo_router_address()
    };

    let token_to_buy = IUnruggableMemecoinDispatcher { contract_address: token_to_buy };

    let max_sqrt_ratio_limit = 6277100250585753475930931601400621808602321654880405518632;
    let min_sqrt_ratio_limit = 18446748437148339061;

    let is_token1 = pool_key.token1 == quote_address;
    let (sqrt_limit_swap1, sqrt_limit_swap2) = if is_token1 {
        (max_sqrt_ratio_limit, min_sqrt_ratio_limit)
    } else {
        (min_sqrt_ratio_limit, max_sqrt_ratio_limit)
    };

    let route_node = RouteNode {
        pool_key: pool_key, sqrt_ratio_limit: sqrt_limit_swap1, skip_ahead: 0
    };

    let quote_token = IERC20Dispatcher { contract_address: quote_address };
    let this = get_contract_address();
    // Buy tokens from the pool, with an exact output amount.
    let token_amount = TokenAmount {
        token: token_to_buy.contract_address,
        amount: i129 { mag: amount.low, sign: true // negative (true) sign is exact output
         },
    };

    // We transfer quote tokens to the swapper contract, which performs the swap
    // It then sends back the funds to the caller once cleared.
    quote_token.transfer(ekubo_router.contract_address, quote_token.balanceOf(this));
    // Swap and clear the tokens to finalize.
    ekubo_router.swap(route_node, token_amount);
    ekubo_clearer.clear(IERC20Dispatcher { contract_address: token_to_buy.contract_address });
    ekubo_clearer
        .clear_minimum_to_recipient(
            IERC20Dispatcher { contract_address: quote_address }, 0, starknet::get_caller_address()
        );
}


pub fn add_liquidity_ekubo_bonding_curve(
    launch: TokenLaunch,
    ekubo_core_address: ContractAddress,
    ekubo_exchange_address: ContractAddress,
    positions_ekubo: ContractAddress
    // params: EkuboLaunchParameters
) -> (u64, EkuboLP) {
    // TODO params of Ekubo launch
    // Init price and params of liquidity

    // TODO assert of threshold and MC reached
    // let launch = self.launched_coins.read(coin_address);
    assert(launch.liquidity_raised >= launch.threshold_liquidity, 'no threshold raised');
    assert(launch.is_liquidity_launch == false, 'liquidity already launch');

    // TODO calculate price

    let starting_price: i129 = calculate_starting_price_launch(
        launch.initial_pool_supply.clone(), launch.threshold_liquidity.clone()
    );
    let lp_meme_supply = launch.initial_pool_supply;

    // let lp_meme_supply = launch.initial_available_supply - launch.available_supply;

    let params: EkuboLaunchParameters = EkuboLaunchParameters {
        owner: launch.owner,
        token_address: launch.token_address,
        quote_address: launch.token_quote.token_address,
        lp_supply: lp_meme_supply,
        // lp_supply: launch.liquidity_raised,
        pool_params: EkuboPoolParameters {
            fee: 0xc49ba5e353f7d00000000000000000,
            tick_spacing: 5000,
            starting_price,
            bound: calculate_aligned_bound_mag(starting_price, 2, 5000),
        }
    };

    // println!("Bound computed: {}", params.pool_params.bound);

    // Register the token in Ekubo Registry
    let memecoin = EKIERC20Dispatcher { contract_address: params.token_address };
    //TODO token decimal, amount of 1 token?
    // println!("RIGHT HERE: {}", 1);

    // let dex_address = self.core.read();
    // let positions_ekubo = self.positions.read();
    memecoin.approve(ekubo_exchange_address, lp_meme_supply);
    memecoin.approve(ekubo_core_address, lp_meme_supply);
    memecoin.approve(positions_ekubo, lp_meme_supply);
    assert!(memecoin.contract_address == params.token_address, "Token address mismatch");
    let base_token = EKIERC20Dispatcher { contract_address: params.quote_address };
    //TODO token decimal, amount of 1 token?
    // let pool = self.launched_coins.read(coin_address);
    base_token.approve(ekubo_exchange_address, launch.liquidity_raised);
    base_token.approve(ekubo_core_address, launch.liquidity_raised);
    let core = ICoreDispatcher { contract_address: ekubo_core_address };
    // Call the core with a callback to deposit and mint the LP tokens.

    // println!("HERE launch callback: {}", 2);

    let (id, position) = call_core_with_callback::<
        // let span = call_core_with_callbac00k::<
        CallbackData, (u64, EkuboLP)
    >(core, @CallbackData::LaunchCallback(LaunchCallback { params }));
    // let (id,position) = self._supply_liquidity_ekubo_and_mint(coin_address, params);
    //TODO emit event
    let id_cast: u256 = id.try_into().unwrap();

    // println!("RIGHT HERE: {}", 3);

    // let mut launch_to_update = self.launched_coins.read(coin_address);
    // launch_to_update.is_liquidity_launch = true;
    // self.launched_coins.entry(coin_address).write(launch_to_update.clone());

    // println!("RIGHT HERE: {}", 4);

    // self
    //     .emit(
    //         LiquidityCreated {
    //             id: id_cast,
    //             pool: coin_address,
    //             asset: coin_address,
    //             quote_token_address: base_token.contract_address,
    //             owner: launch.owner,
    //             exchange: SupportedExchanges::Ekubo,
    //             is_unruggable: false
    //         }
    //     );

    (id, position)
}
