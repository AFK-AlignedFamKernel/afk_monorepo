use afk_launchpad::interfaces::launchpad::{ILaunchpadMarketplace};
use afk_launchpad::types::jediswap_types::{MintParams};
use afk_launchpad::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, TokenQuoteBuyCoin,
    TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch, SetJediswapNFTRouterV2,
    SetJediswapV2Factory, SupportedExchanges, LiquidityCreated, LiquidityCanBeAdded, MetadataLaunch,
    TokenClaimed, MetadataCoinAdded, EkuboPoolParameters, LaunchParameters, EkuboLP, CallbackData,
    EkuboLaunchParameters, LaunchCallback, LiquidityType, EkuboLiquidityParameters,
    LiquidityParameters, EkuboUnrugLaunchParameters, AdminsFeesParams, CreatorFeeDistributed
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
        calculate_starting_price_launch, // get_coin_amount_by_quote_amount,
         get_coin_amount
    };
    use afk_launchpad::launchpad::errors;
    use afk_launchpad::launchpad::math::{PercentageMath, pow_256};
    use afk_launchpad::launchpad::utils::{
        sort_tokens, get_initial_tick_from_starting_price, get_next_tick_bounds, unique_count,
        calculate_aligned_bound_mag, align_tick, MIN_TICK, MAX_TICK, MAX_SQRT_RATIO, MIN_SQRT_RATIO,
        align_tick_with_max_tick_and_min_tick, calculate_bound_mag
    };
    use afk_launchpad::tokens::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk_launchpad::tokens::memecoin::{IMemecoinDispatcher, IMemecoinDispatcherTrait};

    use afk_launchpad::utils::{sqrt};
    use core::num::traits::Zero;
    use cubit::f128::math::ops::{sqrt as sqrt_cubit};
    use cubit::f128::types::fixed::{Fixed, FixedTrait, FixedPrint, FixedTryIntoU128, ONE_u128, ONE};
    use ekubo::components::clear::{IClearDispatcher, IClearDispatcherTrait};

    use ekubo::interfaces::core::{ICoreDispatcher, ICoreDispatcherTrait, ILocker};

    use ekubo::interfaces::erc20::{
        IERC20Dispatcher as EKIERC20Dispatcher, IERC20DispatcherTrait as EKIERC20DispatcherTrait
    };
    // use ekubo::interfaces::mathlib::{IMathLib, IMathLibLibraryDispatcher, dispatcher};
    // use ekubo::interfaces::mathlib::{IMathLib, dispatcher};
    // use ekubo::interfaces::mathlib::{IMathLib, IMathLibLibraryDispatcher};
    use ekubo::interfaces::mathlib::{IMathLibLibraryDispatcher, IMathLib};
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
    use starknet::syscalls::{library_call_syscall, deploy_syscall};
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };

    use starknet::{SyscallResultTrait};

    use super::{
        StoredName, BuyToken, SellToken, CreateToken, SharesTokenUser, MINTER_ROLE, ADMIN_ROLE,
        BondingType, Token, TokenLaunch, TokenQuoteBuyCoin, CreateLaunch, SetJediswapNFTRouterV2,
        SetJediswapV2Factory, SupportedExchanges, MintParams, LiquidityCreated, LiquidityCanBeAdded,
        MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters, LaunchParameters,
        EkuboLP, LiquidityType, CallbackData, EkuboLaunchParameters, LaunchCallback,
        EkuboLiquidityParameters, LiquidityParameters, EkuboUnrugLaunchParameters, AdminsFeesParams,
        CreatorFeeDistributed
        // MemecoinCreated, MemecoinLaunched
    };


    const MAX_SUPPLY: u256 = 100_000_000;
    const INITIAL_SUPPLY: u256 = MAX_SUPPLY / 5;

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

    // TODO  Used in V2 and be choose by user
    const ZERO_FEE_AMOUNT: u256 = 0; //1%
    const MIN_FEE_CREATOR: u256 = 100; //1%
    const MID_FEE_CREATOR: u256 = 1000; //10%
    const MAX_FEE_CREATOR: u256 = 5000; //50%

    const BPS: u256 = 10_000; // 100% = 10_000 bps
    const SCALE_FACTOR: u256 =
        100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff

    // MVP TODO AUDIT FLEXIBLE SUPPLY with Fuzzing
    // FIXED SUPPLY because edge cases not finish testing hard between threshold/supply
    const FIXED_SUPPLY: u256 = 1_000_000_000_000_000_000_000_000_000_u256; // 1_000_000_000

    // Unrug params
    const DEFAULT_MIN_LOCKTIME: u64 = 15_721_200;

    // const MAX_TRANSACTION_AMOUNT: u256 = 1_000_000 * pow_256(10, 18);
    // fn _validate_transaction_size(amount: u256) {
    //     assert(amount <= MAX_TRANSACTION_AMOUNT, 'transaction too large');
    // }
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
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
        // Creator fees and management
        is_fees_creator_enabled: bool,
        is_fees_creator_sell_enabled: bool,
        is_fees_creator_buy_enabled: bool,
        // For launch token
        amount_to_paid_launch: u256,
        is_paid_launch_enable: bool,
        is_create_token_paid: bool,
        // Stats
        total_token: u64,
        total_launch: u64,
        is_coin_launched: Map::<ContractAddress, bool>,
        // TODO check edge case supply for Bonding curve
        // HIGH SECURITY RISK
        // EDGE CASE SUPPLY AND THRESHOLD
        max_supply_launch: u256,
        min_supply_launch: u256,
        is_creator_fee_sent_before_graduated: bool,
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
        CreatorFeeDistributed: CreatorFeeDistributed,
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

        // self.is_fees_protocol_buy_enabled.write(false);
        // self.is_fees_protocol_sell_enabled.write(false);
        // self.is_fees_protocol_enabled.write(false);

        // TODO
        // Fees neabled by default
        // Audit for fees calculation, rounding and edges cases
        // fix BOUNDS_TICK_SPACINGS issue if fees are enabled
        // EDGE CASE HIGH RISK = DRAIN VALUES, BLOCKING FUNCTIONS, ERRORS

        // self.is_fees_protocol_buy_enabled.write(false);
        // self.is_fees_protocol_sell_enabled.write(false);

        self.is_creator_fee_sent_before_graduated.write(true);
        self.is_fees_creator_enabled.write(true);
        self.is_fees_creator_sell_enabled.write(true);
        self.is_fees_creator_sell_enabled.write(true);
        // TODO AUDIT
        // Check fees implementation in buy an sell
        // Rounding and approximation can caused an issue

        self.is_fees_protocol_buy_enabled.write(true);
        self.is_fees_protocol_sell_enabled.write(true);
        self.is_fees_protocol_enabled.write(true);

        // TODO V2
        // self.is_fees_creator_enabled.write(false);

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
        // TODO  test add case  if the payment are needed to create and launch
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
        // Unrug Liquitidy to deposit through Ekubo
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

    pub fn dispatcher() -> IMathLibLibraryDispatcher {
        IMathLibLibraryDispatcher {
            class_hash: 0x037d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3
                .try_into()
                .unwrap()
        }
    }

    // pub const CLASS_HASH_MATH_LIB: ClassHash =
    // 0x037d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3;
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

        // Protocol fees management
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
        // Creator fees management
        // V2
        fn set_is_fees_creator_enabled(ref self: ContractState, is_fees_creator_enabled: bool) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_fees_creator_enabled.write(is_fees_creator_enabled);
        }

        // TODO V2
        // Creator fees recolted sent directly after each graduated
        fn set_is_creator_fee_sent_before_graduated(
            ref self: ContractState, is_creator_fee_sent_before_graduated: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_creator_fee_sent_before_graduated.write(is_creator_fee_sent_before_graduated);
        }

        fn set_is_fees_creator_sell_enabled(
            ref self: ContractState, is_fees_creator_sell_enabled: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_fees_creator_sell_enabled.write(is_fees_creator_sell_enabled);
        }

        fn set_is_fees_creator_buy_enabled(
            ref self: ContractState, is_fees_creator_buy_enabled: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_fees_creator_buy_enabled.write(is_fees_creator_buy_enabled);
        }


        fn set_creator_fee_percent(ref self: ContractState, creator_fee_percent: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert(creator_fee_percent < MAX_FEE_CREATOR, errors::CREATOR_FEE_TOO_HIGH);
            assert(creator_fee_percent > MIN_FEE_CREATOR, errors::CREATOR_FEE_TOO_LOW);
            self.creator_fee_percent.write(creator_fee_percent);
        }

        // Fees manaamgent

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

        // Role admin
        fn set_admin(ref self: ContractState, admin: ContractAddress) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.accesscontrol._grant_role(ADMIN_ROLE, admin);
        }

        fn set_role_address(
            ref self: ContractState, contract_address: ContractAddress, role: felt252
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.accesscontrol._grant_role(role, contract_address);
        }

        fn set_revoke_address(
            ref self: ContractState, contract_address: ContractAddress, role: felt252
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.accesscontrol._revoke_role(role, contract_address);
        }

        // User call

        // Create token for an user
        // Send the supply to the recipient
        // Add Ownable to the caller
        // Add Factory address for the memecoin.cairo
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
        // Need to have the allowance of the total supply to be used
        // 80% percent on sale and 20% for the Liquidity pool when bonding curve reached threshold
        // Threshold is setup by the admin and save in the pool struct (in case we change)
        fn create_and_launch_token(
            ref self: ContractState,
            symbol: ByteArray,
            name: ByteArray,
            initial_supply: u256,
            contract_address_salt: felt252,
            is_unruggable: bool,
            bonding_type: BondingType,
            creator_fee_percent: u256,
            creator_fee_destination: ContractAddress,
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
                    token_address,
                    caller,
                    contract_address,
                    false,
                    Option::Some(bonding_type),
                    creator_fee_percent,
                    creator_fee_destination
                );
            token_address
        }

        // Launch coin to pool bonding curve
        // Need to have the allowance of the total supply to be used
        // 80% percent on sale and 20% for the Liquidity pool when bonding curve reached threshold
        // Threshold is setup by the admin and save in the pool struct (in case we change)
        fn launch_token(
            ref self: ContractState,
            coin_address: ContractAddress,
            bonding_type: BondingType,
            creator_fee_percent: u256,
            creator_fee_destination: ContractAddress
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
                    Option::Some(bonding_type),
                    creator_fee_percent,
                    creator_fee_destination
                );
        }

        // Buy coin by quote amount
        // Calculates amount of coin to receive based on quote token input
        // Handles fees, updates pool state and user shares
        fn buy_coin_by_quote_amount(
            ref self: ContractState, coin_address: ContractAddress, quote_amount: u256,
        ) {
            // Input validation
            assert(quote_amount > 0, errors::AMOUNT_ZERO);
            let caller = get_caller_address();

            // Get pool info
            let mut pool = self.launched_coins.read(coin_address);
            assert(!pool.owner.is_zero(), errors::COIN_NOT_FOUND);

            // Calculate fees and remaining quote amount
            let protocol_fee_percent = self.protocol_fee_percent.read();
            let mut amount_protocol_fee = 0;
            let mut remain_quote_to_liquidity = quote_amount;

            // HIGH SECURITY RISK For Liquidity Ekubo and Buy coin
            // Calculate threshold before launch the liquidity
            // We add a slippage tolerance to launch on the threshold and thresloss - 2%
            // We also substract protocol fees to the threshold: MAYBE CAUSING ISSUE
            let mut threshold_liquidity = pool.threshold_liquidity.clone();

            let mut slippage_threshold: u256 = threshold_liquidity * SLIPPAGE_THRESHOLD / BPS;

            let mut threshold = threshold_liquidity - slippage_threshold;
            // Substract fees protocol from threshold and the quote amount to used to calculate the
            // coin amount Handle protocol fees if enabled
            // HIGH SECURITY RISK ISSUE
            // Security check to do
            // Rounding and approximation of the percentage can lead to security vulnerabilities
            if self.is_fees_protocol_enabled.read() && self.is_fees_protocol_buy_enabled.read() {
                amount_protocol_fee = quote_amount * protocol_fee_percent / BPS;
                remain_quote_to_liquidity = quote_amount - amount_protocol_fee;
                threshold -= amount_protocol_fee;
                // Transfer protocol fee
                let quote_token = IERC20Dispatcher {
                    contract_address: pool.token_quote.token_address
                };
                quote_token
                    .transfer_from(
                        caller, self.protocol_fee_destination.read(), amount_protocol_fee
                    );
            }
            let new_liquidity = pool.liquidity_raised + remain_quote_to_liquidity;
            // assert(new_liquidity <= threshold_liquidity, errors::THRESHOLD_LIQUIDITY_EXCEEDED);
            // Transfer quote tokens to contract
            let quote_token = IERC20Dispatcher { contract_address: pool.token_quote.token_address };

            let mut creator_fee_amount = 0_u256;
            // TODO V2
            // add the Creator feed here setup by the user
            // HIGH SECURITY RISK
            // Security check to do
            // Rounding and approximation of the percentage can lead to security vulnerabilities
            let is_fees_creator_enabled = self.is_fees_creator_enabled.read()
                && self.is_fees_creator_buy_enabled.read();
            if is_fees_creator_enabled {
                // TODO V2
                // add the Creator feed here setup by the user
                let creator_fee_percent = pool.creator_fee_percent;
                // MODULAR USER MANAGEMENT
                // let creator_fee_percent = pool.creator_fee_percent;
                creator_fee_amount = remain_quote_to_liquidity * creator_fee_percent / BPS;
                remain_quote_to_liquidity -= creator_fee_amount;
                pool.creator_amount_received += creator_fee_amount;

                // Distribution alternatives
                // directly to the creator or send it to the Contract and deployed to the DAO after
                let is_creator_fee_sent_before_graduated = self
                    .is_creator_fee_sent_before_graduated
                    .read();
                if creator_fee_amount > 0 && is_creator_fee_sent_before_graduated {
                    quote_token
                        .transfer_from(caller, pool.creator_fee_destination, creator_fee_amount);
                    pool.creator_amount_distributed += creator_fee_amount;
                } else if creator_fee_amount > 0 && !is_creator_fee_sent_before_graduated {
                    quote_token.transfer_from(caller, get_contract_address(), creator_fee_amount);
                    pool.creator_amount_to_distribute += creator_fee_amount;
                }
            }

            // Calculate coin amount to receive
            // AUDIT
            // High security risk.
            // Verify rounding issue and approximation of the quote amount caused overflow
            let coin_amount = get_amount_by_type_of_coin_or_quote(
                pool.clone(), coin_address, remain_quote_to_liquidity, false, true
            );

            // Verify sufficient supply
            assert(pool.available_supply >= coin_amount, errors::INSUFFICIENT_SUPPLY);

            quote_token.transfer_from(caller, get_contract_address(), remain_quote_to_liquidity);

            // Update pool state
            let old_price = pool.price;
            pool.liquidity_raised += remain_quote_to_liquidity;
            pool.price = quote_amount;
            pool.total_token_holded += coin_amount;

            if coin_amount >= pool.available_supply {
                pool.available_supply = 0;
                pool.total_token_holded += coin_amount;
            } else {
                pool.total_token_holded += coin_amount;
                pool.available_supply -= coin_amount;
            }

            // Update user shares
            let mut share = self.shares_by_users.entry(caller).entry(coin_address).read();
            if share.owner.is_zero() {
                share =
                    SharesTokenUser {
                        owner: caller,
                        token_address: coin_address,
                        amount_owned: coin_amount,
                        amount_buy: coin_amount,
                        amount_sell: 0,
                        created_at: get_block_timestamp(),
                        total_paid: quote_amount,
                        is_claimable: true,
                    };
            } else {
                share.total_paid += quote_amount;
                share.amount_owned += coin_amount;
                share.amount_buy += coin_amount;
            }
            self.shares_by_users.entry(caller).entry(coin_address).write(share);

            // Check if liquidity threshold reached
            // let threshold = pool.threshold_liquidity - (pool.threshold_liquidity *
            // SLIPPAGE_THRESHOLD / BPS);
            // Update pool first time
            // Used by the add liquidity ekubo,
            // maybe better to only sent the mut storage to the function to not write two times the
            // state
            self.launched_coins.entry(coin_address).write(pool);

            // High security risk
            // Launch to ekubo if the liquidity raised = threshold liquidity
            // This threshold liquidity have a slippage tolrance of 2% and less protocl fees
            if pool.liquidity_raised >= threshold {
                self
                    .emit(
                        LiquidityCanBeAdded {
                            pool: pool.token_address,
                            asset: pool.token_address,
                            quote_token_address: pool.token_quote.token_address,
                        }
                    );

                // Add liquidity to DEX Ekubo
                self._add_liquidity_ekubo(coin_address);

                // TODO V2
                // Send the creator fee amount received to the creator DAO address
                // Gonna be a DAO AA later
                pool.is_liquidity_launch = true;
            }

            // Update pool state
            self.launched_coins.entry(coin_address).write(pool);

            // Emit buy event
            self
                .emit(
                    BuyToken {
                        caller,
                        token_address: coin_address,
                        amount: coin_amount,
                        price: quote_amount,
                        protocol_fee: amount_protocol_fee,
                        last_price: old_price,
                        timestamp: get_block_timestamp(),
                        quote_amount: remain_quote_to_liquidity
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
            // Validate pool exists and is not yet launched
            let mut pool = self.launched_coins.read(coin_address);
            assert(!pool.owner.is_zero(), errors::COIN_SHARE_NOT_FOUND);
            assert(!pool.is_liquidity_launch, errors::TOKEN_ALREADY_TRADEABLE);

            let caller = get_caller_address();

            // Get user's share and validate amount
            let mut share = self.shares_by_users.entry(caller).entry(coin_address).read();

            // Adjust sell amount if needed to the max owne by user if it's above it
            let mut sell_amount = if share.amount_owned < coin_amount {
                share.amount_owned
            } else {
                coin_amount
            };

            assert(share.amount_owned >= sell_amount, errors::ABOVE_SUPPLY);

            // Calculate fees
            // Get percentage fees setup for protoocol
            let protocol_fee_percent = self.protocol_fee_percent.read();
            // TODO V2: used creator fees setup by admin/user
            // HIGH SECURITY RISK
            let creator_fee_percent = 0_u256;
            // let creator_fee_percent = self.creator_fee_percent.read();
            assert(
                protocol_fee_percent <= MAX_FEE_PROTOCOL
                    && protocol_fee_percent >= MIN_FEE_PROTOCOL,
                errors::PROTOCOL_FEE_OUT_OF_BOUNDS
            );
            // assert(
            //     share.amount_owned <= pool.total_token_holded,
            //     errors::SUPPLY_ABOVE_TOTAL_OWNED
            // );
            // Calculate quote token amounts to received with  the amount of memecoin sell
            let mut quote_amount_total = get_amount_by_type_of_coin_or_quote(
                pool.clone(), coin_address, sell_amount, true, false
            );
            let mut quote_amount = quote_amount_total.clone();
            // AUDIT
            // Validate against liquidity and balance constraints
            // High security check to do.
            // Approximation and rounding issue can cause to enter this check
            // We maybe do something wrong to enter this check
            // println!("check liq raised and quote amount");
            if pool.liquidity_raised < quote_amount {
                // println!("pool.liquidity_raised < quote_amount");
                quote_amount = pool.liquidity_raised;
            }
            // AUDIT
            // HIGH RISK SECURITY
            // Rounding and approximation of the Linear and Exponential bonding curve can occurs
            // Calculate fees for protocol based on this quote amount calculated
            //
            let protocol_fee_amount = quote_amount * protocol_fee_percent / BPS;
            let creator_fee_amount = quote_amount * creator_fee_percent / BPS;

            // let protocol_fee_amount = sell_amount * protocol_fee_percent / BPS;
            // let creator_fee_amount = sell_amount * creator_fee_percent / BPS;

            // Handle protocol fees if enabled
            let is_fees_protocol_enabled = self.is_fees_protocol_enabled.read()
                && self.is_fees_protocol_sell_enabled.read();

            let mut quote_fee_amount = 0_u256;
            let mut creator_fee_amount = 0_u256;
            let mut creator_fee_percent = 0_u256;
            // println!("check fees");

            // Substract fees protocol from quote amount
            // AUDIT
            // High security check to do: rounding, approximation, balance of contract
            if is_fees_protocol_enabled {
                quote_fee_amount = quote_amount * protocol_fee_percent / BPS;
                quote_amount -= quote_fee_amount;
            }
            // Process transfers
            let quote_token = IERC20Dispatcher { contract_address: pool.token_quote.token_address };

            // TODO V2
            // add the Creator feed here setup by the user
            // HIGH SECURITY RISK
            // Security check to do
            // Rounding and approximation of the percentage can lead to security vulnerabilities
            let is_fees_creator_enabled = self.is_fees_creator_enabled.read()
                && self.is_fees_creator_sell_enabled.read();
            if is_fees_creator_enabled {
                // TODO V2
                // add the Creator feed here setup by the user
                creator_fee_percent = pool.creator_fee_percent;
                // MODULAR USER MANAGEMENT
                // let creator_fee_percent = pool.creator_fee_percent;

                creator_fee_amount = quote_amount * creator_fee_percent / BPS;
                quote_amount -= creator_fee_amount;

                // Distribution alternatives
                // directly to the creator or send it to the Contract and deployed to the DAO after
                pool.creator_amount_received += creator_fee_amount;

                let is_creator_fee_sent_before_graduated = self
                    .is_creator_fee_sent_before_graduated
                    .read();
                if creator_fee_amount > 0 && is_creator_fee_sent_before_graduated {
                    quote_token.transfer(pool.creator_fee_destination, creator_fee_amount);
                    pool.creator_amount_distributed += creator_fee_amount;
                } else if creator_fee_amount > 0 && !is_creator_fee_sent_before_graduated {
                    quote_token.transfer_from(caller, get_contract_address(), creator_fee_amount);
                    pool.creator_amount_to_distribute += creator_fee_amount;
                }
            }

            // println!("quote_amount: {}", quote_amount.clone());
            assert(pool.liquidity_raised >= quote_amount, errors::LIQUIDITY_BELOW_AMOUNT);

            // Transfer protocol fees to the address
            if is_fees_protocol_enabled && quote_fee_amount > 0 {
                quote_token.transfer(self.protocol_fee_destination.read(), quote_fee_amount);
            }

            // Transfer creator fees to the address directly
            // TODO V2
            // add the Creator feed here setup by the user
            // HIGH SECURITY RISK
            // Security check to do
            // Rounding and approximation of the percentage can lead to security vulnerabilities
            // Maybe do it when graduate

            // TODO V2
            // WHen graduated, send the creator fee amount received to the creator DAO address
            // Gonna be a DAO AA later

            // println!("transfer quote amount: {}", quote_amount.clone());
            let balance_contract = quote_token.balance_of(get_contract_address());
            // println!("balance_contract: {}", balance_contract.clone());

            // assert(balance_contract >= quote_amount, errors::BALANCE_CONTRACT_BELOW_AMOUNT);

            let quote_amount_paid = quote_amount.clone();
            // let quote_amount_paid = quote_amount - quote_fee_amount;
            // println!("quote_amount_paid: {}", quote_amount_paid.clone());

            // Checking rounding and approximation issue for the balance contract and the quote
            // amount to receive TODO audit
            // HIGH SECURITY ISSUE
            // Security check to do.
            // Rounding issue and approximation of the quote amount caused overflow/underflow when
            // transfering the token to the user
            // We do something wrong to enter this check
            if balance_contract >= quote_amount_paid {
                quote_token.transfer(caller, quote_amount_paid);
            } else {
                // Balance doesn't have the quote amount to paid
                // AUDIT HIGH SECURITY
                // Rounding and approximation on calculation and fees have lost some precision
                // let quote_amount_paid = quote_amount - quote_fee_amount;
                let difference_amount = quote_amount_paid - balance_contract;
                let amount_paid = quote_amount_paid - difference_amount;
                // println!("amount_paid: {}", amount_paid.clone());
                quote_token.transfer(caller, amount_paid);
            }

            // Update state of share user

            share.amount_owned -= sell_amount;
            share.amount_sell += sell_amount;

            let mut updated_pool = pool.clone();
            // println!("update pool");

            // Update the pool with the last data
            // Liquidity raised, available supply and total token holded
            // AUDIT HIGH SECURITY FIXED to VERIFY
            // Change accounting with the total liquidity
            updated_pool
                .liquidity_raised =
                    if updated_pool.liquidity_raised >= quote_amount_total {
                        updated_pool.liquidity_raised - quote_amount_total
                    } else {
                        0_u256
                    };
            updated_pool.total_token_holded -= sell_amount;
            updated_pool.available_supply += sell_amount;

            // Save updated state
            self.shares_by_users.entry(caller).entry(coin_address).write(share);

            self.launched_coins.entry(coin_address).write(updated_pool.clone());

            // Emit event
            self
                .emit(
                    SellToken {
                        caller,
                        key_user: coin_address,
                        amount: quote_amount,
                        price: updated_pool.price,
                        protocol_fee: quote_fee_amount,
                        creator_fee: creator_fee_amount,
                        timestamp: get_block_timestamp(),
                        last_price: pool.price,
                        coin_amount: sell_amount,
                    }
                );
        }

        // TODO Finish this function
        // Claim coin if liquidity is sent
        // Check and modify the share of user

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


        // Distribute the remain token to received to the DAO address and Creator
        //   reset the amount to distribute
        // Check if user can receive the fee now

        fn distribute_creator_fee(ref self: ContractState, coin_address: ContractAddress) {
            let caller = get_contract_address();
            // Verify if liquidity launch
            let mut launch = self.launched_coins.read(coin_address);

            let is_creator_fee_sent_before_graduated = self
                .is_creator_fee_sent_before_graduated
                .read();

            assert(launch.is_liquidity_launch == true, errors::NOT_LAUNCHED_YET);
            // Check if creator fees are accumulated to be be distributed at the launch
            assert(launch.creator_amount_to_distribute > 0_u256, errors::NO_FEE_RECEIVED);
            let quote_token = IERC20Dispatcher {
                contract_address: launch.token_quote.token_address
            };

            let creator_fee_amount = launch.creator_amount_received;
            let creator_fee_distributed = launch.creator_amount_distributed;
            let creator_fee_to_distribute = launch.creator_amount_to_distribute;

            launch.creator_amount_received = 0_u256;
            launch.creator_amount_distributed += creator_fee_to_distribute;
            launch.creator_amount_to_distribute = 0_u256;
            quote_token.transfer(launch.creator_fee_destination, creator_fee_to_distribute);
            self.launched_coins.entry(coin_address).write(launch);

            self
                .emit(
                    CreatorFeeDistributed {
                        token_address: quote_token.contract_address,
                        amount: creator_fee_amount,
                        creator_fee_destination: launch.creator_fee_destination,
                        memecoin_address: coin_address,
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
        // TODO finish add Metadata for Token and Launched and also updated it
        fn add_metadata(
            ref self: ContractState, coin_address: ContractAddress, metadata: MetadataLaunch
        ) {
            let caller = get_contract_address();
            // Verify if caller is owner
            let mut token = self.token_created.read(coin_address);
            // assert(token.owner == caller || token.creator == caller, errors::CALLER_NOT_OWNER);
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
        // Get the amount of coin received by quote amount
        // Bonding curve calculation are Linear and Exponential
        fn get_coin_amount_by_quote_amount(
            self: @ContractState,
            coin_address: ContractAddress,
            quote_amount: u256,
            is_decreased: bool
        ) -> u256 {
            let pool = self.launched_coins.read(coin_address).clone();
            get_coin_amount(pool.clone(), quote_amount)
            // get_coin_amount_by_quote_amount(pool.clone(), quote_amount, is_decreased)
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

            // println!("caller: {:?}", caller);

            // TODO finish this
            // ADD TEST CASE for Paid create token
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
            self.total_token.write(total_token + 1);

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
            bonding_type: Option<BondingType>,
            creator_fee_percent: u256,
            creator_fee_destination: ContractAddress,
        ) {
            let caller = get_caller_address();
            let token = self.token_created.read(coin_address);

            // check if token is created by the launchpad to prevent malicious erc20
            assert(!token.creator.is_zero(), errors::TOKEN_NOT_CREATED_BY_LAUNCHPAD);
            // assert(token.creator == get_contract_address(),
            // errors::TOKEN_NOT_CREATED_BY_LAUNCHPAD);

            let is_coin_launched = self.is_coin_launched.read(coin_address);
            assert(!is_coin_launched, errors::POOL_COIN_ALREADY_LAUNCHED);

            // TODO Add test for Paid launched token bonding curve
            // Handle paid launch if enabled
            // Price of the token and the address is set by the admin
            if self.is_paid_launch_enable.read() {
                // let admins_fees_params = self.admins_fees_params.read();
                let token_address_to_paid_launch = self.token_address_to_paid_launch.read();
                let amount_to_paid_launch = self.amount_to_paid_launch.read();
                let erc20 = IERC20Dispatcher { contract_address: token_address_to_paid_launch };
                erc20
                    .transfer_from(
                        caller, self.protocol_fee_destination.read(), amount_to_paid_launch
                    );
            }

            // TODO V2
            // - add the treasury DAO address here
            // - Add the creator fee selected by the user and do the check
            // HIGH SECURITY RISK
            // Security check to do
            // Rounding and approximation of the percentage can lead to security vulnerabilities

            // let creator_fee_percent = input_creator_fee_percent;
            // let creator_fee_percent = self.creator_fee_percent.read();

            assert(
                creator_fee_percent <= MAX_FEE_CREATOR && creator_fee_percent >= ZERO_FEE_AMOUNT,
                errors::CREATOR_FEE_OUT_OF_BOUNDS
            );

            // Set up bonding curve type
            let bond_type = match bonding_type {
                Option::Some(curve_type) => curve_type,
                Option::None => BondingType::Exponential
            };

            // Get token parameters
            let token_to_use = self.default_token.read();

            let quote_token_address = token_to_use.token_address.clone();
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            let total_supply = memecoin.total_supply();

            // Calculate supply distribution
            // AUDIT: check rounding and approximation issue
            // V2 is gonna be more flexible here for the user
            // V2 allow you to select your token on sale between a range to figure out
            // a range of liquidity to add (5 to 25%)
            let liquidity_supply = total_supply / LIQUIDITY_RATIO;
            let supply_distribution = total_supply - liquidity_supply;

            // Create launch parameters
            let launch_token_pump = TokenLaunch {
                owner: caller.clone(),
                creator: caller.clone(),
                token_address: coin_address,
                total_supply,
                available_supply: supply_distribution,
                initial_available_supply: supply_distribution,
                initial_pool_supply: liquidity_supply,
                bonding_curve_type: bond_type,
                created_at: get_block_timestamp(),
                token_quote: token_to_use.clone(),
                starting_price: 1_u256,
                price: 1_u256,
                liquidity_raised: 0_u256,
                total_token_holded: 0_u256,
                is_liquidity_launch: false,
                slope: 1_u256,
                threshold_liquidity: self.threshold_liquidity.read(),
                liquidity_type: Option::None,
                protocol_fee_percent: self.protocol_fee_percent.read(),
                // TODO V2 add the creator fee selected by the user
                creator_fee_percent: creator_fee_percent,
                creator_amount_received: 0_u256,
                creator_fee_destination: creator_fee_destination, // V2 selected by USER. 
                creator_amount_distributed: 0_u256,
                creator_amount_to_distribute: 0_u256,
            };

            // TODO Check approve
            // AUDIT
            // Handle token transfer to the launchpad
            // Check the allowance and the balance of the contract
            // The user need to approve the token to the launchpad if the token is created elsewhere
            // or without the function create_token_and_launch directly
            let balance_contract = memecoin.balance_of(get_contract_address());
            if balance_contract < total_supply {
                let allowance = memecoin.allowance(caller, get_contract_address());
                assert(allowance >= total_supply, errors::INSUFFICIENT_ALLOWANCE);
                memecoin
                    .transfer_from(caller, get_contract_address(), total_supply - balance_contract);
            }

            // Store launch data
            self.launched_coins.entry(coin_address).write(launch_token_pump.clone());

            // add bool to true when launch one time
            // prevent reinit the launch pool
            self.is_coin_launched.entry(coin_address).write(true);
            let total_launch = self.total_launch.read();
            self.total_launch.write(total_launch + 1);
            self.array_launched_coins.entry(total_launch).write(launch_token_pump);

            // Emit launch event
            self
                .emit(
                    CreateLaunch {
                        caller: get_caller_address(),
                        token_address: coin_address,
                        amount: 0,
                        price: 1_u256,
                        total_supply,
                        slope: 1_u256,
                        threshold_liquidity: self.threshold_liquidity.read(),
                        quote_token_address,
                        is_unruggable,
                        bonding_type: bond_type
                    }
                );
        }


        // TODO AUDIT: check rounding and approximation issue
        // HIGH SECURITY RISK and Vulnerability
        // ADD more test case for Unrug
        // Check better the liquidity position of Ekubo
        // Call the Unrug V2 to deposit Liquidity of the memecoin initial_pool_supply  and the
        // liquidity_raised The LP is owned by the Launchpad and locked it

        fn _add_liquidity_ekubo(
            ref self: ContractState, coin_address: ContractAddress,
        ) -> (u64, EkuboLP) {
            // Get unrug liquidity contract
            let unrug_liquidity_address = self.unrug_liquidity_address.read();
            let unrug_liquidity = IUnrugLiquidityDispatcher {
                contract_address: unrug_liquidity_address
            };

            // Get launch info and validate
            let launch = self.launched_coins.read(coin_address);
            assert(launch.is_liquidity_launch == false, errors::LIQUIDITY_ALREADY_LAUNCHED);

            // Calculate thresholds
            let threshold_liquidity = launch.threshold_liquidity.clone();
            let slippage_threshold: u256 = threshold_liquidity * SLIPPAGE_THRESHOLD / BPS;
            let threshold = threshold_liquidity - slippage_threshold;

            // Set pool parameters
            // TODO audit
            // HIGH SECURITY RISK
            // Add more test case

            // Verify fee is correct
            let fee_percent = 0xc49ba5e353f7d00000000000000000;
            // TODO
            // Verify tick spacing is correct based on the fee used
            // let tick_spacing = 5928;
            // let tick_spacing:u128 = 60_u128;
            let tick_spacing = 60_u128;

            // Calculate initial tick price
            // Compute sqrt root with the correct placed of token0 and token1

            // TODO test sqrt
            // Sort token for calculation
            // Check in Unruggable
            let (token0, token1) = sort_tokens(
                coin_address, launch.token_quote.token_address.clone()
            );
            // let (token0, token1) = sort_tokens(launch.token_quote.token_address.clone(),
            // coin_address);
            let is_token1_quote = launch.token_quote.token_address == token1;

            println!("is_token1_quote {}", is_token1_quote.clone());
            // Audit
            //  Edge case related to difference between threshold and total supply

            // // TODO FIX
            // // Audit edge case related to difference between threshold and total supply

            // TODO: check if this is correct
            // Adjust scale factor

            let scale_factor = pow_256(10, 18);
            // Initial pool need to be more than liquidity raised
            // CHECK liquidity raised and initial pool supply to avoir division by zero, overflow,
            // rounding or 0 value
            let mut x_y = if is_token1_quote {
                // (launch.liquidity_raised ) / launch.initial_pool_supply
                // (launch.liquidity_raised * pow_256(10, 18)) / (launch.initial_pool_supply *
                // pow_256(10, 18))
                // (launch.liquidity_raised * scale_factor) / (launch.initial_pool_supply *
                // scale_factor)
                // (launch.liquidity_raised * scale_factor) / launch.initial_pool_supply
                (launch.liquidity_raised * scale_factor) / (launch.initial_pool_supply * scale_factor)
            } else {
                (launch.initial_pool_supply) / launch.liquidity_raised
            };

            println!("x_y {}", x_y.clone());
            // TODO test sqrt
            // 3. Calculate proper sqrt price ratio
            // Verified fixed i128 with decimals
            // https://docs.ekubo.org/integration-guides/reference/math-1-pager
            // Cubit repo Fixed doesnt work (report issue)

            let x_y_felt: felt252 = x_y.try_into().unwrap();
            println!("x_y_felt {}", x_y_felt.clone());

            // let x_y_fixed = FixedTrait::from_unscaled_felt(x_y_felt);
            let x_y_fixed = FixedTrait::from_felt(x_y_felt);
            // let x_y_fixed = FixedTrait::from_u256(x_y);
            println!("x_y_fixed {}", x_y_fixed.mag.clone());

            // let mut sqrt_ratio_fixed_u128 = sqrt_cubit(x_y_fixed);
            // println!("sqrt_ratio_fixed_u128 {}", sqrt_ratio_fixed_u128.mag.clone());
            // let mut sqrt_ratio = FixedTryIntoU128::try_into_u128(sqrt_ratio_fixed_u128);
            // let mut sqrt_ratio_u128 = FixedTryIntoU128::try_into(sqrt_ratio_fixed_u128).unwrap();
            // println!("sqrt_ratio_u128 {}", sqrt_ratio_u128.clone());
            // let mut sqrt_ratio_fixed = sqrt_ratio_u128.try_into().unwrap();
            // let mut sqrt_ratio = sqrt_ratio_fixed_u128.mag.try_into().unwrap();
            // println!("sqrt_ratio  fixed {}", sqrt_ratio_fixed.clone());

            // Simple sqrt unfixed
            // Fixed point sqrt_ratio

            let mut sqrt_ratio = sqrt(x_y) * pow_256(2, 96);
            println!("sqrt_ratio before unscale {}", sqrt_ratio.clone());

            println!("is_token1_quote {}", is_token1_quote.clone());
            // Unscale sqrt_ratio with the factor before using the sqrt function

            if is_token1_quote == true {
                // x_y = x_y / scale_factor;
                // sqrt_ratio= (sqrt_ratio / scale_factor) * pow_256(2, 96);
                sqrt_ratio = sqrt_ratio / scale_factor;
                println!("sqrt_ratio unscaled {}", sqrt_ratio.clone());
            }
            // println!("sqrt_ratio {}", sqrt_ratio.clone());

            println!("sqrt_ratio : {}", sqrt_ratio.clone());

            let min_sqrt_ratio_limit = MIN_SQRT_RATIO;
            let max_sqrt_ratio_limit = MAX_SQRT_RATIO;

            // Assert range for sqrt ratio order, magnitude and min max

        
            sqrt_ratio =
                if sqrt_ratio < min_sqrt_ratio_limit {
                    println!("sqrt_ratio < min_sqrt_ratio_limit");
                    min_sqrt_ratio_limit
                } else if sqrt_ratio > max_sqrt_ratio_limit {
                    println!("sqrt_ratio > max_sqrt_ratio_limit");
                    max_sqrt_ratio_limit
                } else {
                    println!("sqrt_ratio is between min and max");
                    sqrt_ratio
                };

            println!("sqrt_ratio after assert {}", sqrt_ratio.clone());
            // Define the minimum and maximum sqrt ratios
            // Convert to a tick value
            let mut call_data: Array<felt252> = array![];
            Serde::serialize(@sqrt_ratio, ref call_data);

            // let class_hash:ClassHash =
            // 0x37d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3.try_into().unwrap();
            let class_hash: ClassHash =
                0x037d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3
                .try_into()
                .unwrap();

            let mut res = library_call_syscall(
                class_hash, selector!("sqrt_ratio_to_tick"), call_data.span(),
            )
                .unwrap_syscall();

            let initial_tick = Serde::<i129>::deserialize(ref res).unwrap();
            println!("initial_tick {}", initial_tick.mag.clone());
            // TODO
            // Ensure the tick is align with the tick spacing
            // let aligned_tick = align_tick(initial_tick, tick_spacing);
            // println!("aligned_tick {}",aligned_tick.clone());
            // TODO
            // Adjust bound spacing
            // Based on the range choose
            // Bounding space for Wide range or Concentrated range
            // verify the bound spacing is correct
            // AUDIT
            // let bound_spacing = initial_tick.mag * 2;

            // let bound_spacing = 887272;
            let bound_spacing:u128 = calculate_bound_mag(fee_percent.clone(), tick_spacing.clone().try_into().unwrap(), initial_tick);
            // let bound_spacing = 88719042;
            // let bound_spacing = 2000;
            // let bound_spacing = MAX_TICK.try_into().unwrap();
            // let bound_spacing = tick_spacing * 88719042;
            // let bound_spacing =  88719042;

            let pool_params = EkuboPoolParameters {
                fee: fee_percent,
                tick_spacing: tick_spacing,
                starting_price: initial_tick,
                // starting_price: starting_price,
                bound: bound_spacing,
            };

            // Calculate liquidity amounts
            let lp_supply = launch.initial_pool_supply.clone();
            let mut lp_quote_supply = launch.liquidity_raised.clone();

            // Handle edge case where contract balance is insufficient
            let quote_token = IERC20Dispatcher {
                contract_address: launch.token_quote.token_address.clone()
            };
            let contract_quote_balance = quote_token.balance_of(get_contract_address());

            // TODO audit
            // HIGH SECURITY RISK
            // TODO fix this
            // We do something wrong if we enter this case
            // Can be caused a rounding and approximation error, fees and others stuff
            if contract_quote_balance < lp_quote_supply
                && contract_quote_balance < launch.threshold_liquidity {
                lp_quote_supply = contract_quote_balance.clone();
            }

            // Prepare launch parameters
            let params = EkuboUnrugLaunchParameters {
                owner: get_contract_address(),
                token_address: coin_address,
                quote_address: launch.token_quote.token_address.clone(),
                lp_supply: lp_supply.clone(),
                lp_quote_supply: lp_quote_supply.clone(),
                pool_params: pool_params,
                caller: get_caller_address()
            };

            // Approve tokens
            quote_token.approve(unrug_liquidity_address, lp_quote_supply);
            let memecoin = IERC20Dispatcher { contract_address: coin_address };
            memecoin.approve(unrug_liquidity_address, lp_supply);

            // Launch on Ekubo
            // TODO Audit unrug.cairo
            let (id, position) = unrug_liquidity.launch_on_ekubo(coin_address, params);

            // Update launch state
            let mut launch_to_update = self.launched_coins.read(coin_address);
            launch_to_update.is_liquidity_launch = true;
            self.launched_coins.entry(coin_address).write(launch_to_update.clone());

            // Emit event
            self
                .emit(
                    LiquidityCreated {
                        id: id.try_into().unwrap(),
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

        // TODO finish call Jediswap
        // Change preparation of state for lp_supply, approve etc for the Unrug V2
        fn _add_liquidity_jediswap(
            ref self: ContractState, coin_address: ContractAddress, owner: ContractAddress
        ) -> u256 {
            let unrug_liquidity = IUnrugLiquidityDispatcher {
                contract_address: self.unrug_liquidity_address.read()
            };

            let launch = self.launched_coins.read(coin_address);
            assert(launch.is_liquidity_launch == false, errors::LIQUIDITY_ALREADY_LAUNCHED);

            let quote_address = launch.token_quote.token_address;
            let lp_supply = launch.initial_pool_supply;
            let quote_supply = launch.liquidity_raised;
            let unlock_time = starknet::get_block_timestamp() + DEFAULT_MIN_LOCKTIME;

            let id = unrug_liquidity
                .launch_on_jediswap(
                    coin_address, quote_address, lp_supply, quote_supply, unlock_time, owner
                );

            self
                .emit(
                    LiquidityCreated {
                        id,
                        pool: coin_address,
                        asset: coin_address,
                        quote_token_address: quote_address,
                        owner: launch.owner,
                        exchange: SupportedExchanges::Jediswap,
                        is_unruggable: false
                    }
                );

            id
        }
    }
}
