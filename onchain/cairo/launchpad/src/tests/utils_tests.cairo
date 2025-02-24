mod utils_tests {
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
    use afk_launchpad::launchpad::launchpad::LaunchpadMarketplace::{Event as LaunchpadEvent};
    use afk_launchpad::launchpad::math::{PercentageMath};
    use afk_launchpad::launchpad::utils::{
        get_coin_amount, get_coin_amount_by_quote_amount, get_coin_amount_by_quote_amount_with_fees,
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


    fn DEFAULT_INITIAL_SUPPLY() -> u256 {
        // 100_u256 * pow_256(10, 18)
        1_000_000_000_u256 * pow_256(10, 18)
    }


    fn EKUBO_CORE() -> ContractAddress {
        0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b.try_into().unwrap()
    }

    fn EKUBO_POSITIONS() -> ContractAddress {
        0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067.try_into().unwrap()
    }

    fn EKUBO_REGISTRY() -> ContractAddress {
        0x0013e25867b6eef62703735aa4cfa7754e72f4e94a56c9d3d9ad8ebe86cee4aa.try_into().unwrap()
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


    fn verify_position(
        core: ICoreDispatcher,
        positions: IPositionsDispatcher,
        token_address: ContractAddress,
        sender_address: ContractAddress,
    ) {
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        // Default Params Ekubo launch
        let fee_percent = 0xc49ba5e353f7d00000000000000000;

        let tick_spacing = 5928;
        // let bound_spacing = tick_spacing * 2;
        let bound_spacing = 88719042;

        let fee = fee_percent.try_into().unwrap();
        let (token0, token1) = sort_tokens(token_address, erc20.contract_address.clone());
        let is_token1_quote = erc20.contract_address == token1;

        let TOTAL_SUPPLY = memecoin.total_supply();

        let INITIAL_POOL_SUPPLY = TOTAL_SUPPLY / LIQUIDITY_RATIO;
        let starting_price = calculate_starting_price_launch(
            INITIAL_POOL_SUPPLY.clone(), THRESHOLD_LIQUIDITY.clone()
        );

        let mut x_y = if is_token1_quote {
            // (launch.liquidity_raised ) / launch.initial_pool_supply
            (THRESHOLD_LIQUIDITY * pow_256(10, 18)) / INITIAL_POOL_SUPPLY
        } else {
            (INITIAL_POOL_SUPPLY) / THRESHOLD_LIQUIDITY
        };

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

        let pool_key = PoolKey {
            token0: token_address.clone(),
            token1: erc20.contract_address.clone(),
            fee: fee.try_into().unwrap().clone(),
            tick_spacing: tick_spacing.try_into().unwrap(),
            extension: 0.try_into().unwrap(),
        };

        let quote_address = erc20.contract_address.clone();
        let core = ICoreDispatcher { contract_address: EKUBO_CORE() };
        let liquidity = core.get_pool_liquidity(pool_key);
        let position_dispatcher = IPositionsDispatcher { contract_address: EKUBO_POSITIONS() };
        let price = core.get_pool_price(pool_key);
        let pool_price = position_dispatcher.get_pool_price(pool_key);
        let reserve_memecoin = memecoin.balance_of(core.contract_address);
        let reserve_quote = IERC20Dispatcher { contract_address: quote_address }
            .balance_of(core.contract_address);

        let total_supply = memecoin.total_supply();
        let lp_meme_supply = total_supply / LIQUIDITY_RATIO;
        // let total_token_holded: u256 = total_supply / LIQUIDITY_RATIO;
        println!("lp_meme_supply {:?}", lp_meme_supply);
        println!(
            "sqrt_ratio {:?}", pool_price.sqrt_ratio
        ); // 340282366920938463463374607431768211456
        println!("tick {:?}", pool_price.tick); // { mag: 0, sign: false } strange

        assert(lp_meme_supply == INITIAL_POOL_SUPPLY, 'wrong initial pool supply');
        assert(pool_price.sqrt_ratio == sqrt_ratio, 'wrong sqrt ratio');
        assert(pool_price.tick == initial_tick, 'wrong tick');
    }
}
