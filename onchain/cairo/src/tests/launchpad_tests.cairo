#[cfg(test)]
mod launchpad_tests {
    use afk::launchpad::launchpad::{
        ILaunchpadMarketplaceDispatcher, ILaunchpadMarketplaceDispatcherTrait
    };
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::types::launchpad_types::{MINTER_ROLE, ADMIN_ROLE, TokenQuoteBuyCoin, BondingType};
    use core::array::SpanTrait;
    use core::num::traits::Zero;
    use core::traits::Into;
    use openzeppelin::account::interface::{ISRC6Dispatcher, ISRC6DispatcherTrait};
    use openzeppelin::utils::serde::SerializedAppend;

    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, SpyOn, EventSpy, EventFetcher,
        Event, EventAssertions, start_cheat_caller_address, cheat_caller_address_global,
        stop_cheat_caller_address, stop_cheat_caller_address_global, start_cheat_block_timestamp
    };
    use starknet::syscalls::deploy_syscall;

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        get_block_timestamp, get_contract_address, ClassHash
    };

    fn DEFAULT_INITIAL_SUPPLY() -> u256 {
        // 21_000_000 * pow_256(10, 18)
        100_000_000
    // * pow_256(10, 18)
    }

    // const INITIAL_KEY_PRICE:u256=1/100;
    const INITIAL_SUPPLY_DEFAULT: u256 = 100_000_000;
    const INITIAL_KEY_PRICE: u256 = 1;
    const STEP_LINEAR_INCREASE: u256 = 1;
    const THRESHOLD_LIQUIDITY: u256 = 10;
    const THRESHOLD_MARKET_CAP: u256 = 500;
    // const INITIAL_KEY_PRICE: u256 = 1 / 10_000;
    // const THRESHOLD_LIQUIDITY: u256 = 10;
    // const THRESHOLD_LIQUIDITY: u256 = 10_000;

    const RATIO_SUPPLY_LAUNCH: u256 = 5;
    const LIQUIDITY_SUPPLY: u256 = INITIAL_SUPPLY_DEFAULT / RATIO_SUPPLY_LAUNCH;
    const BUYABLE: u256 = INITIAL_SUPPLY_DEFAULT / RATIO_SUPPLY_LAUNCH;


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

    fn NAME() -> felt252 {
        'name'.try_into().unwrap()
    }

    fn SYMBOL() -> felt252 {
        'symbol'.try_into().unwrap()
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


    fn request_fixture() -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher) {
        // println!("request_fixture");
        let erc20_class = declare_erc20();
        let launch_class = declare_launchpad();
        request_fixture_custom_classes(erc20_class, launch_class)
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass, launch_class: ContractClass
    ) -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher) {
        let sender_address: ContractAddress = 123.try_into().unwrap();
        let erc20 = deploy_erc20(erc20_class, 'USDC token', 'USDC', 1_000_000, sender_address);
        let token_address = erc20.contract_address.clone();
        let launchpad = deploy_launchpad(
            launch_class,
            sender_address,
            token_address.clone(),
            INITIAL_KEY_PRICE,
            STEP_LINEAR_INCREASE,
            erc20_class.class_hash,
            THRESHOLD_LIQUIDITY,
            THRESHOLD_MARKET_CAP
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
        (sender_address, erc20, launchpad)
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
    ) -> ILaunchpadMarketplaceDispatcher {
        // println!("deploy marketplace");
        let mut calldata = array![admin.into()];
        calldata.append_serde(initial_key_price);
        calldata.append_serde(token_address);
        calldata.append_serde(step_increase_linear);
        calldata.append_serde(coin_class_hash);
        calldata.append_serde(threshold_liquidity);
        calldata.append_serde(threshold_marketcap);
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        ILaunchpadMarketplaceDispatcher { contract_address }
    }

    fn declare_launchpad() -> ContractClass {
        declare("LaunchpadMarketplace").unwrap()
    }

    fn declare_erc20() -> ContractClass {
        declare("ERC20").unwrap()
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
        erc20.approve(launchpad.contract_address, amount_quote);
        let allowance = erc20.allowance(sender_address, launchpad.contract_address);
        // println!("test allowance erc20 {}", allowance);
        stop_cheat_caller_address(erc20.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("buy coin",);
        launchpad.buy_coin_by_quote_amount(token_address, amount_quote);
    }


    fn run_sell_by_amount(
        launchpad: ILaunchpadMarketplaceDispatcher,
        erc20: IERC20Dispatcher,
        memecoin: IERC20Dispatcher,
        amount_quote: u256,
        token_address: ContractAddress,
        sender_address: ContractAddress,
    ) {
        println!("sell coin",);
        let allowance = memecoin.allowance(sender_address, launchpad.contract_address);
        println!("test allowance meme coin{}", allowance);
        launchpad.sell_coin(token_address, amount_quote);
    }

    #[test]
    fn launchpad_buy_with_amount() {
        println!("launchpad_buy_with_amount");
        let (sender_address, erc20, launchpad) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        let amount_first_buy = 1_u256;

        // //  First buy with 1 quote token
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        // // // Sell token bought
        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        // //  First buy with 1 quote token
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        // Total buy THRESHOLD
        run_buy_by_amount(
            launchpad,
            erc20,
            memecoin,
            THRESHOLD_LIQUIDITY - amount_first_buy,
            token_address,
            sender_address,
        );
    //  All buy
    //    let res = run_buy_by_amount(
    //     launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY , token_address, sender_address,
    // );

    // let token_address_2 = launchpad
    // .create_and_launch_token(
    //     // owner: OWNER(),
    //     symbol: SYMBOL(),
    //     name: NAME(),
    //     initial_supply: DEFAULT_INITIAL_SUPPLY(),
    //     contract_address_salt: 'salt2'.try_into().unwrap()
    // );
    // let memecoin = IERC20Dispatcher { contract_address: token_address_2 };
    //   // //  First buy with 10 quote token
    //   let res = run_buy_by_amount(
    //     launchpad, erc20, memecoin, amount_first_buy, token_address_2, sender_address,
    // );
    }

    #[test]
    fn launchpad_buy_all_few_steps() {
        println!("launchpad_buy_all_few_steps");
        let (sender_address, erc20, launchpad) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };


        //  All buy
        let mut first_buy=10_u256;
        run_buy_by_amount(
            launchpad, erc20, memecoin, first_buy, token_address, sender_address,
        );

        run_buy_by_amount(
            launchpad, erc20, memecoin, first_buy, token_address, sender_address,
        );

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY / 10, token_address, sender_address,
        );


    }



    #[test]
    fn launchpad_buy_all() {
        println!("launchpad_buy_all");
        let (sender_address, erc20, launchpad) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };

        //  All buy
        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );
    }

    #[test]
    fn launchpad_buy_and_sell() {
        println!("launchpad_buy_and_sell");
        let (sender_address, erc20, launchpad) = request_fixture();
        // let amount_key_buy = 1_u256;
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        println!("test token_address {:?}", token_address);

        let memecoin = IERC20Dispatcher { contract_address: token_address };
        let amount_first_buy = 10_u256;

        // //  First buy with 10 quote token
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );
        // let mut total_amount_buy = amount_first_buy;

        let new_amount=THRESHOLD_LIQUIDITY - amount_first_buy;
        // //  First sell with 10 quote token
        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        // //  Threshold buy - 1
        // run_buy_by_amount(
        //     launchpad, erc20, memecoin, new_amount, token_address, sender_address,
        // );


      
    }


    #[test]
    fn launchpad_end_to_end() {
        println!("launchpad_end_to_end");
        let (sender_address, erc20, launchpad) = request_fixture();
        // let amount_key_buy = 1_u256;
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        println!("create and launch token");
        let token_address = launchpad
            .create_and_launch_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        println!("test token_address {:?}", token_address);

        let memecoin = IERC20Dispatcher { contract_address: token_address };
        let amount_first_buy = 10_u256;

        // //  First buy with 10 quote token
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );
        // let mut total_amount_buy = amount_first_buy;

        // //  First sell with 10 quote token
        run_sell_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );

        //  Final buy

        run_buy_by_amount(
            launchpad, erc20, memecoin, THRESHOLD_LIQUIDITY, token_address, sender_address,
        );
    }

    #[test]
    fn launchpad_integration() {
        println!("launchpad_integration");

        let (sender_address, erc20, launchpad) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_token(
                recipient: OWNER(),
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        // println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        start_cheat_caller_address(memecoin.contract_address, sender_address);

        let balance_contract = memecoin.balance_of(launchpad.contract_address);
        println!("test balance_contract {:?}", balance_contract);

        let total_supply = memecoin.total_supply();
        // println!(" memecoin total_supply {:?}", total_supply);
        memecoin.approve(launchpad.contract_address, total_supply);

        // let allowance = memecoin.allowance(sender_address, launchpad.contract_address);
        // println!("test allowance meme coin{}", allowance);
        memecoin.transfer(launchpad.contract_address, total_supply);
        stop_cheat_caller_address(memecoin.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.launch_token(token_address);
        let amount_first_buy = 9_u256;

        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );
        // let mut total_amount_buy = amount_first_buy;
        let mut amount_second = 1_u256;
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_second, token_address, sender_address,
        );
   
    }


    #[test]
    fn launchpad_buy_more_then_liquidity_threshold() {
        println!("launchpad_buy_more_then_liquidity_threshold");
        let (sender_address, erc20, launchpad) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_token(
                recipient: OWNER(),
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        // println!("test token_address {:?}", token_address);
        let memecoin = IERC20Dispatcher { contract_address: token_address };
        start_cheat_caller_address(memecoin.contract_address, sender_address);

        let balance_contract = memecoin.balance_of(launchpad.contract_address);
        println!("test balance_contract {:?}", balance_contract);

        let total_supply = memecoin.total_supply();
        println!(" memecoin total_supply {:?}", total_supply);
        memecoin.approve(launchpad.contract_address, total_supply);

        let allowance = memecoin.allowance(sender_address, launchpad.contract_address);
        println!("test allowance meme coin{}", allowance);
        // memecoin.transfer(launchpad.contract_address, total_supply);
        stop_cheat_caller_address(memecoin.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad.launch_token(token_address);
        let amount_first_buy = 9_u256;

        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
        );
        // let mut total_amount_buy = amount_first_buy;

        let mut amount_second = 2_u256;
        run_buy_by_amount(
            launchpad, erc20, memecoin, amount_second, token_address, sender_address,
        );
    // // //  First buy with 10 quote token
    // let res = run_sell_by_amount(
    //     launchpad, erc20, memecoin, amount_first_buy, token_address, sender_address,
    // );

    // //  Final buy
    // let res = run_buy_by_amount(
    //     launchpad,
    //     erc20,
    //     memecoin,
    //     THRESHOLD_LIQUIDITY - total_amount_buy,
    //     token_address,
    //     sender_address,
    // );
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
        println!("buy coin",);
        launchpad.get_coin_amount_by_quote_amount(token_address, amount_quote, is_decreased)
    }

    #[test]
    fn launchpad_test_calculation() {
        println!("launchpad_test_calculation");
        let (sender_address, erc20, launchpad) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = default_token.token_address;
        let amount_to_buy = THRESHOLD_LIQUIDITY;
        let amount_coin_get = run_calculation(
            launchpad, amount_to_buy, token_address, sender_address, false, true
        );

        println!("amount coin get {:?}", amount_coin_get);

        let amount_coin_sell = run_calculation(
            launchpad, amount_to_buy, token_address, sender_address, true, true
        );
        println!("amount_coin_sell {:?}", amount_coin_sell);
        assert!(amount_coin_get==amount_coin_sell, "amount incorrect");

    }
}
