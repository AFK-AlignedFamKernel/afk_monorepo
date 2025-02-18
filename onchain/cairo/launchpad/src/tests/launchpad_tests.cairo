#[cfg(test)]
mod launchpad_tests {
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
    use afk_launchpad::tokens::erc20::{IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk_launchpad::tokens::memecoin::{IMemecoin, IMemecoinDispatcher, IMemecoinDispatcherTrait};
    use afk_launchpad::types::launchpad_types::{
        CreateToken, TokenQuoteBuyCoin, BondingType,
        CreateLaunch, // SetJediswapNFTRouterV2,SetJediswapV2Factory,
         SupportedExchanges, EkuboLP,
        EkuboPoolParameters, TokenLaunch, EkuboLaunchParameters, LaunchParameters, SharesTokenUser,
        EkuboUnrugLaunchParameters
    };
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

    fn run_calculation(
        launchpad: ILaunchpadMarketplaceDispatcher,
        amount_quote: u256,
        token_address: ContractAddress,
        sender_address: ContractAddress,
        is_decreased: bool,
        is_quote_amount: bool
    ) -> u256 {
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("calcul amount");
        let amount = launchpad
            .get_amount_by_type_of_coin_or_quote(
                token_address, amount_quote, is_decreased, is_quote_amount
            );
        println!("amount to receive {:?}", amount);
        amount
    }

    fn calculate_slope(total_supply: u256) -> u256 {
        let liquidity_supply = total_supply / LIQUIDITY_RATIO;
        let liquidity_available = total_supply - liquidity_supply;
        let slope = (2 * THRESHOLD_LIQUIDITY) / (liquidity_available * (liquidity_available - 1));
        slope
    }

    #[test]
    #[fork("Mainnet")]
    fn launchpad_buy_all() {
        println!("launchpad_buy_all");
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

        //  All buy
        // run_buy_by_amount(
        //     launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        // );
        println!("first buy {:?}", token_address);
        let memecoin_balance_sender = memecoin.balance_of(sender_address);
        println!("memecoin_balance_sender {:?}", memecoin_balance_sender);
        // global_cheat_caller_address(sender_address);

        let contract_meme_balance = memecoin.balance_of(launchpad.contract_address);
        println!("contract_meme_balance {:?}", contract_meme_balance);

        let contract_quote_balance = erc20.balance_of(launchpad.contract_address);
        println!("contract_quote_balance {:?}", contract_quote_balance);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );

        let contract_meme_balance_after_buy = memecoin.balance_of(launchpad.contract_address);
        println!("contract_meme_balance_after_buy {:?}", contract_meme_balance_after_buy);

        let contract_quote_balance_after_buy = erc20.balance_of(launchpad.contract_address);
        println!("contract_quote_balance_after_buy {:?}", contract_quote_balance_after_buy);

        // Verify memecoin balance are sent to the unrug and liquidity
        assert(contract_meme_balance_after_buy < contract_meme_balance, 'wrong meme balance');
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
        let starting_price = calculate_starting_price_launch(
            initial_pool_supply.clone(), THRESHOLD_LIQUIDITY.clone()
        );
        // Default Params Ekubo launch
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
    fn launchpad_buy_all_exp_curve() {
        println!("launchpad_buy_all_exp_curve");
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

        //  All buy
        // run_buy_by_amount(
        //     launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        // );
        println!("first buy {:?}", token_address);
        // global_cheat_caller_address(sender_address);

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );

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
    fn launchpad_end_to_end() {
        println!("launchpad_end_to_end");
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

    #[test]
    #[should_panic]
    fn multi_launch_token_panic() {
        println!("multi_launch_token_panic");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_token(
                recipient: OWNER(),
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
            );
        // println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        start_cheat_caller_address(memecoin.contract_address, OWNER());

        let balance_contract = memecoin.balance_of(launchpad.contract_address);
        println!("test balance_contract {:?}", balance_contract);

        let total_supply = memecoin.total_supply();
        // println!(" memecoin total_supply {:?}", total_supply);
        memecoin.approve(launchpad.contract_address, total_supply);

        // let allowance = memecoin.allowance(sender_address, launchpad.contract_address);
        // println!("test allowance meme coin{}", allowance);
        // memecoin.transfer(launchpad.contract_address, total_supply);
        stop_cheat_caller_address(memecoin.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.launch_token(token_address, bonding_type: BondingType::Linear, creator_fee_percent: MID_FEE_CREATOR, creator_fee_destination: RECEIVER_ADDRESS());
        let amount_first_buy = 1_u256;

        launchpad.launch_token(token_address, bonding_type: BondingType::Linear, creator_fee_percent: MID_FEE_CREATOR, creator_fee_destination: RECEIVER_ADDRESS());
    }


    #[test]
    #[should_panic]
    fn launch_token_not_from_launchpad_panic() {
        println!("launch_token_not_from_launchpad_panic");
        let (sender_address, erc20, launchpad) = request_fixture();

        let erc20_class = declare_erc20();
        let token_new = deploy_erc20(
            *erc20_class,
            name: NAME_FELT(),
            symbol: SYMBOL_FELT(),
            initial_supply: DEFAULT_INITIAL_SUPPLY(),
            recipient: sender_address,
        );

        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let memecoin = IERC20Dispatcher { contract_address: token_new.contract_address };
        start_cheat_caller_address(memecoin.contract_address, OWNER());

        let total_supply = memecoin.total_supply();
        memecoin.approve(launchpad.contract_address, total_supply);
        stop_cheat_caller_address(memecoin.contract_address);
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.launch_token(token_new.contract_address, bonding_type: BondingType::Linear, creator_fee_percent: MID_FEE_CREATOR, creator_fee_destination: RECEIVER_ADDRESS());
    }


    #[test]
    #[fork("Mainnet")]
    fn launchpad_integration_linear() {
        println!("launchpad_integration");

        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_token(
                recipient: OWNER(),
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
            );
        // println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        start_cheat_caller_address(memecoin.contract_address, OWNER());

        let balance_contract = memecoin.balance_of(launchpad.contract_address);
        println!("test balance_contract {:?}", balance_contract);

        let total_supply = memecoin.total_supply();
        // println!(" memecoin total_supply {:?}", total_supply);
        memecoin.approve(launchpad.contract_address, total_supply);

        // let allowance = memecoin.allowance(sender_address, launchpad.contract_address);
        // println!("test allowance meme coin{}", allowance);
        // memecoin.transfer(launchpad.contract_address, total_supply);
        stop_cheat_caller_address(memecoin.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad
            .launch_token(
                token_address,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
        let amount_first_buy = 1_u256;

        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        // let mut total_amount_buy = amount_first_buy;
        let mut amount_second = 1_u256;
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_second, token_address, sender_address,
        );

        // let mut total_amount_buy = amount_first_buy;
        let mut last_amount = 8_u256;
        run_buy_by_amount(launchpad, erc20, memecoin, last_amount, token_address, sender_address,);
    }

    #[test]
    #[fork("Mainnet")]
    fn launchpad_integration_exp() {
        println!("launchpad_integration");

        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_token(
                recipient: OWNER(),
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
            );
        // println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        start_cheat_caller_address(memecoin.contract_address, OWNER());

        let balance_contract = memecoin.balance_of(launchpad.contract_address);
        println!("test balance_contract {:?}", balance_contract);

        let total_supply = memecoin.total_supply();
        // println!(" memecoin total_supply {:?}", total_supply);
        memecoin.approve(launchpad.contract_address, total_supply);

        // let allowance = memecoin.allowance(sender_address, launchpad.contract_address);
        // println!("test allowance meme coin{}", allowance);
        // memecoin.transfer(launchpad.contract_address, total_supply);
        stop_cheat_caller_address(memecoin.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad
            .launch_token(
                token_address,
                bonding_type: BondingType::Exponential,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
        let amount_first_buy = 1_u256;

        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        // let mut total_amount_buy = amount_first_buy;
        let mut amount_second = 1_u256;
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_second, token_address, sender_address,
        );

        // let mut total_amount_buy = amount_first_buy;
        let mut last_amount = 8_u256;
        run_buy_by_amount(launchpad, erc20, memecoin, last_amount, token_address, sender_address,);
    }

    // TODO
    // TEST WITH SEVERAL USER
    // #[test]
    // #[fork("Mainnet")]
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
    fn test_create_token() {
        let (_, _, launchpad) = request_fixture();
        let mut spy = spy_events();

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        let token_address = launchpad
            .create_token(
                recipient: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
            );

        let expected_event = LaunchpadEvent::CreateToken(
            CreateToken {
                caller: OWNER(),
                token_address: token_address,
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                total_supply: DEFAULT_INITIAL_SUPPLY(),
                is_unruggable: false
            }
        );
        spy.assert_emitted(@array![(launchpad.contract_address, expected_event)]);
    }

    #[test]
    // #[fork("Mainnet")]
    #[should_panic()]
    // #[should_panic(expected: (errors::NO_SUPPLY_PROVIDED,))]
    fn test_launch_token_with_uncreated_token() {
        let (_, erc20, launchpad) = request_fixture();

        launchpad
            .launch_token(
                coin_address: erc20.contract_address,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
    }

    #[test]
    #[should_panic()]
    fn test_launch_token_with_no_supply_provided() {
        let (_, _, launchpad) = request_fixture();

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        let token_address = launchpad
            .create_token(
                recipient: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false
            );

        launchpad
            .launch_token(
                coin_address: token_address,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
    }

    #[test]
    fn test_launch_token() {
        let (_, erc20, launchpad) = request_fixture();
        let mut spy = spy_events();
        let starting_price = THRESHOLD_LIQUIDITY / DEFAULT_INITIAL_SUPPLY();
        let slope = calculate_slope(DEFAULT_INITIAL_SUPPLY());

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        let token_address = launchpad
            .create_token(
                recipient: launchpad.contract_address,
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
            );

        let memecoin = IERC20Dispatcher { contract_address: token_address };
        memecoin.approve(launchpad.contract_address, DEFAULT_INITIAL_SUPPLY());

        launchpad
            .launch_token(
                coin_address: token_address,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );

        let expected_launch_token_event = LaunchpadEvent::CreateLaunch(
            CreateLaunch {
                caller: OWNER(),
                token_address: token_address,
                amount: 0,
                price: starting_price,
                total_supply: DEFAULT_INITIAL_SUPPLY(),
                slope: slope,
                threshold_liquidity: THRESHOLD_LIQUIDITY,
                quote_token_address: erc20.contract_address,
                is_unruggable: false,
                bonding_type: BondingType::Linear
            }
        );

        spy.assert_emitted(@array![(launchpad.contract_address, expected_launch_token_event)]);
    }

    #[test]
    #[should_panic()]
    fn test_launch_token_panic_no_approve() {
        let (_, erc20, launchpad) = request_fixture();
        let mut spy = spy_events();
        let starting_price = THRESHOLD_LIQUIDITY / DEFAULT_INITIAL_SUPPLY();
        let slope = calculate_slope(DEFAULT_INITIAL_SUPPLY());

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        let token_address = launchpad
            .create_token(
                recipient: launchpad.contract_address,
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
                is_unruggable: false,
            );

        // Panic before dont approve allowance
        // The user have received the token
        launchpad
            .launch_token(
                coin_address: token_address,
                bonding_type: BondingType::Linear,
                creator_fee_percent: MID_FEE_CREATOR,
                creator_fee_destination: RECEIVER_ADDRESS()
            );
    }


    #[test]
    fn test_get_threshold_liquidity() {
        let (_, _, launchpad) = request_fixture();
        assert(
            THRESHOLD_LIQUIDITY == launchpad.get_threshold_liquidity(), 'wrong threshold liquidity'
        );
    }

    #[test]
    fn test_get_default_token() {
        let (_, erc20, launchpad) = request_fixture();

        let expected_token = TokenQuoteBuyCoin {
            token_address: erc20.contract_address,
            starting_price: INITIAL_KEY_PRICE,
            price: INITIAL_KEY_PRICE,
            is_enable: true,
            step_increase_linear: STEP_LINEAR_INCREASE,
        };

        assert(expected_token == launchpad.get_default_token(), 'wrong default token');
    }

    #[test]
    fn test_get_coin_launch() {
        let (_, erc20, launchpad) = request_fixture();

        start_cheat_caller_address(launchpad.contract_address, OWNER());

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

        let launched_token = launchpad.get_coin_launch(token_address);

        assert(launched_token.owner == OWNER(), 'wrong owner');
        assert(launched_token.token_address == token_address, 'wrong token address');
        assert(launched_token.total_supply == DEFAULT_INITIAL_SUPPLY(), 'wrong initial supply');
        assert(launched_token.bonding_curve_type == BondingType::Linear, 'wrong initial supply');
        // assert(launched_token.price == 0_u256, 'wrong price');
        assert(launched_token.liquidity_raised == 0_u256, 'wrong liquidation raised');
        assert(launched_token.total_token_holded == 0_u256, 'wrong token holded');
        assert(
            launched_token.token_quote.token_address == erc20.contract_address, 'wrong token quote'
        );
    }

    #[test]
    // #[fork("Mainnet")]
    fn test_get_share_of_user_by_contract() {
        let (sender_address, erc20, launchpad) = request_fixture();

        start_cheat_caller_address(launchpad.contract_address, OWNER());
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
        stop_cheat_caller_address(launchpad.contract_address);

        start_cheat_caller_address(launchpad.contract_address, ALICE());
        let mut first_buy = 9_u256;
        run_buy_by_amount(launchpad, erc20, memecoin, first_buy, token_address, sender_address,);

        let share_key = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        assert(share_key.owner == sender_address, 'wrong owner');
        assert(share_key.token_address == memecoin.contract_address, 'wrong token address');
    }


    #[test]
    #[should_panic()]
    fn test_sell_coin_when_share_too_low() {
        let (sender_address, erc20, launchpad) = request_fixture();

        start_cheat_caller_address(launchpad.contract_address, OWNER());

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

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        let amount_owned = share_user.amount_owned.try_into().unwrap();

        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned + 1, token_address, sender_address,
        );
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: (errors::LIQUIDITY_BELOW_AMOUNT,))]
    fn test_sell_coin_when_quote_amount_is_greater_than_liquidity_raised() {
        let (sender_address, erc20, launchpad) = request_fixture();

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

        run_buy_by_amount(launchpad, erc20, memecoin, 10_u256, token_address, sender_address,);

        let share_user = launchpad
            .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        let amount_owned = share_user.amount_owned;
        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_owned + 20, token_address, sender_address,
        );
    }

    #[test]
    #[fork("Mainnet")]
    fn test_launchpad_end_to_end_linear() {
        let (sender_address, erc20, launchpad) = request_fixture();
        let starting_price = THRESHOLD_LIQUIDITY / DEFAULT_INITIAL_SUPPLY();
        let slope = calculate_slope(DEFAULT_INITIAL_SUPPLY());
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
        let starting_price = THRESHOLD_LIQUIDITY / DEFAULT_INITIAL_SUPPLY();
        let slope = calculate_slope(DEFAULT_INITIAL_SUPPLY());
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


    #[test]
    #[fork("Mainnet")]
    fn test_buy_coin_exp_with_different_supply() {
        let (sender, erc20, launchpad) = request_fixture();
        let quote_token = IERC20Dispatcher { contract_address: erc20.contract_address };

        let mut token_addresses: Array<ContractAddress> = array![];
        let init_supplies = test_get_init_supplies();

        // let init_supplies: Array<u256> = array![
        //     // 100_u256 + pow_256(10, 18),
        //     1_000_u256 + pow_256(10, 18),
        //     10_000_u256 + pow_256(10, 18),
        //     100_000_u256 * pow_256(10, 18), // 100k
        //     1_000_000_u256 * pow_256(10, 18), // 1m
        //     10_000_000_u256 * pow_256(10, 18), // 10m
        //     100_000_000_u256 * pow_256(10, 18), // 100m
        //     1_000_000_000_u256 * pow_256(10, 18), // 1b
        //     10_000_000_000_u256 * pow_256(10, 18), // 10b
        //     100_000_000_000_u256 * pow_256(10, 18), // 100b
        //     1_000_000_000_000_u256 * pow_256(10, 18), // 1t
        //     // 10_000_000_000_000_u256, // 10t
        // // 100_000_000_000_000_u256, // 100t
        // // 100_000_000_000_000_000_000_000_000_000_000_u256
        // ];
        // let init_supplies: Array<u256> = array![
        //     100_u256,
        //     100_000_u256, // 100k
        //     1_000_000_u256, // 1m
        //     10_000_000_u256, // 10m
        //     100_000_000_u256, // 100m
        //     1_000_000_000_u256, // 1b
        //     10_000_000_000_u256, // 10b
        //     100_000_000_000_u256, // 100b
        //     1_000_000_000_000_u256, // 1t
        //     // 10_000_000_000_000_u256, // 10t
        // // 100_000_000_000_000_u256, // 100t
        // // 100_000_000_000_000_000_000_000_000_000_000_u256
        // ];
        let mut i = 0;

        start_cheat_caller_address(launchpad.contract_address, OWNER());

        while i < init_supplies.len() {
            println!(
                "init_supply in loop test_buy_coin_exp_with_different_supply {:?}",
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
                    bonding_type: BondingType::Exponential,
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
            // println!(
            //     "balance quote in loop test_buy_coin_exp_with_different_supply {:?}",
            //     balance_quote_launch
            // );
            println!(
                "last init_supply in loop test_buy_coin_exp_with_different_supply {:?}",
                init_supplies.at(i).clone()
            );

            i += 1;
        };
        // start_cheat_caller_address(launchpad.contract_address, OWNER());

    }


    // #[test]
    // #[fork("Mainnet")]
    // fn test_buy_coin_with_different_supply_and_amount_check() {
    //     let (sender, erc20, launchpad) = request_fixture();
    //     let quote_token = IERC20Dispatcher { contract_address: erc20.contract_address };

    //     let mut token_addresses: Array<ContractAddress> = array![];
    //     let init_supplies: Array<u256> = array![
    //         100_u256,
    //         100_000_u256, // 100k
    //         1_000_000_u256, // 1m
    //         10_000_000_u256, // 10m
    //         100_000_000_u256, // 100m
    //         1_000_000_000_u256, // 1b
    //         10_000_000_000_u256, // 10b
    //         100_000_000_000_u256, // 100b
    //         1_000_000_000_000_u256, // 1t
    //         10_000_000_000_000_u256, // 10t
    //         100_000_000_000_000_u256, // 100t
    //         // 100_000_000_000_000_000_000_000_000_000_000_u256
    //     ];
    //     let mut i = 0;

    //     start_cheat_caller_address(launchpad.contract_address, OWNER());

    //     while i < init_supplies.len() {
    //         println!("init_supply in loop {:?}", init_supplies.at(i).clone());
    //         println!("i {:?}", i.clone());

    //         let token_address = launchpad
    //             .create_and_launch_token(
    //                 symbol: SYMBOL(),
    //                 name: NAME(),
    //                 initial_supply: *init_supplies.at(i),
    //                 contract_address_salt: SALT(),
    //                 is_unruggable: false
    //             );

    //         token_addresses.append(token_address);

    //         let memecoin = IERC20Dispatcher { contract_address: token_address };

    //         println!("buy threshold liquidity");
    //         run_buy_by_amount(
    //             launchpad, quote_token, memecoin, THRESHOLD_LIQUIDITY, token_address, OWNER(),
    //         );
    //         let balance_quote_launch = quote_token.balance_of(launchpad.contract_address);
    //         println!("balance quote in loop {:?}", balance_quote_launch);

    //         i += 1;
    //     };
    //     // start_cheat_caller_address(launchpad.contract_address, OWNER());

    // }

    #[test]
    #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_token_with_non_admin() {
        let (_, erc20, launchpad) = request_fixture();

        let expected_token = TokenQuoteBuyCoin {
            token_address: erc20.contract_address,
            starting_price: INITIAL_KEY_PRICE,
            price: INITIAL_KEY_PRICE,
            is_enable: true,
            step_increase_linear: STEP_LINEAR_INCREASE,
        };

        start_cheat_caller_address(launchpad.contract_address, ALICE());
        launchpad.set_token(expected_token);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: (errors::PROTOCOL_FEE_TOO_HIGH,))]
    fn test_set_protocol_fee_percent_too_high() {
        let (_, _, launchpad) = request_fixture();

        start_cheat_caller_address(launchpad.contract_address, ALICE());

        launchpad.set_protocol_fee_percent(MAX_FEE_PROTOCOL + 1);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: (errors::PROTOCOL_FEE_TOO_LOW,))]
    fn test_set_protocol_fee_percent_too_low() {
        let (_, _, launchpad) = request_fixture();

        launchpad.set_protocol_fee_percent(MIN_FEE_PROTOCOL - 1);
    }

    #[test]
    #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_protocol_fee_percent_non_admin() {
        let (_, _, launchpad) = request_fixture();

        launchpad.set_protocol_fee_percent(MID_FEE_PROTOCOL);
    }

    #[test]
    fn test_set_protocol_fee_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_protocol_fee_percent(MID_FEE_PROTOCOL);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: (errors::CREATOR_FEE_TOO_LOW,))]
    fn test_set_creator_fee_percent_too_low() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_creator_fee_percent(MIN_FEE_CREATOR - 1);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: (errors::CREATOR_FEE_TOO_HIGH,))]
    fn test_set_creator_fee_percent_too_high() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_creator_fee_percent(MAX_FEE_CREATOR + 1);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_creator_fee_percent_non_admin() {
        let (_, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, ALICE());

        launchpad.set_creator_fee_percent(MID_FEE_PROTOCOL);
    }

    #[test]
    fn test_set_creator_fee_percent_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_creator_fee_percent(MID_FEE_CREATOR);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_dollar_paid_coin_creation_non_admin() {
        let (_, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, ALICE());

        launchpad.set_dollar_paid_coin_creation(50_u256);
    }

    #[test]
    fn test_set_dollar_paid_coin_creation_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_dollar_paid_coin_creation(50_u256);
    }


    #[test]
    #[should_panic()]
    // #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_dollar_paid_launch_creation_non_admin() {
        let (_, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, ALICE());

        launchpad.set_dollar_paid_launch_creation(50_u256);
    }

    #[test]
    fn test_set_dollar_paid_launch_creation_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_dollar_paid_launch_creation(50_u256);
    }


    #[test]
    #[should_panic()]
    // #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_dollar_paid_finish_percentage_non_admin() {
        let (_, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, ALICE());

        launchpad.set_dollar_paid_finish_percentage(50_u256);
    }

    #[test]
    fn test_set_dollar_paid_finish_percentage_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_dollar_paid_finish_percentage(50_u256);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_threshold_liquidity_non_admin() {
        let (_, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, ALICE());

        launchpad.set_threshold_liquidity(50_u256);
    }

    #[test]
    fn test_set_threshold_liquidity_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_threshold_liquidity(50_u256);
    }


    #[test]
    #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_exchanges_address_non_admin() {
        let (_, _, launchpad) = request_fixture();
        let jediswap_addr: ContractAddress = 'jediswap'.try_into().unwrap();
        start_cheat_caller_address(launchpad.contract_address, ALICE());

        let exchange_addresses = array![(SupportedExchanges::Jediswap, jediswap_addr)].span();

        launchpad.set_exchanges_address(exchange_addresses);
    }

    #[test]
    fn test_set_exchanges_address_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        let jediswap_addr: ContractAddress = 'jediswap'.try_into().unwrap();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let exchange_addresses = array![(SupportedExchanges::Jediswap, jediswap_addr)].span();

        launchpad.set_exchanges_address(exchange_addresses);
    }

    #[test]
    #[should_panic(expected: ('Caller is missing role',))]
    fn test_set_class_hash_non_admin() {
        let (_, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, ALICE());

        launchpad.set_class_hash(class_hash_const::<'hash'>());
    }

    #[test]
    fn test_set_class_hash_ok() {
        let (sender_address, _, launchpad) = request_fixture();
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.set_class_hash(class_hash_const::<'hash'>());
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: (errors::COIN_NOT_FOUND,))]
    fn test_sell_coin_for_invalid_coin() {
        let (_, erc20, launchpad) = request_fixture();

        launchpad.sell_coin(erc20.contract_address, 50_u256);
    }


    #[test]
    // #[fork("Mainnet")]
    fn launchpad_test_calculation() {
        println!("launchpad_test_calculation");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
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

        // let token_address = default_token.token_address;
        let amount_to_buy = THRESHOLD_LIQUIDITY;
        let amount_coin_get_max = run_calculation(
            launchpad, amount_to_buy, token_address, sender_address, false, true
        );

        let amount_coin_get = amount_coin_get_max.clone();
        println!("amount coin get {:?}", amount_coin_get);
        println!(
            "DEFAULT_INITIAL_SUPPLY()/LIQUIDITY_RATIO, {:?}",
            DEFAULT_INITIAL_SUPPLY() / LIQUIDITY_RATIO,
        );
        // assert!(amount_coin_get == DEFAULT_INITIAL_SUPPLY() - (DEFAULT_INITIAL_SUPPLY() /
        // LIQUIDITY_RATIO), "not 80 percent");
        assert!(
            amount_coin_get == DEFAULT_INITIAL_SUPPLY()
                - (DEFAULT_INITIAL_SUPPLY() / LIQUIDITY_RATIO),
            "not 80 percent"
        );

        let amount_coin_sell = run_calculation(
            launchpad, amount_to_buy, token_address, sender_address, true, true
        );
        println!("amount_coin_sell {:?}", amount_coin_sell);
        assert!(amount_coin_get == amount_coin_sell, "amount incorrect");
    }

    #[test]
    // #[fork("Mainnet")]
    fn launchpad_test_calculation_exp() {
        println!("launchpad_test_calculation");
        let (sender_address, erc20, launchpad) = request_fixture();
        // start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
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

        // let token_address = default_token.token_address;
        let amount_to_buy = THRESHOLD_LIQUIDITY;
        let amount_coin_get_max = run_calculation(
            launchpad, amount_to_buy, token_address, sender_address, false, true
        );

        let amount_coin_get = amount_coin_get_max.clone();
        println!("amount coin get {:?}", amount_coin_get);
        println!(
            "DEFAULT_INITIAL_SUPPLY()/LIQUIDITY_RATIO, {:?}",
            DEFAULT_INITIAL_SUPPLY() / LIQUIDITY_RATIO,
        );
        // assert!(amount_coin_get == DEFAULT_INITIAL_SUPPLY() - (DEFAULT_INITIAL_SUPPLY() /
        // LIQUIDITY_RATIO), "not 80 percent");
        assert!(
            amount_coin_get == DEFAULT_INITIAL_SUPPLY()
                - (DEFAULT_INITIAL_SUPPLY() / LIQUIDITY_RATIO),
            "not 80 percent"
        );

        let amount_coin_sell = run_calculation(
            launchpad, amount_to_buy, token_address, sender_address, true, true
        );
        println!("amount_coin_sell {:?}", amount_coin_sell);
        assert!(amount_coin_get == amount_coin_sell, "amount incorrect");
    }


    #[test]
    fn test_get_coin_amount_by_quote_amount_for_buy_steps() {
        let (sender_address, erc20, launchpad) = request_fixture();

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

        let mut quote_amount: u256 = 1; // Example amount of quote token for buying

        // TODO calculation of amount received
        let expected_meme_amount_max: u256 = DEFAULT_INITIAL_SUPPLY()
            / LIQUIDITY_RATIO; // Replace with the expected value from the formula

        let expected_meme_amount: u256 = expected_meme_amount_max
            / 10_u256; // Replace with the expected value from the formula

        let result = launchpad
            .get_amount_by_type_of_coin_or_quote(token_address, quote_amount, false, true);

        println!("result {:?}", result);
        println!("expected_meme_amount {:?}", expected_meme_amount);

        run_buy_by_amount(launchpad, erc20, memecoin, quote_amount, token_address, sender_address,);
        let quote_amount_2: u256 = 1; // Example amount of quote token for buying
        assert(result == expected_meme_amount, 'Error: Buy calculation mismatch');

        println!("result {:?}", result);
        println!("expected_meme_amount {:?}", expected_meme_amount);

        // let share_key = launchpad
        //     .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        // assert(share_key.owner == sender_address, 'wrong owner');
        // assert(share_key.amount_owned == result, 'wrong result');
        // assert(share_key.amount_owned == expected_meme_amount, 'wrong expected');

        let result = launchpad
            .get_amount_by_type_of_coin_or_quote(token_address, quote_amount_2, false, true);
    }

    #[test]
    fn test_get_coin_amount_by_quote_amount_for_buy_steps_exp() {
        let (sender_address, erc20, launchpad) = request_fixture();

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

        let mut quote_amount: u256 = 1; // Example amount of quote token for buying

        // TODO calculation of amount received
        let expected_meme_amount_max: u256 = DEFAULT_INITIAL_SUPPLY()
            / LIQUIDITY_RATIO; // Replace with the expected value from the formula

        let expected_meme_amount: u256 = expected_meme_amount_max
            / 10_u256; // Replace with the expected value from the formula

        let result = launchpad
            .get_amount_by_type_of_coin_or_quote(token_address, quote_amount, false, true);

        println!("result {:?}", result);
        println!("expected_meme_amount {:?}", expected_meme_amount);

        run_buy_by_amount(launchpad, erc20, memecoin, quote_amount, token_address, sender_address,);
        let quote_amount_2: u256 = 1; // Example amount of quote token for buying
        assert(result == expected_meme_amount, 'Error: Buy calculation mismatch');

        println!("result {:?}", result);
        println!("expected_meme_amount {:?}", expected_meme_amount);

        // let share_key = launchpad
        //     .get_share_of_user_by_contract(sender_address, memecoin.contract_address);

        // assert(share_key.owner == sender_address, 'wrong owner');
        // assert(share_key.amount_owned == result, 'wrong result');
        // assert(share_key.amount_owned == expected_meme_amount, 'wrong expected');

        let result = launchpad
            .get_amount_by_type_of_coin_or_quote(token_address, quote_amount_2, false, true);
    }
    // #[test]
// // #[fork("Mainnet")]
// fn test_get_all_launch_tokens_and_coins() {
//     let (sender_address, erc20, launchpad) = request_fixture();
//     let first_token: felt252 = 'token_1';
//     let second_token: felt252 = 'token_2';
//     let third_token: felt252 = 'token_3';

    //     let first_token_addr = launchpad
//         .create_and_launch_token(
//             symbol: 'FRST',
//             name: first_token,
//             initial_supply: DEFAULT_INITIAL_SUPPLY(),
//             contract_address_salt: SALT(),
//             is_unruggable: false,
//             bonding_type: BondingType::Linear
//         );

    //     let second_token_addr = launchpad
//         .create_and_launch_token(
//             symbol: 'SCND',
//             name: second_token,
//             initial_supply: DEFAULT_INITIAL_SUPPLY(),
//             contract_address_salt: SALT(),
//             is_unruggable: false,
//             bonding_type: BondingType::Linear
//         );

    //     let third_token_addr = launchpad
//         .create_and_launch_token(
//             symbol: 'THRD',
//             name: third_token,
//             initial_supply: DEFAULT_INITIAL_SUPPLY(),
//             contract_address_salt: SALT(),
//             is_unruggable: false,
//             bonding_type: BondingType::Linear
//         );

    //     let all_launched_coins = launchpad.get_all_coins();
//     let all_launched_tokens = launchpad.get_all_launch();

    //     assert(all_launched_coins.len() == 3, 'wrong number of coins');
//     assert(all_launched_tokens.len() == 3, 'wrong number of tokens');
//     assert(*all_launched_coins.at(0).name == first_token, 'wrong coin name');
//     assert(*all_launched_coins.at(1).name == second_token, 'wrong coin name');
//     assert(*all_launched_coins.at(2).name == third_token, 'wrong coin name');
//     assert(*all_launched_tokens.at(0).token_address == first_token_addr, 'wrong token
//     address');
//     assert(
//         *all_launched_tokens.at(1).token_address == second_token_addr, 'wrong token address'
//     );
//     assert(*all_launched_tokens.at(2).token_address == third_token_addr, 'wrong token
//     address');
// }
// #[test]
// #[fork("Mainnet")]
// fn launchpad_buy_all_few_steps() {
//     println!("launchpad_buy_all_few_steps");
//     let (sender_address, erc20, launchpad) = request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     start_cheat_caller_address(erc20.contract_address, sender_address);
//     // Call a view function of the contract
//     // Check default token used
//     let default_token = launchpad.get_default_token();
//     assert(default_token.token_address == erc20.contract_address, 'no default token');
//     assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
//     start_cheat_caller_address(launchpad.contract_address, sender_address);
//     println!("create and launch token");
//     let token_address = launchpad
//         .create_and_launch_token(
//             // owner: OWNER(),
//             symbol: SYMBOL(),
//             name: NAME(),
//             initial_supply: DEFAULT_INITIAL_SUPPLY(),
//             contract_address_salt: SALT(),
//         );
//     println!("test token_address {:?}", token_address);
//     let memecoin = IERC20Dispatcher { contract_address: token_address };

    //     //  All buy
//     let mut first_buy = 10_u256;

    //     run_buy_by_amount(launchpad, erc20, memecoin, first_buy, token_address, sender_address,);

    //     // run_buy_by_amount(launchpad, erc20, memecoin, first_buy, token_address,
//     sender_address,);

    //     run_buy_by_amount(
//         launchpad,
//         erc20,
//         memecoin,
//         THRESHOLD_LIQUIDITY - first_buy,
//         token_address,
//         sender_address,
//     );
// }
// #[test]
// #[fork("Mainnet")]
// fn launchpad_buy_and_sell() {
//     println!("launchpad_buy_and_sell");
//     let (sender_address, erc20, launchpad) = request_fixture();
//     // let amount_key_buy = 1_u256;
//     start_cheat_caller_address_global(sender_address);
//     start_cheat_caller_address(erc20.contract_address, sender_address);
//     // Call a view function of the contract
//     // Check default token used
//     let default_token = launchpad.get_default_token();
//     assert(default_token.token_address == erc20.contract_address, 'no default token');
//     assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');

    //     start_cheat_caller_address(launchpad.contract_address, sender_address);

    //     println!("create and launch token");
//     let token_address = launchpad
//         .create_and_launch_token(
//             // owner: OWNER(),
//             symbol: SYMBOL(),
//             name: NAME(),
//             initial_supply: DEFAULT_INITIAL_SUPPLY(),
//             contract_address_salt: SALT(),
//         );
//     println!("test token_address {:?}", token_address);

    //     let memecoin = IERC20Dispatcher { contract_address: token_address };
//     let amount_first_buy = 10_u256;

    //     // //  First buy with 10 quote token
//     run_buy_by_amount(
//         launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
//     );
//     // let mut total_amount_buy = amount_first_buy;

    //     let new_amount = THRESHOLD_LIQUIDITY - amount_first_buy;
//     // //  First sell with 10 quote token
//     run_sell_by_amount(
//         launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
//     );
//     // //  Threshold buy - 1
// // run_buy_by_amount(
// //     launchpad, erc20, memecoin, new_amount, token_address, sender_address,
// // );

    // }

    // #[test]
// #[fork("Mainnet")]
// #[should_panic(expected: (errors::THRESHOLD_LIQUIDITY_EXCEEDED,))]
// fn launchpad_buy_more_then_liquidity_threshold() {
//     println!("launchpad_buy_more_then_liquidity_threshold");
//     let (sender_address, erc20, launchpad) = request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     start_cheat_caller_address(erc20.contract_address, sender_address);
//     let default_token = launchpad.get_default_token();
//     assert(default_token.token_address == erc20.contract_address, 'no default token');
//     assert(default_token.starting_price == INITIAL_KEY_PRICE, 'no init price');
//     start_cheat_caller_address(launchpad.contract_address, sender_address);

    //     let token_address = launchpad
//         .create_token(
//             recipient: OWNER(),
//             // owner: OWNER(),
//             symbol: SYMBOL(),
//             name: NAME(),
//             initial_supply: DEFAULT_INITIAL_SUPPLY(),
//             contract_address_salt: SALT(),
//         );
//     // println!("test token_address {:?}", token_address);
//     let memecoin = IERC20Dispatcher { contract_address: token_address };
//     start_cheat_caller_address(memecoin.contract_address, sender_address);

    //     let balance_contract = memecoin.balance_of(launchpad.contract_address);
//     println!("test balance_contract {:?}", balance_contract);

    //     let total_supply = memecoin.total_supply();
//     println!(" memecoin total_supply {:?}", total_supply);
//     memecoin.approve(launchpad.contract_address, total_supply);

    //     let allowance = memecoin.allowance(sender_address, launchpad.contract_address);
//     println!("test allowance meme coin{}", allowance);
//     // memecoin.transfer(launchpad.contract_address, total_supply);
//     stop_cheat_caller_address(memecoin.contract_address);

    //     start_cheat_caller_address(launchpad.contract_address, sender_address);

    //     launchpad.launch_token(token_address);
//     let amount_first_buy = 9_u256;

    //     run_buy_by_amount(
//         launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
//     );
//     // let mut total_amount_buy = amount_first_buy;

    //     let mut amount_second = 2_u256;
//     run_buy_by_amount(
//         launchpad, erc20, memecoin, amount_second, token_address, sender_address,
//     );
//     // // //  First buy with 10 quote token
// // let res = run_sell_by_amount(
// //     launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
// // );

    //     // //  Final buy
// // let res = run_buy_by_amount(
// //     launchpad,
// //     erc20,
// //     memecoin,
// //     THRESHOLD_LIQUIDITY - total_amount_buy,
// //     token_address,
// //     sender_address,
// // );
// }

    //
// Unit test
//

    // #[test]
// #[should_panic(expected: ('Caller is missing role',))]
// fn test_set_address_jediswap_factory_v2_non_admin() {
//     let (_, _, launchpad) = request_fixture();
//     start_cheat_caller_address(launchpad.contract_address, ALICE());

    //     launchpad.set_address_jediswap_factory_v2('jediswap'.try_into().unwrap());
// }

    // #[test]
// fn test_set_address_jediswap_factory_v2_ok() {
//     let (sender_address, _, launchpad) = request_fixture();
//     let mut spy = spy_events();
//     let jediswap_v2_addr: ContractAddress = 'jediswap'.try_into().unwrap();

    //     start_cheat_caller_address(launchpad.contract_address, sender_address);

    //     launchpad.set_address_jediswap_factory_v2(jediswap_v2_addr);

    //     let expected_event = LaunchpadEvent::SetJediswapV2Factory(
//         SetJediswapV2Factory { address_jediswap_factory_v2: jediswap_v2_addr }
//     );
//     spy.assert_emitted(@array![(launchpad.contract_address, expected_event)]);
// }

    // #[test]
// #[should_panic(expected: ('Caller is missing role',))]
// fn test_set_address_jediswap_nft_router_v2_non_admin() {
//     let (_, _, launchpad) = request_fixture();
//     start_cheat_caller_address(launchpad.contract_address, ALICE());

    //     launchpad.set_address_jediswap_nft_router_v2('jediswap'.try_into().unwrap());
// }

    // #[test]
// fn test_set_address_jediswap_nft_router_v2_ok() {
//     let (sender_address, _, launchpad) = request_fixture();
//     let mut spy = spy_events();
//     let jediswap_nft_v2_addr: ContractAddress = 'jediswap'.try_into().unwrap();

    //     start_cheat_caller_address(launchpad.contract_address, sender_address);

    //     launchpad.set_address_jediswap_nft_router_v2(jediswap_nft_v2_addr);

    //     let expected_event = LaunchpadEvent::SetJediswapNFTRouterV2(
//         SetJediswapNFTRouterV2 { address_jediswap_nft_router_v2: jediswap_nft_v2_addr }
//     );
//     spy.assert_emitted(@array![(launchpad.contract_address, expected_event)]);
// }

}
