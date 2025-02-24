mod end_to_end_tests {
    use afk_launchpad::interfaces::factory::{IFactory, IFactoryDispatcher, IFactoryDispatcherTrait};
    use afk_launchpad::interfaces::launchpad::{
        ILaunchpadMarketplaceDispatcher, ILaunchpadMarketplaceDispatcherTrait,
    };
    use afk_launchpad::interfaces::unrug::{
        IUnrugLiquidityDispatcher, IUnrugLiquidityDispatcherTrait,
    };
    use afk_launchpad::launchpad::calcul::linear::{
        calculate_starting_price_launch, // get_coin_amount_by_quote_amount,
         get_coin_amount
    };
    // use afk_launchpad::launchpad::errors;
    use afk_launchpad::launchpad::launchpad::LaunchpadMarketplace::{Event as LaunchpadEvent};
    use afk_launchpad::launchpad::math::{PercentageMath};

    use afk_launchpad::launchpad::utils::{
        sort_tokens, get_initial_tick_from_starting_price, get_next_tick_bounds, unique_count,
        calculate_aligned_bound_mag, align_tick, MIN_TICK, MAX_TICK, MAX_SQRT_RATIO, MIN_SQRT_RATIO,
        align_tick_with_max_tick_and_min_tick
    };
    use afk_launchpad::tokens::erc20::{IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk_launchpad::tokens::memecoin::{IMemecoin, IMemecoinDispatcher, IMemecoinDispatcherTrait};
    use afk_launchpad::types::launchpad_types::{
        CreateToken, TokenQuoteBuyCoin, BondingType,
        CreateLaunch, // SetJediswapNFTRouterV2,SetJediswapV2Factory,
         SupportedExchanges, EkuboLP,
        EkuboPoolParameters, TokenLaunch, EkuboLaunchParameters, LaunchParameters, SharesTokenUser,
        EkuboUnrugLaunchParameters
    };

    use afk_launchpad::types::launchpad_types::{MINTER_ROLE, ADMIN_ROLE};
    use core::num::traits::Zero;
    use core::traits::Into;
    use ekubo::interfaces::core::{ICoreDispatcher, ICoreDispatcherTrait};
    use ekubo::interfaces::positions::{IPositionsDispatcher, IPositionsDispatcherTrait};
    use ekubo::interfaces::token_registry::{
        ITokenRegistryDispatcher, ITokenRegistryDispatcherTrait,
    };

    use ekubo::types::i129::i129;
    use ekubo::types::keys::PoolKey;
    use openzeppelin::utils::serde::SerializedAppend;
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, start_cheat_caller_address,
        start_cheat_caller_address_global, stop_cheat_caller_address,
        stop_cheat_caller_address_global, start_cheat_block_timestamp, DeclareResultTrait,
        EventSpyAssertionsTrait
    };
    use starknet::syscalls::call_contract_syscall;
    use starknet::{ContractAddress, ClassHash, class_hash::class_hash_const};
    // fn DEFAULT_INITIAL_SUPPLY() -> u256 {
    //     // 21_000_000 * pow_256(10, 18)
    //     100_000_000
    //     // * pow_256(10, 18)
    // }

    // 100 supply for the low range
    // fn DEFAULT_INITIAL_SUPPLY() -> u256 {
    //     100_u256 * pow_256(10, 18)
    // }

    fn DEFAULT_INITIAL_SUPPLY() -> u256 {
        // 100_u256 * pow_256(10, 18)
        1_000_000_000_u256 * pow_256(10, 18)
    }

    fn DEFAULT_100_SUPPLY() -> u256 {
        100_u256 * pow_256(10, 18)
    }

    fn DEFAULT_100M_SUPPLY() -> u256 {
        100_000_000_u256 * pow_256(10, 18)
    }

    fn DEFAULT_1B_SUPPLY() -> u256 {
        1_000_000_000_u256 * pow_256(10, 18)
    }

    fn DEFAULT_BIG_SUPPLY() -> u256 {
        100_000_000_000_000_u256 * pow_256(10, 18)
    }

    fn DEFAULT_100_T_SUPPLY() -> u256 {
        100_000_000_000_000_u256 * pow_256(10, 18)
    }
    // const INITIAL_KEY_PRICE:u256=1/100;
    const INITIAL_SUPPLY_DEFAULT: u256 = 100_000_000;
    const INITIAL_KEY_PRICE: u256 = 1;
    const STEP_LINEAR_INCREASE: u256 = 1;
    // const THRESHOLD_LIQUIDITY: u256 = 10;d
    const THRESHOLD_MARKET_CAP: u256 = 500;
    const MIN_FEE_PROTOCOL: u256 = 10; //0.1%
    const MAX_FEE_PROTOCOL: u256 = 1000; //10%
    const MID_FEE_PROTOCOL: u256 = 100; //1%
    const MIN_FEE_CREATOR: u256 = 100; //1%
    const MID_FEE_CREATOR: u256 = 1000; //10%
    const MAX_FEE_CREATOR: u256 = 5000; //50%
    // const INITIAL_KEY_PRICE: u256 = 1 / 10_000;
    // const THRESHOLD_LIQUIDITY: u256 = 10;
    // const THRESHOLD_LIQUIDITY: u256 = 10_000;

    const RATIO_SUPPLY_LAUNCH: u256 = 5;
    const LIQUIDITY_SUPPLY: u256 = INITIAL_SUPPLY_DEFAULT / RATIO_SUPPLY_LAUNCH;
    const BUYABLE: u256 = INITIAL_SUPPLY_DEFAULT / RATIO_SUPPLY_LAUNCH;

    const LIQUIDITY_RATIO: u256 = 5;
    // const THRESHOLD_LIQUIDITY: u256 = 10 * pow_256(10, 18);
    // const THRESHOLD_LIQUIDITY: u256 = 1_000_000_000_000_000_000_u256; // 1 = maybe ETH quote
    // const THRESHOLD_LIQUIDITY: u256 = 10_000_000_000_000_000_000_u256; // 10
    // const THRESHOLD_LIQUIDITY: u256 = 1_000_000_000_000_000_000_000_u256; // 1000 for first
    const THRESHOLD_LIQUIDITY: u256 = 2_000_000_000_000_000_000_000_u256; // 2000 for
    // first release liq

    // fn THRESHOLD_LIQUIDITY() -> u256 {
    //     10_u256 * pow_256(10, 18)
    // }

    fn RECEIVER_ADDRESS() -> ContractAddress {
        'receiver'.try_into().unwrap()
    }

    fn FACTORY_ADDRESS() -> ContractAddress {
        0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc.try_into().unwrap()
    }

    fn EKUBO_EXCHANGE_ADDRESS() -> ContractAddress {
        0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b.try_into().unwrap()
    }

    // fn EKUBO_EXCHANGE_ADDRESS() -> ContractAddress {
    //     0x02bd1cdd5f7f17726ae221845afd9580278eebc732bc136fe59d5d94365effd5.try_into().unwrap()
    // }

    fn EKUBO_CORE() -> ContractAddress {
        0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b.try_into().unwrap()
    }

    fn EKUBO_POSITIONS() -> ContractAddress {
        0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067.try_into().unwrap()
    }

    fn EKUBO_REGISTRY() -> ContractAddress {
        0x0013e25867b6eef62703735aa4cfa7754e72f4e94a56c9d3d9ad8ebe86cee4aa.try_into().unwrap()
    }
    // v3
    // fn EKUBO_REGISTRY() -> ContractAddress {
    //     0x064bdb4094881140bc39340146c5fcc5a187a98aec5a53f448ac702e5de5067e.try_into().unwrap()
    // }

    fn JEDISWAP_FACTORY() -> ContractAddress {
        0x01aa950c9b974294787de8df8880ecf668840a6ab8fa8290bf2952212b375148.try_into().unwrap()
    }

    fn JEDISWAP_NFT_V2() -> ContractAddress {
        0x0469b656239972a2501f2f1cd71bf4e844d64b7cae6773aa84c702327c476e5b.try_into().unwrap()
    }


    fn SALT() -> felt252 {
        'salty'.try_into().unwrap()
    }

    // Constants
    fn OWNER() -> ContractAddress {
        // 'owner'.try_into().unwrap()
        123.try_into().unwrap()
    }

    fn RECIPIENT() -> ContractAddress {
        'recipient'.try_into().unwrap()
    }

    fn SPENDER() -> ContractAddress {
        'spender'.try_into().unwrap()
    }

    fn ALICE() -> ContractAddress {
        'alice'.try_into().unwrap()
    }

    fn BOB() -> ContractAddress {
        'bob'.try_into().unwrap()
    }

    fn NAME() -> ByteArray {
        let name: ByteArray = "name";
        name
    }

    fn SYMBOL() -> ByteArray {
        let symbol: ByteArray = "symbol";
        symbol
    }


    fn SYMBOL_FELT() -> felt252 {
        'symbol'.try_into().unwrap()
    }

    fn NAME_FELT() -> felt252 {
        'name'.try_into().unwrap()
    }

    // Math
    fn pow_256(self: u256, mut exponent: u8) -> u256 {
        if self.is_zero() {
            return 0;
        }
        let mut result = 1;
        let mut base = self;

        loop {
            if exponent & 1 == 1 {
                result = result * base;
            }

            exponent = exponent / 2;
            if exponent == 0 {
                break result;
            }

            base = base * base;
        }
    }

    // Declare and create all contracts
    // Return sender_address, Erc20 quote and Launchpad contract
    fn request_fixture() -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher) {
        // fn request_fixture() -> (ContractAddress, IERC20Dispatcher,
        // ILaunchpadMarketplaceDispatcher, IUnrugLiquidityDispatcher) {

        // println!("request_fixture");
        let erc20_class = declare_erc20();
        let meme_class = declare_memecoin();
        let unrug_class = declare_unrug_liquidity();
        let launch_class = declare_launchpad();
        request_fixture_custom_classes(*erc20_class, *meme_class, *launch_class, *unrug_class)
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass,
        meme_class: ContractClass,
        launch_class: ContractClass,
        unrug_class: ContractClass
    ) -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher) {
        // ) -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher,
        // IUnrugLiquidityDispatcher) {
        let sender_address: ContractAddress = 123.try_into().unwrap();
        let erc20 = deploy_erc20(
            erc20_class,
            'USDC token',
            'USDC',
            1_000_000_000_000_000_000 * pow_256(10, 18),
            sender_address
        );
        let token_address = erc20.contract_address.clone();

        let unrug_liquidity = deploy_unrug_liquidity(
            unrug_class,
            sender_address,
            token_address.clone(),
            INITIAL_KEY_PRICE,
            STEP_LINEAR_INCREASE,
            meme_class.class_hash,
            THRESHOLD_LIQUIDITY,
            THRESHOLD_MARKET_CAP,
            FACTORY_ADDRESS(),
            EKUBO_REGISTRY(),
            EKUBO_CORE(),
            EKUBO_POSITIONS(),
            EKUBO_EXCHANGE_ADDRESS()
        );

        let launchpad = deploy_launchpad(
            launch_class,
            sender_address,
            token_address.clone(),
            INITIAL_KEY_PRICE,
            STEP_LINEAR_INCREASE,
            meme_class.class_hash,
            THRESHOLD_LIQUIDITY,
            THRESHOLD_MARKET_CAP,
            // FACTORY_ADDRESS(),
            // EKUBO_REGISTRY(),
            // EKUBO_CORE(),
            // EKUBO_POSITIONS(),
            // EKUBO_EXCHANGE_ADDRESS(),
            unrug_liquidity.contract_address,
            // ITokenRegistryDispatcher { contract_address: EKUBO_REGISTRY() },
        // ICoreDispatcher { contract_address: EKUBO_CORE() },
        // IPositionsDispatcher { contract_address: EKUBO_POSITIONS() },
        );
        // let launchpad = deploy_launchpad(
        //     launch_class,
        //     sender_address,
        //     token_address.clone(),
        //     INITIAL_KEY_PRICE * pow_256(10,18),
        //     // INITIAL_KEY_PRICE,
        //     // STEP_LINEAR_INCREASE,
        //     STEP_LINEAR_INCREASE * pow_256(10,18),
        //     erc20_class.class_hash,
        //     THRESHOLD_LIQUIDITY * pow_256(10,18),
        //     // THRESHOLD_LIQUIDITY,
        //     THRESHOLD_MARKET_CAP * pow_256(10,18),
        //     // THRESHOLD_MARKET_CAP
        // );

        start_cheat_caller_address(launchpad.contract_address, OWNER());
        // launchpad.set_address_jediswap_factory_v2(JEDISWAP_FACTORY());
        // launchpad.set_address_jediswap_nft_router_v2(JEDISWAP_NFT_V2());
        (sender_address, erc20, launchpad)
        // (sender_address, erc20, launchpad, unrug_liquidity)
    }

    fn deploy_unrug_liquidity(
        class: ContractClass,
        admin: ContractAddress,
        token_address: ContractAddress,
        initial_key_price: u256,
        step_increase_linear: u256,
        coin_class_hash: ClassHash,
        threshold_liquidity: u256,
        threshold_marketcap: u256,
        factory_address: ContractAddress,
        ekubo_registry: ContractAddress,
        core: ContractAddress,
        positions: ContractAddress,
        ekubo_exchange_address: ContractAddress,
        // ekubo_registry: ITokenRegistryDispatcher,
    // core: ICoreDispatcher,
    // positions: IPositionsDispatcher,
    ) -> IUnrugLiquidityDispatcher {
        // println!("deploy marketplace");
        let mut calldata = array![admin.into()];
        calldata.append_serde(initial_key_price);
        calldata.append_serde(token_address);
        calldata.append_serde(step_increase_linear);
        calldata.append_serde(coin_class_hash);
        calldata.append_serde(threshold_liquidity);
        calldata.append_serde(threshold_marketcap);
        calldata.append_serde(factory_address);
        calldata.append_serde(ekubo_registry);
        calldata.append_serde(core);
        calldata.append_serde(positions);
        calldata.append_serde(ekubo_exchange_address);
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        IUnrugLiquidityDispatcher { contract_address }
    }

    fn deploy_launchpad(
        class: ContractClass,
        admin: ContractAddress,
        token_address: ContractAddress,
        initial_key_price: u256,
        step_increase_linear: u256,
        coin_class_hash: ClassHash,
        threshold_liquidity: u256,
        threshold_marketcap: u256,
        // factory_address: ContractAddress,
        // ekubo_registry: ContractAddress,
        // core: ContractAddress,
        // positions: ContractAddress,
        // ekubo_exchange_address: ContractAddress,
        unrug_liquidity_address: ContractAddress,
        // ekubo_registry: ITokenRegistryDispatcher,
    // core: ICoreDispatcher,
    // positions: IPositionsDispatcher,
    ) -> ILaunchpadMarketplaceDispatcher {
        // println!("deploy marketplace");
        let mut calldata = array![admin.into()];
        calldata.append_serde(initial_key_price);
        calldata.append_serde(token_address);
        calldata.append_serde(step_increase_linear);
        calldata.append_serde(coin_class_hash);
        calldata.append_serde(threshold_liquidity);
        calldata.append_serde(threshold_marketcap);
        // calldata.append_serde(factory_address);
        // calldata.append_serde(ekubo_registry);
        // calldata.append_serde(core);
        // calldata.append_serde(positions);
        // calldata.append_serde(ekubo_exchange_address);
        calldata.append_serde(unrug_liquidity_address);
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        ILaunchpadMarketplaceDispatcher { contract_address }
    }

    fn declare_unrug_liquidity() -> @ContractClass {
        declare("UnrugLiquidity").unwrap().contract_class()
    }

    fn declare_launchpad() -> @ContractClass {
        declare("LaunchpadMarketplace").unwrap().contract_class()
    }

    fn declare_erc20() -> @ContractClass {
        declare("ERC20").unwrap().contract_class()
    }

    fn declare_memecoin() -> @ContractClass {
        declare("Memecoin").unwrap().contract_class()
    }

    fn deploy_erc20(
        class: ContractClass,
        name: felt252,
        symbol: felt252,
        initial_supply: u256,
        recipient: ContractAddress
    ) -> IERC20Dispatcher {
        let mut calldata = array![];

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        (2 * initial_supply).serialize(ref calldata);
        recipient.serialize(ref calldata);
        18_u8.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IERC20Dispatcher { contract_address }
    }

    fn run_buy_by_amount(
        launchpad: ILaunchpadMarketplaceDispatcher,
        erc20: IERC20Dispatcher,
        memecoin: IERC20Dispatcher,
        amount_quote: u256,
        token_address: ContractAddress,
        sender_address: ContractAddress,
    ) {
        start_cheat_caller_address(erc20.contract_address, sender_address);
        erc20.approve(launchpad.contract_address, amount_quote * 2);
        let allowance = erc20.allowance(sender_address, launchpad.contract_address);
        println!("test allowance erc20 {}", allowance);
        stop_cheat_caller_address(erc20.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("buy coin {:?}", amount_quote,);
        // launchpad.buy_coin_by_quote_amount(token_address, amount_quote, Option::None);
        launchpad.buy_coin_by_quote_amount(token_address, amount_quote);
        stop_cheat_caller_address(launchpad.contract_address);
    }


    fn run_sell_by_amount(
        launchpad: ILaunchpadMarketplaceDispatcher,
        erc20: IERC20Dispatcher,
        memecoin: IERC20Dispatcher,
        amount_quote: u256,
        token_address: ContractAddress,
        sender_address: ContractAddress,
    ) {
        println!("sell coin for amount quote{:?}", amount_quote);
        launchpad.sell_coin(token_address, amount_quote);
    }

    #[test]
    #[fork("Mainnet")]
    fn launchpad_buy_all_and_claim() {
        println!("launchpad_buy_all_and_claim");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let mut spy = spy_events();

        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };

        let memecoin_address = memecoin.contract_address.clone();
        //  All buy
        // run_buy_by_amount(
        //     launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        // );
        println!("first buy {:?}", token_address);
        // global_cheat_caller_address(sender_address);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );

        let initial_pool_supply = DEFAULT_INITIAL_SUPPLY() / 5_u256;
        // Set pool parameters
        let tick_spacing = 5928;
        let bound_spacing = tick_spacing * 2;
        let fee = 0xc49ba5e353f7d00000000000000000;
        let pool_key = PoolKey {
            token0: memecoin_address.clone(),
            token1: erc20.contract_address.clone(),
            fee: fee.try_into().unwrap().clone(),
            tick_spacing: tick_spacing.try_into().unwrap(),
            extension: 0.try_into().unwrap(),
        };

        let quote_address = erc20.contract_address.clone();
        let core = ICoreDispatcher { contract_address: EKUBO_CORE() };
        let liquidity = core.get_pool_liquidity(pool_key);
        let price = core.get_pool_price(pool_key);
        let reserve_memecoin = memecoin.balance_of(core.contract_address);
        let reserve_quote = IERC20Dispatcher { contract_address: quote_address }
            .balance_of(core.contract_address);

        let total_supply: u256 = memecoin.total_supply();
        let lp_meme_supply: u256 = total_supply / LIQUIDITY_RATIO;
        // let total_token_holded: u256 = total_supply / LIQUIDITY_RATIO;
        println!("lp_meme_supply {:?}", lp_meme_supply);

        // let lp_meme_supply = total_supply - total_token_holded;
        // println!("lp_meme_supply {:?}", lp_meme_supply);

        // TODO check the reserver of the positions

        let reserve_memecoin = memecoin.balance_of(core.contract_address);
        // let reserve_quote = IERC20Dispatcher { contract_address: quote_address }
        //     .balance_of(core.contract_address);
        let positions = IPositionsDispatcher { contract_address: EKUBO_POSITIONS() };
        let reserve_quote = IERC20Dispatcher { contract_address: quote_address }
            .balance_of(positions.contract_address);
        // let reserve_quote_core = IERC20Dispatcher { contract_address: quote_address }
        //     .balance_of(core.contract_address);
        println!("reserve_memecoin {:?}", reserve_memecoin);
        println!("reserve_quote {:?}", reserve_quote);

        assert(
            reserve_memecoin >= PercentageMath::percent_mul(lp_meme_supply, 9800),
            'reserve too low meme'
        );

        assert(
            reserve_quote >= PercentageMath::percent_mul(THRESHOLD_LIQUIDITY, 9000),
            'reserve too low quote'
        );

        let liquidity = core.get_pool_liquidity(pool_key);
        // assert(liquidity == THRESHOLD_LIQUIDITY, 'wrong liquidity');

        // launchpad.claim_coin_buy(token_address);
        // launchpad.claim_coin_all(token_address);

        // run_buy_by_amount(launchpad, erc20, memecoin, 1, token_address, sender_address,);

        // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
        //     CreateLaunch {
        //         caller: OWNER(),
        //         token_address: token_address,
        //         amount: 0,
        //         price: INITIAL_KEY_PRICE,
        //         total_supply: DEFAULT_INITIAL_SUPPLY(),
        //         slope: slope,
        //         threshold_liquidity: THRESHOLD_LIQUIDITY,
        //         quote_token_address: erc20.contract_address,
        //     }
        // );
        // spy.assert_emitted(@array![(launchpad.contract_address, expected_launch_token_event)]);
        let launched_token = launchpad.get_coin_launch(token_address);
        let default_supply = DEFAULT_INITIAL_SUPPLY();
        // assert(launched_token.owner == OWNER(), 'wrong owner');
        assert(launched_token.token_address == token_address, 'wrong token address');
        assert(launched_token.total_supply == DEFAULT_INITIAL_SUPPLY(), 'wrong initial supply');
        // assert(launched_token.bonding_curve_type == BondingType::Linear, 'wrong type curve');
        // assert(launched_token.liquidity_raised == THRESHOLD_LIQUIDITY, 'wrong liq raised');
        assert(launched_token.initial_pool_supply == default_supply / 5_u256, 'wrong init pool');
        // assert(
        //     launched_token.total_token_holded >= default_supply
        //         - launched_token.initial_pool_supply,
        //     'wrong token holded'
        // );
        assert(
            launched_token.token_quote.token_address == erc20.contract_address, 'wrong token quote'
        );
    }

    #[test]
    #[fork("Mainnet")]
    fn test_launchpad_end_to_end() {
        println!("launchpad_end_to_end");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let mut spy = spy_events();

        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        println!("buy coin {:?}", THRESHOLD_LIQUIDITY);

        let one_quote = 1 * pow_256(10, 18);
        run_buy_by_amount(launchpad, erc20, memecoin, one_quote, token_address, sender_address,);
        println!("get share user");

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        // let amount_owned = share_user.amount_owned.try_into().unwrap();
        let amount_owned = share_user.amount_owned;
        println!("amount_owned {:?}", amount_owned);
        println!("sell coin {:?}", amount_owned);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned, token_address, sender_address,
        );

        //  All buy
        println!("buy end_to_end all coin after sell {:?}", THRESHOLD_LIQUIDITY);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );
        // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
        //     CreateLaunch {
        //         caller: OWNER(),
        //         token_address: token_address,
        //         amount: 0,
        //         price: initial_key_price,
        //         total_supply: DEFAULT_INITIAL_SUPPLY(),
        //         slope: slope,
        //         threshold_liquidity: THRESHOLD_LIQUIDITY,
        //         quote_token_address: erc20.contract_address,
        //     }
        // );
        // spy.assert_emitted(@array![(launchpad.contract_address, expected_launch_token_event)]);
        let launched_token = launchpad.get_coin_launch(token_address);
        let default_supply = DEFAULT_INITIAL_SUPPLY();
        // assert(launched_token.owner == OWNER(), 'wrong owner');
        assert(launched_token.token_address == token_address, 'wrong token address');
        assert(launched_token.total_supply == DEFAULT_INITIAL_SUPPLY(), 'wrong initial supply');
        // assert(launched_token.bonding_curve_type == BondingType::Linear, 'wrong type curve');
        // assert(launched_token.liquidity_raised == THRESHOLD_LIQUIDITY, 'wrong liq raised');
        assert(launched_token.initial_pool_supply == default_supply / 5_u256, 'wrong init pool');
        // assert(
        //     launched_token.total_token_holded >= default_supply
        //         - launched_token.initial_pool_supply,
        //     'wrong token holded'
        // );
        assert(
            launched_token.token_quote.token_address == erc20.contract_address,
            'wrong token
            quote'
        );
    }

    #[test]
    #[fork("Mainnet")]
    fn launchpad_buy_and_sell() {
        println!("launchpad_buy_and_sell");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let mut spy = spy_events();

        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        println!("buy coin {:?}", THRESHOLD_LIQUIDITY);

        let one_quote = 1 * pow_256(10, 18);
        run_buy_by_amount(launchpad, erc20, memecoin, one_quote, token_address, sender_address,);
        println!("get share user");

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        // let amount_owned = share_user.amount_owned.try_into().unwrap();
        let amount_owned = share_user.amount_owned;
        println!("amount_owned {:?}", amount_owned);
        println!("sell coin {:?}", amount_owned);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned, token_address, sender_address,
        );

        //  All buy
        println!("buy coin coin now {:?}", THRESHOLD_LIQUIDITY);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );
        // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
        //     CreateLaunch {
        //         caller: OWNER(),
        //         token_address: token_address,
        //         amount: 0,
        //         price: initial_key_price,
        //         total_supply: DEFAULT_INITIAL_SUPPLY(),
        //         slope: slope,
        //         threshold_liquidity: THRESHOLD_LIQUIDITY,
        //         quote_token_address: erc20.contract_address,
        //     }
        // );
        // spy.assert_emitted(@array![(launchpad.contract_address, expected_launch_token_event)]);
        let launched_token = launchpad.get_coin_launch(token_address);
        let default_supply = DEFAULT_INITIAL_SUPPLY();
        // assert(launched_token.owner == OWNER(), 'wrong owner');
        assert(launched_token.token_address == token_address, 'wrong token address');
        // assert(launched_token.total_supply == DEFAULT_INITIAL_SUPPLY(), 'wrong initial supply');
        // assert(launched_token.bonding_curve_type == BondingType::Linear, 'wrong type curve');
        // assert(launched_token.liquidity_raised == THRESHOLD_LIQUIDITY, 'wrong liq raised');
        assert(launched_token.initial_pool_supply == default_supply / 5_u256, 'wrong init pool');

        // TODO add percentage of the fees and slippage
        // Few percent of the total token holded
        // assert(
        //     launched_token.total_token_holded >= (default_supply
        //         - launched_token.initial_pool_supply),
        //     'wrong token holded'
        // );
        assert(
            launched_token.token_quote.token_address == erc20.contract_address, 'wrong token quote'
        );
    }

    #[test]
    #[fork("Mainnet")]
    fn launchpad_buy_and_sell_exp() {
        println!("launchpad_buy_and_sell_exp");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let mut spy = spy_events();

        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
                bonding_type: BondingType::Exponential,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        println!("buy coin {:?}", THRESHOLD_LIQUIDITY);

        let one_quote = 1_u256 * pow_256(10, 18);
        run_buy_by_amount(launchpad, erc20, memecoin, one_quote, token_address, sender_address,);
        println!("get share user");
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        // let amount_owned = share_user.amount_owned.try_into().unwrap();
        let amount_owned = share_user.amount_owned;
        println!("amount_owned {:?}", amount_owned);
        println!("sell coin {:?}", amount_owned);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned, token_address, sender_address,
        );

        //  All buy
        println!("buy coin {:?}", THRESHOLD_LIQUIDITY);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );
        // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
        //     CreateLaunch {
        //         caller: OWNER(),
        //         token_address: token_address,
        //         amount: 0,
        //         price: initial_key_price,
        //         total_supply: DEFAULT_INITIAL_SUPPLY(),
        //         slope: slope,
        //         threshold_liquidity: THRESHOLD_LIQUIDITY,
        //         quote_token_address: erc20.contract_address,
        //     }
        // );
        // spy.assert_emitted(@array![(launchpad.contract_address, expected_launch_token_event)]);
        let launched_token = launchpad.get_coin_launch(token_address);
        let default_supply = DEFAULT_INITIAL_SUPPLY();
        // assert(launched_token.owner == OWNER(), 'wrong owner');
        assert(launched_token.token_address == token_address, 'wrong token address');
        assert(launched_token.total_supply == DEFAULT_INITIAL_SUPPLY(), 'wrong initial supply');
        // assert(launched_token.bonding_curve_type == BondingType::Linear, 'wrong type curve');
        // assert(launched_token.liquidity_raised == THRESHOLD_LIQUIDITY, 'wrong liq raised');
        assert(launched_token.initial_pool_supply == default_supply / 5_u256, 'wrong init pool');

        // TODO add percentage of the fees and slippage
        // Few percent of the total token holded
        // assert(
        //     launched_token.total_token_holded >= default_supply
        //         - launched_token.initial_pool_supply,
        //     'wrong token holded'
        // );
        assert(
            launched_token.token_quote.token_address == erc20.contract_address, 'wrong token quote'
        );
    }

    // TODO
    // TEST WITH SEVERAL USER
    #[test]
    #[fork("Mainnet")]
    fn launchpad_many_buyer_buy_and_sell_exp() {
        println!("launchpad_buy_and_sell_exp");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let mut spy = spy_events();

        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
                bonding_type: BondingType::Exponential,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        println!("buy coin {:?}", THRESHOLD_LIQUIDITY);

        let one_quote = 1_u256 * pow_256(10, 18);
        run_buy_by_amount(launchpad, erc20, memecoin, one_quote, token_address, sender_address,);
        println!("get share user");
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        // let amount_owned = share_user.amount_owned.try_into().unwrap();
        let amount_owned = share_user.amount_owned;
        println!("amount_owned {:?}", amount_owned);
        println!("sell coin {:?}", amount_owned);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let alice_address = ALICE();
        run_buy_by_amount(launchpad, erc20, memecoin, one_quote, token_address, alice_address,);

        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned, token_address, sender_address,
        );

        //  All buy
        println!("buy coin {:?}", THRESHOLD_LIQUIDITY);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );
        // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
        //     CreateLaunch {
        //         caller: OWNER(),
        //         token_address: token_address,
        //         amount: 0,
        //         price: initial_key_price,
        //         total_supply: DEFAULT_INITIAL_SUPPLY(),
        //         slope: slope,
        //         threshold_liquidity: THRESHOLD_LIQUIDITY,
        //         quote_token_address: erc20.contract_address,
        //     }
        // );
        // spy.assert_emitted(@array![(launchpad.contract_address, expected_launch_token_event)]);
        let launched_token = launchpad.get_coin_launch(token_address);
        let default_supply = DEFAULT_INITIAL_SUPPLY();
        // assert(launched_token.owner == OWNER(), 'wrong owner');
        assert(launched_token.token_address == token_address, 'wrong token address');
        assert(launched_token.total_supply == DEFAULT_INITIAL_SUPPLY(), 'wrong initial supply');
        // assert(launched_token.bonding_curve_type == BondingType::Linear, 'wrong type curve');
        // assert(launched_token.liquidity_raised == THRESHOLD_LIQUIDITY, 'wrong liq raised');
        assert(launched_token.initial_pool_supply == default_supply / 5_u256, 'wrong init pool');

        // TODO add percentage of the fees and slippage
        // Few percent of the total token holded
        // assert(
        //     launched_token.total_token_holded >= default_supply
        //         - launched_token.initial_pool_supply,
        //     'wrong token holded'
        // );
        assert(
            launched_token.token_quote.token_address == erc20.contract_address, 'wrong token quote'
        );
    }

    #[test]
    #[fork("Mainnet")]
    fn test_launchpad_end_to_end_linear() {
        let (sender_address, erc20, launchpad) = request_fixture();
        let starting_price = THRESHOLD_LIQUIDITY / DEFAULT_INITIAL_SUPPLY();
        let mut spy = spy_events();
        // let mut spy = spy_events(SpyOn::One(launchpad.contract_address));

        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);

        let default_token = launchpad.get_default_token();

        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
        assert(
            default_token.step_increase_linear == STEP_LINEAR_INCREASE, 'no step_increase_linear'
        );
        assert(default_token.is_enable == true, 'not enabled');

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_and_launch_token(
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );

        let memecoin = IERC20Dispatcher { contract_address: token_address };
        // let amount_first_buy = 10_u256;
        let amount_first_buy = 1_u256 * pow_256(10, 18);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        let amount_owned = share_user.amount_owned.try_into().unwrap();
        println!("sell amount owned {:?}", amount_owned);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned, token_address, sender_address,
        );

        // run_sell_by_amount(
        //     launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        // );

        println!("buy threshold liquidity");
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );

        // run_sell_by_amount(
        //     launchpad,
        //     erc20,
        //     memecoin,
        //     THRESHOLD_LIQUIDITY - amount_first_buy,
        //     token_address,
        //     sender_address,
        // );

        let expected_create_token_event = LaunchpadEvent::CreateToken(
            CreateToken {
                caller: sender_address,
                token_address: token_address,
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                total_supply: DEFAULT_INITIAL_SUPPLY(),
                is_unruggable: false,
            }
        );

        // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
        //     CreateLaunch {
        //         caller: OWNER(),
        //         token_address: token_address,
        //         amount: 0,
        //         price: starting_price,
        //         total_supply: DEFAULT_INITIAL_SUPPLY(),
        //         slope: slope,
        //         threshold_liquidity: THRESHOLD_LIQUIDITY,
        //         quote_token_address: erc20.contract_address,
        //         is_unruggable: true
        //     }
        // );

        spy
            .assert_emitted(
                @array![
                    (
                        launchpad.contract_address, expected_create_token_event
                    ), // (launchpad.contract_address, expected_launch_token_event)
                ]
            );
    }

    #[test]
    #[fork("Mainnet")]
    fn test_launchpad_end_to_end_exponential() {
        let (sender_address, erc20, launchpad) = request_fixture();
        let mut spy = spy_events();
        // let mut spy = spy_events(SpyOn::One(launchpad.contract_address));

        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);

        let default_token = launchpad.get_default_token();

        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(
            default_token.step_increase_linear == STEP_LINEAR_INCREASE, 'no step_increase_linear'
        );
        assert(default_token.is_enable == true, 'not enabled');

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_and_launch_token(
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
                bonding_type: BondingType::Exponential,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );

        let memecoin = IERC20Dispatcher { contract_address: token_address };
        // let amount_first_buy = 10_u256;
        let amount_first_buy = 1_u256 * pow_256(10, 18);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        let amount_owned = share_user.amount_owned.try_into().unwrap();
        println!("sell amount owned {:?}", amount_owned);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned, token_address, sender_address,
        );

        println!("buy threshold liquidity less amount first buy");
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        let amount_second_buy = 3_u256 * pow_256(10, 18);

        run_buy_by_amount(
            launchpad,
            erc20,
            memecoin, // THRESHOLD_LIQUIDITY - amount_first_buy,
            // THRESHOLD_LIQUIDITY - amount_first_buy * amount_second_buy,
            amount_second_buy,
            token_address,
            sender_address,
        );
        println!("sell threshold amount owned");
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let share_user_2 = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        let amount_owned_2 = share_user_2.amount_owned.try_into().unwrap();

        run_sell_by_amount(
            launchpad,
            erc20,
            memecoin,
            amount_owned_2, // THRESHOLD_LIQUIDITY - amount_second_buy,
            token_address,
            sender_address,
        );

        println!("buy end_to_end amount total");
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );
        println!("finished buy end_to_end amount total");

        let expected_create_token_event = LaunchpadEvent::CreateToken(
            CreateToken {
                caller: sender_address,
                token_address: token_address,
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                total_supply: DEFAULT_INITIAL_SUPPLY(),
                is_unruggable: false,
            }
        );

        // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
        //     CreateLaunch {
        //         caller: OWNER(),
        //         token_address: token_address,
        //         amount: 0,
        //         price: starting_price,
        //         total_supply: DEFAULT_INITIAL_SUPPLY(),
        //         slope: slope,
        //         threshold_liquidity: THRESHOLD_LIQUIDITY,
        //         quote_token_address: erc20.contract_address,
        //         is_unruggable: true
        //     }
        // );

        spy
            .assert_emitted(
                @array![
                    (
                        launchpad.contract_address, expected_create_token_event
                    ), // (launchpad.contract_address, expected_launch_token_event)
                ]
            );
    }

    fn test_get_init_supplies() -> Array<u256> {
        let init_supplies: Array<u256> = array![
            // 100_u256 + pow_256(10, 18),
            // 1_000_u256 + pow_256(10, 18),
            // 10_000_u256 + pow_256(10, 18),
            100_000_u256 * pow_256(10, 18), // 100k
            1_000_000_u256 * pow_256(10, 18), // 1m
            10_000_000_u256 * pow_256(10, 18), // 10m
            100_000_000_u256 * pow_256(10, 18), // 100m
            1_000_000_000_u256 * pow_256(10, 18), // 1b
            10_000_000_000_u256 * pow_256(10, 18), // 10b
            100_000_000_000_u256 * pow_256(10, 18), // 100b
            1_000_000_000_000_u256 * pow_256(10, 18), // 1t
            // 10_000_000_000_000_u256, // 10t
        // 100_000_000_000_000_u256, // 100t
        // 100_000_000_000_000_000_000_000_000_000_000_u256
        ];

        init_supplies
    }


    #[test]
    #[fork("Mainnet")]
    fn test_buy_coin_with_different_supply() {
        let (sender, erc20, launchpad) = request_fixture();
        let quote_token = IERC20Dispatcher { contract_address: erc20.contract_address };

        let mut token_addresses: Array<ContractAddress> = array![];
        let init_supplies = test_get_init_supplies();

        let mut i = 0;

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        while i < init_supplies.len() {
            println!(
                "init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );
            // println!("i {:?}", i.clone());

            let token_address = launchpad
                .create_and_launch_token(
                    symbol: SYMBOL(),
                    name: NAME(),
                    initial_supply: *init_supplies.at(i),
                    contract_address_salt: SALT(),
                    is_unruggable: false,
                    bonding_type: BondingType::Linear,
                    creator_fee_percent: MID_FEE_CREATOR,
                    creator_fee_destination: RECEIVER_ADDRESS()
                );

            token_addresses.append(token_address);

            let memecoin = IERC20Dispatcher { contract_address: token_address };

            // println!("buy threshold liquidity");
            run_buy_by_amount(
                launchpad, quote_token, memecoin, THRESHOLD_LIQUIDITY, token_address, OWNER(),
            );
            let balance_quote_launch = quote_token.balance_of(launchpad.contract_address);
            // println!("balance quote in loop {:?}", balance_quote_launch);
            println!(
                "latest init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );

            i += 1;
        };
        // start_cheat_caller_address(launchpad.contract_address, OWNER());

    }
}
