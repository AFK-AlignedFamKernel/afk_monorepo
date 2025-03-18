mod edge_cases_tests {
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
    use afk_launchpad::mocks::router_lite::{IRouterLiteDispatcher, IRouterLiteDispatcherTrait, RouteNode , TokenAmount};
    use afk_launchpad::launchpad::math::{PercentageMath};
    use afk_launchpad::launchpad::utils::{
        sort_tokens, get_initial_tick_from_starting_price, get_next_tick_bounds, unique_count,
        calculate_aligned_bound_mag, align_tick, MIN_TICK, MAX_TICK, MAX_SQRT_RATIO, MIN_SQRT_RATIO, MAX_TICK_U128, MIN_TICK_U128,
        align_tick_with_max_tick_and_min_tick, calculate_bound_mag, calculate_sqrt_ratio
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
    use afk_launchpad::utils::{sqrt};
    use core::num::traits::Zero;
    use core::starknet::SyscallResultTrait;
    use core::traits::Into;
    use ekubo::interfaces::core::{ICoreDispatcher, ICoreDispatcherTrait};
    use ekubo::interfaces::positions::{IPositionsDispatcher, IPositionsDispatcherTrait, GetTokenInfoResult};
    use ekubo::interfaces::token_registry::{
        ITokenRegistryDispatcher, ITokenRegistryDispatcherTrait,
    };

    use ekubo::types::i129::i129;
    use ekubo::types::keys::PoolKey;
    use ekubo::types::bounds::{Bounds};
    use ekubo::types::delta::{Delta};
    use openzeppelin::utils::serde::SerializedAppend;
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, start_cheat_caller_address,
        start_cheat_caller_address_global, stop_cheat_caller_address,
        stop_cheat_caller_address_global, start_cheat_block_timestamp, DeclareResultTrait,
        EventSpyAssertionsTrait
    };

    use starknet::syscalls::{call_contract_syscall, library_call_syscall};
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
    fn DEFAULT_10K_SUPPLY() -> u256 {
        10_000_u256 * pow_256(10, 18)
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
    // const THRESHOLD_LIQUIDITY: u256 = 10_000_000_000_000_000_000_u256; // 10 = ETH quote
    // const THRESHOLD_LIQUIDITY: u256 = 1_000_000_000_000_000_000_000_u256; // 1000 for first
    const THRESHOLD_LIQUIDITY: u256 = 1_000_000_000_000_000_000_000_u256; // 2000 for
    // const THRESHOLD_LIQUIDITY: u256 = 10_000_000_000_000_000_000_000_u256; // 10 000 for
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
    fn request_fixture() -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher, IRouterLiteDispatcher) {
        let erc20_class = declare_erc20();
        let meme_class = declare_memecoin();
        let unrug_class = declare_unrug_liquidity();
        let launch_class = declare_launchpad();
        let router_class = declare_router();
        request_fixture_custom_classes(*erc20_class, *meme_class, *launch_class, *unrug_class, *router_class)
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass,
        meme_class: ContractClass,
        launch_class: ContractClass,
        unrug_class: ContractClass,
        router_class: ContractClass,
    ) -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher, IRouterLiteDispatcher) {
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
            unrug_liquidity.contract_address,
        );
        let router = deploy_router(router_class, EKUBO_CORE());
        start_cheat_caller_address(launchpad.contract_address, OWNER());
        (sender_address, erc20, launchpad, router)
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

    fn declare_router() -> @ContractClass {
        declare("RouterLite").unwrap().contract_class()
    }

    fn deploy_router(class: ContractClass, ekubo_core: ContractAddress) -> IRouterLiteDispatcher{
        let mut calldata = array![];
        Serde::serialize(@ekubo_core, ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        IRouterLiteDispatcher { contract_address }
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

        let total_supply = memecoin.total_supply();
        erc20.approve(launchpad.contract_address, amount_quote * 2);
        // memecoin.approve(launchpad.contract_address, total_supply);
        // erc20.approve(launchpad.contract_address, total_supply);
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
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("sell coin for amount quote{:?}", amount_quote);
        launchpad.sell_coin(token_address, amount_quote);
    }

    fn perform_swap(router: IRouterLiteDispatcher,
        erc20: IERC20Dispatcher,
        memecoin: IERC20Dispatcher,
        amount_quote: u256,
        sender_address: ContractAddress){

        let fee_percent = 0xc49ba5e353f7d00000000000000000;
        let tick_spacing = 60_u128;
        
        let (token0, token1) = sort_tokens(memecoin.contract_address, erc20.contract_address); 

        let pool_key = PoolKey {
            token0: token0,
            token1: token1,
            tick_spacing: tick_spacing,
            fee: fee_percent,
            extension: 0.try_into().unwrap(),   
        };

        let router_node =  RouteNode{
            pool_key: pool_key,
            sqrt_ratio_limit: MIN_SQRT_RATIO, // We can ignore slippage in testing, as our router is just a mock
            skip_ahead: 0,
        };
        let amount_u128 : u128 = amount_quote.try_into().unwrap();
        let token_amount = TokenAmount {
            token: erc20.contract_address, // I understand we want to sell ERC20 tok
            amount: i129 {mag: amount_u128, sign: false}, // sign false as we are supplying this token
        };

        start_cheat_caller_address(erc20.contract_address, sender_address);
        erc20.transfer(router.contract_address, amount_quote);
        stop_cheat_caller_address(erc20.contract_address);

        // Tokens will remain in router but it is enough for this test
        let delta: Delta = router.swap(router_node, token_amount);
        println!("delta.amount0.mag {}", delta.amount0.mag);
        println!("delta.amount0.sign {}", delta.amount0.sign);
        println!("delta.amount1.mag {}", delta.amount1.mag);
        println!("delta.amount1.sign {}", delta.amount1.sign); 

        let memecoin_balance = memecoin.balance_of(router.contract_address);
        // assert(memecoin_balance == delta.amount1.mag, 'Wrong After swap balance');
        

    }


    #[test]
    #[fork("Mainnet")]
    fn triggering_token1(){
        let erc20_class = declare_erc20();
        let meme_class = declare_memecoin();
        let unrug_class = declare_unrug_liquidity();
        let launch_class = declare_launchpad();

        let sender_address: ContractAddress = 123.try_into().unwrap();
        let erc20 = deploy_erc20(
            *erc20_class,
            'USDC token',
            'USDC',
            1_000_000_000_000_000_000 * pow_256(10, 18),
            sender_address
        );
        let token_address = erc20.contract_address.clone();

        let unrug_liquidity = deploy_unrug_liquidity(
            *unrug_class,
            sender_address,
            token_address.clone(),
            INITIAL_KEY_PRICE,
            STEP_LINEAR_INCREASE,
            *meme_class.class_hash,
            THRESHOLD_LIQUIDITY,
            THRESHOLD_MARKET_CAP,
            FACTORY_ADDRESS(),
            EKUBO_REGISTRY(),
            EKUBO_CORE(),
            EKUBO_POSITIONS(),
            EKUBO_EXCHANGE_ADDRESS()
        );

        let launchpad = deploy_launchpad(
            *launch_class,
            sender_address,
            token_address.clone(),
            INITIAL_KEY_PRICE,
            STEP_LINEAR_INCREASE,
            *meme_class.class_hash,
            THRESHOLD_LIQUIDITY,
            THRESHOLD_MARKET_CAP,
            unrug_liquidity.contract_address,
        );

        let memecoin_address = launchpad
        .create_token(
            recipient: OWNER(),
            // owner: OWNER(),
            symbol: SYMBOL(),
            name: NAME(),
            initial_supply: DEFAULT_10K_SUPPLY(),
            contract_address_salt: SALT(),
            is_unruggable: false,
        );
          
        let memecoin_address2 = launchpad // This address is smaller than memecoin_address this will be the memecoin we will buy
        .create_token(
            recipient: OWNER(),
            // owner: OWNER(),
            symbol: SYMBOL(),
            name: NAME(),
            initial_supply: DEFAULT_100_T_SUPPLY(),
            contract_address_salt: 0,
            is_unruggable: false,
        );
        assert(memecoin_address2 > memecoin_address, 'wrong memecoin address');
        start_cheat_caller_address(launchpad.contract_address, OWNER());
        let default_token = TokenQuoteBuyCoin {
            token_address: memecoin_address2,
            starting_price: INITIAL_KEY_PRICE,
            price: INITIAL_KEY_PRICE,
            is_enable: true,
            step_increase_linear: STEP_LINEAR_INCREASE,
        };
        launchpad.set_default_token(default_token);
        launchpad.set_threshold_liquidity(THRESHOLD_LIQUIDITY);
        stop_cheat_caller_address(launchpad.contract_address);

        let our_memecoin = IERC20Dispatcher { contract_address: memecoin_address };
        start_cheat_caller_address(our_memecoin.contract_address, OWNER());
        let total_supply = our_memecoin.total_supply();
        our_memecoin.transfer(launchpad.contract_address, total_supply);
        stop_cheat_caller_address(our_memecoin.contract_address);

        launchpad
        .launch_token(
            our_memecoin.contract_address,
            bonding_type: BondingType::Linear,
            creator_fee_percent: MID_FEE_CREATOR,
            creator_fee_destination: RECEIVER_ADDRESS()
        );

        let quote_token = IERC20Dispatcher { contract_address: memecoin_address2 };
        let total_supply_quote = quote_token.total_supply();
        start_cheat_caller_address(quote_token.contract_address, OWNER());
        quote_token.approve(launchpad.contract_address, total_supply_quote);
        stop_cheat_caller_address(quote_token.contract_address);

        run_buy_by_amount(
            launchpad,
            quote_token,
            our_memecoin,
            THRESHOLD_LIQUIDITY,
            our_memecoin.contract_address,
            OWNER()
        );

        test_ekubo_lp(our_memecoin.contract_address, quote_token.contract_address, launchpad, 0);
    }
    // TODO
    // TEST WITH SEVERAL USER
    // #[test]
    // #[fork("Mainnet")]
    // fn launchpad_many_buyer_buy_and_sell_exp() {
    //     println!("launchpad_buy_and_sell_exp");
    //     let (sender_address, erc20, launchpad) = request_fixture();
    //     // start_cheat_caller_address_global(sender_address);
    //     start_cheat_caller_address(erc20.contract_address, sender_address);
    //     let mut spy = spy_events();

    //     // Call a view function of the contract
    //     // Check default token used
    //     let default_token = launchpad.get_default_token();
    //     assert(default_token.token_address == erc20.contract_address, 'no default token');
    //     start_cheat_caller_address(launchpad.contract_address, sender_address);
    //     println!("create and launch token");
    //     let token_address = launchpad
    //         .create_and_launch_token(
    //             // owner: OWNER(),
    //             symbol: SYMBOL(),
    //             name: NAME(),
    //             initial_supply: DEFAULT_INITIAL_SUPPLY(),
    //             contract_address_salt: SALT(),
    //             is_unruggable: false,
    //             bonding_type: BondingType::Exponential,
    //             creator_fee_percent: MID_FEE_CREATOR,
    //             creator_fee_destination: RECEIVER_ADDRESS()
    //         );
    //     println!("test token_address {:?}", token_address);
    //     let memecoin = IERC20Dispatcher { contract_address: token_address };
    //     println!("buy coin {:?}", THRESHOLD_LIQUIDITY);
    //     start_cheat_caller_address(launchpad.contract_address, sender_address);

    //     let one_quote = 1_u256 * pow_256(10, 18);
    //     run_buy_by_amount(launchpad, erc20, memecoin, one_quote, token_address, sender_address,);
    //     println!("get share user");

    //     let share_user = launchpad
    //         .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

    //     // let amount_owned = share_user.amount_owned.try_into().unwrap();
    //     let amount_owned = share_user.amount_owned;
    //     println!("amount_owned {:?}", amount_owned);
    //     println!("sell coin {:?}", amount_owned);
    //     start_cheat_caller_address(launchpad.contract_address, sender_address);

    //     let alice_address = ALICE();

    //     println!("transfer erc20 to alice");
    //     erc20.transfer(alice_address, 100_u256 * pow_256(10, 18));
    //     println!("alice balance {:?}", erc20.balance_of(alice_address));
    //     run_buy_by_amount(launchpad, erc20, memecoin, one_quote, token_address, alice_address,);

    //     run_sell_by_amount(
    //         launchpad, erc20, memecoin, amount_owned, token_address, sender_address,
    //     );

    //     //  All buy
    //     println!("buy coin {:?}", THRESHOLD_LIQUIDITY);

    //     run_buy_by_amount(
    //         launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
    //     );
    //     // let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
    //     //     CreateLaunch {
    //     //         caller: OWNER(),
    //     //         token_address: token_address,
    //     //         amount: 0,
    //     //         price: initial_key_price,
    //     //         total_supply: DEFAULT_INITIAL_SUPPLY(),
    //     //         slope: slope,
    //     //         threshold_liquidity: THRESHOLD_LIQUIDITY,
    //     //         quote_token_address: erc20.contract_address,
    //     //     }
    //     // );
    //     // spy.assert_emitted(@array![(launchpad.contract_address,
    //     expected_launch_token_event)]);
    //     let launched_token = launchpad.get_coin_launch(token_address);
    //     let default_supply = DEFAULT_INITIAL_SUPPLY();
    //     // assert(launched_token.owner == OWNER(), 'wrong owner');
    //     assert(launched_token.token_address == token_address, 'wrong token address');
    //     assert(launched_token.total_supply == DEFAULT_INITIAL_SUPPLY(), 'wrong initial supply');
    //     // assert(launched_token.bonding_curve_type == BondingType::Linear, 'wrong type curve');
    //     // assert(launched_token.liquidity_raised == THRESHOLD_LIQUIDITY, 'wrong liq raised');
    //     assert(launched_token.initial_pool_supply == default_supply / 5_u256, 'wrong init pool');

    //     // TODO add percentage of the fees and slippage
    //     // Few percent of the total token holded
    //     // assert(
    //     //     launched_token.total_token_holded >= default_supply
    //     //         - launched_token.initial_pool_supply,
    //     //     'wrong token holded'
    //     // );
    //     assert(
    //         launched_token.token_quote.token_address == erc20.contract_address, 'wrong token
    //         quote'
    //     );
    // }


    // Verify all supply edge cases possible for total supply of a token
    // Can variate with the threshold liquidity selected
    // Check the range between both liq_raised, init_pool_supply that is 20% of the total_supply of
    // the token
    fn test_get_init_supplies() -> Array<u256> {
        let init_supplies: Array<u256> = array![
            // EDGE CASES TO CHECK
            // (THRESHOLD_LIQUIDITY ), // BREAKING = same supply as threshold liquidity
            // (THRESHOLD_LIQUIDITY * 2_u256), // BREAKING = double times the supply
            (THRESHOLD_LIQUIDITY
                * 10_u256), // 10 times the threshold_liquidity = can init_pool_supply be alsways above
            (THRESHOLD_LIQUIDITY
                * 100_u256), // 100 times the threshold_liquidity = can init_pool_supply be alsways above
            100_000_u256 * pow_256(10, 18), // 100k
            // 1_000_000_u256 * pow_256(10, 18), // 1m
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
    // Assert balance
    // Check LP on Ekubo
    // Default Params Ekubo launch
    fn test_ekubo_lp(
        token_address: ContractAddress,
        quote_address: ContractAddress,
        launchpad: ILaunchpadMarketplaceDispatcher,
        supply: u256,
    ) {
        // let (sender, erc20, launchpad) = request_fixture();

        let quote_token = IERC20Dispatcher { contract_address: quote_address };
        let memecoin = IERC20Dispatcher { contract_address: token_address };

        // Default Params Ekubo launch
        // Refactoring and use utils helpers
        let fee_percent = 0xc49ba5e353f7d00000000000000000;

        let tick_spacing = 60_u128;

        let (token0, token1) = sort_tokens(token_address, quote_token.contract_address.clone());

        let fee = fee_percent.try_into().unwrap();

        let pool_key = PoolKey {
            token0: token0.clone(),
            token1: token1.clone(),
            fee: fee.clone(),
            tick_spacing: tick_spacing.try_into().unwrap(),
            extension: 0.try_into().unwrap(),
        };

        let core = ICoreDispatcher { contract_address: EKUBO_CORE() };
        let liquidity = core.get_pool_liquidity(pool_key);
        let position_dispatcher = IPositionsDispatcher { contract_address: EKUBO_POSITIONS() };
        let price = core.get_pool_price(pool_key);

        let pool_price = position_dispatcher.get_pool_price(pool_key);


        // This implementation give us different values from the core
        println!("pool_price tick mag {:?}", pool_price.tick.mag);
        println!("pool_price tick sign {:?}", pool_price.tick.sign);
        println!("pool_price sqrt_ratio {:?}", pool_price.sqrt_ratio);

        println!("edge test cases ekubo");
        println!("price tick mag {:?}", price.tick.mag);
        println!("price tick sign {:?}", price.tick.sign);
        println!("price sqrt_ratio {:?}", price.sqrt_ratio);

    
        let min_tick: u128 = MIN_TICK_U128;
        let max_tick: u128 = MAX_TICK_U128;

        let aligned_min_tick = align_tick_with_max_tick_and_min_tick(min_tick, tick_spacing);
        let aligned_max_tick = align_tick_with_max_tick_and_min_tick(max_tick, tick_spacing);
        let mut full_range_bounds = Bounds {
            lower: i129 { mag: aligned_min_tick, sign: true },
            upper: i129 { mag: aligned_max_tick, sign: false }
        };
        let initial_position :  GetTokenInfoResult = position_dispatcher.get_token_info(697963, pool_key, full_range_bounds);
        println!("Amount0 {:?}", initial_position.amount0);
        println!("Amount1 {:?}", initial_position.amount1);
        let position_price = initial_position.pool_price;
        assert(position_price.sqrt_ratio == pool_price.sqrt_ratio, 'wrong sqrt ratio');
        assert(position_price.tick.mag == pool_price.tick.mag, 'wrong tick');
        assert(position_price.tick.sign == pool_price.tick.sign, 'wrong sign');
        assert(initial_position.liquidity == liquidity, 'wrong liquidity');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_one_position_with_swap() {
        println!("test_buy_coin_with_different_supply_linear");
        let (sender, erc20, launchpad, router) = request_fixture();
        let quote_token = IERC20Dispatcher { contract_address: erc20.contract_address };

        let mut token_addresses: Array<ContractAddress> = array![];
        println!("get supplies to test");
        let init_supplies = test_get_init_supplies();

        let mut i = 0;

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        while i < 1 {
            println!(
                "linear init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );
            // println!("i {:?}", i.clone());

            // let total_supply:u256 = *init_supplies.at(i);
            let token_address = launchpad
                .create_and_launch_token(
                    symbol: SYMBOL(),
                    name: NAME(),
                    initial_supply: *init_supplies.at(i),
                    // contract_address_salt: SALT(),
                    contract_address_salt: i
                        .try_into()
                        .unwrap(), // find way to predine below quote token
                    // contract_address_salt: (i.try_into().unwrap() / pow_256(10,
                    // 18)).try_into().unwrap(),
                    is_unruggable: false,
                    bonding_type: BondingType::Linear,
                    creator_fee_percent: MID_FEE_CREATOR,
                    creator_fee_destination: RECEIVER_ADDRESS()
                );

            token_addresses.append(token_address.clone());

            let memecoin = IERC20Dispatcher { contract_address: token_address };

            // println!("buy threshold liquidity");
            // println!("buy threshold liquidity {:?}", THRESHOLD_LIQUIDITY/2_u256);
            run_buy_by_amount(
                launchpad,
                quote_token,
                memecoin,
                THRESHOLD_LIQUIDITY / 2_u256,
                token_address,
                OWNER(),
            );
            // let balance_quote_launch = quote_token.balance_of(launchpad.contract_address);

            // // Sell
            let share_user = launchpad
                .get_share_of_user_by_contract(sender.clone(), token_address.clone());

            let amount_owned = share_user.amount_owned.try_into().unwrap();
            // let amount_owned = share_user.amount_owned;
            println!("amount_owned {:?}", amount_owned.clone());

            start_cheat_caller_address(launchpad.contract_address, sender.clone());
            run_sell_by_amount(
                launchpad, quote_token, memecoin, amount_owned, token_address, sender.clone(),
            );

            // println!("balance quote in loop {:?}", balance_quote_launch);

            // Last buy before launch

            let mut liquidity_raised = launchpad.get_coin_launch(token_address).liquidity_raised;
            println!("liquidity_raised before last {:?}", liquidity_raised);

            let remain_liquidity = THRESHOLD_LIQUIDITY - liquidity_raised;

            println!("remain_liquidity {:?}", remain_liquidity);

            println!("BUY last remain_liquidity {:?}", remain_liquidity);

            run_buy_by_amount(
                launchpad, quote_token, memecoin, remain_liquidity, token_address, OWNER(),
            );
            println!(
                "linear check LP init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );

            liquidity_raised = launchpad.get_coin_launch(token_address).liquidity_raised;
            println!("liquidity_raised {:?}", liquidity_raised);

            println!("test_ekubo_lp");

            // test_ekubo_lp(token_address, erc20.contract_address, *init_supplies.at(i));
            test_ekubo_lp(token_address, erc20.contract_address, launchpad, *init_supplies.at(i));

            println!("test_ekubo_lp_end");

            println!(
                "linear latest init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );
            i += 1;
            
            perform_swap(router, erc20, memecoin, 10_u256 * pow_256(10, 18), OWNER());
        };
        // start_cheat_caller_address(launchpad.contract_address, OWNER());

    }

    #[test]
    #[fork("Mainnet")]
    fn test_end_linear_with_different_supply() {
        println!("test_buy_coin_with_different_supply_linear");
        let (sender, erc20, launchpad, router) = request_fixture();
        let quote_token = IERC20Dispatcher { contract_address: erc20.contract_address };

        let mut token_addresses: Array<ContractAddress> = array![];
        println!("get supplies to test");
        let init_supplies = test_get_init_supplies();

        let mut i = 0;

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        while i < init_supplies.len() {
            println!(
                "linear init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );
            // println!("i {:?}", i.clone());

            // let total_supply:u256 = *init_supplies.at(i);
            let token_address = launchpad
                .create_and_launch_token(
                    symbol: SYMBOL(),
                    name: NAME(),
                    initial_supply: *init_supplies.at(i),
                    // contract_address_salt: SALT(),
                    contract_address_salt: i
                        .try_into()
                        .unwrap(), // find way to predine below quote token
                    // contract_address_salt: (i.try_into().unwrap() / pow_256(10,
                    // 18)).try_into().unwrap(),
                    is_unruggable: false,
                    bonding_type: BondingType::Linear,
                    creator_fee_percent: MID_FEE_CREATOR,
                    creator_fee_destination: RECEIVER_ADDRESS()
                );

            token_addresses.append(token_address.clone());

            let memecoin = IERC20Dispatcher { contract_address: token_address };

            // println!("buy threshold liquidity");
            // println!("buy threshold liquidity {:?}", THRESHOLD_LIQUIDITY/2_u256);
            run_buy_by_amount(
                launchpad,
                quote_token,
                memecoin,
                THRESHOLD_LIQUIDITY / 2_u256,
                token_address,
                OWNER(),
            );
            // let balance_quote_launch = quote_token.balance_of(launchpad.contract_address);

            // // Sell
            let share_user = launchpad
                .get_share_of_user_by_contract(sender.clone(), token_address.clone());

            let amount_owned = share_user.amount_owned.try_into().unwrap();
            // let amount_owned = share_user.amount_owned;
            println!("amount_owned {:?}", amount_owned.clone());

            start_cheat_caller_address(launchpad.contract_address, sender.clone());
            run_sell_by_amount(
                launchpad, quote_token, memecoin, amount_owned, token_address, sender.clone(),
            );

            // println!("balance quote in loop {:?}", balance_quote_launch);

            // Last buy before launch

            let mut liquidity_raised = launchpad.get_coin_launch(token_address).liquidity_raised;
            println!("liquidity_raised before last {:?}", liquidity_raised);

            let remain_liquidity = THRESHOLD_LIQUIDITY - liquidity_raised;

            println!("remain_liquidity {:?}", remain_liquidity);

            println!("BUY last remain_liquidity {:?}", remain_liquidity);

            run_buy_by_amount(
                launchpad, quote_token, memecoin, remain_liquidity, token_address, OWNER(),
            );
            println!(
                "linear check LP init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );

            liquidity_raised = launchpad.get_coin_launch(token_address).liquidity_raised;
            println!("liquidity_raised {:?}", liquidity_raised);

            println!("test_ekubo_lp");

            // test_ekubo_lp(token_address, erc20.contract_address, *init_supplies.at(i));
            test_ekubo_lp(token_address, erc20.contract_address, launchpad, *init_supplies.at(i));

            println!("test_ekubo_lp_end");

            println!(
                "linear latest init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );
            i += 1;

        };
        // start_cheat_caller_address(launchpad.contract_address, OWNER());

    }

    #[test]
    #[fork("Mainnet")]
    fn test_end_exp_with_different_supply() {
        println!("test_buy_coin_with_different_supply_exp");
        let (sender, erc20, launchpad, router) = request_fixture();
        let quote_token = IERC20Dispatcher { contract_address: erc20.contract_address };
        let mut token_addresses: Array<ContractAddress> = array![];
        let init_supplies = test_get_init_supplies();

        let mut i = 0;

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        while i < init_supplies.len() {
            println!(
                "exp init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );
            // println!("i {:?}", i.clone());

            let token_address = launchpad
                .create_and_launch_token(
                    symbol: SYMBOL(),
                    name: NAME(),
                    initial_supply: *init_supplies.at(i),
                    // contract_address_salt: SALT(),
                    contract_address_salt: i.try_into().unwrap(),
                    is_unruggable: false,
                    bonding_type: BondingType::Exponential,
                    creator_fee_percent: MID_FEE_CREATOR,
                    creator_fee_destination: RECEIVER_ADDRESS()
                );

            token_addresses.append(token_address);

            let memecoin = IERC20Dispatcher { contract_address: token_address };

            // println!("buy threshold liquidity");
            // run_buy_by_amount(
            //     launchpad, quote_token, memecoin, THRESHOLD_LIQUIDITY, token_address, OWNER(),
            // );
            run_buy_by_amount(
                launchpad,
                quote_token,
                memecoin,
                THRESHOLD_LIQUIDITY / 2_u256,
                token_address,
                OWNER(),
            );

            let balance_quote_launch = quote_token.balance_of(launchpad.contract_address);

            // // Sell
            let share_user = launchpad
                .get_share_of_user_by_contract(sender.clone(), token_address.clone());

            let amount_owned = share_user.amount_owned.try_into().unwrap();
            // let amount_owned = share_user.amount_owned;
            println!("amount_owned {:?}", amount_owned.clone());

            start_cheat_caller_address(launchpad.contract_address, sender.clone());
            run_sell_by_amount(
                launchpad, quote_token, memecoin, amount_owned, token_address, sender.clone(),
            );

            let mut liquidity_raised = launchpad.get_coin_launch(token_address).liquidity_raised;
            println!("liquidity_raised before last {:?}", liquidity_raised);

            let remain_liquidity = THRESHOLD_LIQUIDITY - liquidity_raised;

            println!("remain_liquidity {:?}", remain_liquidity);

            println!("BUY last remain_liquidity {:?}", remain_liquidity);

            run_buy_by_amount(
                launchpad, quote_token, memecoin, remain_liquidity, token_address, OWNER(),
            );
            // println!("balance quote in loop {:?}", balance_quote_launch);
            println!(
                "exp latest init_supply in loop test_buy_coin_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );

            println!("exp test_ekubo_lp");

            // test_ekubo_lp(token_address, erc20.contract_address, *init_supplies.at(i));
            test_ekubo_lp(token_address, erc20.contract_address, launchpad, *init_supplies.at(i));

            println!("exp test_ekubo_lp_end");

            i += 1;
        };
        // start_cheat_caller_address(launchpad.contract_address, OWNER());

    }
}
