use afk_launchpad::types::jediswap_types::{MintParams};
use afk_launchpad::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyCoin, TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch,
    SetJediswapNFTRouterV2, SetJediswapV2Factory, SupportedExchanges, LiquidityCreated,
    LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters,
    LaunchParameters, EkuboLP, CallbackData, EkuboLaunchParameters, LaunchCallback, LiquidityType,
    EkuboLiquidityParameters, LiquidityParameters, EkuboUnrugLaunchParameters
    // MemecoinCreated, MemecoinLaunched
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
    fn buy_coin_by_quote_amount(
        ref self: TContractState, coin_address: ContractAddress, quote_amount: u256,
        // ekubo_pool_params: Option<EkuboPoolParameters>,
    );
    fn sell_coin(ref self: TContractState, coin_address: ContractAddress, coin_amount: u256);
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

    // Views
    fn get_coin_launch(self: @TContractState, key_user: ContractAddress,) -> TokenLaunch;
    fn get_share_of_user_by_contract(
        self: @TContractState, owner: ContractAddress, key_user: ContractAddress,
    ) -> SharesTokenUser;
    fn get_all_launch(self: @TContractState) -> Span<TokenLaunch>;

    fn get_all_coins(self: @TContractState) -> Span<Token>;

    // Admins functions
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
    fn set_unrug_liquidity_address(
        ref self: TContractState, unrug_liquidity_address: ContractAddress
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
}

#[starknet::contract]
pub mod LaunchpadMarketplace {
    // use afk_launchpad::calcul::launch::{get_initial_price, get_amount_by_type_of_coin_or_quote};
    // use afk_launchpad::calcul::linear::{
    //     calculate_starting_price_launch, calculate_slope, calculate_pricing,
    //     get_coin_amount_by_quote_amount
    // };
    // use afk_launchpad::launchpad::launch::{get_initial_price,
    // get_amount_by_type_of_coin_or_quote};
    // use afk_launchpad::launchpad::linear::{
    //     calculate_starting_price_launch, calculate_slope, calculate_pricing,
    //     get_coin_amount_by_quote_amount
    // };
    use afk_launchpad::interfaces::factory::{IFactory, IFactoryDispatcher, IFactoryDispatcherTrait};
    use afk_launchpad::interfaces::jediswap::{
        IJediswapFactoryV2, IJediswapFactoryV2Dispatcher, IJediswapFactoryV2DispatcherTrait,
        IJediswapNFTRouterV2, IJediswapNFTRouterV2Dispatcher, IJediswapNFTRouterV2DispatcherTrait,
    };
    use afk_launchpad::interfaces::unrug::{
        IUnrugLiquidityDispatcher, IUnrugLiquidityDispatcherTrait,
        // Event as LaunchpadEvent
    };
    use afk_launchpad::launchpad::calcul::launch::{
        get_initial_price, get_amount_by_type_of_coin_or_quote
    };
    use afk_launchpad::launchpad::calcul::linear::{
        calculate_starting_price_launch, calculate_slope, calculate_pricing,
        get_coin_amount_by_quote_amount
    };
    // use afk_launchpad::launchpad::calcul::{
    //     calculate_starting_price_launch, calculate_slope, calculate_pricing,
    //     get_amount_by_type_of_coin_or_quote, get_coin_amount_by_quote_amount
    // };

    use afk_launchpad::launchpad::errors;
    // use afk_launchpad::launchpad::helpers::{distribute_team_alloc, check_common_launch_parameters
    // };
    use afk_launchpad::launchpad::helpers::{distribute_team_alloc, check_common_launch_parameters};
    use afk_launchpad::launchpad::math::{PercentageMath, pow_256};
    use afk_launchpad::launchpad::utils::{
        sort_tokens, get_initial_tick_from_starting_price, get_next_tick_bounds, unique_count,
        calculate_aligned_bound_mag
    };
    use afk_launchpad::tokens::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk_launchpad::tokens::memecoin::{IMemecoinDispatcher, IMemecoinDispatcherTrait};
    use afk_launchpad::utils::{sqrt};
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
        Map, StorageMapReadAccess, StorageMapWriteAccess, // Stor
         StoragePointerReadAccess,
        StoragePointerWriteAccess, StoragePathEntry,
        // MutableEntryStoragePathEntry,
    // StorableEntryReadAccess,
    // StorageAsPathReadForward,
    // MutableStorableEntryReadAccess,
    // MutableStorableEntryWriteAccess,
    // StorageAsPathWriteForward,
    // PathableStorageEntryImpl
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
        EkuboLaunchParameters, LaunchCallback, EkuboLiquidityParameters, LiquidityParameters,
        EkuboUnrugLaunchParameters
        // MemecoinCreated, MemecoinLaunched
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

    // const MAX_TRANSACTION_AMOUNT: u256 = 1_000_000 * pow_256(10, 18);

    // fn _validate_transaction_size(amount: u256) {
    //     assert(amount <= MAX_TRANSACTION_AMOUNT, 'transaction too large');
    // }

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
        // distribute_team_alloc: Map::<ContractAddress, Map::<ContractAddress, SharesTokenUser>>,
        metadata_coins: Map::<ContractAddress, MetadataLaunch>,
        // shares_by_users: Map::<(ContractAddress, ContractAddress), SharesTokenUser>,
        // shares_by_users: Map<ContractAddress, Map<ContractAddress,SharesTokenUser>>,
        shares_by_users: Map::<ContractAddress, Map<ContractAddress, SharesTokenUser>>,
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
        is_fees_protocol_sell_enabled: bool,
        is_fees_protocol_buy_enabled: bool,
        is_fees_protocol_enabled: bool,
        is_fees_enabled: bool,
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
        unrug_liquidity_address: ContractAddress,
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
        ekubo_exchange_address: ContractAddress,
        unrug_liquidity_address: ContractAddress,
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
        self.unrug_liquidity_address.write(unrug_liquidity_address);
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

        fn set_unrug_liquidity_address(
            ref self: ContractState, unrug_liquidity_address: ContractAddress
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.unrug_liquidity_address.write(unrug_liquidity_address);
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
            let contract_address = get_contract_address();
            let token_address = self
                ._create_token(
                    symbol,
                    name,
                    initial_supply,
                    contract_address_salt,
                    is_unruggable,
                    recipient,
                    caller,
                    contract_address,
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
                    symbol,
                    name,
                    initial_supply,
                    contract_address_salt,
                    is_unruggable,
                    contract_address,
                    caller,
                    contract_address,
                );
            // self._launch_token(token_address, caller, contract_address, false,);
            self._launch_token(token_address, caller, contract_address, false, Option::None);
            token_address
        }

        // Launch coin to pool bonding curve
        fn launch_token(ref self: ContractState, coin_address: ContractAddress) {
            let caller = get_caller_address();
            let contract_address = get_contract_address();

            let token = self.token_created.read(coin_address);
            let is_unruggable = token.is_unruggable;
            // self._launch_token(coin_address, caller, contract_address, is_unruggable);
            self._launch_token(coin_address, caller, contract_address, is_unruggable, Option::None);
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
            let mut remain_quote_to_liquidity = total_price - amount_protocol_fee;

            println!("amount quote to send {:?}", quote_amount);
            println!("remain_quote_to_liquidity {:?}", remain_quote_to_liquidity);

            //new liquidity after purchase
            let new_liquidity = pool_coin.liquidity_raised + remain_quote_to_liquidity;

            // Verify pool has sufficient available supply

            //assertion
            assert(new_liquidity <= threshold_liquidity, 'threshold liquidity exceeded');
            // let mut amount = 0;
            // Pay with quote token
            // Transfer quote & coin
            // TOdo fix issue price
            let mut amount = get_amount_by_type_of_coin_or_quote(
                pool_coin.clone(),
                coin_address.clone(),
                remain_quote_to_liquidity.clone(),
                false,
                true
            );

            assert(pool_coin.available_supply >= amount, 'insufficient supply');

            // remain_liquidity = total_price - amount_protocol_fee;
            // TODO check available to buy

            println!("amount memecoin to receive {:?}", amount);

            // TODO readd this check and check why it's broken
            // assert(amount <= pool_coin.available_supply, 'no available supply');
            println!("transfer protocol fees {:?}", amount_protocol_fee);

            erc20
                .transfer_from(
                    get_caller_address(), self.protocol_fee_destination.read(), amount_protocol_fee
                );
            println!("transfer remain_liquidity {:?}", remain_quote_to_liquidity);

            erc20
                .transfer_from(
                    get_caller_address(), get_contract_address(), remain_quote_to_liquidity
                );
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

            println!("update pool");

            pool_coin.liquidity_raised += remain_liquidity;
            pool_coin.total_token_holded += amount;
            pool_coin.price = total_price;
            println!("subtract amount and available supply");
            println!("available supply {:?}", pool_coin.available_supply);
            println!("amount {:?}", amount);
            if amount >= pool_coin.available_supply {
                pool_coin.available_supply = 0;
            } else {
                println!("subtract amount");

                pool_coin.available_supply -= amount;
            }

            // Update share and coin stats for an user
            // let mut old_share = self.shares_by_users.read((get_caller_address(), coin_address));
            // let mut old_share = self.shares_by_users.entry((get_caller_address(),
            // coin_address)).read();
            let mut old_share = self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .read();

            let mut share_user = old_share.clone();
            println!("update share");

            if share_user.owner.is_zero() {
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
            } else {
                share_user.total_paid += total_price;
                share_user.amount_owned += amount;
                share_user.amount_buy += amount;
            }
            // pool_coin.price = total_price / amount;

            // Check if liquidity threshold raise
            // let threshold = self.threshold_liquidity.read();
            let threshold = pool_coin.threshold_liquidity.clone();
            let threshold_liq = self.threshold_liquidity.read();
            let threshold_mc = self.threshold_market_cap.read();
            // println!("threshold {:?}", threshold);
            // println!("pool_coin.liquidity_raised {:?}", pool_coin.liquidity_raised);

            // let mc = (pool_coin.price * total_supply_memecoin);
            // TODO add liquidity launch
            // TOTAL_SUPPLY / 5
            // 20% go the liquidity
            // 80% bought by others

            // TODO check reetrancy guard
            // Update state
            // self
            //     .shares_by_users
            //     .entry((get_caller_address(), coin_address))
            //     .write(share_user.clone());

            self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .write(share_user.clone());

            self.launched_coins.entry(coin_address).write(pool_coin.clone());

            println!("check threshold");
            // TODO finish test and fix
            // Fix price of the last
            if pool_coin.liquidity_raised >= threshold {
                println!("emit liquidity can be added");
                self
                    .emit(
                        LiquidityCanBeAdded {
                            pool: pool_coin.token_address.clone(),
                            asset: pool_coin.token_address.clone(),
                            quote_token_address: pool_coin.token_quote.token_address.clone(),
                        }
                    );
                // self._add_liquidity(coin_address, SupportedExchanges::Ekubo);
                // TODO fix add liquidity ekubo
                self._add_liquidity_ekubo(coin_address);
            }

            println!("emit buy token");

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

        fn sell_coin(ref self: ContractState, coin_address: ContractAddress, coin_amount: u256) {
            let old_pool = self.launched_coins.read(coin_address);
            assert(!old_pool.owner.is_zero(), 'coin not found');
            assert(old_pool.is_liquidity_launch == false, 'token tradeable');

            let caller = get_caller_address();
            // let mut old_share = self.shares_by_users.read((get_caller_address(), coin_address));
            // let mut old_share = self.shares_by_users.entry((get_caller_address(),
            // coin_address)).read();
            let mut old_share = self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .read();
            // Verify Amount owned
            let mut share_user = old_share.clone();

            assert(share_user.amount_owned >= coin_amount, 'above supply');

            // TODO erc20 token transfer
            let total_supply = old_pool.total_supply;
            let token_quote = old_pool.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();

            // Todo check user amount fee creator if needed
            let creator_fee_percent = self.creator_fee_percent.read();
            let protocol_fee_percent = self.protocol_fee_percent.read();

            let amount_protocol_fee: u256 = coin_amount * protocol_fee_percent / BPS;
            let amount_creator_fee = coin_amount * creator_fee_percent / BPS;
            let remain_coin_amount = coin_amount - amount_protocol_fee;

            let mut quote_amount_total = get_amount_by_type_of_coin_or_quote(
                old_pool.clone(), coin_address.clone(), remain_coin_amount.clone(), true, false
            );
            println!("sell amount memecoin {:?}", coin_amount);
            println!("sell amount quote to receive {:?}", quote_amount_total);

            let quote_amount_protocol_fee: u256 = quote_amount_total * protocol_fee_percent / BPS;

            let quote_amount = quote_amount_total - quote_amount_protocol_fee;
            println!("quote_amount {:?}", quote_amount);

            assert(old_pool.liquidity_raised >= quote_amount, 'liquidity <= amount');

            // TODO fix this function
            // let mut amount = self
            //     ._get_coin_amount_by_quote_amount(coin_address, quote_amount, true);

            // let amount_to_user: u256 = coin_amount - amount_protocol_fee - amount_creator_fee;

            // let mut total_price = amount;
            // println!("amount {:?}", amount);
            // println!("coin_amount {:?}", coin_amount);
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

            // let old_price = old_pool.price.clone();
            let total_price = old_pool.price.clone();
            // Update keys with new values
            let mut pool_update = old_pool.clone();

            // let remain_coin_amount = total_price ;

            // Ensure fee calculations are correct
            // assert(
            //     amount_to_user + amount_protocol_fee + amount_creator_fee == quote_amount,
            //     'fee calculation mismatch'
            // );

            // Assertion: Check if the contract has enough quote tokens to transfer
            let contract_quote_balance = erc20.balance_of(get_contract_address());
            assert!(
                contract_quote_balance >= quote_amount_total,
                "contract has insufficient quote token balance"
            );

            // Transfer protocol fee to the designated destination
            println!("sell transfer fees protocol");
            if quote_amount_protocol_fee > 0 {
                erc20.transfer(self.protocol_fee_destination.read(), quote_amount_protocol_fee);
            }
            println!("sell transfer quote amount");
            // Transfer the remaining quote amount to the user
            if quote_amount > 0 {
                erc20.transfer(caller, quote_amount);
            }

            // Assertion: Ensure the user receives the correct amount
            // let user_received = erc20.balance_of(caller);
            // assert(user_received >= , 'user not receive amount');

            // TODO sell coin if it's already sendable and transferable
            // ENABLE if direct launch coin
            // let memecoin = IERC20Dispatcher { contract_address: coin_address };
            // memecoin.transfer_from(get_caller_address(), get_contract_address(), amount);

            // TODO fix amount owned and sellable.
            // Update share user coin

            share_user.amount_owned -= remain_coin_amount;
            share_user.amount_sell += remain_coin_amount;

            // TODO check reetrancy guard

            // Assertion: Ensure pool liquidity remains consistent
            assert!(
                old_pool.liquidity_raised >= quote_amount, "pool liquidity inconsistency after sale"
            );

            // TODO finish update state
            // pool_update.price = total_price;
            println!("sell update pool");
            pool_update.liquidity_raised -= quote_amount;
            pool_update.total_token_holded -= remain_coin_amount;
            pool_update.available_supply += remain_coin_amount;

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

            // Old map version with tuple
            // self
            //     .shares_by_users
            //     .entry((get_caller_address(), coin_address.clone()))
            //     .write(share_user.clone());

            self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address.clone())
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

        // TODO Finish this function
        // Claim coin if liquidity is sent
        // Check and modify the share of user
        fn claim_coin_buy(ref self: ContractState, coin_address: ContractAddress, amount: u256) {
            let caller = get_contract_address();
            // Verify if liquidity launch
            let mut launch = self.launched_coins.read(coin_address);
            assert(launch.is_liquidity_launch == true, 'not launch yet');

            // Verify share of user
            // let mut share_user = self.shares_by_users.read((get_caller_address(), coin_address));

            // OLD MAP used with tuple
            // let mut share_user = self.shares_by_users.entry((get_caller_address(),
            // coin_address)).read();
            let mut share_user = self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .read();

            let max_amount_claimable = share_user.amount_owned;
            assert(max_amount_claimable >= amount, 'share below');

            // Transfer memecoin
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.transfer(caller, amount);

            // Update new share and emit event
            share_user.amount_owned -= amount;

            // OLD MAP used with Tuple
            // self.shares_by_users.entry((get_caller_address(), coin_address)).write(share_user);
            self.shares_by_users.entry(get_caller_address()).entry(coin_address).write(share_user);

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

        fn get_share_of_user_by_contract(
            self: @ContractState, owner: ContractAddress, key_user: ContractAddress,
        ) -> SharesTokenUser {
            // self.shares_by_users.read((owner, key_user))
            // self.shares_by_users.entry((owner, key_user)).read()
            // self.shares_by_users.entry((owner, key_user)).read()

            self.shares_by_users.entry(owner).entry(key_user).read()
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

        // fn create_unrug_token(
    //     ref self: ContractState,
    //     owner: ContractAddress,
    //     name: felt252,
    //     symbol: felt252,
    //     initial_supply: u256,
    //     contract_address_salt: felt252,
    //     is_launch_bonding_now: bool,
    // ) -> ContractAddress {
    //     let caller = get_caller_address();
    //     let creator = get_caller_address();
    //     let contract_address = get_contract_address();
    //     let owner = get_caller_address();
    //     if is_launch_bonding_now == true {
    //         let token_address = self
    //             ._create_token(
    //                 symbol,
    //                 name,
    //                 initial_supply,
    //                 contract_address_salt,
    //                 true,
    //                 contract_address,
    //                 caller,
    //                 contract_address,
    //             );
    //         // self._launch_token(token_address, caller, contract_address, true);
    //         self._launch_token(token_address, caller, contract_address, true, Option::None);

        //         token_address
    //     } else {
    //         let token_address = self
    //             ._create_token(
    //                 symbol,
    //                 name,
    //                 initial_supply,
    //                 contract_address_salt,
    //                 true,
    //                 caller,
    //                 caller,
    //                 contract_address,
    //             );

        //         let mut token = Token {
    //             token_address: token_address,
    //             owner: owner,
    //             creator: creator,
    //             name,
    //             symbol,
    //             total_supply: initial_supply,
    //             initial_supply: initial_supply,
    //             created_at: get_block_timestamp(),
    //             token_type: Option::None,
    //             is_unruggable: true
    //         };
    //         self.token_created.entry(token_address).write(token);
    //         token_address
    //     }
    // }

    }

    // // Could be a group of functions about a same topic
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _create_token(
            ref self: ContractState,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_unruggable: bool,
            recipient: ContractAddress,
            owner: ContractAddress,
            factory: ContractAddress,
        ) -> ContractAddress {
            let mut calldata = array![name.into(), symbol.into()];
            Serde::serialize(@initial_supply, ref calldata);
            Serde::serialize(@18, ref calldata);
            Serde::serialize(@recipient, ref calldata);
            Serde::serialize(@owner, ref calldata);
            Serde::serialize(@factory, ref calldata);

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
            is_unruggable: bool,
            bonding_type: Option<BondingType>
        ) {
            // let caller = get_caller_address();
            let token = self.token_created.read(coin_address);

            // TODO
            // Maybe not needed because you can also create the coin everyhwhere (Unrug) and launch
            let mut token_to_use = self.default_token.read();
            let mut quote_token_address = token_to_use.token_address.clone();
            // let mut bond_type = BondingType::Exponential;
            // TODO fix unwrap match

            // if bonding_type.is_some() {
            //     bond_type = bonding_type.clone();
            // }
            // let type_bond = if Option::Some(v) == bonding_type {
            //     // bond_type = v.clone();
            //     return v;
            // };

            let mut bond_type = BondingType::Linear;
            // let mut bond_type = Option::Some(BondingType::Linear);
            if let Option::Some(v) =
                bonding_type { // println!("The maximum is configured to be {}", v);
            // bond_type=Option::Some(v.clone());
            // bond_type = v.clone();
            } else {
                bond_type = BondingType::Linear;
            }
            // let bond_type = match bonding_type {
            //     Option::Some(v) => { return Option::Some(v)},
            //     Option::None => { return BondingType::Linear; },
            // };

            // if let Option::Some(value) = arr.pop_front() {
            //     sum += value;
            // };

            // match bonding_type.try_into().unwrap() {
            //     Option::Some(val) => { bond_type = val.clone(); },
            //     Option::None => {},
            // }
            // if Option::Some(value) = bonding_type {
            //     bond_type = value.clone();
            // };
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
            // let starting_price = calculate_pricing(
            //     threshold_liquidity.clone(), supply_distribution.clone()
            // );
            // let slope = calculate_slope(
            //     threshold_liquidity.clone(), starting_price.clone(), supply_distribution.clone()
            // );
            // let starting_price = calculate_pricing(
            //     threshold_liquidity.clone(), supply_distribution.clone()
            // );
            // let slope = calculate_slope(
            //     threshold_liquidity.clone(), starting_price.clone(), supply_distribution.clone()
            // );

            // TODO precompute maybe and saved
            // Also start User params after
            let starting_price = 1_u256;
            let slope = 1_u256;
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
                // bonding_curve_type: Option::Some(bond_type),
                // bonding_curve_type: Option::Some(bond_type),
                bonding_curve_type: bond_type,
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


        // Call the Unrug V2 to deposit Liquidity and locked it
        fn _add_liquidity_ekubo(
            ref self: ContractState, coin_address: ContractAddress,
            // params: EkuboLaunchParameters
        ) -> (u64, EkuboLP) {
            let unrug_liquidity = IUnrugLiquidityDispatcher {
                contract_address: self.unrug_liquidity_address.read()
            };

            let launch = self.launched_coins.read(coin_address);

            assert(launch.is_liquidity_launch == false, 'liquidity already launch');
            assert(launch.liquidity_raised >= launch.threshold_liquidity, 'no threshold raised');
            let starting_price: i129 = calculate_starting_price_launch(
                launch.initial_pool_supply.clone(), launch.threshold_liquidity.clone()
            );
            let bound = calculate_aligned_bound_mag(starting_price, 2, 5000);

            let pool_params = EkuboPoolParameters {
                fee: 0xc49ba5e353f7d00000000000000000, // TODO fee optional by user
                tick_spacing: 5000, // TODO tick_spacing optional by user   
                starting_price: starting_price, // TODO verify if starting_price is correct
                bound: bound, // TODO verify if bound is correct
            };

            let params = EkuboUnrugLaunchParameters {
                owner: launch.owner,
                token_address: coin_address,
                quote_address: launch.token_quote.token_address,
                lp_supply: launch.initial_pool_supply,
                lp_quote_supply: launch.liquidity_raised,
                pool_params: pool_params
            };
            let (id, position) = unrug_liquidity.launch_on_ekubo(coin_address, params);
            let id_cast: u256 = id.try_into().unwrap();

            // Set token launched
            let mut launch_to_update = self.launched_coins.read(coin_address);
            launch_to_update.is_liquidity_launch = true;
            self.launched_coins.entry(coin_address).write(launch_to_update.clone());

            self
                .emit(
                    LiquidityCreated {
                        id: id_cast,
                        pool: coin_address,
                        asset: coin_address,
                        quote_token_address: launch.token_quote.token_address,
                        owner: launch.owner,
                        exchange: SupportedExchanges::Ekubo,
                        is_unruggable: false
                    }
                );

            let token_state = self.token_created.read(coin_address);
            // TODO set_launched

            // if token_state.creator == get_contract_address() {
            //     memecoin
            //         .set_launched(
            //             LiquidityType::EkuboNFT(id),
            //             LiquidityParameters::Ekubo(
            //                 EkuboLiquidityParameters {
            //                     quote_address, ekubo_pool_parameters: ekubo_pool_params
            //                 }
            //             ),
            //             :transfer_restriction_delay,
            //             :max_percentage_buy_launch,
            //             :team_allocation,
            //         );
            //     self
            //         .emit(
            //             MemecoinLaunched {
            //                 memecoin_address, quote_token: quote_address, exchange_name: 'Ekubo'
            //             }
            //         );
            // }
            (id, position)
        }

        // TODO finish call Jediswap
        fn _add_liquidity_jediswap(
            ref self: ContractState, coin_address: ContractAddress,
            // params: EkuboLaunchParameters
        ) -> (u64, EkuboLP) {
            let unrug_liquidity = IUnrugLiquidityDispatcher {
                contract_address: self.unrug_liquidity_address.read()
            };

            let launch = self.launched_coins.read(coin_address);

            assert(launch.is_liquidity_launch == false, 'liquidity already launch');
            assert(launch.liquidity_raised >= launch.threshold_liquidity, 'no threshold raised');
            let starting_price: i129 = calculate_starting_price_launch(
                launch.initial_pool_supply.clone(), launch.threshold_liquidity.clone()
            );
            let bound = calculate_aligned_bound_mag(starting_price, 2, 5000);

            let pool_params = EkuboPoolParameters {
                fee: 0xc49ba5e353f7d00000000000000000, // TODO fee optional by user
                tick_spacing: 5000, // TODO tick_spacing optional by user   
                starting_price: starting_price, // TODO verify if starting_price is correct
                bound: bound, // TODO verify if bound is correct
            };

            let params = EkuboUnrugLaunchParameters {
                owner: launch.owner,
                token_address: coin_address,
                quote_address: launch.token_quote.token_address,
                lp_supply: launch.initial_pool_supply,
                lp_quote_supply: launch.liquidity_raised,
                pool_params: pool_params
            };
            let (id, position) = unrug_liquidity.launch_on_ekubo(coin_address, params);
            let id_cast: u256 = id.try_into().unwrap();

            self
                .emit(
                    LiquidityCreated {
                        id: id_cast,
                        pool: coin_address,
                        asset: coin_address,
                        quote_token_address: launch.token_quote.token_address,
                        owner: launch.owner,
                        exchange: SupportedExchanges::Ekubo,
                        is_unruggable: false
                    }
                );
            (id, position)
        }

        // TODO add liquidity to Ekubo, Jediswap and others exchanges enabled
        // TODO Increased liquidity if pool already exist
        fn _add_liquidity(
            ref self: ContractState, coin_address: ContractAddress, exchange: SupportedExchanges
        ) {
            match exchange {
                // TODO changed when finished
                SupportedExchanges::Jediswap => { self._add_liquidity_jediswap(coin_address); },
                SupportedExchanges::Ekubo => { self._add_liquidity_ekubo(coin_address); },
            }
            let mut launch_to_update = self.launched_coins.read(coin_address);
            launch_to_update.is_liquidity_launch = true;
            self.launched_coins.entry(coin_address).write(launch_to_update.clone());
        }
        // fn _supply_liquidity_ekubo(
    //     ref self: ContractState,
    //     pool_key: PoolKey,
    //     token: ContractAddress,
    //     amount: u256,
    //     bounds: Bounds
    // ) -> u64 {
    //     // println!("mint deposit NOW HERE: {}", 1);

        //     let positions_address = self.positions.read();
    //     let positions = IPositionsDispatcher { contract_address: positions_address };
    //     // println!("mint deposit NOW HERE: {}", 2);

        //     // // The token must be transferred to the positions contract before calling mint.
    //     // IERC20Dispatcher { contract_address: token }
    //     //     .transfer(recipient: positions.contract_address, :amount);
    //     // println!("mint deposit NOW HERE: {}", 3);

        //     let (id, liquidity) = positions.mint_and_deposit(pool_key, bounds, min_liquidity: 0);
    //     // let (id, liquidity, _, _) = positions
    //     // .mint_and_deposit_and_clear_both(pool_key, bounds, min_liquidity: 0);
    //     // println!("mint deposit NOW HERE: {}", 4);
    //     id
    // }

        // fn _calculate_fees(ref self: ContractState, amount: u256, is_buy: bool,) -> (u256, u256)
    // {
    //     // Add bounds checking
    //     assert(self.protocol_fee_percent <= MAX_FEE_PROTOCOL, 'protocol fee too high');
    //     assert(self.creator_fee_percent <= MAX_FEE_CREATOR, 'creator fee too high');

        //     // Check for potential overflow before multiplication
    //     assert(amount <= BPS * BPS, 'amount too large for fee calc');

        //     let protocol_fee = amount * self.protocol_fee_percent / BPS;
    //     let creator_fee = amount * self.creator_fee_percent / BPS;

        //     // Verify fees don't exceed amount
    //     assert(protocol_fee + creator_fee <= amount, 'fees exceed amount');

        //     (protocol_fee, creator_fee)
    // }

        // fn _update_user_shares(
    //     ref self: ContractState,
    //     user: ContractAddress,
    //     token: ContractAddress,
    //     amount: u256,
    //     is_increase: bool
    // ) {
    //     let mut share = self.shares_by_users.read(user).read(token);

        //     if is_increase {
    //         // Check for overflow on increase
    //         let new_amount = share.amount_owned + amount;
    //         assert(new_amount >= share.amount_owned, 'share overflow');
    //         share.amount_owned = new_amount;
    //     } else {
    //         // Check for underflow on decrease
    //         assert(share.amount_owned >= amount, 'insufficient shares');
    //         share.amount_owned -= amount;
    //     }

        //     self.shares_by_users.write(user, token, share);
    // }

        // fn _update_pool_liquidity(
    //     ref self: ContractState, pool_address: ContractAddress, amount: u256, is_add: bool
    // ) {
    //     let mut pool = self.launched_coins.read(pool_address);

        //     if is_add {
    //         // Check for overflow when adding liquidity
    //         let new_liquidity = pool.liquidity_raised + amount;
    //         assert(new_liquidity >= pool.liquidity_raised, 'liquidity overflow');
    //         pool.liquidity_raised = new_liquidity;
    //     } else {
    //         // Check for underflow when removing liquidity
    //         assert(pool.liquidity_raised >= amount, 'insufficient liquidity');
    //         pool.liquidity_raised -= amount;
    //     }

        //     self.launched_coins.write(pool_address, pool);
    // }

        // fn _check_price_impact(old_price: u256, new_price: u256, max_impact_bps: u256) {
    //     let impact = if new_price > old_price {
    //         (new_price - old_price) * BPS / old_price
    //     } else {
    //         (old_price - new_price) * BPS / old_price
    //     };
    //     assert(impact <= max_impact_bps, 'price impact too high');
    // }

    }
}
