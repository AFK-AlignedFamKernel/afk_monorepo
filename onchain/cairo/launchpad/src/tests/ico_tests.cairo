mod ico_tests {
    use alexandria_math::fast_power::fast_power;
    use core::num::traits::Zero;
    use snforge_std::cheatcodes::events::Event;
    use snforge_std::{
        CheatSpan, ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, EventSpyTrait,
        EventsFilterTrait, cheat_block_timestamp, cheat_caller_address, declare, spy_events,
    };
    use starknet::{ClassHash, ContractAddress};
    use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interfaces::ico::{
        ContractConfig, IICOConfigDispatcher, IICOConfigDispatcherTrait, IICODispatcher,
        IICODispatcherTrait, PresaleDetails, PresaleLaunched, PresaleStatus, TokenCreated,
        TokenDetails,
    };
    use crate::launchpad::ico::ICO;

    const EKUBO_EXCHANGE: ContractAddress =
        0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b
        .try_into()
        .unwrap();

    const OWNER: ContractAddress = 'OWNER'.try_into().unwrap();
    const ADMIN: ContractAddress = 'ADMIN'.try_into().unwrap();
    const PROTOCOL: ContractAddress = 'PROTOCOL'.try_into().unwrap();
    const USER: ContractAddress = 'USER'.try_into().unwrap();

    fn get_max_supply() -> u256 {
        1_000_000 * fast_power(10, 18)
    }

    fn deploy(
        token_class_hash: ClassHash,
        fee_amount: u256,
        fee_to: ContractAddress,
        max_token_supply: u256,
        paid_in: ContractAddress,
        exchange_address: ContractAddress,
    ) -> ContractAddress {
        let owner = ADMIN;
        let mut calldata = array![];

        (owner, token_class_hash, fee_amount, fee_to, max_token_supply, paid_in, exchange_address)
            .serialize(ref calldata);
        let contract = declare("ICO").unwrap().contract_class();
        let (address, _) = contract.deploy(@calldata).unwrap();
        address
    }

    fn deploy_default() -> ContractAddress {
        let token_class_hash = *declare("ERC20").unwrap().contract_class().class_hash;
        let fee_amount: u256 = 0;
        let fee_to = PROTOCOL;
        let max_token_supply = get_max_supply();
        let paid_in = deploy_erc20(OWNER);
        let exchange_address = EKUBO_EXCHANGE;

        deploy(token_class_hash, fee_amount, fee_to, max_token_supply, paid_in, exchange_address)
    }

    /// For base coin -- buy token
    fn deploy_erc20(owner: ContractAddress) -> ContractAddress {
        let mut calldata = array![];
        ('USD COIN', 'USDC', 1_000_000_u256 * fast_power(10, 18), owner, 18_u8)
            .serialize(ref calldata);
        let contract = declare("ERC20").unwrap().contract_class();
        let (contract_address, _) = contract.deploy(@calldata).unwrap();
        contract_address
    }

    fn get_default_token_details() -> TokenDetails {
        TokenDetails {
            name: 'My Token',
            symbol: 'MYTK',
            initial_supply: get_max_supply(),
            decimals: 18,
            salt: 0,
        }
    }

    fn launch_presale(
        token_address: ContractAddress,
        details: PresaleDetails,
        dispatcher: IICODispatcher,
        owner: ContractAddress,
    ) {
        let contract = dispatcher.contract_address;
        cheat_caller_address(contract, owner, CheatSpan::TargetCalls(1));
        dispatcher.launch_presale(token_address, Option::Some(details));
    }

    fn init_presale_details(buy_token: ContractAddress, whitelist: bool) -> PresaleDetails {
        let presale_rate = 100; // 100 tokens to 1 of base (buy_token)
        let hard_cap = 1500 * fast_power(10, 18);
        let soft_cap = 70 * hard_cap / 100; // 1050 * fast_power(10, 18);
        let liquidity_percentage = 60;
        let listing_rate = 60;
        let start_time = 0;
        let end_time = 10;
        let liquidity_lockup = 100;

        // let min_supply = 20 * details.presale_rate * details.hard_cap / 100;
        PresaleDetails {
            buy_token,
            presale_rate,
            whitelist,
            soft_cap,
            hard_cap,
            liquidity_percentage,
            listing_rate,
            start_time,
            end_time,
            liquidity_lockup,
        }
    }

    fn config(buy_token: ContractAddress, contract: ContractAddress) {
        let config = ContractConfig {
            exchange_address: Option::None,
            accepted_buy_tokens: array![buy_token],
            fee: Option::None,
            max_token_supply: Option::None,
            paid_in: Option::None,
            token_class_hash: Option::None,
        };
        cheat_caller_address(contract, ADMIN, CheatSpan::TargetCalls(1));
        let config_dispatcher = IICOConfigDispatcher { contract_address: contract };
        config_dispatcher.set_config(config);
    }

    #[test]
    fn test_ico_deploy_erc20() {
        let contract_address = deploy_erc20(OWNER);
        let dispatcher = IERC20Dispatcher { contract_address };
        assert(dispatcher.name() == 'USD COIN', 'ERC20 NAME MISMATCH');
        assert(dispatcher.symbol() == 'USDC', 'ERC20 SYMBOL MISMATCH');
        assert(dispatcher.total_supply() == get_max_supply(), 'ERC20 SUPPLY MISMATCH');
        assert(dispatcher.decimals() == 18_u8, 'ERC20 DECIMALS MISMATCH');
        assert(dispatcher.balance_of(OWNER) == get_max_supply(), 'ERC20 OWNER MISMATCH');
    }

    #[test]
    fn test_ico_create_token() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };

        let mut spy = spy_events();
        cheat_caller_address(contract_address, USER, CheatSpan::TargetCalls(1));
        cheat_block_timestamp(contract_address, 4, CheatSpan::TargetCalls(1));
        let token_address = dispatcher.create_token(get_default_token_details());
        assert(token_address.is_non_zero(), 'TOKEN ADDRESS IS ZERO');

        let token_dispatcher = IERC20Dispatcher { contract_address: token_address };
        assert(token_dispatcher.balance_of(USER) == get_max_supply(), 'USER BALANCE MISMATCH');
        assert(token_dispatcher.name() == 'My Token', 'CREATE TOKEN NAME MISMATCH');
        assert(token_dispatcher.symbol() == 'MYTK', 'CREATE TOKEN SYMBOL MISMATCH');
        assert(token_dispatcher.decimals() == 18, 'TOTAL SUPPLY MISMATCH');

        let expected_event = ICO::Event::TokenCreated(
            TokenCreated {
                token_address,
                owner: USER,
                name: 'My Token',
                symbol: 'MYTK',
                decimals: 18,
                initial_supply: get_max_supply(),
                created_at: 4,
            },
        );

        spy.assert_emitted(@array![(contract_address, expected_event)]);
    }

    #[test]
    #[should_panic(expected: 'ZERO CALLER')]
    fn test_ico_create_token_zero_address() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };

        cheat_caller_address(contract_address, Zero::zero(), CheatSpan::TargetCalls(1));
        dispatcher.create_token(get_default_token_details());
    }

    #[test]
    fn test_ico_launch_presale_with_created_token() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let buy_token = deploy_erc20(OWNER);
        cheat_caller_address(contract_address, USER, CheatSpan::TargetCalls(1));
        let token = dispatcher.create_token(get_default_token_details());
        config(buy_token, contract_address);

        cheat_caller_address(token, USER, CheatSpan::TargetCalls(3));
        let token_dispatcher = IERC20Dispatcher { contract_address: token };
        let user_balance = token_dispatcher.balance_of(USER);
        token_dispatcher.approve(contract_address, user_balance);

        let details = init_presale_details(buy_token, false);
        assert(token_dispatcher.balance_of(contract_address) == 0, 'INVALID INIT BALANCE');

        let mut spy = spy_events();
        launch_presale(token, details, dispatcher, USER);
        assert(token_dispatcher.balance_of(contract_address) > 0, 'INVALID CONTRACT BALANCE');

        let expected_event = ICO::Event::PresaleLaunched(
            PresaleLaunched {
                buy_token: details.buy_token,
                presale_rate: details.presale_rate,
                soft_cap: details.soft_cap,
                hard_cap: details.hard_cap,
                liquidity_percentage: details.liquidity_percentage,
                listing_rate: details.listing_rate,
                start_time: details.start_time,
                end_time: details.end_time,
                liquidity_lockup: details.liquidity_lockup,
            },
        );

        spy.assert_emitted(@array![(contract_address, expected_event)]);
    }

    #[test]
    #[should_panic(expected: 'BUY TOKEN NOT SUPPORTED')]
    fn test_ico_launch_presale_invalid_buy_token() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let buy_token = deploy_erc20(OWNER);
        cheat_caller_address(contract_address, USER, CheatSpan::TargetCalls(1));
        let token = dispatcher.create_token(get_default_token_details());

        let details = init_presale_details(buy_token, false);
        launch_presale(token, details, dispatcher, USER);
    }

    #[test]
    fn test_ico_launch_presale_with_existing_token() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let token = deploy_erc20(OWNER);
        let buy_token = deploy_erc20(OWNER);
        config(buy_token, contract_address);

        cheat_caller_address(token, OWNER, CheatSpan::TargetCalls(3));
        let token_dispatcher = IERC20Dispatcher { contract_address: token };
        let user_balance = token_dispatcher.balance_of(OWNER);
        token_dispatcher.approve(contract_address, user_balance);

        let details = init_presale_details(buy_token, false);
        assert(token_dispatcher.balance_of(contract_address) == 0, 'INVALID INIT BALANCE');
        launch_presale(token, details, dispatcher, OWNER);
        assert(token_dispatcher.balance_of(contract_address) > 0, 'INVALID CONTRACT BALANCE');
    }

    #[test]
    #[should_panic(expected: 'VERIFICATION FAILED')]
    fn test_ico_launch_presale_should_panic_on_token_ownership_non_owner() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let buy_token = deploy_erc20(OWNER);
        cheat_caller_address(contract_address, USER, CheatSpan::TargetCalls(1));
        let token = dispatcher.create_token(get_default_token_details());
        config(buy_token, contract_address);

        let token_dispatcher = IERC20Dispatcher { contract_address: token };
        let user_balance = token_dispatcher.balance_of(OWNER);
        cheat_caller_address(token, OWNER, CheatSpan::TargetCalls(1));
        token_dispatcher.approve(contract_address, user_balance);

        let details = init_presale_details(buy_token, false);
        launch_presale(token, details, dispatcher, OWNER);
    }

    #[test]
    #[should_panic(expected: 'VERIFICATION FAILED')]
    fn test_ico_launch_presale_should_panic_on_token_ownership_unverified_owner() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let buy_token = deploy_erc20(OWNER);
        let token = deploy_erc20(USER);
        let token_dispatcher = IERC20Dispatcher { contract_address: token };
        config(buy_token, contract_address);

        // the presale launcher is the user, but invalidate ownership
        // send 20 percent of the total supply to another user
        let balance = token_dispatcher.balance_of(USER);
        println!("Balance of user: {}", balance);
        let amount = 20 * balance / 100;
        cheat_caller_address(token, USER, CheatSpan::TargetCalls(3));
        token_dispatcher.transfer(PROTOCOL, amount);

        let user_balance = token_dispatcher.balance_of(USER);
        token_dispatcher.approve(contract_address, user_balance);

        let details = init_presale_details(buy_token, false);
        launch_presale(token, details, dispatcher, USER);
    }

    #[test]
    #[ignore]
    #[should_panic]
    fn test_ico_launch_presale_incorrect_presale_details() {}

    #[test]
    #[ignore]
    #[should_panic(expected: 'PRESALE ALREADY LAUNCHED')]
    fn test_ico_launch_presale_with_already_launched_token() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let token = deploy_erc20(OWNER);
        let buy_token = deploy_erc20(OWNER);
        config(buy_token, contract_address);

        let token_dispatcher = IERC20Dispatcher { contract_address: token };
        let user_balance = token_dispatcher.balance_of(OWNER);
        cheat_caller_address(token, OWNER, CheatSpan::TargetCalls(1));
        token_dispatcher.approve(contract_address, user_balance);

        let details = init_presale_details(buy_token, false);
        assert(token_dispatcher.balance_of(contract_address) == 0, 'INVALID INIT BALANCE');
        launch_presale(token, details, dispatcher, OWNER);
        launch_presale(token, details, dispatcher, OWNER);
    }

    #[test]
    #[ignore]
    #[should_panic(expected: "CONFIG REQUIRES 20 PERCENT OF SUPPLY TO NOT BE SOLD")]
    fn test_ico_launch_presale_below_min_supply_threshold() {}
    // Remember the storage mutable issh, with update status -- doesn't take in a ref of token.
    // TODO: Don't forget to test this state.

    #[test]
    #[ignore]
    #[should_panic(expected: 'CALLER NOT WHITELISTED')]
    fn test_ico_buy_token_should_panic_on_caller_not_whitelisted() {}

    #[test]
    #[ignore]
    fn test_ico_buy_token_success() {}

    #[test]
    #[ignore]
    #[should_panic(expected: 'PRESALE STATUS ERROR')]
    fn test_ico_buy_token_should_panic_on_invalid_presale() {}
    // Test buy_token for a token twice, run claim_all, it shouldn't throw an error, but it should
// run perfectly.
// buy_token pushes the token's contract twice, so the second call to _claim should do
// absolutely nothing.
// But claim won't work until the token is deployed to Ekubo sepolia.

    /// transfer from owner to another user 80% of tokens, and try to launch a presale
///
}
