#[starknet::contract]
pub mod UnrugLiquidity {
    use afk_launchpad::interfaces::jediswap::{
        // V1
        // IJediswapRouter, IJediswapRouterDispatcher, IJediswapFactoryDispatcher, //
        // IJediswapFactoryV1Dispatcher,  // IJediswapFactoryV1DispatcherTrait, V2 Jediswap
        IJediswapFactoryV2, IJediswapFactoryV2Dispatcher, IJediswapFactoryV2DispatcherTrait,
        //    Router
        // IJediswapRouterV2,
        IJediswapRouterV2Dispatcher, IJediswapRouterV2DispatcherTrait, // NFT router position
        IJediswapNFTRouterV2, IJediswapNFTRouterV2Dispatcher, IJediswapNFTRouterV2DispatcherTrait,
    };
    use afk_launchpad::interfaces::unrug::IUnrugLiquidity;
    use afk_launchpad::launchpad::errors;
    // use afk_launchpad::launchpad::helpers::{check_common_launch_parameters,
    // distribute_team_alloc};
    // use afk_launchpad::launchpad::locker::interface::{
    //     ILockManagerDispatcher, ILockManagerDispatcherTrait,
    // };
    use afk_launchpad::launchpad::math::{PercentageMath // pow_256
    };
    use afk_launchpad::launchpad::utils::{
        MAX_TICK_U128, MIN_TICK, MIN_TICK_U128, align_tick_with_max_tick_and_min_tick,
        calculate_bound_mag, sort_tokens, unique_count,
    };
    use afk_launchpad::tokens::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk_launchpad::tokens::memecoin::{IMemecoinDispatcher, IMemecoinDispatcherTrait};
    use afk_launchpad::types::jediswap_types::MintParams;
    use afk_launchpad::types::launchpad_types::{
        ADMIN_ROLE, BuyToken, CreateLaunch, CreateToken, EkuboLP, EkuboLPStore,
        EkuboLaunchParameters, EkuboUnrugLaunchParameters, FeesCollected, LaunchParameters,
        LaunchUpdated, LiquidityCanBeAdded, LiquidityCreated, LockPosition, MINTER_ROLE,
        MetadataCoinAdded, MetadataLaunch, MetadataLaunchParams, SellToken, SetJediswapNFTRouterV2,
        SetJediswapRouterV2, SetJediswapV2Factory, StoredName, SupportedExchanges, Token,
        TokenClaimed, TokenLaunch, TokenQuoteBuyCoin, UnrugCallbackData, UnrugLaunchCallback,
        WithdrawFeesCallback,
        // EkuboLiquidityParameters, DEFAULT_MIN_LOCKTIME, EkuboPoolParameters, CallbackData,
    // BondingType, LaunchCallback MemecoinCreated, MemecoinLaunched
    };
    use core::num::traits::Zero;
    use ekubo::components::shared_locker::{call_core_with_callback, consume_callback_data};
    use ekubo::interfaces::core::{ICoreDispatcher, ICoreDispatcherTrait, ILocker};
    use ekubo::interfaces::erc20::{
        IERC20Dispatcher as EKIERC20Dispatcher // IERC20DispatcherTrait as EKIERC20DispatcherTrait,
    };
    use ekubo::interfaces::positions::{IPositionsDispatcher, IPositionsDispatcherTrait};
    // use ekubo::interfaces::router::{IRouterDispatcher, IRouterDispatcherTrait};
    use ekubo::interfaces::token_registry::{
        ITokenRegistryDispatcher, ITokenRegistryDispatcherTrait,
    };
    use ekubo::types::bounds::Bounds;
    // use ekubo::types::i129::i129;
    use ekubo::types::keys::PoolKey;
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc20::interface::{
        ERC20ABIDispatcher, ERC20ABIDispatcherTrait // IERC20Dispatcher as OZIERC20Dispatcher,
        // IERC20DispatcherTrait as OZIERC20DispatcherTrait,
    };
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::storage_access::StorageBaseAddress;
    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ClassHash, ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
        // contract_address_const
    };
    // use core::integer::{u32_wrapping_add, BoundedInt};

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
        quote_tokens: Map<ContractAddress, bool>,
        exchange_configs: Map<SupportedExchanges, ContractAddress>,
        quote_token: ContractAddress,
        protocol_fee_destination: ContractAddress,
        lock_manager_address: ContractAddress,
        // User states
        token_created: Map<ContractAddress, Token>,
        launched_coins: Map<ContractAddress, TokenLaunch>,
        // distribute_team_alloc: Map::<ContractAddress, Map::<ContractAddress, SharesTokenUser>>,
        metadata_coins: Map<ContractAddress, MetadataLaunch>,
        array_coins: Map<u64, Token>,
        tokens_created: Map<u64, Token>,
        launch_created: Map<u64, TokenLaunch>,
        locked_positions: Map<ContractAddress, LockPosition>,
        // Parameters admin
        // Setup
        is_tokens_buy_enable: Map<ContractAddress, TokenQuoteBuyCoin>,
        default_token: TokenQuoteBuyCoin,
        dollar_price_launch_pool: u256,
        dollar_price_create_token: u256,
        dollar_price_percentage: u256,
        liquidity_raised_amount_in_dollar: u256,
        protocol_fee_percent: u256,
        creator_fee_percent: u256,
        is_fees_protocol: bool,
        is_custom_launch_enable: bool,
        is_custom_token_enable: bool,
        is_paid_launch_enable: bool,
        is_create_token_paid: bool,
        launchpad_address: ContractAddress,
        // Stats
        total_token: u64,
        total_launch: u64,
        total_shares_keys: u64,
        // External contract
        factory_address: ContractAddress,
        ekubo_registry: ContractAddress,
        core: ContractAddress,
        positions: ContractAddress,
        ekubo_exchange_address: ContractAddress,
        address_jediswap_factory_v2: ContractAddress,
        address_jediswap_nft_router_v2: ContractAddress,
        address_jediswap_router_v2: ContractAddress,
        address_jediswap_router_v1: ContractAddress,
        address_ekubo_factory: ContractAddress,
        address_ekubo_router: ContractAddress,
        liquidity_per_token: Map<ContractAddress, EkuboLPStore>,
        token_owner: Map<ContractAddress, ContractAddress>,
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
        SetJediswapRouterV2: SetJediswapRouterV2,
        LiquidityCreated: LiquidityCreated,
        LiquidityCanBeAdded: LiquidityCanBeAdded,
        TokenClaimed: TokenClaimed,
        MetadataCoinAdded: MetadataCoinAdded,
        FeesCollected: FeesCollected,
        // MemecoinCreated: MemecoinCreated,
        // MemecoinLaunched: MemecoinLaunched,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        token_address: ContractAddress,
        coin_class_hash: ClassHash,
        factory_address: ContractAddress,
        ekubo_registry: ContractAddress,
        core: ContractAddress,
        positions: ContractAddress,
        ekubo_exchange_address: ContractAddress,
    ) {
        self.coin_class_hash.write(coin_class_hash);
        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, admin);
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);

        let init_token = TokenQuoteBuyCoin {
            token_address: token_address, // starting_price,
            is_enable: true,
            // step_increase_linear,
        };
        self.is_custom_launch_enable.write(false);
        self.is_custom_token_enable.write(false);
        self.default_token.write(init_token.clone());
        self.protocol_fee_destination.write(admin);
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
    impl UnrugLiquidity of IUnrugLiquidity<ContractState> {
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
            ref self: ContractState, protocol_fee_destination: ContractAddress,
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

        // Jediwswap factory address
        fn set_address_jediswap_factory_v2(
            ref self: ContractState, address_jediswap_factory_v2: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            // self.ownable.assert_only_owner();
            self.address_jediswap_factory_v2.write(address_jediswap_factory_v2);
            self
                .emit(
                    SetJediswapV2Factory {
                        address_jediswap_factory_v2: address_jediswap_factory_v2,
                    },
                );
        }

        fn set_address_jediswap_nft_router_v2(
            ref self: ContractState, address_jediswap_nft_router_v2: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_jediswap_nft_router_v2.write(address_jediswap_nft_router_v2);
            self
                .emit(
                    SetJediswapNFTRouterV2 {
                        address_jediswap_nft_router_v2: address_jediswap_nft_router_v2,
                    },
                );
        }


        fn set_address_jediswap_router_v2(
            ref self: ContractState, address_jediswap_router_v2: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_jediswap_nft_router_v2.write(address_jediswap_router_v2);
            self
                .emit(
                    SetJediswapRouterV2 { address_jediswap_router_v2: address_jediswap_router_v2 },
                );
        }


        fn set_address_jediswap_router_v1(
            ref self: ContractState, address_jediswap_router_v1: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_jediswap_router_v1.write(address_jediswap_router_v1);
        }

        fn set_address_ekubo_factory(
            ref self: ContractState, address_ekubo_factory: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_ekubo_factory.write(address_ekubo_factory);
            // Optionally emit an event
        }

        fn set_address_ekubo_registry(
            ref self: ContractState, new_ekubo_registry_address: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.ekubo_registry.write(new_ekubo_registry_address);
            // Optionally emit an event
        }

        fn set_address_ekubo_router(
            ref self: ContractState, address_ekubo_router: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.address_ekubo_router.write(address_ekubo_router);
            // Optionally emit an event
        }

        fn set_lock_manager_address(
            ref self: ContractState, lock_manager_address: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.lock_manager_address.write(lock_manager_address);
        }


        fn set_class_hash(ref self: ContractState, class_hash: ClassHash) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.coin_class_hash.write(class_hash);
        }
        // User call

        // Create keys for an user
        fn create_token(
            ref self: ContractState,
            // recipient: ContractAddress,
            symbol: ByteArray,
            name: ByteArray,
            initial_supply: u256,
            contract_address_salt: felt252,
        ) -> ContractAddress {
            let caller = get_caller_address();
            let contract_address = get_contract_address();
            let token_address = self
                ._create_token(
                    symbol,
                    name,
                    initial_supply,
                    contract_address_salt,
                    caller,
                    caller,
                    contract_address,
                );

            token_address
        }

        fn launch_on_ekubo(
            ref self: ContractState,
            coin_address: ContractAddress,
            unrug_params: EkuboUnrugLaunchParameters,
        ) -> (u64, EkuboLP) {
            self._add_liquidity_ekubo(coin_address, unrug_params)
        }

        fn launch_on_jediswap(
            ref self: ContractState,
            coin_address: ContractAddress,
            quote_address: ContractAddress,
            lp_supply: u256,
            quote_amount: u256,
            unlock_time: u64,
            owner: ContractAddress,
        ) -> u256 {
            let id_cast = self
                ._add_liquidity_jediswap(
                    coin_address, quote_address, lp_supply, quote_amount, unlock_time, owner,
                );
            id_cast
        }

        fn collect_fees(
            ref self: ContractState,
            token_address: ContractAddress,
            quote_address: ContractAddress,
            recipient: ContractAddress,
        ) {
            self
                ._collect_fees(
                    token_address,
                    WithdrawFeesCallback {
                        recipient: recipient,
                        token_address: token_address,
                        quote_address: quote_address,
                    },
                );
        }


        // TODO finish add Metadata
        fn add_metadata(
            ref self: ContractState, coin_address: ContractAddress, metadata: MetadataLaunchParams,
        ) {
            let caller = get_contract_address();
            // Verify if caller is owner
            let mut launch = self.launched_coins.read(coin_address);
            assert(launch.owner == caller, 'not owner');

            // Add or update metadata

            self
                .metadata_coins
                .entry(coin_address)
                .write(
                    MetadataLaunch {
                        token_address: coin_address,
                        nostr_event_id: metadata.nostr_event_id,
                        url: metadata.url.clone(),
                        ipfs_hash: metadata.ipfs_hash.clone(),
                        // twitter: metadata.twitter.clone(),
                    // website: metadata.website.clone(),
                    // telegram: metadata.telegram.clone(),
                    // github: metadata.github.clone(),
                    // description: metadata.description.clone(),
                    },
                );
            self
                .emit(
                    MetadataCoinAdded {
                        token_address: coin_address,
                        ipfs_hash: metadata.ipfs_hash.clone(),
                        url: metadata.url,
                        nostr_event_id: metadata.nostr_event_id,
                        twitter: metadata.twitter,
                        telegram: metadata.telegram,
                        github: metadata.github,
                        website: metadata.website,
                        description: metadata.description,
                    },
                );
        }

        fn get_default_token(self: @ContractState) -> TokenQuoteBuyCoin {
            self.default_token.read()
        }

        fn get_position_ekubo_address(self: @ContractState) -> ContractAddress {
            self.positions.read()
        }
    }


    // // Could be a group of functions about a same topic
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _create_token(
            ref self: ContractState,
            symbol: ByteArray,
            name: ByteArray,
            initial_supply: u256,
            contract_address_salt: felt252,
            recipient: ContractAddress,
            owner: ContractAddress,
            factory: ContractAddress,
        ) -> ContractAddress {
            let mut calldata = array![];
            Serde::serialize(@name.clone(), ref calldata);
            Serde::serialize(@symbol.clone(), ref calldata);
            Serde::serialize(@initial_supply, ref calldata);
            Serde::serialize(@18, ref calldata);
            Serde::serialize(@recipient, ref calldata);
            Serde::serialize(@owner, ref calldata);
            Serde::serialize(@factory, ref calldata);

            let (token_address, _) = deploy_syscall(
                self.coin_class_hash.read(), contract_address_salt, calldata.span(), false,
            )
                .unwrap();
            // .unwrap_syscall();
            // println!("token address {:?}", token_address);

            let token = Token {
                token_address: token_address,
                owner: recipient,
                creator: owner,
                name: name.clone(),
                symbol: symbol.clone(),
                total_supply: initial_supply,
                initial_supply: initial_supply,
                created_at: get_block_timestamp(),
                token_type: Option::None,
            };

            self.token_created.entry(token_address).write(token.clone());

            let total_token = self.total_token.read();
            if total_token == 0 {
                self.total_token.write(1);
                self.array_coins.entry(0).write(token.clone());
            } else {
                self.total_token.write(total_token + 1);
                self.array_coins.entry(total_token).write(token.clone());
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
                    },
                );
            token_address
        }

        /// Adds liquidity to an Ekubo pool for a given memecoin and quote token pair
        ///
        /// # Arguments
        /// * `coin_address` - The address of the memecoin token contract
        /// * `unrug_params_inputs` - Parameters for adding liquidity including:
        ///   - token_address: Address of the memecoin token
        ///   - quote_address: Address of the quote/base token
        ///   - lp_supply: Amount of memecoin tokens to add as liquidity
        ///   - pool_params: Parameters for pool creation (fee, tick spacing, etc)
        ///   - owner: Owner address who can withdraw liquidity
        ///
        /// # Flow
        /// 1. Validates caller and parameters
        /// 2. Registers the memecoin token with Ekubo registry by:
        ///    - Transferring small amount of tokens to registry
        ///    - Calling register_token() on registry
        /// 3. Sets up pool with initial price and liquidity bounds
        /// 4. Adds liquidity to the pool
        ///
        /// # Returns
        /// * Tuple containing:
        ///   - Pool ID (u64)
        ///   - EkuboLP struct with pool details
        fn _add_liquidity_ekubo(
            ref self: ContractState,
            coin_address: ContractAddress,
            unrug_params_inputs: EkuboUnrugLaunchParameters,
            // unrug_params: EkuboUnrugLaunchParameters
        ) -> (u64, EkuboLP) {
            let caller = get_caller_address();
            // let mut unrug_params = unrug_params_inputs.clone();
            let mut unrug_params = unrug_params_inputs;

            // let lp_meme_supply = unrug_params.lp_supply.clone();

            let ekubo_core_address = self.core.read();
            // let ekubo_exchange_address = self.ekubo_exchange_address.read();
            // let memecoin = EKIERC20Dispatcher {
            //     contract_address: unrug_params.token_address.clone()
            // };

            // let positions_ekubo = self.positions.read();

            let base_token = EKIERC20Dispatcher {
                contract_address: unrug_params.quote_address.clone(),
            };

            let registry_address = self.ekubo_registry.read();
            // println!("registry_address {:?}", registry_address);

            let registry = ITokenRegistryDispatcher { contract_address: registry_address.clone() };

            // let amount_register: u256 = 1000000000000000000;
            // let amount_register = 1_u256;
            let amount_register = 1000000000000000000;
            // println!("register token amount {:?}", amount_register.clone());
            // println!("transfer base token {:?}", registry_address.clone());

            // memecoin.transfer(registry.contract_address, amount_register.clone());
            // memecoin.transfer_from(caller, registry.contract_address, amount_register.clone());
            ERC20ABIDispatcher { contract_address: unrug_params.token_address.clone() }
                .transfer_from(
                    unrug_params.owner,
                    recipient: registry.contract_address,
                    amount: amount_register,
                );
            // println!("register token",);

            // // TODO substract amount register and check if amount_register is correct
            registry
                .register_token(
                    EKIERC20Dispatcher { contract_address: unrug_params.token_address.clone() },
                );

            unrug_params.lp_supply -= amount_register;
            // println!("register ok add liquidity");

            let core = ICoreDispatcher { contract_address: ekubo_core_address };

            // let (team_allocation, pre_holders) = self
            //     ._check_common_launch_parameters(launch_params);
            // // assert(
            // //     ekubo_pool_params.fee <= 0x51eb851eb851ec00000000000000000,
            // errors::FEE_TOO_HIGH // );
            // // assert(ekubo_pool_params.tick_spacing >= 5982, errors::TICK_SPACING_TOO_LOW);
            // // assert(ekubo_pool_params.tick_spacing <= 19802, errors::TICK_SPACING_TOO_HIGH);
            // // assert(ekubo_pool_params.bound >= 88712960, errors::BOUND_TOO_LOW);
            // let LaunchParameters { memecoin_address,
            // transfer_restriction_delay,
            // max_percentage_buy_launch,
            // quote_address,
            // initial_holders,
            // initial_holders_amounts } =
            //     launch_params;

            // Call the core with a callback to deposit and mint the LP tokens.
            let (id, position) = call_core_with_callback::<
                UnrugCallbackData, (u64, EkuboLP),
            >(core, @UnrugCallbackData::UnrugLaunchCallback(UnrugLaunchCallback { unrug_params }));

            let id_cast: u256 = id.try_into().unwrap();
            // let min_unlock_time = starknet::get_block_timestamp() + DEFAULT_MIN_LOCKTIME;

            // let lock_position = LockPosition {
            //     id_position: id_cast.clone(),
            //     asset_address: unrug_params.token_address.clone(),
            //     quote_address: unrug_params.quote_address.clone(),
            //     created_at: get_block_timestamp(),
            //     exchange: SupportedExchanges::Ekubo,
            //     owner: unrug_params.owner.clone(),
            //     caller: unrug_params.caller.clone(),
            //     unlock_time: min_unlock_time,
            // };
            // self.locked_positions.entry(coin_address).write(lock_position);

            self
                .emit(
                    LiquidityCreated {
                        id: id_cast,
                        pool: coin_address,
                        asset: coin_address,
                        quote_token_address: base_token.contract_address,
                        owner: caller,
                        exchange: SupportedExchanges::Ekubo,
                        is_unruggable: true,
                    },
                );
            (id, position)
        }
        /// Adds liquidity to an Ekubo pool with the specified parameters
        /// @param pool_key - The key identifying the pool (contains token addresses, fees, etc)
        /// @param token - The address of the first token in the pair
        /// @param token_quote - The address of the second token in the pair (quote token)
        /// @param lp_supply - The amount of the first token to add as liquidity
        /// @param lp_quote_supply - The amount of the second token to add as liquidity
        /// @param bounds - The price bounds for the position
        /// @param owner - The address that will own the LP position
        /// @return u64 - The ID of the minted LP position
        ///
        /// This function:
        /// 1. Gets the positions contract address
        /// 2. Transfers both tokens from the owner to the positions contract
        /// 3. Calls the mint_and_deposit function on the positions contract
        /// 4. Returns the ID of the minted LP position
        fn _supply_liquidity_ekubo(
            ref self: ContractState,
            pool_key: PoolKey,
            token: ContractAddress,
            token_quote: ContractAddress,
            lp_supply: u256,
            lp_quote_supply: u256,
            bounds: Bounds,
            owner: ContractAddress,
        ) -> u64 {
            let positions_address = self.positions.read();
            let positions = IPositionsDispatcher { contract_address: positions_address };

            // println!("transfer memecoin");
            ERC20ABIDispatcher { contract_address: token }
                .transfer_from(owner, recipient: positions.contract_address, amount: lp_supply);

            // println!("transfer quote amount");
            ERC20ABIDispatcher { contract_address: token_quote }
                .transfer_from(
                    owner, recipient: positions.contract_address, amount: lp_quote_supply,
                );

            // println!("try mint and deposit");
            // let (id, liquidity) = positions.mint_and_deposit(pool_key, bounds, min_liquidity: 0);
            let (id, _) = positions.mint_and_deposit(pool_key, bounds, min_liquidity: 0);

            // println!("pool id {}", id.clone());
            id
        }


        // Collect fees from the LP
        // Owner of the LP or Launchpad can call it
        fn _collect_fees(
            ref self: ContractState,
            coin_address: ContractAddress,
            unrug_params_inputs: WithdrawFeesCallback,
            // unrug_params: EkuboUnrugLaunchParameters
        ) -> (u64, u128, u128) {
            let caller = get_caller_address();
            // let mut unrug_params = unrug_params_inputs.clone();
            let mut unrug_params = unrug_params_inputs;

            // let lp_meme_supply = unrug_params.lp_supply.clone();

            let ekubo_core_address = self.core.read();
            // let ekubo_exchange_address = self.ekubo_exchange_address.read();
            // let memecoin = EKIERC20Dispatcher {
            //     contract_address: unrug_params.token_address.clone()
            // };

            // let positions_ekubo = self.positions.read();

            let base_token = EKIERC20Dispatcher {
                contract_address: unrug_params.quote_address.clone(),
            };

            let registry_address = self.ekubo_registry.read();
            // println!("registry_address {:?}", registry_address);

            let registry = ITokenRegistryDispatcher { contract_address: registry_address.clone() };

            // let amount_register: u256 = 1000000000000000000;
            // let amount_register = 1_u256;
            let amount_register = 1000000000000000000;

            let core = ICoreDispatcher { contract_address: ekubo_core_address };

            // Call the core with a callback to deposit and mint the LP tokens.
            let (id, fees0, fees1) = call_core_with_callback::<
                UnrugCallbackData, (u64, u128, u128),
            >(
                core,
                @UnrugCallbackData::WithdrawFeesCallback(
                    WithdrawFeesCallback {
                        recipient: unrug_params.recipient,
                        token_address: unrug_params.token_address,
                        quote_address: unrug_params.quote_address,
                    },
                ),
            );

            let id_cast: u256 = id.try_into().unwrap();

            self
                .emit(
                    FeesCollected {
                        id: id_cast,
                        pool: coin_address,
                        asset: coin_address,
                        quote_token_address: base_token.contract_address,
                        owner: caller,
                        exchange: SupportedExchanges::Ekubo,
                        is_unruggable: true,
                        fees0: fees0,
                        fees1: fees1,
                    },
                );
            (id, fees0, fees1)
        }

        /// TODO fix change
        // / Modular way
        // Less restrictions but represent the params in the UI etc
        /// Validates common parameters for launching a memecoin
        ///
        /// # Arguments
        /// * `launch_parameters` - LaunchParameters struct containing:
        ///   - memecoin_address: Address of the memecoin token contract
        ///   - transfer_restriction_delay: Delay before transfers are enabled
        ///   - max_percentage_buy_launch: Max % of supply that can be bought at launch
        ///   - quote_address: Address of quote/base token
        ///   - initial_holders: Array of initial token holder addresses
        ///   - initial_holders_amounts: Array of token amounts for initial holders
        ///
        /// # Validation Checks
        /// 1. Verifies memecoin is not already launched
        /// 2. Validates initial holders arrays have matching lengths
        /// 3. Checks number of initial holders does not exceed MAX_HOLDERS_LAUNCH
        /// 4. Ensures total allocation to initial holders does not exceed
        /// MAX_SUPPLY_PERCENTAGE_TEAM_ALLOCATION
        ///
        /// # Returns
        /// * Tuple containing:
        ///   - Total allocation amount to initial holders (u256)
        ///   - Number of unique initial holders (u8)
        ///
        /// # Reverts
        /// * If memecoin is already launched
        /// * If initial holders arrays have different lengths
        /// * If too many initial holders specified
        /// * If team allocation exceeds maximum allowed
        fn _check_common_launch_parameters(
            ref self: ContractState, launch_parameters: LaunchParameters,
        ) -> (u256, u8) {
            let LaunchParameters {
                memecoin_address,
                transfer_restriction_delay,
                max_percentage_buy_launch,
                quote_address,
                initial_holders,
                initial_holders_amounts,
            } = launch_parameters;
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
            }

            (team_allocation, unique_count(initial_holders).try_into().unwrap())
        }

        // TODO add liquidity or increase
        // Better params of Mint
        fn _add_liquidity_jediswap(
            ref self: ContractState,
            coin_address: ContractAddress,
            quote_address: ContractAddress,
            lp_supply: u256,
            quote_amount: u256,
            unlock_time: u64,
            owner: ContractAddress,
        ) -> u256 {
            // ) -> (u64, EkuboLP)  {
            // println!("In _add_liquidity_jediswap",);

            let mut factory_address = self.address_jediswap_factory_v2.read();
            let nft_router_address = self.address_jediswap_nft_router_v2.read();

            // println!("check address");

            if nft_router_address.is_zero() {
                return 0_u256;
            }
            let nft_router = IJediswapNFTRouterV2Dispatcher {
                contract_address: nft_router_address,
            };

            if factory_address.is_zero() {
                return 0_u256;
            }

            // TODO
            // Better params default
            // TODO check if pool exist
            // Pool need to be create

            // println!("step setup params",);
            let fee: u32 = 10_000;
            let factory = IJediswapFactoryV2Dispatcher { contract_address: factory_address };
            let token_a = coin_address.clone();
            let asset_token_address = coin_address.clone();
            let quote_token_address = quote_address.clone();
            let token_b = quote_token_address.clone();
            // TODO tokens check
            // assert!(token_a != token_b, "same token");
            // Look if pool already exist
            // Init and Create pool if not exist
            // let mut pool: ContractAddress = factory.get_pool(token_a, token_b, fee);
            let mut pool: ContractAddress = factory.get_pair(token_a, token_b);
            let sqrt_price_X96 = 0; // TODO change sqrt_price_X96

            let amount_coin_liq = lp_supply.clone();
            let total_supply = lp_supply.clone();
            let liquidity_raised = quote_amount.clone();

            // println!("prepare params jediswap pool",);
            // TODO
            // Better params default
            // let amount_coin_liq = total_supply / LIQUIDITY_RATIO;
            let amount0_desired = 0;
            let amount1_desired = 0;
            let amount0_min = amount_coin_liq;
            let amount1_min = liquidity_raised;
            let tick_lower: i32 = 0;
            let tick_upper: i32 = 0;
            let deadline: u64 = get_block_timestamp();

            let recipient_lp = get_contract_address();

            // @TODO check mint params

            let mut id_token_lp: u256 = 0;

            // println!("check if pool exist");

            // TODO
            // Check if using Router or NFTRouter to add liquidity
            if pool.into() == 0_felt252 {
                // println!("pool still not created");

                pool = factory.create_pool(token_a, token_b, fee);
                pool = nft_router.create_and_initialize_pool(token_a, token_b, fee, sqrt_price_X96);
                // TODO Increase liquidity with router if exist
                // Approve token asset and quote to be transferred
                let token_asset = IERC20Dispatcher { contract_address: token_a };
                let token_quote = IERC20Dispatcher { contract_address: token_b };
                token_asset.approve(nft_router_address, amount_coin_liq);
                token_quote.approve(nft_router_address, liquidity_raised);
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
                    // recipient: launch.owner, // TODO add
                    recipient: recipient_lp, // TODO add
                    deadline: deadline,
                };

                // println!("step {}", 9);
                let (token_id, _, _, _) = nft_router.mint(mint_params);
                id_token_lp = token_id.try_into().unwrap();

                // let lock_position = LockPosition {
                //     id_position: id_token_lp.clone(),
                //     asset_address: coin_address.clone(),
                //     quote_address: quote_address.clone(),
                //     created_at: get_block_timestamp(),
                //     exchange: SupportedExchanges::Jediswap,
                //     owner: owner.clone(), // TODO
                //     caller: owner.clone(), // TODO change caller
                //     unlock_time: unlock_time,
                // };
                // self.locked_positions.entry(coin_address).write(lock_position);

                // TODO Locked LP token
                self
                    .emit(
                        LiquidityCreated {
                            id: token_id,
                            pool: pool,
                            quote_token_address: quote_token_address,
                            // token_id:token_id,
                            owner: recipient_lp,
                            asset: asset_token_address,
                            exchange: SupportedExchanges::Jediswap,
                            is_unruggable: true,
                        },
                    );
                id_token_lp
            } else { // TODO
                id_token_lp
                // Increase liquidity of this pool.
            }
            // let pair_address = jedi_factory.get_pair(coin_address, quote_token_address);
            // let pair = ERC20ABIDispatcher { contract_address: pair_address, };

            // // Burn LP if unlock_time is max u64
            // if (BoundedInt::<u64>::max() == unlock_time) {
            //     pair.transfer(contract_address_const::<0xdead>(), liquidity_received);
            //     return (pair.contract_address, contract_address_const::<0xdead>());
            // }

            // // Lock LP tokens
            // let lock_manager = ILockManagerDispatcher { contract_address: lock_manager_address };
            // pair.approve(lock_manager_address, liquidity_received);
            // let lock_position = lock_manager
            //     .lock_tokens(
            //         token: pair_address,
            //         amount: liquidity_received,
            //         unlock_time: unlock_time,
            //         withdrawer: caller_address,
            //     );

            // (pair.contract_address, lock_position)

            id_token_lp
        }
    }


    #[external(v0)]
    impl LockerImpl of ILocker<ContractState> {
        /// Callback function called by the core contract.
        /// Callback sent and consumed in the _add_liquidity_ekubo
        fn locked(ref self: ContractState, id: u32, data: Span<felt252>) -> Span<felt252> {
            let core_address = self.core.read();
            let core = ICoreDispatcher { contract_address: core_address };
            // let ekubo_core_address = self.core.read();
            // let ekubo_exchange_address = self.ekubo_exchange_address.read();
            // let positions_address = self.positions.read();

            match consume_callback_data::<UnrugCallbackData>(core, data) {
                UnrugCallbackData::UnrugLaunchCallback(params) => {
                    let launch_params: EkuboUnrugLaunchParameters = params.unrug_params;
                    let (token0, token1) = sort_tokens(
                        launch_params.token_address, launch_params.quote_address,
                    );
                    // let memecoin = EKIERC20Dispatcher {
                    //     contract_address: launch_params.token_address,
                    // };
                    // let base_token = EKIERC20Dispatcher {
                    //     contract_address: launch_params.quote_address,
                    // };

                    let pool_key = PoolKey {
                        token0: token0,
                        token1: token1,
                        fee: launch_params.pool_params.fee,
                        tick_spacing: launch_params.pool_params.tick_spacing,
                        extension: 0.try_into().unwrap(),
                    };

                    let initial_tick = launch_params.pool_params.starting_price;

                    // Get full range bounds
                    // WORKING
                    // Align tick with max ticks
                    // Verify the bounds is as expected
                    core.maybe_initialize_pool(:pool_key, :initial_tick);
                    // core.maybe_initialize_pool(:pool_key, initial_tick:starting_price);
                    let bound_to_use = launch_params.pool_params.bounds;

                    // Verify tick spacing, fee, bounding_space,
                    // initial_tick and and bounds calculated
                    let id = self
                        ._supply_liquidity_ekubo(
                            pool_key,
                            launch_params.token_address,
                            launch_params.quote_address,
                            launch_params.lp_supply,
                            launch_params.lp_quote_supply,
                            bound_to_use,
                            // full_range_bounds_initial,
                            // full_range_bounds,
                            // single_tick_bound,
                            launch_params.owner,
                        );

                    let mut return_data: Array<felt252> = Default::default();

                    let ekubo_lp_store = EkuboLPStore {
                        id: id,
                        owner: launch_params.owner,
                        quote_address: launch_params.quote_address,
                        token0: token0,
                        token1: token1,
                        fee: launch_params.pool_params.fee,
                        tick_spacing: launch_params.pool_params.tick_spacing,
                        extension: 0.try_into().unwrap(),
                        lower_bound: bound_to_use.lower,
                        upper_bound: bound_to_use.upper,
                    };
                    self
                        .liquidity_per_token
                        .entry(launch_params.token_address)
                        .write(ekubo_lp_store);

                    self.token_owner.entry(launch_params.token_address).write(launch_params.owner);
                    Serde::serialize(@id, ref return_data);
                    Serde::serialize(
                        @EkuboLP {
                            owner: launch_params.owner,
                            quote_address: launch_params.quote_address,
                            pool_key,
                            bounds: bound_to_use,
                            // bounds: full_range_bounds
                        },
                        ref return_data,
                    );
                    return_data.span()
                },
                UnrugCallbackData::WithdrawFeesCallback(params) => {
                    let WithdrawFeesCallback { recipient, token_address, quote_address } = params;
                    let positions_address = self.positions.read();
                    let positions = IPositionsDispatcher { contract_address: positions_address };
                    let (token0, token1) = sort_tokens(token_address, quote_address);
                    // let memecoin = EKIERC20Dispatcher {
                    //     contract_address: launch_params.token_address,
                    // };
                    // let base_token = EKIERC20Dispatcher {
                    //     contract_address: launch_params.quote_address,
                    // };

                    let caller = get_caller_address();

                    let launchpad_address = self.launchpad_address.read();
                    let owner = self.token_owner.entry(token_address).read();

                    assert(
                        owner == get_caller_address() && caller == launchpad_address,
                        errors::CALLER_NOT_OWNER,
                    );

                    let ekubo_lp_store = self.liquidity_per_token.entry(token_address).read();

                    let pool_key = PoolKey {
                        token0: ekubo_lp_store.token0,
                        token1: ekubo_lp_store.token1,
                        fee: ekubo_lp_store.fee,
                        tick_spacing: ekubo_lp_store.tick_spacing,
                        extension: ekubo_lp_store.extension,
                    };
                    let bounds = Bounds {
                        lower: ekubo_lp_store.lower_bound, upper: ekubo_lp_store.upper_bound,
                    };
                    let (fees0, fees1) = positions
                        .collect_fees(ekubo_lp_store.id, pool_key, bounds);

                    // Transfer to recipient is done after the callback
                    let mut return_data = Default::default();
                    Serde::serialize(@id, ref return_data);
                    Serde::serialize(@fees0, ref return_data);
                    Serde::serialize(@fees1, ref return_data);
                    return_data.span()
                },
            }
        }
    }
}
