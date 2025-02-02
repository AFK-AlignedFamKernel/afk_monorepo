use afk_launchpad::interfaces::launchpad::{ILaunchpadMarketplace};
use afk_launchpad::types::jediswap_types::{MintParams};
use afk_launchpad::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, TokenQuoteBuyCoin,
    TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch, SetJediswapNFTRouterV2,
    SetJediswapV2Factory, SupportedExchanges, LiquidityCreated, LiquidityCanBeAdded, MetadataLaunch,
    TokenClaimed, MetadataCoinAdded, EkuboPoolParameters, LaunchParameters, EkuboLP, CallbackData,
    EkuboLaunchParameters, LaunchCallback, LiquidityType, EkuboLiquidityParameters,
    LiquidityParameters, EkuboUnrugLaunchParameters, AdminsFeesParams
    // MemecoinCreated, MemecoinLaunched
};
use starknet::ClassHash;
use starknet::ContractAddress;

#[starknet::contract]
pub mod LaunchpadMarketplace {
    use afk_launchpad::interfaces::launchpad::{ILaunchpadMarketplace};
    use afk_launchpad::interfaces::unrug::{
        IUnrugLiquidityDispatcher, IUnrugLiquidityDispatcherTrait,
        // Event as LaunchpadEvent
    };
    use afk_launchpad::launchpad::calcul::launch::{
        get_initial_price, get_amount_by_type_of_coin_or_quote
    };
    use afk_launchpad::launchpad::calcul::linear::{
        calculate_starting_price_launch, get_coin_amount_by_quote_amount
    };
    use afk_launchpad::launchpad::errors;
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

    use ekubo::interfaces::core::{ICoreDispatcher, ICoreDispatcherTrait, ILocker};
    use ekubo::interfaces::erc20::{
        IERC20Dispatcher as EKIERC20Dispatcher, IERC20DispatcherTrait as EKIERC20DispatcherTrait
    };
    use ekubo::types::bounds::{Bounds};
    use ekubo::types::keys::PoolKey;
    use ekubo::types::{i129::i129};

    use openzeppelin::access::accesscontrol::{AccessControlComponent};
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;

    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, // Stor
         StoragePointerReadAccess,
        StoragePointerWriteAccess, StoragePathEntry,
        // MutableEntryStoragePathEntry, StorableEntryReadAccess, StorageAsPathReadForward,
    // MutableStorableEntryReadAccess, MutableStorableEntryWriteAccess,
    // StorageAsPathWriteForward,PathableStorageEntryImpl
    };
    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use super::{
        StoredName, BuyToken, SellToken, CreateToken, SharesTokenUser, MINTER_ROLE, ADMIN_ROLE,
        BondingType, Token, TokenLaunch, TokenQuoteBuyCoin, CreateLaunch, SetJediswapNFTRouterV2,
        SetJediswapV2Factory, SupportedExchanges, MintParams, LiquidityCreated, LiquidityCanBeAdded,
        MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters, LaunchParameters,
        EkuboLP, LiquidityType, CallbackData, EkuboLaunchParameters, LaunchCallback,
        EkuboLiquidityParameters, LiquidityParameters, EkuboUnrugLaunchParameters, AdminsFeesParams
        // MemecoinCreated, MemecoinLaunched
    };
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    const MAX_SUPPLY: u256 = 100_000_000;
    const INITIAL_SUPPLY: u256 = MAX_SUPPLY / 5;
    const MAX_STEPS_LOOP: u256 = 100;

    // TODO add optional parameters to be select LIQ percent to be lock to Unrug at some point
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
    const SLIPPAGE_THRESHOLD: u256 = 100; //1%

    const MIN_FEE_CREATOR: u256 = 100; //1%
    const MID_FEE_CREATOR: u256 = 1000; //10%
    const MAX_FEE_CREATOR: u256 = 5000; //50%

    const BPS: u256 = 10_000; // 100% = 10_000 bps
    const SCALE_FACTOR: u256 =
        100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff

    // MVP
    // FIXED SUPPLY because edge cases not finish testing hard between threshold/supply
    const FIXED_SUPPLY: u256 = 1_000_000_000_000_000_000_000_000_000_u256; // 1_000_000_000

    // Unrug params

    // CHANGE it
    /// The maximum percentage of the total supply that can be allocated to the team.
    /// This is to prevent the team from having too much control over the supply.
    const MAX_SUPPLY_PERCENTAGE_TEAM_ALLOCATION: u16 = 1_000; // 10%

    /// The maximum number of holders one can specify when launching.
    /// This is to prevent the contract from being is_launched with a large number of holders.
    /// Once reached, transfers are disabled until the memecoin is is_launched.
    const MAX_HOLDERS_LAUNCH: u8 = 10;

    const DEFAULT_MIN_LOCKTIME: u64 = 15_721_200;
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

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

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
        // User states
        token_created: Map::<ContractAddress, Token>,
        launched_coins: Map::<ContractAddress, TokenLaunch>,
        // distribute_team_alloc: Map::<ContractAddress, Map::<ContractAddress, SharesTokenUser>>,
        metadata_coins: Map::<ContractAddress, MetadataLaunch>,
        shares_by_users: Map::<ContractAddress, Map<ContractAddress, SharesTokenUser>>,
        bonding_type: Map::<ContractAddress, BondingType>,
        array_launched_coins: Map::<u64, TokenLaunch>,
        array_coins: Map::<u64, Token>,
        tokens_created: Map::<u64, Token>,
        launch_created: Map::<u64, TokenLaunch>,
        // Admin params
        default_init_supply: u256,
        is_default_init_supply: bool,
        admins_fees_params: AdminsFeesParams,
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
        // Admins params fees
        is_fees_protocol_sell_enabled: bool,
        is_fees_protocol_buy_enabled: bool,
        is_fees_protocol_enabled: bool,
        is_fees_enabled: bool,
        is_custom_launch_enable: bool,
        // For create token
        token_address_to_paid_create_token: ContractAddress,
        token_address_to_paid_launch: ContractAddress,
        amount_to_paid_create_token: u256,
        is_paid_create_token_enable: bool,
        is_custom_token_enable: bool,
        // For launch token
        amount_to_paid_launch: u256,
        is_paid_launch_enable: bool,
        is_create_token_paid: bool,
        // Stats
        total_token: u64,
        total_launch: u64,
        // TODO check edge case supply for Bonding curve
        // HIGH SECURITY RISK
        // EDGE CASE SUPPLY AND THRESHOLD
        max_supply_launch: u256,
        min_supply_launch: u256,
        // External contract
        address_jediswap_factory_v2: ContractAddress,
        address_jediswap_nft_router_v2: ContractAddress,
        address_ekubo_factory: ContractAddress,
        address_ekubo_router: ContractAddress,
        unrug_liquidity_address: ContractAddress,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        StoredName: StoredName,
        BuyToken: BuyToken,
        SellToken: SellToken,
        CreateToken: CreateToken,
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
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
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
        unrug_liquidity_address: ContractAddress,
    ) {
        self.coin_class_hash.write(coin_class_hash);
        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, admin);
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);

        // TODO
        // Launch and Create fees to false by default
        // Still not test
        self.is_paid_create_token_enable.write(false);
        self.is_paid_launch_enable.write(false);
        self.amount_to_paid_launch.write(1_u256);
        self.amount_to_paid_create_token.write(1_u256);

        // TODO
        // Fees protocol to true by default
        // Still not test wisely
        // Rounding issues after fees can happens.

        self.is_fees_protocol_buy_enabled.write(false);
        self.is_fees_protocol_sell_enabled.write(false);
        self.is_fees_protocol_enabled.write(false);

        // TODO
        // Fees neabled by default
        // Audit for fees calculation, rounding and edges cases
        // fix BOUNDS_TICK_SPACINGS issue if fees are enabled
        // EDGE CASE HIGH RISK = DRAIN VALUES, BLOCKING FUNCTIONS, ERRORS

        // self.is_fees_protocol_buy_enabled.write(false);
        // self.is_fees_protocol_sell_enabled.write(false);

        self.is_fees_protocol_buy_enabled.write(true);
        self.is_fees_protocol_sell_enabled.write(true);
        self.is_fees_protocol_enabled.write(true);

        let admins_fees_params = AdminsFeesParams {
            token_address_to_paid_launch: token_address,
            token_address_to_paid_create_token: token_address,
            amount_to_paid_launch: 1_u256,
            amount_to_paid_create_token: 1_u256,
            is_fees_protocol_buy_enabled: true,
            is_fees_protocol_sell_enabled: true,
            is_fees_protocol_enabled: true,
            is_paid_create_token_enable: false,
            is_paid_launch_enable: false,
        };
        self.admins_fees_params.write(admins_fees_params);

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
        self.total_token.write(0);
        self.total_launch.write(0);
        self.protocol_fee_percent.write(MID_FEE_PROTOCOL);
        self.creator_fee_percent.write(MIN_FEE_CREATOR);
        self.unrug_liquidity_address.write(unrug_liquidity_address);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the ADMIN
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            // Replace the class hash upgrading the contract
            self.upgradeable.upgrade(new_class_hash);
        }
    }

    // Public functions inside an impl block
    // Create token
    // Launch token with Bonding curve type: Linear, Exponential, more to come
    // Buy and Sell a token in the pool
    // Claim your tokens
    #[abi(embed_v0)]
    impl LaunchpadMarketplace of ILaunchpadMarketplace<ContractState> {
        // Views functions public

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
            self.shares_by_users.entry(owner).entry(key_user).read()
        }

        // ADMINS function with Access control
        fn set_token(ref self: ContractState, token_quote: TokenQuoteBuyCoin) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_tokens_buy_enable.entry(token_quote.token_address).write(token_quote);
        }

        fn set_default_token(ref self: ContractState, default_token: TokenQuoteBuyCoin) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.default_token.write(default_token);
        }

        fn set_default_init_supply(ref self: ContractState, default_init_supply: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.default_init_supply.write(default_init_supply);
        }

        fn set_force_default_init_supply(ref self: ContractState, is_default_init_supply: bool) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_default_init_supply.write(is_default_init_supply);
        }

        fn set_is_fees_protocol_enabled(ref self: ContractState, is_fees_protocol_enabled: bool) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_fees_protocol_enabled.write(is_fees_protocol_enabled);
        }

        fn set_is_fees_protocol_buy_enabled(
            ref self: ContractState, is_fees_protocol_buy_enabled: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);

            self.is_fees_protocol_buy_enabled.write(is_fees_protocol_buy_enabled);
        }

        fn set_is_fees_protocol_sell_enabled(
            ref self: ContractState, is_fees_protocol_sell_enabled: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_fees_protocol_sell_enabled.write(is_fees_protocol_sell_enabled);
        }

        fn set_is_fees(ref self: ContractState, is_fees_protocol_enabled: bool) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_fees_protocol_buy_enabled.write(is_fees_protocol_enabled);
            self.is_fees_protocol_sell_enabled.write(is_fees_protocol_enabled);
            self.is_fees_protocol_enabled.write(is_fees_protocol_enabled);
        }

        fn set_protocol_fee_percent(ref self: ContractState, protocol_fee_percent: u256) {
            // assert(protocol_fee_percent < MAX_FEE_PROTOCOL, 'protocol_fee_too_high');
            // assert(protocol_fee_percent > MIN_FEE_PROTOCOL, 'protocol_fee_too_low');
            assert(protocol_fee_percent < MAX_FEE_PROTOCOL, errors::PROTOCOL_FEE_TOO_HIGH);
            assert(protocol_fee_percent > MIN_FEE_PROTOCOL, errors::PROTOCOL_FEE_TOO_LOW);
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
            assert(creator_fee_percent < MAX_FEE_CREATOR, errors::CREATOR_FEE_TOO_HIGH);
            assert(creator_fee_percent > MIN_FEE_CREATOR, errors::CREATOR_FEE_TOO_LOW);
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


        fn set_is_paid_create_token_enable(
            ref self: ContractState, is_paid_create_token_enable: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_paid_create_token_enable.write(is_paid_create_token_enable);
        }

        fn set_is_paid_launch_enable(ref self: ContractState, is_paid_launch_enable: bool) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_paid_launch_enable.write(is_paid_launch_enable);
        }

        fn set_token_address_for_action(ref self: ContractState, token_address: ContractAddress) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.token_address_to_paid_create_token.write(token_address);
            self.token_address_to_paid_launch.write(token_address);
        }

        fn set_amount_to_paid_launch(ref self: ContractState, amount_to_paid_launch: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.amount_to_paid_launch.write(amount_to_paid_launch);
        }

        fn set_amount_to_paid_create_token(
            ref self: ContractState, amount_to_paid_create_token: u256
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.amount_to_paid_create_token.write(amount_to_paid_create_token);
        }

        // User call

        // Create token for an user
        // Send the supply to the caller
        fn create_token(
            ref self: ContractState,
            recipient: ContractAddress,
            symbol: ByteArray,
            name: ByteArray,
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
                    recipient, // Send supply to this address
                    caller, // Owner of the address, Ownable access
                    contract_address, // Factory address to set_launched and others stuff
                );

            token_address
        }

        // Create coin and launch in bonding curve
        fn create_and_launch_token(
            ref self: ContractState,
            symbol: ByteArray,
            name: ByteArray,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_unruggable: bool,
            bonding_type: BondingType
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
                    contract_address, // Send supply to this address
                    caller, // Owner of the address, Ownable access
                    contract_address, // Factory address to set_launched and others stuff
                );
            self
                ._launch_token(
                    token_address, caller, contract_address, false, Option::Some(bonding_type)
                );
            token_address
        }

        // Launch coin to pool bonding curve
        fn launch_token(
            ref self: ContractState, coin_address: ContractAddress, bonding_type: BondingType
        ) {
            let caller = get_caller_address();
            let contract_address = get_contract_address();

            let token = self.token_created.read(coin_address);
            let is_unruggable = token.is_unruggable;
            self
                ._launch_token(
                    coin_address,
                    caller,
                    contract_address,
                    is_unruggable,
                    Option::Some(bonding_type)
                );
        }

        // Buy coin by quote amount
        // Get amount of coin receive based on token IN
        // Calculate fees and protocol fees
        // Transfer fees to the protocol fee destination
        // Transfer quote to the user
        // Update the state of the pool: Liquidity raised, available_supply,
        // Update the share user: update amount_owned
        // Emit the buy event
        fn buy_coin_by_quote_amount(
            ref self: ContractState, coin_address: ContractAddress, quote_amount: u256,
            // ekubo_pool_params: Option<EkuboPoolParameters>
        ) {
            assert(quote_amount > 0, errors::AMOUNT_ZERO);
            let caller = get_caller_address();
            let old_launch = self.launched_coins.read(coin_address);
            assert(!old_launch.owner.is_zero(), errors::COIN_NOT_FOUND);
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            let mut pool_coin = old_launch.clone();
            // let total_supply_memecoin = memecoin.total_supply();
            let threshold_liquidity = pool_coin.threshold_liquidity.clone();

            // TODO erc20 token transfer
            let token_quote = old_launch.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();
            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };
            let protocol_fee_percent = self.protocol_fee_percent.read();

            // IF AMOUNT COIN TO HAVE => GET AMOUNT QUOTE TO PAID
            let mut total_price = quote_amount.clone();
            let old_price = pool_coin.price.clone();

            // TODO edge case remaining supply to buy easily
            // In case the user want to buy more than the threshold
            // Give the available supply
            // if total_price + old_launch.liquidity_raised.clone() > threshold_liquidity {
            //     total_price = threshold_liquidity - old_launch.liquidity_raised.clone();
            //     amount = pool_coin.available_supply;
            //     amount_protocol_fee = total_price * protocol_fee_percent / BPS;
            //     // remain_liquidity = total_price - amount_protocol_fee;
            //     remain_liquidity = total_price;
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

            // TODO check if fees is enabled
            let mut amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let mut remain_liquidity = total_price - amount_protocol_fee;
            let mut remain_quote_to_liquidity = total_price;
            // let mut remain_quote_to_liquidity = total_price - amount_protocol_fee;

            let mut threshold_liquidity = pool_coin.threshold_liquidity.clone();
            // let mut amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let mut slippage_threshold: u256 = threshold_liquidity * SLIPPAGE_THRESHOLD / BPS;
            // let mut threshold = threshold_liquidity;
            let mut threshold = threshold_liquidity - slippage_threshold;
            threshold_liquidity = threshold_liquidity - slippage_threshold;
            // TODO without fees if it's correct
            let is_fees_protocol_enabled = self.is_fees_protocol_enabled.read();
            let is_fees_protocol_buy_enabled = self.is_fees_protocol_buy_enabled.read();

            // TODO edge cases
            // Verify rounding of Fees
            // Check fees send to protocol and liquidity and carefully verify
            if is_fees_protocol_enabled && is_fees_protocol_buy_enabled {
                // if pool_coin.liquidity_raised < quote_amount {
                //     total_price = pool_coin.liquidity_raised.clone();
                //     amount_protocol_fee = total_price * protocol_fee_percent / BPS;
                //     remain_quote_to_liquidity = pool_coin.liquidity_raised.clone() -
                //     amount_protocol_fee;
                // } else {
                //     remain_quote_to_liquidity = quote_amount - amount_protocol_fee;
                // }
                remain_liquidity = total_price - amount_protocol_fee;

                remain_quote_to_liquidity = total_price - amount_protocol_fee;
                // remain_quote_to_liquidity = quote_amount - amount_protocol_fee;
                // TODO check slippage and fees
                // TODO check threshold min and Supply threshold
                // threshold = threshold_liquidity - (slippage_threshold * 2); // add slippage and
                // fees
                threshold = threshold_liquidity
                    - (slippage_threshold + amount_protocol_fee); // add slippage and fees
                // threshold = threshold_liquidity
                // - (slippage_threshold); // add slippage and fees
                // threshold = threshold_liquidity
                // - (amount_protocol_fee); // add slippage and fees

                erc20
                    .transfer_from(
                        get_caller_address(),
                        self.protocol_fee_destination.read(),
                        amount_protocol_fee
                    );
            }
            //new liquidity after purchase
            let new_liquidity = pool_coin.liquidity_raised + remain_quote_to_liquidity;

            // Verify pool has sufficient available supply
            //assertion
            // Add slippage threshold
            // assert(new_liquidity <= threshold, errors::THRESHOLD_LIQUIDITY_EXCEEDED);

            // Check if liquidity threshold raise
            let threshold_liq = self.threshold_liquidity.read();
            let threshold_mc = self.threshold_market_cap.read();

            // let mut amount = 0;
            // Pay with quote token
            // Transfer quote & coin
            // TOdo fix issue price
            let mut coin_amount = get_amount_by_type_of_coin_or_quote(
                pool_coin.clone(),
                coin_address.clone(),
                remain_quote_to_liquidity.clone(),
                false,
                true
            );

            let mut amount_coin_received = coin_amount.clone();
            // TODO check available to buy
            // TODO EDGES CASES
            // Approximation amount
            // TEST
            // Can cause draining
            // Todo check all memecoin amount possible to buy
            // if pool_coin.total_token_holded < pool_coin.available_supply + amount {
            //     let amount = pool_coin.total_token_holded - pool_coin.available_supply;
            //     let amount_coin_received = pool_coin.total_token_holded -
            //     pool_coin.available_supply;
            //     // assert(amount  <  pool_coin.available_supply,
            //     errors::INSUFFICIENT_TOTAL_SUPPLY);
            //     // assert(pool_coin.total_token_holded < pool_coin.available_supply + amount,
            //     errors::INSUFFICIENT_TOTAL_SUPPLY);

            // }
            // if pool_coin.available_supply < amount {
            //     amount = pool_coin.available_supply;
            // }
            assert(pool_coin.available_supply >= coin_amount, errors::INSUFFICIENT_SUPPLY);
            // println!("amount memecoin to receive {:?}", amount);
            // TODO readd this check and check why it's broken
            // println!("transfer protocol fees {:?}", amount_protocol_fee);
            // println!("transfer remain_liquidity {:?}", remain_quote_to_liquidity);
            erc20
                .transfer_from(
                    get_caller_address(), get_contract_address(), remain_quote_to_liquidity
                );

            // Update the Stats of pool:
            // Liquidity raised
            // Available supply
            // Token holded
            // pool_coin.liquidity_raised += remain_liquidity;
            // Amount quote buy with fees deducted if enabled
            // Optionally, re-calculate the quote amount based on the amount to ensure consistency
            // println!("total_price {:?}", total_price);
            // println!("update pool");
            // println!("subtract amount and available supply");
            // println!("available supply {:?}", pool_coin.available_supply);
            // println!("amount {:?}", amount);
            pool_coin.liquidity_raised += remain_quote_to_liquidity;
            pool_coin.price = total_price;
            // TODO TEST
            // EDGE CASE
            // HIGH RISK = CAN DRAINED ALL POOL VALUE
            // TODO check approximation, rounding and edges cases
            if coin_amount >= pool_coin.available_supply {
                pool_coin.available_supply = 0;
                pool_coin.total_token_holded += coin_amount;
            } else {
                // println!("subtract amount");
                pool_coin.total_token_holded += coin_amount;
                pool_coin.available_supply -= coin_amount;
            }

            // Update share and coin stats for an user
            let mut old_share = self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .read();

            let mut share_user = old_share.clone();
            //  println!("update share");
            if share_user.owner.is_zero() {
                share_user =
                    SharesTokenUser {
                        owner: get_caller_address(),
                        token_address: coin_address,
                        amount_owned: coin_amount,
                        amount_buy: coin_amount,
                        amount_sell: 0,
                        created_at: get_block_timestamp(),
                        total_paid: total_price,
                        is_claimable: true,
                    };
            } else {
                share_user.total_paid += total_price;
                share_user.amount_owned += coin_amount;
                share_user.amount_buy += coin_amount;
            }
            // pool_coin.price = total_price / amount;

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

            // println!("check threshold");
            // TODO finish test and fix
            // Add slipage threshold
            // Fix price of the last

            self.launched_coins.entry(coin_address).write(pool_coin.clone());

            if pool_coin.liquidity_raised >= threshold {
                // println!("emit liquidity can be added");
                self
                    .emit(
                        LiquidityCanBeAdded {
                            pool: pool_coin.token_address.clone(),
                            asset: pool_coin.token_address.clone(),
                            quote_token_address: pool_coin.token_quote.token_address.clone(),
                        }
                    );
                // TODO fix add liquidity ekubo or other DEX
                // let launch_dex= lauch.dex_launch
                // self._add_liquidity(coin_address, SupportedExchanges::Ekubo);

                // println!("try add liquidity");
                self._add_liquidity_ekubo(coin_address);
                pool_coin.is_liquidity_launch = true;
            }

            // Update the state of the pool
            self.launched_coins.entry(coin_address).write(pool_coin.clone());

            // println!("emit buy token");

            self
                .emit(
                    BuyToken {
                        caller: get_caller_address(),
                        token_address: coin_address,
                        amount: coin_amount,
                        price: total_price,
                        protocol_fee: amount_protocol_fee,
                        // creator_fee: 0,
                        last_price: old_price,
                        timestamp: get_block_timestamp(),
                        quote_amount: remain_quote_to_liquidity
                        // quote_amount: quote_amount
                    }
                );
        }

        // params @coin_address @coin_amount
        // Sell coin in the current bonding curve for Linear or Exponential atm
        // Calculate amount of quote to receive by a coin_amount to sell
        // Calculate fees and protocol fees & Transfer fees to the protocol fee destination
        // Transfer quote to the user
        // Update the state of the pool: Liquidity raised, available_supply,
        // Update the share user: update amount_owned
        // Emit the sell event
        fn sell_coin(ref self: ContractState, coin_address: ContractAddress, coin_amount: u256) {
            let old_pool = self.launched_coins.read(coin_address);
            assert(!old_pool.owner.is_zero(), errors::COIN_SHARE_NOT_FOUND);
            assert(old_pool.is_liquidity_launch == false, errors::TOKEN_ALREADY_TRADEABLE);
            let caller = get_caller_address();
            let mut old_share = self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .read();
            // Verify Amount owned
            let mut share_user = old_share.clone();
            // assert(share_user.amount_owned >= coin_amount, 'above supply');

            // TODO erc20 token transfer
            let total_supply = old_pool.total_supply.clone();
            let token_quote = old_pool.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();

            // Todo check user amount fee creator if needed
            let creator_fee_percent = self.creator_fee_percent.read();
            let protocol_fee_percent = self.protocol_fee_percent.read();

            // let amount_protocol_fee: u256 = coin_amount * protocol_fee_percent / BPS;
            // let amount_creator_fee = coin_amount * creator_fee_percent / BPS;

            let mut remain_coin_amount = coin_amount.clone();
            // let mut remain_coin_amount = coin_amount;
            // let remain_coin_amount = coin_amount - amount_protocol_fee;

            // TODO check
            // Test edge case and calcul
            // CAREFULLY CHECK AND TEST
            let mut amount_owned = share_user.amount_owned.clone();
            // println!("sell share_user.amount_owned {:?}", share_user.amount_owned);

            assert(
                share_user.amount_owned <= old_pool.total_token_holded,
                errors::SUPPLY_ABOVE_TOTAL_OWNED
            );

            // if share_user.amount_owned >= old_pool.total_token_holded {
            //     assert(
            //         share_user.amount_owned >= old_pool.total_token_holded,
            //         errors::SUPPLY_ABOVE_TOTAL_OWNED
            //     );
            // }

            // TODO CHECK error even if used amount_owned as an input in test
            // Edge case calculation rounding
            // Use max owned
            // CAREFULLY CHECK AND TEST

            // println!("sell remain_coin_amount {:?}", remain_coin_amount);
            if share_user.amount_owned < remain_coin_amount {
                // Used max amount_owned
                remain_coin_amount = share_user.amount_owned.clone();
                // remain_coin_amount = share_user.amount_owned;
            }

            let amount_protocol_fee: u256 = remain_coin_amount.clone() * protocol_fee_percent / BPS;
            let amount_creator_fee = remain_coin_amount.clone() * creator_fee_percent / BPS;
            assert(share_user.amount_owned >= remain_coin_amount, errors::ABOVE_SUPPLY);
            // println!("sell remain_coin_amount edge {:?}", remain_coin_amount);

            let mut quote_amount_total = get_amount_by_type_of_coin_or_quote(
                old_pool.clone(), coin_address.clone(), remain_coin_amount.clone(), true, false
            );
            // println!("sell quote_amount_total received {:?}", quote_amount_total);
            // println!("sell amount quote to receive {:?}", quote_amount_total);

            // println!("sell check quote_amount {:?}", quote_amount);
            // println!("sell check liquidity_raised {:?}", old_pool.liquidity_raised);

            // TODO check fees
            // TEST issue of Unrug

            let is_fees_protocol_enabled = self.is_fees_protocol_enabled.read();
            let is_fees_protocol_sell_enabled = self.is_fees_protocol_sell_enabled.read();
            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };

            let mut quote_amount_protocol_fee: u256 = quote_amount_total
                * protocol_fee_percent
                / BPS;
            // let quote_amount = quote_amount_total - quote_amount_protocol_fee;
            let mut quote_amount = quote_amount_total.clone();
            let mut total_quote_amount = quote_amount_total.clone();
            let mut quote_amount_received = quote_amount_total.clone();
            // CAREFULLY CHECK AND TEST

            if is_fees_protocol_enabled && is_fees_protocol_sell_enabled {
                quote_amount = quote_amount_total - quote_amount_protocol_fee;
                quote_amount_total = quote_amount_total - quote_amount_protocol_fee;
                quote_amount_received = quote_amount_total - quote_amount_protocol_fee;
            }
            // println!("sell quote_amount received final {:?}", quote_amount);
            // TODO
            // Edge case calculation rounding
            // HIGH SECURITY
            // TODO due to estimation, approximation or rounding
            //  GET the approximation slippage tolerance too not drained liq if big error
            // CAREFULLY CHECK AND TEST
            // Can drained all fund

            if old_pool.liquidity_raised < quote_amount {
                // TODO due to estimation, approximation or rounding
                // maybe substract the difference between quote_amount and old_pool.liquidity_raised
                // println!("old_pool.liquidity_raised < quote_amount");
                quote_amount = old_pool.liquidity_raised.clone();
                quote_amount_total = old_pool.liquidity_raised.clone();
                quote_amount_received = old_pool.liquidity_raised.clone();
            }

            // Overwrite protocol fees and quote amount after check liquidity raised and contract
            // quote balance
            quote_amount_protocol_fee = quote_amount * protocol_fee_percent / BPS;

            // quote_amount = quote_amount - quote_amount_protocol_fee;
            // quote_amount_total = quote_amount - quote_amount_protocol_fee;
            // quote_amount_received = quote_amount - quote_amount_protocol_fee;
            if is_fees_protocol_enabled && is_fees_protocol_sell_enabled {
                quote_amount = quote_amount_total - quote_amount_protocol_fee;
                quote_amount_total = quote_amount_total - quote_amount_protocol_fee;
                quote_amount_received = quote_amount_total - quote_amount_protocol_fee;
            }

            // TODO edge case approximation, rounding
            // CAREFULLY TEST EDGE CASE AND FUZZING
            // HIGH RISK = MONEY DRAINING
            // CAN DRAINED ALL MONEY
            // TODO fixed rounding and approximation
            // HIGH RISK SECURITY
            // // Assertion: Check if the contract has enough quote tokens to transfer
            let contract_quote_balance = erc20.balance_of(get_contract_address());
            // println!("sell contract_quote_balance final {:?}", contract_quote_balance);

            //  // if contract_quote_balance < quote_amount {
            // if contract_quote_balance < quote_amount && contract_quote_balance <
            // old_pool.threshold_liquidity.clone() {
            //     println!("contract quote above try edge case rounding");
            //     if is_fees_protocol_sell_enabled {
            //         quote_amount = contract_quote_balance.clone() - quote_amount_protocol_fee;
            //     } else {
            //         quote_amount = contract_quote_balance.clone();
            //     }
            // }
            // println!("sell quote_amount received final after check balance {:?}", quote_amount);

            // assert(old_pool.liquidity_raised >= quote_amount, 'liquidity <= amount');
            assert(old_pool.liquidity_raised >= quote_amount, errors::LIQUIDITY_BELOW_AMOUNT);

            // TODO fix this function
            // let mut total_price = amount;
            // println!("amount {:?}", amount);
            // println!("coin_amount {:?}", coin_amount);
            // println!("total_price {:?}", total_price);

            // Ensure fee percentages are within valid bounds
            assert(
                protocol_fee_percent <= MAX_FEE_PROTOCOL
                    && protocol_fee_percent >= MIN_FEE_PROTOCOL,
                errors::PROTOCOL_FEE_OUT_OF_BOUNDS
                // 'protocol fee out'
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

            // Transfer protocol fee to the designated destination
            // println!("sell transfer fees protocol");

            // TODO edge case fees threshold
            // CAREFULLY TEST
            // HIGH RISK = BLOCKED SELL
            // println!("sell quote_amount_protocol_fee {:?}", quote_amount_protocol_fee);
            // //  TODO fixed rounding before

            if is_fees_protocol_enabled && is_fees_protocol_sell_enabled {
                // TODO edgecase
                // println!("sell transfer FEES {:?}", quote_amount_protocol_fee);
                erc20.transfer(self.protocol_fee_destination.read(), quote_amount_protocol_fee);
            }

            // println!("sell transfer quote amount");
            // Transfer the remaining quote amount to the user
            if quote_amount > 0 {
                // println!("sell transfer quote amount {:?}", quote_amount);
                erc20.transfer(caller, quote_amount);
            }

            // Assertion: Ensure the user receives the correct amount
            // let user_received = erc20.balance_of(caller);
            // assert(user_received >= , 'user not receive amount');
            // TODO sell coin if it's already sendable and transferable
            // ENABLE if direct launch coin

            // TODO fix amount owned and sellable.
            // Update share user coin
            // println!("sell update amount owned");

            share_user.amount_owned -= remain_coin_amount;
            share_user.amount_sell += remain_coin_amount;

            // TODO check reetrancy guard

            // Assertion: Ensure pool liquidity remains consistent
            assert(
                old_pool.liquidity_raised >= quote_amount,
                errors::POOL_LIQUIDITY_INCONSISTENCY_AFTER_SALE
            );
            // TODO finish update state
            // pool_update.price = total_price;
            //      println!("sell update pool");

            // println!("sell pool update liq raised");
            // println!("remain_coin_amount {:?}", remain_coin_amount);

            // TODO check
            // HIGH SECURITY
            if pool_update.liquidity_raised >= quote_amount {
                // println!(
                //     "pool_update.liquidity_raised > quote_amount {:?}",
                //     pool_update.liquidity_raised > quote_amount
                // );
                pool_update.liquidity_raised -= quote_amount;
            } else {
                pool_update.liquidity_raised = 0_u256;
            }
            // println!("try update total_token_holded {:?}", pool_update.total_token_holded);
            pool_update.total_token_holded -= remain_coin_amount;
            // println!("try update available supply {:?}", pool_update.available_supply);
            pool_update.available_supply += remain_coin_amount;
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
                        protocol_fee: quote_amount_protocol_fee,
                        creator_fee: amount_creator_fee,
                        timestamp: get_block_timestamp(),
                        last_price: old_pool.price,
                        coin_amount: remain_coin_amount,
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
            assert(launch.is_liquidity_launch == true, errors::NOT_LAUNCHED_YET);

            let mut share_user = self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .read();
            assert(share_user.is_claimable, errors::NOT_CLAIMABLE);

            let max_amount_claimable = share_user.amount_owned;
            // assert(max_amount_claimable >= amount, 'share below');
            assert(max_amount_claimable >= amount, errors::SHARE_BELOW);

            // Transfer memecoin
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.transfer(caller, amount);

            // Update new share and emit event
            share_user.amount_owned -= amount;
            if share_user.amount_owned == 0 {
                share_user.is_claimable = false;
            }

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
        fn claim_coin_all(ref self: ContractState, coin_address: ContractAddress) {
            let caller = get_contract_address();
            // Verify if liquidity launch
            let mut launch = self.launched_coins.read(coin_address);
            assert(launch.is_liquidity_launch == true, errors::NOT_LAUNCHED_YET);

            // Verify share of user
            let mut share_user = self
                .shares_by_users
                .entry(get_caller_address())
                .entry(coin_address)
                .read();

            assert(share_user.is_claimable, errors::NOT_CLAIMABLE);

            let max_amount_claimable = share_user.amount_owned;
            let amount = max_amount_claimable;
            // Transfer memecoin
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.transfer(caller, amount);

            // Update new share and emit event
            share_user.amount_owned -= amount;
            share_user.is_claimable = false;
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
        // Claim call for a friend
        // Gonna be used to auto claim the rewards of all users of a pool bonding curve
        // So we can pay the fees for the customers
        fn claim_coin_all_for_friend(
            ref self: ContractState, coin_address: ContractAddress, friend: ContractAddress
        ) {
            let caller = get_contract_address();
            // Verify if liquidity launch
            let mut launch = self.launched_coins.read(coin_address);
            assert(launch.is_liquidity_launch == true, errors::NOT_LAUNCHED_YET);

            // Verify share of user
            let mut share_user = self.shares_by_users.entry(friend).entry(coin_address).read();

            assert(share_user.is_claimable, errors::NOT_CLAIMABLE);

            let max_amount_claimable = share_user.amount_owned;
            let amount = max_amount_claimable;
            // Transfer memecoin
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.transfer(friend, amount);

            // Update new share and emit event
            share_user.amount_owned -= amount;
            share_user.is_claimable = false;
            self.shares_by_users.entry(friend).entry(coin_address).write(share_user);

            self
                .emit(
                    TokenClaimed {
                        token_address: coin_address,
                        owner: friend,
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
            assert(launch.owner == caller, errors::CALLER_NOT_OWNER);
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
        }

        fn get_coin_amount_by_quote_amount(
            self: @ContractState,
            coin_address: ContractAddress,
            quote_amount: u256,
            is_decreased: bool
        ) -> u256 {
            let pool = self.launched_coins.read(coin_address).clone();
            get_coin_amount_by_quote_amount(pool.clone(), quote_amount, is_decreased)
        }

        fn get_is_paid_launch_enable(self: @ContractState) -> bool {
            self.is_paid_launch_enable.read()
        }

        fn get_is_paid_create_token_enable(self: @ContractState) -> bool {
            self.is_paid_create_token_enable.read()
        }

        fn get_amount_to_paid_launch(self: @ContractState) -> u256 {
            self.amount_to_paid_launch.read()
        }

        fn get_amount_to_paid_create_token(self: @ContractState) -> u256 {
            self.amount_to_paid_create_token.read()
        }
    }

    // // Internal functions for create token, launch, add liquidity in DEX
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _create_token(
            ref self: ContractState,
            symbol: ByteArray,
            name: ByteArray,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_unruggable: bool,
            recipient: ContractAddress,
            owner: ContractAddress,
            factory: ContractAddress,
        ) -> ContractAddress {
            let caller = get_caller_address();

            // TODO finish this
            let is_paid_create_token_enable = self.is_paid_create_token_enable.read();
            if is_paid_create_token_enable {
                let token_address_to_paid_create_token = self
                    .token_address_to_paid_create_token
                    .read();
                let amount_to_paid_create_token = self.amount_to_paid_create_token.read();
                let erc20 = IERC20Dispatcher {
                    contract_address: token_address_to_paid_create_token
                };
                erc20
                    .transfer_from(
                        caller, self.protocol_fee_destination.read(), amount_to_paid_create_token
                    );
            }

            let mut calldata = array![];
            Serde::serialize(@name.clone(), ref calldata);
            Serde::serialize(@symbol.clone(), ref calldata);
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
                name: name.clone(),
                symbol: symbol.clone(),
                total_supply: initial_supply,
                initial_supply: initial_supply,
                created_at: get_block_timestamp(),
                token_type: Option::None,
                is_unruggable: is_unruggable
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
            let caller = get_caller_address();
            let token = self.token_created.read(coin_address);

            // TODO
            // TEST edges cases
            // Supply
            // Threshold and supply correlation

            // TODO finish this and add tests
            let is_paid_launch_enable = self.is_paid_launch_enable.read();
            if is_paid_launch_enable {
                let admins_fees_params = self.admins_fees_params.read();
                let token_address_to_paid_launch = admins_fees_params.token_address_to_paid_launch;
                let amount_to_paid_launch = admins_fees_params.amount_to_paid_launch;

                let erc20 = IERC20Dispatcher { contract_address: token_address_to_paid_launch };
                erc20
                    .transfer_from(
                        caller, self.protocol_fee_destination.read(), amount_to_paid_launch
                    );
            }

            // TODO
            // Maybe not needed because you can also create the coin everyhwhere (Unrug) and launch
            let mut token_to_use = self.default_token.read();
            let mut quote_token_address = token_to_use.token_address.clone();
            // let mut bond_type = BondingType::Exponential;
            // TODO fix unwrap match

            let mut bond_type = BondingType::Linear;
            // let mut bond_type = Option::Some(BondingType::Linear);
            if let Option::Some(v) =
                bonding_type { // println!("The maximum is configured to be {}", v);
            } else {
                // Default Exponential because gas optimization
                bond_type = BondingType::Exponential;
            }

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
                bonding_curve_type: bond_type,
                created_at: get_block_timestamp(),
                token_quote: token_to_use.clone(),
                starting_price: starting_price.clone(),
                price: starting_price.clone(),
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
                // assert(allowance >= amount_needed, 'no supply provided');
                // assert(allowance >= amount_needed, errors::NO_SUPPLY_PROVIDED);
                assert(allowance >= amount_needed, errors::INSUFFICIENT_ALLOWANCE);

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
                        is_unruggable: is_unruggable,
                        bonding_type: bond_type
                    }
                );
        }

        // Call the Unrug V2 to deposit Liquidity and locked it
        fn _add_liquidity_ekubo(
            ref self: ContractState, coin_address: ContractAddress,
            // params: EkuboLaunchParameters
        ) -> (u64, EkuboLP) {
            let unrug_liquidity_address = self.unrug_liquidity_address.read();
            let unrug_liquidity = IUnrugLiquidityDispatcher {
                contract_address: unrug_liquidity_address
            };

            let launch = self.launched_coins.read(coin_address);

            // assert(launch.liquidity_raised >= launch.threshold_liquidity, 'no threshold raised');
            assert(launch.is_liquidity_launch == false, errors::LIQUIDITY_ALREADY_LAUNCHED);
            let threshold_liquidity = launch.threshold_liquidity.clone();
            let mut slippage_threshold: u256 = threshold_liquidity * SLIPPAGE_THRESHOLD / BPS;
            let mut threshold = threshold_liquidity - slippage_threshold;
            // WEIRD error to fix
            // assert(launch.liquidity_raised >= threshold, errors::NO_THRESHOLD_RAISED);

            // TODO fix starting price
            // Fix tick spacing
            // Fix bounds
            let starting_price: i129 = calculate_starting_price_launch(
                launch.initial_pool_supply.clone(), launch.liquidity_raised.clone()
            );
            // Uncomment this to used calculated starting price
            let init_starting_price = i129 { sign: true, mag: 4600158 };

            // TODO default tick space
            // Add default for main coin like others
            let mut tick_spacing = 5928;

            // Edge case to check and fix if fees enabled
            let is_fees_protocol_enabled = self.is_fees_protocol_enabled.read();
            // println!("tick_spacing {:?}", tick_spacing);
            // let bound = calculate_aligned_bound_mag(starting_price, 2, tick_spacing);
            // TODO verify condition EKUBO
            // Verify conditions
            // Add these debug prints

            // assert(bound % tick_spacing == 0, 'Bound not aligned');
            // assert(bound <= MAX_TICK.try_into().unwrap(), 'Tick magnitude too high');
            // println!("Starting Price: {}", starting_price.mag);
            // println!("Calculated Bound: {}", bound);
            // println!("Tick Spacing: {}", tick_spacing);
            let bound_spacing = tick_spacing * 2;
            let pool_params = EkuboPoolParameters {
                fee: 0xc49ba5e353f7d00000000000000000, // TODO fee optional by user
                tick_spacing: tick_spacing, // TODO tick_spacing optional by user   
                // tick_spacing: 5000, // TODO tick_spacing optional by user
                starting_price: starting_price, // TODO verify if starting_price is correct
                // starting_price: init_starting_price, // TODO verify if starting_price is correct
                bound: bound_spacing,
                // bound: bound,
            };

            // TODO fix issue when fees are enabled
            let lp_supply = launch.initial_pool_supply.clone();
            let mut lp_quote_supply = launch.liquidity_raised.clone();

            // Approve Quote
            let quote_token = IERC20Dispatcher {
                contract_address: launch.token_quote.token_address.clone()
            };

            // Assertion: Check if the contract has enough quote tokens to transfer to liquidity
            // TODO fix this
            // HIGH SECURITY
            // Can drained funk if edge case approximation issue
            // Edge case of approximation estimation amount and fees can cause it
            let contract_quote_balance = quote_token.balance_of(get_contract_address());
            // println!("add liquidity contract_quote_balance final {:?}", contract_quote_balance);
            // println!("initial_pool_supply : {}", lp_supply.clone());
            // println!("liquidity raised: {}", lp_quote_supply.clone());

            if contract_quote_balance < lp_quote_supply
                && contract_quote_balance < launch.threshold_liquidity {
                // println!(
                //     "contract_quote_balance < lp_quote_supply
                // && contract_quote_balance < launch.threshold_liquidity: {}",
                //     contract_quote_balance < lp_quote_supply
                //         && contract_quote_balance < launch.threshold_liquidity
                // );
                // println!("launch.threshold_liquidity: {}", launch.threshold_liquidity.clone());
                // TODO just calculate the difference of round and substract it

                // let new_lp_quote_rounded= lp_quote_supply - contract_quote_balance;
                // lp_quote_supply = new_lp_quote_rounded.clone();

                lp_quote_supply = contract_quote_balance.clone();
            }
            // println!("liquidity raised: {}", lp_quote_supply.clone());

            let params = EkuboUnrugLaunchParameters {
                // owner: launch.owner, // TODO add optional parameters to be select LIQ percent to
                // be lock to Unrug at some point
                owner: get_contract_address(), // TODO add optional parameters to be select LIQ percent to be lock to Unrug at some point
                token_address: coin_address,
                quote_address: launch.token_quote.token_address.clone(),
                lp_supply: lp_supply.clone(),
                lp_quote_supply: lp_quote_supply.clone(),
                pool_params: pool_params,
                caller: get_caller_address()
            };

            let position_ekubo_address = unrug_liquidity.get_position_ekubo_address();
            // quote_token.approve(position_ekubo_address, lp_quote_supply);
            quote_token.approve(unrug_liquidity_address, lp_quote_supply);

            // Approve Memecoin
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            // memecoin.approve(position_ekubo_address, lp_supply);
            memecoin.approve(unrug_liquidity_address, lp_supply);

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
            // let memecoin = IMemecoinDispatcher { contract_address: coin_address };
            // let factory_address = memecoin.get_factory_address();
            // if token_state.creator == get_contract_address() || factory_address ==
            // get_contract_address() {
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
        // Change preparation of state for lp_supply, approve etc for the Unrug V2
        fn _add_liquidity_jediswap(
            ref self: ContractState, coin_address: ContractAddress, owner: ContractAddress
            // params: EkuboLaunchParameters
        ) -> u256 {
            let unrug_liquidity = IUnrugLiquidityDispatcher {
                contract_address: self.unrug_liquidity_address.read()
            };

            let launch = self.launched_coins.read(coin_address);

            assert(launch.is_liquidity_launch == false, errors::LIQUIDITY_ALREADY_LAUNCHED);
            let threshold_liquidity = launch.threshold_liquidity.clone();
            let mut slippage_threshold: u256 = threshold_liquidity * SLIPPAGE_THRESHOLD / BPS;
            let mut threshold = threshold_liquidity - slippage_threshold;

            // assert(launch.liquidity_raised >= threshold, errors::NO_THRESHOLD_RAISED);

            let quote_address = launch.token_quote.token_address.clone();
            let lp_supply = launch.initial_pool_supply.clone();
            let quote_supply = launch.liquidity_raised.clone();
            let unlock_time = starknet::get_block_timestamp() + DEFAULT_MIN_LOCKTIME;

            // let (id, position) = unrug_liquidity.launch_on_jediswap(coin_address, params);
            let id_cast = unrug_liquidity
                .launch_on_jediswap(
                    coin_address, quote_address, lp_supply, quote_supply, unlock_time, owner
                );

            // TODO
            // Add Locked position
            // let (id, position) = unrug_liquidity.launch_on_jediswap(coin_address, quote_address,
            // lp_supply, quote_supply, unlock_time);
            // let id_cast: u256 = id.try_into().unwrap();

            self
                .emit(
                    LiquidityCreated {
                        id: id_cast,
                        pool: coin_address,
                        asset: coin_address,
                        quote_token_address: launch.token_quote.token_address,
                        owner: launch.owner,
                        exchange: SupportedExchanges::Jediswap,
                        is_unruggable: false
                    }
                );
            // (id, position)
            id_cast
        }
    }
}
