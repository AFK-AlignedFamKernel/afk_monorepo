// SPDX-License-Identifier: MIT
// https://github.com/henryf10h/dynamic-fees-extension/blob/main/src/contracts/internal_swap_pool.cairo

use core::serde::Serde;
use ekubo::interfaces::core::{ICoreDispatcher, SwapParameters};
use ekubo::types::delta::Delta;
use ekubo::types::i129::i129;
use ekubo::types::keys::PoolKey;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IISP<TState> {
    fn initialize(
        ref self: TState,
        native_token: ContractAddress,
        creator: ContractAddress,
        core: ICoreDispatcher,
        fee_percentage_creator: u128,
    );
    fn can_use_prefill(self: @TState, pool_key: PoolKey, params: SwapParameters) -> bool;
    fn accumulate_fees(ref self: TState, pool_key: PoolKey, token: ContractAddress, amount: u128);
    fn get_native_token(self: @TState) -> ContractAddress;
    fn calc_fee(ref self: TState, amount: u128) -> u128;
}


#[derive(Serde, Copy, Drop)]
pub struct RouteNode {
    pub pool_key: PoolKey,
    pub sqrt_ratio_limit: u256,
    pub skip_ahead: u128,
}

// Amount of token to swap and its address
#[derive(Serde, Copy, Drop)]
pub struct TokenAmount {
    pub token: ContractAddress,
    pub amount: i129,
}

// Swap argument for multi multi-hop swaps
// After single swap works well change to: pub route: Array<RouteNode>
#[derive(Serde, Drop)]
pub struct Swap {
    pub route: RouteNode,
    pub token_amount: TokenAmount,
}

// Interface for ISP Router
#[starknet::interface]
pub trait IISPRouter<TContractState> {
    fn swap(ref self: TContractState, swap_data: Swap) -> Delta;
}

#[starknet::contract]
pub mod InternalSwapPool {
    use core::array::ArrayTrait;
    use core::serde::Serde;
    use ekubo::components::clear::ClearImpl;
    use ekubo::components::owned::Owned as owned_component;
    use ekubo::components::shared_locker::consume_callback_data;
    use ekubo::components::upgradeable::{IHasInterface, Upgradeable as upgradeable_component};
    use ekubo::interfaces::core::{
        ICoreDispatcher, ICoreDispatcherTrait, IExtension, IForwardee, SwapParameters,
        UpdatePositionParameters,
    };
    use ekubo::types::bounds::Bounds;
    use ekubo::types::call_points::CallPoints;
    use ekubo::types::delta::Delta;
    use ekubo::types::i129::i129;
    use ekubo::types::keys::{PoolKey, SavedBalanceKey};
    use starknet::storage::*;
    use starknet::{ContractAddress, get_contract_address};
    use super::{IISP, Swap};

    #[abi(embed_v0)]
    impl Clear = ekubo::components::clear::ClearImpl<ContractState>;

    component!(path: owned_component, storage: owned, event: OwnedEvent);
    #[abi(embed_v0)]
    impl Owned = owned_component::OwnedImpl<ContractState>;
    impl OwnableImpl = owned_component::OwnableImpl<ContractState>;

    component!(path: upgradeable_component, storage: upgradeable, event: UpgradeableEvent);
    #[abi(embed_v0)]
    impl Upgradeable = upgradeable_component::UpgradeableImpl<ContractState>;

    // TODO  Used in V2 and be choose by user
    const ZERO_FEE_AMOUNT: u256 = 0; //0%
    const MIN_FEE_CREATOR: u256 = 100; //1%
    const MID_FEE_CREATOR: u256 = 300; //3%
    const MAX_FEE_CREATOR: u256 = 500; //5%

    const MIN_FEE_PROTOCOL: u256 = 10; //0.1%
    const MAX_FEE_PROTOCOL: u256 = 1000; //10%
    const MID_FEE_PROTOCOL: u256 = 100; //1%

    #[storage]
    struct Storage {
        #[substorage(v0)]
        upgradeable: upgradeable_component::Storage,
        #[substorage(v0)]
        owned: owned_component::Storage,
        core: ICoreDispatcher,
        native_token: ContractAddress,
        creator:ContractAddress,
        fee_percentage_creator: u256,
        fee_percentage_protocol: u256,
        protocol_address: ContractAddress,
        factory_address: ContractAddress,

        is_auto_buyback_enabled: bool,

    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        creator: ContractAddress,
        core: ICoreDispatcher,
        native_token: ContractAddress,
        protocol_address: ContractAddress,
        fee_percentage_creator: u256,
        fee_percentage_protocol: u256,
        factory_address: ContractAddress,
        is_auto_buyback_enabled: bool,
    ) {
        self.initialize_owned(owner);

        assert(fee_percentage_protocol > MIN_FEE_PROTOCOL, 'fee_percentage_protocol_too_low');
        assert(fee_percentage_creator < MAX_FEE_CREATOR, 'fee_percentage_too_high');
        assert(fee_percentage_creator > MIN_FEE_CREATOR, 'fee_percentage_too_low');
        assert(native_token != protocol_address, 'native_token_error');

        // Set ISP fields directly
        self.native_token.write(native_token);
        self.core.write(core);
        self.fee_percentage_creator.write(fee_percentage_creator); // 0.3%
        self.protocol_address.write(protocol_address);
        self.factory_address.write(factory_address);
        self.creator.write(creator);
        self.fee_percentage_creator.write(fee_percentage_creator);
        self.fee_percentage_protocol.write(fee_percentage_protocol);

        // Set call points - minimal requirements for ISP
        core
            .set_call_points(
                CallPoints {
                    before_initialize_pool: false,
                    after_initialize_pool: false,
                    before_swap: true,
                    after_swap: false,
                    before_update_position: false,
                    after_update_position: false,
                    before_collect_fees: false,
                    after_collect_fees: false,
                },
            );
    }

    #[derive(Drop, starknet::Event)]
    pub struct SwapProcessed {
        #[key]
        pub pool_key: PoolKey,
        #[key]
        pub user: ContractAddress,
        pub swap_amount: u128,
        pub total_output: u128,
    }

    #[derive(starknet::Event, Drop)]
    #[event]
    enum Event {
        SwapProcessed: SwapProcessed,
        #[flat]
        UpgradeableEvent: upgradeable_component::Event,
        #[flat]
        OwnedEvent: owned_component::Event,
    }

    // Implement IHasInterface for contract identification
    #[abi(embed_v0)]
    impl InternalSwapPoolHasInterface of IHasInterface<ContractState> {
        fn get_primary_interface_id(self: @ContractState) -> felt252 {
            selector!("relaunch::contracts::internal_swap_pool::InternalSwapPool")
        }
    }

    // Minimal extension implementation
    #[abi(embed_v0)]
    impl ExtensionImpl of IExtension<ContractState> {
        fn before_initialize_pool(
            ref self: ContractState, caller: ContractAddress, pool_key: PoolKey, initial_tick: i129,
        ) {}
        fn after_initialize_pool(
            ref self: ContractState, caller: ContractAddress, pool_key: PoolKey, initial_tick: i129,
        ) {}
        fn before_swap(
            ref self: ContractState,
            caller: ContractAddress,
            pool_key: PoolKey,
            params: SwapParameters,
        ) {
            panic!("Only from internal_swap_pool");
        }
        fn after_swap(
            ref self: ContractState,
            caller: ContractAddress,
            pool_key: PoolKey,
            params: SwapParameters,
            delta: Delta,
        ) {}
        fn before_update_position(
            ref self: ContractState,
            caller: ContractAddress,
            pool_key: PoolKey,
            params: UpdatePositionParameters,
        ) {}
        fn after_update_position(
            ref self: ContractState,
            caller: ContractAddress,
            pool_key: PoolKey,
            params: UpdatePositionParameters,
            delta: Delta,
        ) {}
        fn before_collect_fees(
            ref self: ContractState,
            caller: ContractAddress,
            pool_key: PoolKey,
            salt: felt252,
            bounds: Bounds,
        ) {}
        fn after_collect_fees(
            ref self: ContractState,
            caller: ContractAddress,
            pool_key: PoolKey,
            salt: felt252,
            bounds: Bounds,
            delta: Delta,
        ) {}
    }


    #[abi(embed_v0)]
    impl LockedImpl of ILocker<ContractState> {
        fn locked(ref self: ContractState, id: u32, data: Span<felt252>) -> Span<felt252> {
            let core = self.core.read();
            let (pool_key, skip_ahead) = consume_callback_data::<(PoolKey, u128)>(core, data);

            let tick_after_swap = core.get_pool_price(pool_key).tick;
            let state_entry = self.pools.entry((pool_key.token0, pool_key.token1));
            let state = state_entry.read();
            let mut initialized_ticks_crossed = state.initialized_ticks_crossed;

            let pool_initialized_ticks_crossed_entry = self
                .initialized_ticks_crossed_last_crossing
                .entry((pool_key.token0, pool_key.token1));

            if (tick_after_swap != state.last_tick) {
                let this_address = get_contract_address();
                let price_increasing = tick_after_swap > state.last_tick;
                let mut tick_current = state.last_tick;
                let mut save_amount: u128 = 0;

                loop {
                    let (next_tick, is_initialized) = if price_increasing {
                        core.next_initialized_tick(pool_key, tick_current, skip_ahead)
                    } else {
                        core.prev_initialized_tick(pool_key, tick_current, skip_ahead)
                    };

                    if ((next_tick > tick_after_swap) == price_increasing) {
                        break ();
                    };

                    if (is_initialized
                        & ((next_tick.mag % DOUBLE_LIMIT_ORDER_TICK_SPACING).is_non_zero())) {
                        let bounds = if price_increasing {
                            Bounds {
                                lower: next_tick
                                    - i129 { mag: LIMIT_ORDER_TICK_SPACING, sign: false },
                                upper: next_tick,
                            }
                        } else {
                            Bounds {
                                lower: next_tick,
                                upper: next_tick
                                    + i129 { mag: LIMIT_ORDER_TICK_SPACING, sign: false },
                            }
                        };

                        let position_data = core
                            .get_position(
                                pool_key, PositionKey { salt: 0, owner: this_address, bounds }
                            );

                        let delta = core
                            .update_position(
                                pool_key,
                                UpdatePositionParameters {
                                    salt: 0,
                                    bounds,
                                    liquidity_delta: i129 {
                                        mag: position_data.liquidity, sign: true
                                    }
                                }
                            );

                        save_amount +=
                            if price_increasing {
                                delta.amount1.mag
                            } else {
                                delta.amount0.mag
                            };
                        initialized_ticks_crossed += 1;
                        pool_initialized_ticks_crossed_entry
                            .write(next_tick, initialized_ticks_crossed);
                    };

                    tick_current =
                        if price_increasing {
                            next_tick
                        } else {
                            next_tick - i129 { mag: LIMIT_ORDER_TICK_SPACING, sign: false }
                        };
                };

                if (save_amount.is_non_zero()) {
                    core
                        .save(
                            SavedBalanceKey {
                                owner: this_address,
                                token: if price_increasing {
                                    pool_key.token1
                                } else {
                                    pool_key.token0
                                },
                                salt: 0,
                            },
                            save_amount
                        );
                }

                state_entry
                    .write(PoolState { initialized_ticks_crossed, last_tick: tick_after_swap });
            }

            array![].span()
        }
    }



    // Core ISP logic - handles forwarded calls from router
    #[abi(embed_v0)]
    impl ForwardeeImpl of IForwardee<ContractState> {
        fn forwarded(
            ref self: ContractState, original_locker: ContractAddress, id: u32, data: Span<felt252>,
        ) -> Span<felt252> {
            let core = self.core.read();

            // Consume the callback data from router
            let swap_data: Swap = consume_callback_data(core, data);

            // Determine if it is token1
            let is_token1 = swap_data.route.pool_key.token1 == swap_data.token_amount.token;

            // Directly call core.swap here instead of execute_isp_swap
            let result: Delta = core
                .swap(
                    swap_data.route.pool_key,
                    SwapParameters {
                        amount: swap_data.token_amount.amount,
                        is_token1: is_token1,
                        sqrt_ratio_limit: swap_data.route.sqrt_ratio_limit,
                        skip_ahead: swap_data.route.skip_ahead,
                    },
                );

            // Handle fees based on the swap result
            let mut new_delta = result;
            if result.amount0.sign {
                // Token0 negative: take fee from amount0
                let fee = InternalSwapPoolImpl::calc_fee(ref self, result.amount0.mag);
                // Credit fee to internal swap pool owner
                let owner = self.owned.get_owner();
                let key = SavedBalanceKey {
                    owner, token: swap_data.route.pool_key.token0, salt: 0,
                };
                core.save(key, fee);
                new_delta.amount0.mag = result.amount0.mag - fee;
            } else if result.amount1.sign {
                // Token1 negative: take fee from amount1
                let fee = InternalSwapPoolImpl::calc_fee(ref self, result.amount1.mag);
                // Save fee for amount1
                let key = SavedBalanceKey {
                    owner: get_contract_address(), token: swap_data.route.pool_key.token1, salt: 1,
                };
                core.save(key, fee);
                // Load the saved balance
                core.load(key.token, key.salt, fee);
                // Accumulate as protocol fees using ekubo core
                core.accumulate_as_fees(swap_data.route.pool_key, 0, fee);
                new_delta.amount1.mag = result.amount1.mag - fee;
            }

            // Serialize and return the modified delta
            let mut result_data = array![];
            Serde::serialize(@new_delta, ref result_data);
            result_data.span()
        }
    }

    // Public interface for ISP functionality
    #[abi(embed_v0)]
    impl InternalSwapPoolImpl of IISP<ContractState> {
        fn initialize(
            ref self: ContractState,
            native_token: ContractAddress,
            creator: ContractAddress,
            core: ICoreDispatcher,
            fee_percentage_creator: u128,
        ) {// Already initialized in constructor
        }

        fn can_use_prefill(
            self: @ContractState, pool_key: PoolKey, params: SwapParameters,
        ) -> bool {
            false
        }


        fn accumulate_fees(
            ref self: ContractState, pool_key: PoolKey, token: ContractAddress, amount: u128,
        ) {}

        /// Get native token address
        fn get_native_token(self: @ContractState) -> ContractAddress {
            self.native_token.read()
        }

        fn calc_fee(ref self: ContractState, amount: u128) -> u128 {
            if amount % 2 == 0 {
                // Even: 0.5%
                (amount * 5) / 1000
            } else {
                // Odd: 1%
                amount / 100
            }
        }
        // execute_isp_swap removed; logic is now inlined in forwarded
    }
}
