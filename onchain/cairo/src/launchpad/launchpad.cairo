use afk::types::jediswap_types::{MintParams};
use afk::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyCoin, TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch,
    SetJediswapNFTRouterV2, SetJediswapV2Factory, SupportedExchanges, LiquidityCreated,
    LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters,
    LaunchParameters, EkuboLP, CallbackData, EkuboLaunchParameters, LaunchCallback, LiquidityType,
    EkuboLiquidityParameters, LiquidityParameters
};
use starknet::ClassHash;
use starknet::ContractAddress;

#[starknet::interface]
pub trait ILaunchpadMarketplace<TContractState> {
    // User call
    fn create_token(
        ref self: TContractState,
        recipient: ContractAddress,
        symbol: felt252,
        name: felt252,
        initial_supply: u256,
        contract_address_salt: felt252,
        is_unruggable: bool
    ) -> ContractAddress;

    fn create_and_launch_token(
        ref self: TContractState,
        symbol: felt252,
        name: felt252,
        initial_supply: u256,
        contract_address_salt: felt252,
        is_unruggable: bool
    ) -> ContractAddress;
    fn launch_token(ref self: TContractState, coin_address: ContractAddress);
    fn launch_liquidity(ref self: TContractState, coin_address: ContractAddress);
    // fn buy_coin(ref self: TContractState, coin_address: ContractAddress, amount: u256);
    fn buy_coin_by_quote_amount(
        ref self: TContractState, coin_address: ContractAddress, quote_amount: u256,
        // ekubo_pool_params: Option<EkuboPoolParameters>,
    );
    fn sell_coin(ref self: TContractState, coin_address: ContractAddress, quote_amount: u256);

    fn claim_coin_buy(ref self: TContractState, coin_address: ContractAddress, amount: u256);
    fn add_metadata(
        ref self: TContractState, coin_address: ContractAddress, metadata: MetadataLaunch
    );

    // Views
    fn get_threshold_liquidity(self: @TContractState) -> u256;
    fn get_default_token(self: @TContractState,) -> TokenQuoteBuyCoin;

    // Main function to calculate amount
    fn get_amount_by_type_of_coin_or_quote(
        self: @TContractState,
        coin_address: ContractAddress,
        amount: u256,
        is_decreased: bool,
        is_quote_amount: bool
    ) -> u256;
    fn get_coin_amount_by_quote_amount(
        self: @TContractState, coin_address: ContractAddress, quote_amount: u256, is_decreased: bool
    ) -> u256;

    // fn get_quote_paid_by_amount_coin(
    //     self: @TContractState, coin_address: ContractAddress, quote_amount: u256, is_decreased:
    //     bool
    // ) -> u256;

    fn get_coin_launch(self: @TContractState, key_user: ContractAddress,) -> TokenLaunch;
    fn get_share_key_of_user(
        self: @TContractState, owner: ContractAddress, key_user: ContractAddress,
    ) -> SharesTokenUser;
    fn get_all_launch(self: @TContractState) -> Span<TokenLaunch>;

    fn get_all_coins(self: @TContractState) -> Span<Token>;

    // Admins
    fn set_token(ref self: TContractState, token_quote: TokenQuoteBuyCoin);
    fn set_protocol_fee_percent(ref self: TContractState, protocol_fee_percent: u256);
    fn set_creator_fee_percent(ref self: TContractState, creator_fee_percent: u256);
    fn set_dollar_paid_coin_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_launch_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_finish_percentage(ref self: TContractState, bps: u256);
    fn set_class_hash(ref self: TContractState, class_hash: ClassHash);
    fn set_protocol_fee_destination(
        ref self: TContractState, protocol_fee_destination: ContractAddress
    );
    fn set_threshold_liquidity(ref self: TContractState, threshold_liquidity: u256);
    fn set_address_jediswap_factory_v2(
        ref self: TContractState, address_jediswap_factory_v2: ContractAddress
    );
    fn set_address_jediswap_nft_router_v2(
        ref self: TContractState, address_jediswap_nft_router_v2: ContractAddress
    );
    fn set_address_ekubo_factory(ref self: TContractState, address_ekubo_factory: ContractAddress);
    fn set_address_ekubo_router(ref self: TContractState, address_ekubo_router: ContractAddress);
    fn set_exchanges_address(
        ref self: TContractState, exchanges: Span<(SupportedExchanges, ContractAddress)>
    );

    //TODO
    fn add_liquidity_jediswap(ref self: TContractState, coin_address: ContractAddress,);
    fn add_liquidity_unrug(
        ref self: TContractState,
        coin_address: ContractAddress,
        launch_params: LaunchParameters,
        ekubo_pool_params: EkuboPoolParameters
    ) -> (u64, EkuboLP);

    fn add_liquidity_unrug_lp(
        ref self: TContractState,
        coin_address: ContractAddress,
        quote_address: ContractAddress,
        lp_supply: u256,
        launch_params: LaunchParameters,
        ekubo_pool_params: EkuboPoolParameters
    ) -> (u64, EkuboLP);

    fn add_liquidity_ekubo(
        ref self: TContractState, coin_address: ContractAddress,
        //  params: EkuboLaunchParameters
    ) -> (u64, EkuboLP);
    // ) -> Span<felt252>;

    fn create_unrug_token(
        ref self: TContractState,
        owner: ContractAddress,
        name: felt252,
        symbol: felt252,
        initial_supply: u256,
        contract_address_salt: felt252,
        is_launch_bonding_now: bool
    ) -> ContractAddress;
}

#[starknet::contract]
pub mod LaunchpadMarketplace {
    use afk::interfaces::factory::{IFactory, IFactoryDispatcher, IFactoryDispatcherTrait};
    use afk::interfaces::jediswap::{
        IJediswapFactoryV2, IJediswapFactoryV2Dispatcher, IJediswapFactoryV2DispatcherTrait,
        IJediswapNFTRouterV2, IJediswapNFTRouterV2Dispatcher, IJediswapNFTRouterV2DispatcherTrait,
    };
    use afk::launchpad::calcul::{
        calculate_starting_price_launch, calculate_slope, calculate_pricing,
        get_amount_by_type_of_coin_or_quote, get_coin_amount_by_quote_amount
    };
    use afk::launchpad::errors;
    // use afk::launchpad::helpers::{distribute_team_alloc, check_common_launch_parameters };
    use afk::launchpad::helpers::{distribute_team_alloc, check_common_launch_parameters};
    use afk::launchpad::math::{PercentageMath, pow_256};
    use afk::launchpad::utils::{
        sort_tokens, get_initial_tick_from_starting_price, get_next_tick_bounds, unique_count,
        calculate_aligned_bound_mag
    };
    use afk::tokens::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::tokens::memecoin::{IMemecoinDispatcher, IMemecoinDispatcherTrait};
    use afk::utils::{sqrt};
    use core::num::traits::Zero;
    use ekubo::components::clear::{IClearDispatcher, IClearDispatcherTrait};

    use ekubo::components::shared_locker::{call_core_with_callback, consume_callback_data};
    use ekubo::interfaces::core::{ICoreDispatcher, ICoreDispatcherTrait, ILocker};
    use ekubo::interfaces::erc20::{
        IERC20Dispatcher as EKIERC20Dispatcher, IERC20DispatcherTrait as EKIERC20DispatcherTrait
    };
    use ekubo::interfaces::positions::{IPositions, IPositionsDispatcher, IPositionsDispatcherTrait};
    use ekubo::interfaces::router::{IRouterDispatcher, IRouterDispatcherTrait};
    use ekubo::interfaces::token_registry::{
        ITokenRegistryDispatcher, ITokenRegistryDispatcherTrait,
    };
    use ekubo::types::bounds::{Bounds};
    use ekubo::types::keys::PoolKey;
    use ekubo::types::{i129::i129};

    use openzeppelin::access::accesscontrol::{AccessControlComponent};
    use openzeppelin::introspection::src5::SRC5Component;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use super::{
        StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated, SharesTokenUser, MINTER_ROLE,
        ADMIN_ROLE, BondingType, Token, TokenLaunch, TokenQuoteBuyCoin, CreateLaunch,
        SetJediswapNFTRouterV2, SetJediswapV2Factory, SupportedExchanges, MintParams,
        LiquidityCreated, LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded,
        EkuboPoolParameters, LaunchParameters, EkuboLP, LiquidityType, CallbackData,
        EkuboLaunchParameters, LaunchCallback, EkuboLiquidityParameters, LiquidityParameters
    };


    const MAX_SUPPLY: u256 = 100_000_000;
    const INITIAL_SUPPLY: u256 = MAX_SUPPLY / 5;
    const MAX_STEPS_LOOP: u256 = 100;
    // Total supply / LIQUIDITY_RATIO
    // Get the 20% of Bonding curve going to Liquidity
    // Liquidity can be lock to Unrug
    const LIQUIDITY_RATIO: u256 = 5; // Divid by 5 the total supply.
    // TODO add with a enabled pay boolean to be free at some point
    const PAY_TO_LAUNCH: u256 = 1; // amount in the coin used
    const LIQUIDITY_PERCENTAGE: u256 = 2000; //20%
    const MIN_FEE_PROTOCOL: u256 = 10; //0.1%
    const MAX_FEE_PROTOCOL: u256 = 1000; //10%
    const MID_FEE_PROTOCOL: u256 = 100; //1%

    const MIN_FEE_CREATOR: u256 = 100; //1%
    const MID_FEE_CREATOR: u256 = 1000; //10%
    const MAX_FEE_CREATOR: u256 = 5000; //50%

    const BPS: u256 = 10_000; // 100% = 10_000 bps
    const SCALE_FACTOR: u256 =
        100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff

    // Unrug params

    // CHANGE it
    /// The maximum percentage of the total supply that can be allocated to the team.
    /// This is to prevent the team from having too much control over the supply.
    const MAX_SUPPLY_PERCENTAGE_TEAM_ALLOCATION: u16 = 1_000; // 10%

    /// The maximum number of holders one can specify when launching.
    /// This is to prevent the contract from being is_launched with a large number of holders.
    /// Once reached, transfers are disabled until the memecoin is is_launched.
    const MAX_HOLDERS_LAUNCH: u8 = 10;

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        // Admin & others contract
        coin_class_hash: ClassHash,
        quote_tokens: Map::<ContractAddress, bool>,
        exchange_configs: Map<SupportedExchanges, ContractAddress>,
        quote_token: ContractAddress,
        protocol_fee_destination: ContractAddress,
        address_jediswap_factory_v2: ContractAddress,
        address_jediswap_nft_router_v2: ContractAddress,
        address_ekubo_factory: ContractAddress,
        address_ekubo_router: ContractAddress,
        // User states
        token_created: Map::<ContractAddress, Token>,
        launched_coins: Map::<ContractAddress, TokenLaunch>,
        metadata_coins: Map::<ContractAddress, MetadataLaunch>,
        shares_by_users: Map::<(ContractAddress, ContractAddress), SharesTokenUser>,
        bonding_type: Map::<ContractAddress, BondingType>,
        array_launched_coins: Map::<u64, TokenLaunch>,
        array_coins: Map::<u64, Token>,
        tokens_created: Map::<u64, Token>,
        launch_created: Map::<u64, TokenLaunch>,
        // Parameters
        is_tokens_buy_enable: Map::<ContractAddress, TokenQuoteBuyCoin>,
        default_token: TokenQuoteBuyCoin,
        dollar_price_launch_pool: u256,
        dollar_price_create_token: u256,
        dollar_price_percentage: u256,
        starting_price: u256,
        threshold_liquidity: u256,
        threshold_market_cap: u256,
        liquidity_raised_amount_in_dollar: u256,
        protocol_fee_percent: u256,
        creator_fee_percent: u256,
        is_fees_protocol: bool,
        step_increase_linear: u256,
        is_custom_launch_enable: bool,
        is_custom_token_enable: bool,
        is_paid_launch_enable: bool,
        is_create_token_paid: bool,
        // Stats
        total_keys: u64,
        total_token: u64,
        total_launch: u64,
        total_shares_keys: u64,
        // External contract
        factory_address: ContractAddress,
        ekubo_registry: ContractAddress,
        core: ContractAddress,
        positions: ContractAddress,
        ekubo_exchange_address: ContractAddress,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        StoredName: StoredName,
        BuyToken: BuyToken,
        SellToken: SellToken,
        CreateToken: CreateToken,
        LaunchUpdated: LaunchUpdated,
        CreateLaunch: CreateLaunch,
        SetJediswapV2Factory: SetJediswapV2Factory,
        SetJediswapNFTRouterV2: SetJediswapNFTRouterV2,
        LiquidityCreated: LiquidityCreated,
        LiquidityCanBeAdded: LiquidityCanBeAdded,
        TokenClaimed: TokenClaimed,
        MetadataCoinAdded: MetadataCoinAdded,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        starting_price: u256,
        token_address: ContractAddress,
        step_increase_linear: u256,
        coin_class_hash: ClassHash,
        threshold_liquidity: u256,
        threshold_market_cap: u256,
        factory_address: ContractAddress,
        ekubo_registry: ContractAddress,
        core: ContractAddress,
        positions: ContractAddress,
        ekubo_exchange_address: ContractAddress
    ) {
        self.coin_class_hash.write(coin_class_hash);
        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, admin);
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);

        let init_token = TokenQuoteBuyCoin {
            token_address: token_address,
            starting_price,
            price: starting_price,
            is_enable: true,
            step_increase_linear
        };
        self.is_custom_launch_enable.write(false);
        self.is_custom_token_enable.write(false);
        self.default_token.write(init_token.clone());
        self.starting_price.write(init_token.starting_price);

        self.threshold_liquidity.write(threshold_liquidity);
        self.threshold_market_cap.write(threshold_market_cap);
        self.protocol_fee_destination.write(admin);
        self.step_increase_linear.write(step_increase_linear);
        self.total_keys.write(0);
        self.total_token.write(0);
        self.total_launch.write(0);
        self.protocol_fee_percent.write(MID_FEE_PROTOCOL);
        self.creator_fee_percent.write(MIN_FEE_CREATOR);
        self.factory_address.write(factory_address);
        self.ekubo_registry.write(ekubo_registry);
        self.core.write(core);
        self.positions.write(positions);
        self.ekubo_exchange_address.write(ekubo_exchange_address);
    }

    // Public functions inside an impl block
    #[abi(embed_v0)]
    impl LaunchpadMarketplace of super::ILaunchpadMarketplace<ContractState> {
        // ADMIN

        fn set_token(ref self: ContractState, token_quote: TokenQuoteBuyCoin) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_tokens_buy_enable.entry(token_quote.token_address).write(token_quote);
        }

        fn set_protocol_fee_percent(ref self: ContractState, protocol_fee_percent: u256) {
            assert(protocol_fee_percent < MAX_FEE_PROTOCOL, 'protocol_fee_too_high');
            assert(protocol_fee_percent > MIN_FEE_PROTOCOL, 'protocol_fee_too_low');

            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.protocol_fee_percent.write(protocol_fee_percent);
        }

        fn set_protocol_fee_destination(
            ref self: ContractState, protocol_fee_destination: ContractAddress
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.protocol_fee_destination.write(protocol_fee_destination);
        }

        fn set_creator_fee_percent(ref self: ContractState, creator_fee_percent: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert(creator_fee_percent < MAX_FEE_CREATOR, 'creator_fee_too_high');
            assert(creator_fee_percent > MIN_FEE_CREATOR, 'creator_fee_too_low');
            self.creator_fee_percent.write(creator_fee_percent);
        }

        fn set_dollar_paid_coin_creation(ref self: ContractState, dollar_price: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.dollar_price_create_token.write(dollar_price);
        }

        fn set_dollar_paid_launch_creation(ref self: ContractState, dollar_price: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.dollar_price_launch_pool.write(dollar_price);
        }

        fn set_dollar_paid_finish_percentage(ref self: ContractState, bps: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.dollar_price_percentage.write(bps);
        }

        // Set threshold liquidity
        fn set_threshold_liquidity(ref self: ContractState, threshold_liquidity: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.threshold_liquidity.write(threshold_liquidity);
        }

        // Jediwswap factory address
        fn set_address_jediswap_factory_v2(
            ref self: ContractState, address_jediswap_factory_v2: ContractAddress
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            // self.ownable.assert_only_owner();
            self.address_jediswap_factory_v2.write(address_jediswap_factory_v2);
            self
                .emit(
                    SetJediswapV2Factory {
                        address_jediswap_factory_v2: address_jediswap_factory_v2
                    }
                );
        }

        fn set_address_jediswap_nft_router_v2(
            ref self: ContractState, address_jediswap_nft_router_v2: ContractAddress
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_jediswap_nft_router_v2.write(address_jediswap_nft_router_v2);
            self
                .emit(
                    SetJediswapNFTRouterV2 {
                        address_jediswap_nft_router_v2: address_jediswap_nft_router_v2
                    }
                );
        }

        fn set_address_ekubo_factory(
            ref self: ContractState, address_ekubo_factory: ContractAddress
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_ekubo_factory.write(address_ekubo_factory);
            // Optionally emit an event
        }

        fn set_address_ekubo_router(
            ref self: ContractState, address_ekubo_router: ContractAddress
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_ekubo_router.write(address_ekubo_router);
            // Optionally emit an event
        }

        fn set_exchanges_address(
            ref self: ContractState, exchanges: Span<(SupportedExchanges, ContractAddress)>
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            let mut dex = exchanges;
            // Add Exchanges configurations
            loop {
                match dex.pop_front() {
                    Option::Some((exchange, address)) => self
                        .exchange_configs
                        .entry(*exchange)
                        .write(*address),
                    Option::None => { break; }
                }
            };
        }


        fn set_class_hash(ref self: ContractState, class_hash: ClassHash) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.coin_class_hash.write(class_hash);
        }
        // User call

        // Create keys for an user
        fn create_token(
            ref self: ContractState,
            recipient: ContractAddress,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_unruggable: bool
        ) -> ContractAddress {
            let caller = get_caller_address();
            let token_address = self
                ._create_token(
                    recipient,
                    caller,
                    symbol,
                    name,
                    initial_supply,
                    contract_address_salt,
                    is_unruggable
                );

            token_address
        }

        // Creat coin and launch
        // recipient, caller, symbol, name, initial_supply, contract_address_salt
        fn create_and_launch_token(
            ref self: ContractState,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_unruggable: bool
        ) -> ContractAddress {
            let contract_address = get_contract_address();
            let caller = get_caller_address();
            let token_address = self
                ._create_token(
                    contract_address,
                    caller,
                    symbol,
                    name,
                    initial_supply,
                    contract_address_salt,
                    is_unruggable
                );
            let contract_address = get_contract_address();
            self._launch_token(token_address, caller, contract_address, false);
            token_address
        }

        // Launch coin to pool bonding curve
        fn launch_token(ref self: ContractState, coin_address: ContractAddress) {
            let caller = get_caller_address();
            let contract_address = get_contract_address();

            let token = self.token_created.read(coin_address);
            let is_unruggable = token.is_unruggable;
            self._launch_token(coin_address, caller, contract_address, is_unruggable);
        }

        // Buy coin by quote amount
        // Get amount of coin receive based on token IN
        fn buy_coin_by_quote_amount(
            ref self: ContractState, coin_address: ContractAddress, quote_amount: u256,
            // ekubo_pool_params: Option<EkuboPoolParameters>
        ) {
            // assert!(quote_amount > 0, "amount == 0");
            let caller = get_caller_address();
            let old_launch = self.launched_coins.read(coin_address);
            assert!(!old_launch.owner.is_zero(), "coin not found");
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            let mut pool_coin = old_launch.clone();
            let total_supply_memecoin = memecoin.total_supply();
            // let threshold_liquidity = self.threshold_liquidity.read();
            let threshold_liquidity = pool_coin.threshold_liquidity.clone();

            //new liquidity after purchase
            let new_liquidity = pool_coin.liquidity_raised + quote_amount;

            //assertion
            assert(new_liquidity <= threshold_liquidity, 'threshold liquidity exceeded');

            // TODO erc20 token transfer
            let token_quote = old_launch.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();
            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };
            let protocol_fee_percent = self.protocol_fee_percent.read();

            // IF AMOUNT COIN TO HAVE => GET AMOUNT QUOTE TO PAID
            let mut total_price = quote_amount.clone();
            let old_price = pool_coin.price.clone();
            let mut amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let mut remain_liquidity = total_price - amount_protocol_fee;
            // let mut amount = 0;
            // Pay with quote token
            // Transfer quote & coin
            // TOdo fix issue price
            let mut amount = get_amount_by_type_of_coin_or_quote(
                pool_coin.clone(), coin_address.clone(), remain_liquidity.clone(), false, true
            );
            // remain_liquidity = total_price - amount_protocol_fee;
            // TODO check available to buy

            // println!("amount receive {:?}", amount);

            assert(amount <= pool_coin.available_supply, 'no available supply');

            erc20
                .transfer_from(
                    get_caller_address(), self.protocol_fee_destination.read(), amount_protocol_fee
                );
            // println!("remain_liquidity {:?}", remain_liquidity);
            erc20.transfer_from(get_caller_address(), get_contract_address(), remain_liquidity);
            // In case the user want to buy more than the threshold
            // Give the available supply
            // if total_price + old_launch.liquidity_raised.clone() > threshold_liquidity {
            //     total_price = threshold_liquidity - old_launch.liquidity_raised.clone();
            //     amount = pool_coin.available_supply;

            //     amount_protocol_fee = total_price * protocol_fee_percent / BPS;
            //     // remain_liquidity = total_price - amount_protocol_fee;
            //     remain_liquidity = total_price;
            //     erc20
            //         .transfer_from(
            //             get_caller_address(),
            //             self.protocol_fee_destination.read(),
            //             amount_protocol_fee
            //         );
            //     // println!("remain_liquidity {:?}", remain_liquidity);
            //     erc20.transfer_from(get_caller_address(), get_contract_address(),
            //     remain_liquidity);
            // } else {
            //     amount = self
            //         ._get_amount_by_type_of_coin_or_quote(coin_address, total_price, false,
            //         true);
            //     // remain_liquidity = total_price - amount_protocol_fee;

            //     erc20
            //         .transfer_from(
            //             get_caller_address(),
            //             self.protocol_fee_destination.read(),
            //             amount_protocol_fee
            //         );
            //     // println!("remain_liquidity {:?}", remain_liquidity);
            //     erc20.transfer_from(get_caller_address(), get_contract_address(),
            //     remain_liquidity);
            // }

            // Assertion: Amount Received Validation
            // Optionally, re-calculate the quote amount based on the amount to ensure consistency
            // println!("total_price {:?}", total_price);
            // Change the Stats of pool:
            // Liquidity raised
            // Available supply
            // Token holded

            pool_coin.liquidity_raised += remain_liquidity;
            pool_coin.total_token_holded += amount;
            pool_coin.price = total_price;

            if amount >= pool_coin.available_supply {
                pool_coin.available_supply = 0;
            } else {
                pool_coin.available_supply -= amount;
            }

            // Update share and coin stats for an user
            let mut old_share = self.shares_by_users.read((get_caller_address(), coin_address));

            let mut share_user = old_share.clone();
            if old_share.owner.is_zero() {
                share_user =
                    SharesTokenUser {
                        owner: get_caller_address(),
                        token_address: coin_address,
                        amount_owned: amount,
                        amount_buy: amount,
                        amount_sell: 0,
                        created_at: get_block_timestamp(),
                        total_paid: total_price,
                    };
                let total_key_share = self.total_shares_keys.read();
                self.total_shares_keys.write(total_key_share + 1);
            } else {
                share_user.total_paid += total_price;
                share_user.amount_owned += amount;
                share_user.amount_buy += amount;
            }
            // pool_coin.price = total_price / amount;

            // Check if liquidity threshold raise
            let threshold = self.threshold_liquidity.read();
            let threshold_mc = self.threshold_market_cap.read();
            // println!("threshold {:?}", threshold);
            // println!("pool_coin.liquidity_raised {:?}", pool_coin.liquidity_raised);

            let mc = (pool_coin.price * total_supply_memecoin);
            // TODO add liquidity launch
            // TOTAL_SUPPLY / 5
            // 20% go the liquidity
            // 80% bought by others

            // TODO check reetrancy guard
            // Update state
            self
                .shares_by_users
                .entry((get_caller_address(), coin_address))
                .write(share_user.clone());
            self.launched_coins.entry(coin_address).write(pool_coin.clone());

            // TODO finish test and fix
            // Fix price of the last
            if pool_coin.liquidity_raised >= threshold {
                self
                    .emit(
                        LiquidityCanBeAdded {
                            pool: pool_coin.token_address.clone(),
                            asset: pool_coin.token_address.clone(),
                            quote_token_address: pool_coin.token_quote.token_address.clone(),
                        }
                    );
                // self._add_liquidity(coin_address, SupportedExchanges::Jediswap);
            // self._add_liquidity(coin_address, SupportedExchanges::Ekubo);
            // TODO fix add liquidity ekubo
            // self._add_liquidity_ekubo(coin_address);
            }

            self
                .emit(
                    BuyToken {
                        caller: get_caller_address(),
                        token_address: coin_address,
                        amount: amount,
                        price: total_price,
                        protocol_fee: amount_protocol_fee,
                        // creator_fee: 0,
                        last_price: old_price,
                        timestamp: get_block_timestamp(),
                        quote_amount: quote_amount
                    }
                );
        }


        // TODO finish and fix
        fn sell_coin(ref self: ContractState, coin_address: ContractAddress, quote_amount: u256) {
            let old_pool = self.launched_coins.read(coin_address);
            assert(!old_pool.owner.is_zero(), 'coin not found');

            let caller = get_caller_address();
            let mut old_share = self.shares_by_users.read((get_caller_address(), coin_address));

            let mut share_user = old_share.clone();

            // TODO erc20 token transfer
            let total_supply = old_pool.total_supply;
            let token_quote = old_pool.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();
            assert(old_pool.liquidity_raised >= quote_amount, 'liquidity <= amount');
            assert(old_pool.is_liquidity_launch == false, 'token tradeable');

            // TODO fix this function
            // let mut amount = self
            //     ._get_coin_amount_by_quote_amount(coin_address, quote_amount, true);

            // Todo check user amount fee creator if needed
            let creator_fee_percent = self.creator_fee_percent.read();
            let protocol_fee_percent = self.protocol_fee_percent.read();

            let amount_protocol_fee: u256 = quote_amount * protocol_fee_percent / BPS;
            let amount_creator_fee = quote_amount * creator_fee_percent / BPS;
            let remain_liquidity = quote_amount - amount_protocol_fee;
            // let amount_to_user: u256 = quote_amount - amount_protocol_fee - amount_creator_fee;

            let mut amount = get_amount_by_type_of_coin_or_quote(
                old_pool.clone(), coin_address.clone(), remain_liquidity.clone(), false, true
            );

            // Verify Amount owned
            assert(old_pool.total_supply >= quote_amount, 'above supply');
            assert(share_user.amount_owned >= amount, 'above supply');

            // let mut total_price = amount;
            // println!("amount {:?}", amount);
            // println!("quote_amount {:?}", quote_amount);
            // println!("total_price {:?}", total_price);
            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };

            // Ensure fee percentages are within valid bounds
            assert(
                protocol_fee_percent <= MAX_FEE_PROTOCOL
                    && protocol_fee_percent >= MIN_FEE_PROTOCOL,
                'protocol fee out'
            );
            // assert(
            //     creator_fee_percent <= MAX_FEE_CREATOR && creator_fee_percent >= MIN_FEE_CREATOR,
            //     'creator_fee out'
            // );

            // assert!(old_share.amount_owned >= amount, "share to sell > supply");
            // println!("amount{:?}", amount);
            // assert!(total_supply >= quote_amount, "share to sell > supply");
            // assert( old_pool.liquidity_raised >= quote_amount, 'liquidity_raised <= amount');

            let old_price = old_pool.price.clone();
            let total_price = old_pool.price.clone();
            // Update keys with new values
            let mut pool_update = old_pool.clone();

            // let remain_liquidity = total_price ;
            assert(old_pool.liquidity_raised >= remain_liquidity, 'liquidity <= amount');

            // Ensure fee calculations are correct
            // assert(
            //     amount_to_user + amount_protocol_fee + amount_creator_fee == quote_amount,
            //     'fee calculation mismatch'
            // );

            // Assertion: Check if the contract has enough quote tokens to transfer
            let contract_quote_balance = erc20.balance_of(get_contract_address());
            assert!(
                contract_quote_balance >= quote_amount,
                "contract has insufficient quote token balance"
            );

            // Transfer protocol fee to the designated destination
            if amount_protocol_fee > 0 {
                erc20.transfer(self.protocol_fee_destination.read(), amount_protocol_fee);
            }

            // Transfer the remaining quote amount to the user
            if remain_liquidity > 0 {
                erc20.transfer(caller, remain_liquidity);
            }

            // Assertion: Ensure the user receives the correct amount
            let user_received = erc20.balance_of(caller);
            assert(user_received >= remain_liquidity, 'user not receive amount');

            // TODO sell coin if it's already sendable and transferable
            // ENABLE if direct launch coin
            // let memecoin = IERC20Dispatcher { contract_address: coin_address };
            // memecoin.transfer_from(get_caller_address(), get_contract_address(), amount);

            // TODO fix amount owned and sellable.
            // Update share user coin
            share_user.amount_owned -= amount;
            share_user.amount_sell += amount;

            // TODO check reetrancy guard

            // Assertion: Ensure pool liquidity remains consistent
            assert!(
                old_pool.liquidity_raised >= quote_amount, "pool liquidity inconsistency after sale"
            );

            // TODO finish update state
            // pool_update.price = total_price;
            pool_update.liquidity_raised -= remain_liquidity;
            pool_update.total_token_holded -= amount;
            pool_update.available_supply += amount;

            // Assertion: Ensure the pool's liquidity and token holded are updated correctly
            // assert!(
            //     pool_update.liquidity_raised + quote_amount == old_pool.liquidity_raised,
            //     "liquidity_raised mismatch after update"
            // );
            // assert!(
            //     pool_update.total_token_holded
            //         + self
            //             ._get_coin_amount_by_quote_amount(
            //                 coin_address, quote_amount, true
            //             ) == old_pool
            //             .total_token_holded,
            //     "total_token_holded mismatch after update"
            // );

            self
                .shares_by_users
                .entry((get_caller_address(), coin_address.clone()))
                .write(share_user.clone());
            self.launched_coins.entry(coin_address.clone()).write(pool_update.clone());
            self
                .emit(
                    SellToken {
                        caller: caller,
                        key_user: coin_address,
                        amount: quote_amount,
                        price: total_price, // Adjust if necessary
                        protocol_fee: amount_protocol_fee,
                        creator_fee: amount_creator_fee,
                        timestamp: get_block_timestamp(),
                        last_price: old_pool.price,
                    }
                );
        }


        // TODO finish check
        //  Launch liquidity if threshold ok
        // Add more exchanges. Start with EKUBO by default
        fn launch_liquidity(
            ref self: ContractState, coin_address: ContractAddress, // exchange:SupportedExchanges
        ) {
            // TODO auto distrib and claim?

            let caller = get_caller_address();

            let pool = self.launched_coins.read(coin_address);

            // assert(caller == pool.owner, errors::OWNER_DIFFERENT);
            // assert(caller == pool.owner || caller == pool.creator, errors::OWNER_DIFFERENT);

            self._add_liquidity_ekubo(coin_address);
            // self._add_liquidity(coin_address, SupportedExchanges::Jediswap, ekubo_pool_params);
        // self._add_liquidity(coin_address, SupportedExchanges::Ekubo, ekubo_pool_params);
        }
        fn add_liquidity_jediswap(ref self: ContractState, coin_address: ContractAddress) {
            // TODO auto distrib and claim?
            let caller = get_caller_address();

            let pool = self.launched_coins.read(coin_address);

            // assert(caller == pool.owner || caller == pool.creator, errors::OWNER_DIFFERENT);

            self._add_liquidity_jediswap(coin_address);
            // self._add_liquidity(coin_address, SupportedExchanges::Jediswap, ekubo_pool_params);
        // self._add_liquidity(coin_address, SupportedExchanges::Ekubo, ekubo_pool_params);
        }


        // TODO Finish this function
        // Claim coin if liquidity is sent
        // Check and modify the share of user
        fn claim_coin_buy(ref self: ContractState, coin_address: ContractAddress, amount: u256) {
            let caller = get_contract_address();
            // Verify if liquidity launch
            let mut launch = self.launched_coins.read(coin_address);
            assert(launch.is_liquidity_launch == true, 'not launch yet');

            // Verify share of user
            let mut share_user = self.shares_by_users.read((get_caller_address(), coin_address));

            let max_amount_claimable = share_user.amount_owned;
            assert(max_amount_claimable >= amount, 'share below');

            // Transfer memecoin
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.transfer(caller, amount);

            // Update new share and emit event
            share_user.amount_owned -= amount;
            self.shares_by_users.entry((get_caller_address(), coin_address)).write(share_user);

            self
                .emit(
                    TokenClaimed {
                        token_address: coin_address,
                        owner: caller,
                        timestamp: get_block_timestamp(),
                        amount,
                    }
                );
        }

        // TODO finish add Metadata
        fn add_metadata(
            ref self: ContractState, coin_address: ContractAddress, metadata: MetadataLaunch
        ) {
            let caller = get_contract_address();
            // Verify if caller is owner
            let mut launch = self.launched_coins.read(coin_address);
            assert(launch.owner == caller, 'not owner');

            // Add or update metadata

            self.metadata_coins.entry(coin_address).write(metadata.clone());
            self
                .emit(
                    MetadataCoinAdded {
                        token_address: coin_address,
                        url: metadata.url,
                        timestamp: get_block_timestamp(),
                        nostr_event_id: metadata.nostr_event_id,
                    }
                );
        }


        fn get_default_token(self: @ContractState) -> TokenQuoteBuyCoin {
            self.default_token.read()
        }

        fn get_threshold_liquidity(self: @ContractState) -> u256 {
            self.threshold_liquidity.read()
        }


        fn get_coin_launch(self: @ContractState, key_user: ContractAddress,) -> TokenLaunch {
            self.launched_coins.read(key_user)
        }

        fn get_share_key_of_user(
            self: @ContractState, owner: ContractAddress, key_user: ContractAddress,
        ) -> SharesTokenUser {
            self.shares_by_users.read((owner, key_user))
        }

        fn get_all_coins(self: @ContractState) -> Span<Token> {
            let max_coin_id = self.total_token.read() + 1;
            let mut coins: Array<Token> = ArrayTrait::new();
            let mut i = 0; //Since the stream id starts from 0
            loop {
                if i >= max_coin_id {}
                let coin = self.array_coins.read(i);
                if coin.owner.is_zero() {
                    break coins.span();
                }
                coins.append(coin);
                i += 1;
            }
        }

        fn get_all_launch(self: @ContractState) -> Span<TokenLaunch> {
            let max_key_id = self.total_launch.read() + 1;
            let mut launches: Array<TokenLaunch> = ArrayTrait::new();
            let mut i = 0; //Since the stream id starts from 0
            loop {
                if i >= max_key_id {}
                let pool = self.array_launched_coins.read(i);
                if pool.owner.is_zero() {
                    break launches.span();
                }
                launches.append(pool);
                i += 1;
            }
        }

        // The function calculates the amiunt of quote_token you need to buy a coin in the pool
        fn get_amount_by_type_of_coin_or_quote(
            self: @ContractState,
            coin_address: ContractAddress,
            amount: u256,
            is_decreased: bool,
            is_quote_amount: bool
        ) -> u256 {
            let pool = self.launched_coins.read(coin_address).clone();
            get_amount_by_type_of_coin_or_quote(
                pool.clone(), coin_address, amount, is_decreased, is_quote_amount
            )
            // self
        //     .get_amount_by_type_of_coin_or_quote(
        //         coin_address, amount, is_decreased, is_quote_amount
        //     )
        }

        fn get_coin_amount_by_quote_amount(
            self: @ContractState,
            coin_address: ContractAddress,
            quote_amount: u256,
            is_decreased: bool
        ) -> u256 {
            let pool = self.launched_coins.read(coin_address).clone();

            // self._get_coin_amount_by_quote_amount(coin_address, quote_amount, is_decreased)
            get_coin_amount_by_quote_amount(pool.clone(), quote_amount, is_decreased)
        }

        // fn get_quote_paid_by_amount_coin(
        //     self: @ContractState,
        //     coin_address: ContractAddress,
        //     quote_amount: u256,
        //     is_decreased: bool
        // ) -> u256 {
        //     self._get_quote_paid_by_amount_coin(coin_address, quote_amount, is_decreased)
        // }

        //TODO refac
        // Used for Add liquidity in Unruggable mode
        fn add_liquidity_unrug(
            ref self: ContractState,
            coin_address: ContractAddress,
            launch_params: LaunchParameters,
            ekubo_pool_params: EkuboPoolParameters
        ) -> (u64, EkuboLP) {
            //TODO restrict fn?

            self._add_internal_liquidity_unrug(coin_address, launch_params, ekubo_pool_params)
            // INTEGRATION not working
        // self._add_liquidity_unrug(launch_params, ekubo_pool_params)
        }

        //TODO refac
        fn add_liquidity_unrug_lp(
            ref self: ContractState,
            coin_address: ContractAddress,
            quote_address: ContractAddress,
            lp_supply: u256,
            launch_params: LaunchParameters,
            ekubo_pool_params: EkuboPoolParameters
        ) -> (u64, EkuboLP) {
            //TODO restrict fn?

            let caller = get_caller_address();
            self
                ._add_internal_liquidity_unrug_lp(
                    caller, coin_address, quote_address, lp_supply, launch_params, ekubo_pool_params
                )
            // INTEGRATION not working
        // self._add_liquidity_unrug(launch_params, ekubo_pool_params)
        }

        fn create_unrug_token(
            ref self: ContractState,
            owner: ContractAddress,
            name: felt252,
            symbol: felt252,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_launch_bonding_now: bool,
        ) -> ContractAddress {
            let caller = get_caller_address();
            let creator = get_caller_address();
            let contract_address = get_contract_address();
            let owner = get_caller_address();
            if is_launch_bonding_now == true {
                let token_address = self
                    ._create_token(
                        contract_address,
                        caller,
                        symbol,
                        name,
                        initial_supply,
                        contract_address_salt,
                        true
                    );
                self._launch_token(token_address, caller, contract_address, true);
                token_address
            } else {
                let token_address = self
                    ._create_token(
                        contract_address,
                        caller,
                        symbol,
                        name,
                        initial_supply,
                        contract_address_salt,
                        true
                    );
                let contract_address = get_contract_address();

                let mut token = Token {
                    token_address: token_address,
                    owner: owner,
                    creator: creator,
                    name,
                    symbol,
                    total_supply: initial_supply,
                    initial_supply: initial_supply,
                    created_at: get_block_timestamp(),
                    token_type: Option::None,
                    is_unruggable: true
                };
                self.token_created.entry(token_address).write(token);
                token_address
            }
        }

        fn add_liquidity_ekubo(
            ref self: ContractState, coin_address: ContractAddress,
            // params: EkuboLaunchParameters
        // ) ->  Span<felt252>  {
        ) -> (u64, EkuboLP) {
            let caller = get_caller_address();
            let pool = self.launched_coins.read(coin_address);
            // assert(caller == pool.owner, errors::OWNER_DIFFERENT);
            
            // assert(caller == pool.owner || caller == pool.creator, errors::OWNER_DIFFERENT);
            self._add_liquidity_ekubo(coin_address)
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

    // // Could be a group of functions about a same topic
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _create_token(
            ref self: ContractState,
            recipient: ContractAddress,
            owner: ContractAddress,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_unruggable: bool
        ) -> ContractAddress {
            let mut calldata = array![name.into(), symbol.into()];
            Serde::serialize(@initial_supply, ref calldata);
            Serde::serialize(@recipient, ref calldata);
            Serde::serialize(@18, ref calldata);

            let (token_address, _) = deploy_syscall(
                self.coin_class_hash.read(), contract_address_salt, calldata.span(), false
            )
                .unwrap();
            // .unwrap_syscall();
            // println!("token address {:?}", token_address);

            let token = Token {
                token_address: token_address,
                owner: recipient,
                creator: owner,
                name,
                symbol,
                total_supply: initial_supply,
                initial_supply: initial_supply,
                created_at: get_block_timestamp(),
                token_type: Option::None,
                is_unruggable: is_unruggable
            };

            self.token_created.entry(token_address).write(token);

            let total_token = self.total_token.read();
            if total_token == 0 {
                self.total_token.write(1);
                self.array_coins.entry(0).write(token);
            } else {
                self.total_token.write(total_token + 1);
                self.array_coins.entry(total_token).write(token);
            }

            self
                .emit(
                    CreateToken {
                        caller: get_caller_address(),
                        token_address: token_address,
                        symbol: symbol,
                        name: name,
                        initial_supply,
                        total_supply: initial_supply.clone(),
                        is_unruggable: is_unruggable
                    }
                );
            token_address
        }


        fn _launch_token(
            ref self: ContractState,
            coin_address: ContractAddress,
            caller: ContractAddress,
            creator: ContractAddress,
            is_unruggable: bool
        ) {
            // let caller = get_caller_address();
            let token = self.token_created.read(coin_address);

            // TODO
            // Maybe not needed because you can also create the coin everyhwhere (Unrug) and launch
            let mut token_to_use = self.default_token.read();
            let mut quote_token_address = token_to_use.token_address.clone();
            let bond_type = BondingType::Linear;
            // let erc20 = IERC20Dispatcher { contract_address: quote_token_address };
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            let total_supply = memecoin.total_supply();
            let threshold_liquidity = self.threshold_liquidity.read();
            let protocol_fee_percent = self.protocol_fee_percent.read();
            let creator_fee_percent = self.creator_fee_percent.read();

            // let threshold = pool.threshold_liquidity;

            // TODO calculate initial key price based on
            // MC
            // Threshold liquidity
            // total supply

            // Total supply / 5 to get 20% of supply add after threshold
            let liquidity_supply = total_supply / LIQUIDITY_RATIO;
            let supply_distribution = total_supply - liquidity_supply;
            let liquidity_available = total_supply - liquidity_supply;

            // let (slope, init_price) = self._calculate_pricing(total_supply - liquidity_supply);
            let starting_price = calculate_pricing(
                threshold_liquidity.clone(), supply_distribution.clone()
            );
            let slope = calculate_slope(
                threshold_liquidity.clone(), starting_price.clone(), supply_distribution.clone()
            );
            // let starting_price = threshold_liquidity / total_supply;
            // // @TODO Deploy an ERC404
            // // Option for liquidity providing and Trading
            let launch_token_pump = TokenLaunch {
                owner: caller,
                creator: caller,
                token_address: coin_address, // CREATE 404
                total_supply: total_supply,
                // available_supply: total_supply,
                available_supply: supply_distribution,
                initial_available_supply: supply_distribution,
                initial_pool_supply: liquidity_supply,
                // available_supply:liquidity_supply,
                // Todo price by pricetype after fix Enum instantiate
                bonding_curve_type: Option::Some(bond_type),
                // bonding_curve_type: BondingType,
                created_at: get_block_timestamp(),
                token_quote: token_to_use.clone(),
                starting_price: starting_price.clone(),
                // starting_price: token_to_use.starting_price,
                price: starting_price.clone(),
                // price:init_price,
                liquidity_raised: 0_u256,
                total_token_holded: 0_u256,
                is_liquidity_launch: false,
                slope: slope,
                threshold_liquidity: threshold_liquidity,
                liquidity_type: Option::None,
                protocol_fee_percent: protocol_fee_percent,
                creator_fee_percent: creator_fee_percent
            };
            // Send supply need to launch your coin
            let amount_needed = total_supply.clone();
            // println!("amount_needed {:?}", amount_needed);
            let allowance = memecoin.allowance(caller, get_contract_address());
            // println!("test allowance contract {:?}", allowance);
            let balance_contract = memecoin.balance_of(get_contract_address());

            let is_memecoin = is_unruggable;
            // let is_memecoin = factory.is_memecoin(memecoin.contract_address);
            // if balance_contract < total_supply && !is_memecoin {
            if balance_contract < total_supply {
                // && !is_memecoin
                assert(allowance >= amount_needed, 'no supply provided');
                if allowance >= amount_needed {
                    // println!("allowance > amount_needed{:?}", allowance > amount_needed);
                    memecoin
                        .transfer_from(
                            caller, get_contract_address(), total_supply - balance_contract
                        );
                }
            }

            // memecoin.transfer_from(get_caller_address(), get_contract_address(), amount_needed);
            self.launched_coins.entry(coin_address).write(launch_token_pump.clone());

            let total_launch = self.total_launch.read();
            if total_launch == 0 {
                self.total_launch.write(1);
                self.array_launched_coins.entry(0).write(launch_token_pump);
            } else {
                self.total_launch.write(total_launch + 1);
                self.array_launched_coins.entry(total_launch).write(launch_token_pump);
            }
            self
                .emit(
                    CreateLaunch {
                        caller: get_caller_address(),
                        token_address: coin_address,
                        amount: 0,
                        price: starting_price,
                        total_supply: total_supply,
                        slope: slope,
                        threshold_liquidity: threshold_liquidity,
                        quote_token_address: quote_token_address,
                        is_unruggable: is_unruggable
                    }
                );
        }

        // TODO add liquidity to Ekubo, Jediswap and others exchanges enabled
        // TODO Increased liquidity if pool already exist
        fn _add_liquidity(
            ref self: ContractState, coin_address: ContractAddress, exchange: SupportedExchanges
        ) {
            match exchange {
                SupportedExchanges::Jediswap => { self._add_liquidity_jediswap(coin_address) },
                SupportedExchanges::Ekubo => { self._add_liquidity_ekubo(coin_address); },
            }
            let mut launch_to_update = self.launched_coins.read(coin_address);
            launch_to_update.is_liquidity_launch = true;
            self.launched_coins.entry(coin_address).write(launch_to_update.clone());
        }


        fn _supply_liquidity_ekubo(
            ref self: ContractState,
            pool_key: PoolKey,
            token: ContractAddress,
            amount: u256,
            bounds: Bounds
        ) -> u64 {
            // println!("mint deposit NOW HERE: {}", 1);

            let positions_address = self.positions.read();
            let positions = IPositionsDispatcher { contract_address: positions_address };
            println!("mint deposit NOW HERE: {}", 2);

            // // The token must be transferred to the positions contract before calling mint.
            // IERC20Dispatcher { contract_address: token }
            //     .transfer(recipient: positions.contract_address, :amount);
            // println!("mint deposit NOW HERE: {}", 3);

            let (id, liquidity) = positions.mint_and_deposit(pool_key, bounds, min_liquidity: 0);
            // let (id, liquidity, _, _) = positions
            // .mint_and_deposit_and_clear_both(pool_key, bounds, min_liquidity: 0);
            println!("mint deposit NOW HERE: {}", 4);
            id
        }

        fn _add_liquidity_ekubo(
            ref self: ContractState, coin_address: ContractAddress,
            // params: EkuboLaunchParameters
        ) -> (u64, EkuboLP) {
            // TODO params of Ekubo launch
            // Init price and params of liquidity

            // TODO assert of threshold and MC reached
            let launch = self.launched_coins.read(coin_address);
            assert(launch.liquidity_raised >= launch.threshold_liquidity, 'no threshold raised');
            assert(launch.is_liquidity_launch == false, 'liquidity already launch');

            // TODO calculate price

            // let launch_price = launch.initial_pool_supply / launch.threshold_liquidity;
            // println!("launch_price {:?}", launch_price);

            // let price_u128:u128=launch_price.try_into().unwrap();
            // println!("price_u128 {:?}", price_u128);

            // let starting_price = i129 { sign: true, mag: 100_u128 };
            // let starting_price = i129 { sign: true, mag: 100_u128 };
            // let starting_price = i129 { sign: true, mag: price_u128 };
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
            // let registry_address = self.ekubo_registry.read();
            // let registry = ITokenRegistryDispatcher { contract_address: registry_address };

            let ekubo_core_address = self.core.read();
            let ekubo_exchange_address = self.ekubo_exchange_address.read();
            let memecoin = EKIERC20Dispatcher { contract_address: params.token_address };
            //TODO token decimal, amount of 1 token?

            // println!("RIGHT HERE: {}", 1);

            let pool = self.launched_coins.read(coin_address);
            // let dex_address = self.core.read();
            let positions_ekubo = self.positions.read();
            memecoin.approve(ekubo_exchange_address, lp_meme_supply);
            memecoin.approve(ekubo_core_address, lp_meme_supply);
            memecoin.approve(positions_ekubo, lp_meme_supply);
            assert!(memecoin.contract_address == params.token_address, "Token address mismatch");
            let base_token = EKIERC20Dispatcher { contract_address: params.quote_address };
            //TODO token decimal, amount of 1 token?
            // let pool = self.launched_coins.read(coin_address);
            base_token.approve(ekubo_exchange_address, pool.liquidity_raised);
            base_token.approve(ekubo_core_address, pool.liquidity_raised);
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

            let mut launch_to_update = self.launched_coins.read(coin_address);
            launch_to_update.is_liquidity_launch = true;
            self.launched_coins.entry(coin_address).write(launch_to_update.clone());

            // println!("RIGHT HERE: {}", 4);

            self
                .emit(
                    LiquidityCreated {
                        id: id_cast,
                        pool: coin_address,
                        asset: coin_address,
                        quote_token_address: base_token.contract_address,
                        owner: launch.owner,
                        exchange: SupportedExchanges::Ekubo,
                        is_unruggable: false
                    }
                );

            (id, position)
        }

        /// TODO fix change
        fn _check_common_launch_parameters(
            ref self: ContractState, launch_parameters: LaunchParameters
        ) -> (u256, u8) {
            let LaunchParameters { memecoin_address,
            transfer_restriction_delay,
            max_percentage_buy_launch,
            quote_address,
            initial_holders,
            initial_holders_amounts } =
                launch_parameters;
            let memecoin = IMemecoinDispatcher { contract_address: memecoin_address };
            let erc20 = IERC20Dispatcher { contract_address: memecoin_address };

            // TODO fix assert
            // assert(self.is_memecoin(memecoin_address), errors::NOT_UNRUGGABLE);
            // assert(!self.is_memecoin(quote_address), errors::QUOTE_TOKEN_IS_MEMECOIN);
            assert(!memecoin.is_launched(), errors::ALREADY_LAUNCHED);
            // assert(get_caller_address() == memecoin.owner(), errors::CALLER_NOT_OWNER);
            assert(initial_holders.len() == initial_holders_amounts.len(), errors::ARRAYS_LEN_DIF);
            assert(initial_holders.len() <= MAX_HOLDERS_LAUNCH.into(), errors::MAX_HOLDERS_REACHED);

            let initial_supply = erc20.total_supply();

            // Check that the sum of the amounts of initial holders does not exceed the max
            // allocatable supply for a team.

            // Needs to be an adjustable parameters described by the team
            let max_team_allocation = initial_supply
                .percent_mul(MAX_SUPPLY_PERCENTAGE_TEAM_ALLOCATION.into());
            let mut team_allocation: u256 = 0;
            let mut i: usize = 0;
            loop {
                if i == initial_holders.len() {
                    break;
                }

                let address = *initial_holders.at(i);
                let amount = *initial_holders_amounts.at(i);

                team_allocation += amount;
                assert(team_allocation <= max_team_allocation, errors::MAX_TEAM_ALLOCATION_REACHED);
                i += 1;
            };

            (team_allocation, unique_count(initial_holders).try_into().unwrap())
        }


        // Launch token Unrug with a Launch bonding curve already created
        // Add liquidity with params:
        // Team allocation
        // Token lock
        fn _add_internal_liquidity_unrug(
            ref self: ContractState,
            coin_address: ContractAddress,
            launch_params: LaunchParameters,
            ekubo_pool_params: EkuboPoolParameters
        ) -> (u64, EkuboLP) {
            let launch = self.launched_coins.read(coin_address);
            // let starting_price = i129 { sign: true, mag: 100_u128 };

            // let starting_price: i129 = self._calculate_starting_price_launch(
            //     launch.initial_pool_supply.clone(), launch.threshold_liquidity.clone()
            // );
            let starting_price: i129 = calculate_starting_price_launch(
                launch.initial_pool_supply.clone(), launch.threshold_liquidity.clone()
            );

            let lp_meme_supply = launch.initial_available_supply - launch.available_supply;

            let lp_meme_supply = launch.initial_pool_supply;
            let lp_supply = launch.initial_pool_supply;

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
            // let params: EkuboLaunchParameters = EkuboLaunchParameters {
            //     owner: launch.owner,
            //     token_address: launch.token_address,
            //     quote_address: launch.token_quote.token_address,
            //     lp_supply: lp_meme_supply,
            //     // lp_supply: launch.liquidity_raised,
            //     pool_params: EkuboPoolParameters {
            //         fee: 0xc49ba5e353f7d00000000000000000,
            //         tick_spacing: 5982,
            //         starting_price,
            //         bound: 88719042,
            //     }
            // };

            let (team_allocation, pre_holders) = self
                ._check_common_launch_parameters(launch_params);

            assert(launch.liquidity_raised >= launch.threshold_liquidity, 'no threshold raised');
            assert(launch.is_liquidity_launch == false, 'liquidity already launch');

            assert(
                ekubo_pool_params.fee <= 0x51eb851eb851ec00000000000000000, errors::FEE_TOO_HIGH
            );
            assert(ekubo_pool_params.tick_spacing >= 5982, errors::TICK_SPACING_TOO_LOW);
            assert(ekubo_pool_params.tick_spacing <= 19802, errors::TICK_SPACING_TOO_HIGH);
            assert(ekubo_pool_params.bound >= 88712960, errors::BOUND_TOO_LOW);

            let LaunchParameters { memecoin_address,
            transfer_restriction_delay,
            max_percentage_buy_launch,
            quote_address,
            initial_holders,
            initial_holders_amounts } =
                launch_params;

            // let launchpad_address = self.exchange_address(SupportedExchanges::Ekubo);
            let launchpad_address = self.ekubo_exchange_address.read();

            // let launchpad_address = self.exchange_address(SupportedExchanges::Ekubo);
            assert(launchpad_address.is_non_zero(), errors::EXCHANGE_ADDRESS_ZERO);
            assert(ekubo_pool_params.starting_price.mag.is_non_zero(), errors::PRICE_ZERO);

            // let erc20 = IERC20Dispatcher { contract_address: coin_address };
            let ekubo_core_address = self.core.read();

            let pool = self.launched_coins.read(coin_address);
            let base_token = EKIERC20Dispatcher { contract_address: params.quote_address.clone() };
            //TODO token decimal, amount of 1 token?
            // let pool = self.launched_coins.read(coin_address);
            let positions_ekubo = self.positions.read();
            let ekubo_exchange_address = self.ekubo_exchange_address.read();
            base_token.approve(ekubo_exchange_address, pool.liquidity_raised);
            base_token.approve(ekubo_core_address, pool.liquidity_raised);
            base_token.approve(positions_ekubo, pool.liquidity_raised);

            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.approve(ekubo_core_address, lp_supply);
            memecoin.approve(positions_ekubo, lp_meme_supply);

            let core = ICoreDispatcher { contract_address: ekubo_core_address };
            println!("ekubo add liq");

            let (id, position) = call_core_with_callback::<
                CallbackData, (u64, EkuboLP)
            >(core, @CallbackData::LaunchCallback(LaunchCallback { params }));

            println!("distribute_team_alloc");
            distribute_team_alloc(memecoin, initial_holders, initial_holders_amounts);

            let memecoin = IMemecoinDispatcher { contract_address: coin_address };

            memecoin
                .set_launched(
                    LiquidityType::EkuboNFT(id),
                    LiquidityParameters::Ekubo(
                        EkuboLiquidityParameters {
                            quote_address, ekubo_pool_parameters: ekubo_pool_params
                        }
                    ),
                    :transfer_restriction_delay,
                    :max_percentage_buy_launch,
                    :team_allocation,
                );
            // self
            //     .emit(
            //         MemecoinLaunched {
            //             memecoin_address, quote_token: quote_address, exchange_name: 'Ekubo'
            //         }
            //     );
            (id, position)
        }


        // Direct add and lock liquidity without launch in bonding curve
        // Needs to be more modular:WIP
        // Readd different exchanges: Ekubo, Jediswap, StarkDefi
        fn _add_internal_liquidity_unrug_lp(
            ref self: ContractState,
            caller: ContractAddress,
            coin_address: ContractAddress,
            quote_address: ContractAddress,
            lp_supply: u256,
            launch_params: LaunchParameters,
            ekubo_pool_params: EkuboPoolParameters
        ) -> (u64, EkuboLP) {
            let starting_price = i129 { sign: true, mag: 10_u128 };

            let params: EkuboLaunchParameters = EkuboLaunchParameters {
                owner: caller,
                token_address: coin_address,
                quote_address: quote_address,
                lp_supply: lp_supply,
                // lp_supply: launch.liquidity_raised,
                pool_params: ekubo_pool_params
            };
            let (team_allocation, pre_holders) = self
                ._check_common_launch_parameters(launch_params);

            assert(
                ekubo_pool_params.fee <= 0x51eb851eb851ec00000000000000000, errors::FEE_TOO_HIGH
            );
            assert(ekubo_pool_params.tick_spacing >= 5982, errors::TICK_SPACING_TOO_LOW);
            assert(ekubo_pool_params.tick_spacing <= 19802, errors::TICK_SPACING_TOO_HIGH);
            assert(ekubo_pool_params.bound >= 88712960, errors::BOUND_TOO_LOW);

            let LaunchParameters { memecoin_address,
            transfer_restriction_delay,
            max_percentage_buy_launch,
            quote_address,
            initial_holders,
            initial_holders_amounts } =
                launch_params;

            let launchpad_address = self.ekubo_exchange_address.read();
            assert(launchpad_address.is_non_zero(), errors::EXCHANGE_ADDRESS_ZERO);
            assert(ekubo_pool_params.starting_price.mag.is_non_zero(), errors::PRICE_ZERO);
            let pool = self.launched_coins.read(coin_address);

            let base_token = IERC20Dispatcher { contract_address: params.quote_address.clone() };
            let ekubo_core_address = self.core.read();
            let ekubo_exchange_address = self.ekubo_exchange_address.read();

            base_token.approve(ekubo_exchange_address, pool.liquidity_raised);
            base_token.approve(ekubo_core_address, pool.liquidity_raised);

            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.approve(ekubo_core_address, lp_supply);

            let core = ICoreDispatcher { contract_address: ekubo_core_address };
            println!("ekubo add liq");

            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.approve(ekubo_core_address, lp_supply);

            let core = ICoreDispatcher { contract_address: ekubo_core_address };

            let (id, position) = call_core_with_callback::<
                CallbackData, (u64, EkuboLP)
            >(core, @CallbackData::LaunchCallback(LaunchCallback { params }));

            distribute_team_alloc(memecoin, initial_holders, initial_holders_amounts);

            let memecoin_dispatcher = IMemecoinDispatcher { contract_address: coin_address };

            memecoin_dispatcher
                .set_launched(
                    LiquidityType::EkuboNFT(id),
                    LiquidityParameters::Ekubo(
                        EkuboLiquidityParameters {
                            quote_address, ekubo_pool_parameters: ekubo_pool_params
                        }
                    ),
                    :transfer_restriction_delay,
                    :max_percentage_buy_launch,
                    :team_allocation,
                );
            // self
            //     .emit(
            //         MemecoinLaunched {
            //             memecoin_address, quote_token: quote_address, exchange_name: 'Ekubo'
            //         }
            //     );
            (id, position)
        }

        // TODO add liquidity or increase
        // Better params of Mint
        fn _add_liquidity_jediswap(ref self: ContractState, coin_address: ContractAddress) {
            let mut factory_address = self.address_jediswap_factory_v2.read();
            let nft_router_address = self.address_jediswap_nft_router_v2.read();

            if nft_router_address.is_zero() {
                return;
            }
            let nft_router = IJediswapNFTRouterV2Dispatcher {
                contract_address: nft_router_address
            };

            let facto_address = nft_router.factory();

            if !facto_address.is_zero() {
                factory_address = facto_address.clone();
            }

            if factory_address.is_zero() {
                return;
            }
            // let jediswap_address = self.exchange_configs.read(SupportedExchanges::Jediswap);
            //
            let fee: u32 = 10_000;
            let factory = IJediswapFactoryV2Dispatcher { contract_address: factory_address };
            let launch = self.launched_coins.read(coin_address);
            let token_a = launch.token_address.clone();
            let asset_token_address = launch.token_address.clone();
            let quote_token_address = launch.token_quote.token_address.clone();
            let token_b = launch.token_quote.token_address.clone();
            // TODO tokens check
            // assert!(token_a != token_b, "same token");
            // Look if pool already exist
            // Init and Create pool if not exist
            let mut pool: ContractAddress = factory.get_pool(token_a, token_b, fee);
            let sqrt_price_X96 = 0; // TODO change sqrt_price_X96

            // TODO check if pool exist
            // Pool need to be create
            // Better params for Liquidity launching
            // let token_asset = IERC20Dispatcher { contract_address: token_a };

            // TODO
            // Used total supply if coin is minted
            // let total_supply_now = token_asset.total_supply().clone();
            let total_supply = launch.total_supply.clone();
            let liquidity_raised = launch.liquidity_raised.clone();
            // let total_supply = launch.total_supply.clone();

            let amount_coin_liq = total_supply / LIQUIDITY_RATIO;
            let amount0_desired = 0;
            let amount1_desired = 0;
            let amount0_min = amount_coin_liq;
            let amount1_min = liquidity_raised;
            let tick_lower: i32 = 0;
            let tick_upper: i32 = 0;
            let deadline: u64 = get_block_timestamp();

            // @TODO check mint params

            if pool.into() == 0_felt252 {
                pool = factory.create_pool(token_a, token_b, fee);
                pool = nft_router.create_and_initialize_pool(token_a, token_b, fee, sqrt_price_X96);
                // TODO Increase liquidity with router if exist
                // Approve token asset and quote to be transferred
                let token_asset = IERC20Dispatcher { contract_address: token_a };
                let token_quote = IERC20Dispatcher { contract_address: token_b };
                token_asset.approve(nft_router_address, amount_coin_liq);
                token_quote.approve(nft_router_address, launch.liquidity_raised);
                // TODO verify Mint params
                // Test snforge in Sepolia
                let mint_params = MintParams {
                    token0: token_a,
                    token1: token_b,
                    fee: fee,
                    tick_lower: tick_lower,
                    tick_upper: tick_upper,
                    amount0_desired: amount0_desired,
                    amount1_desired: amount1_desired,
                    amount0_min: amount0_min,
                    amount1_min: amount1_min,
                    recipient: launch.owner, // TODO add 
                    deadline: deadline,
                };

                let (token_id, _, _, _) = nft_router.mint(mint_params);
                // TODO Locked LP token
                self
                    .emit(
                        LiquidityCreated {
                            id: token_id,
                            pool: pool,
                            quote_token_address: quote_token_address,
                            // token_id:token_id,
                            owner: launch.owner,
                            asset: asset_token_address,
                            exchange: SupportedExchanges::Jediswap,
                            is_unruggable: false
                        }
                    );
            } else { // TODO 
            // Increase liquidity of this pool.
            }
        }
    }
}
