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
        IICODispatcherTrait, PresaleDetails, PresaleStatus, TokenCreated, TokenDetails,
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
        let paid_in = deploy_erc20();
        let exchange_address = EKUBO_EXCHANGE;

        deploy(token_class_hash, fee_amount, fee_to, max_token_supply, paid_in, exchange_address)
    }

    /// For base coin -- buy token
    fn deploy_erc20() -> ContractAddress {
        let mut calldata = array![];
        ('USD COIN', 'USDC', 1_000_000_u256 * fast_power(10, 18), OWNER, 18_u8)
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

    #[test]
    fn test_ico_deploy_erc20() {
        let contract_address = deploy_erc20();
        let dispatcher = IERC20Dispatcher { contract_address };
        assert(dispatcher.name() == 'USD COIN', 'ERC20 NAME MISMATCH');
        assert(dispatcher.symbol() == 'USDC', 'ERC20 SYMBOL MISMATCH');
        assert(dispatcher.total_supply() == get_max_supply(), 'ERC20 SUPPLY MISMATCH');
        assert(dispatcher.decimals() == 18_u8, 'ERC20 DECIMALS MISMATCH');
        assert(dispatcher.balance_of(OWNER) == get_max_supply(), 'ERC20 OWNER MISMATCH');
    }
    // Test buy_token for a token twice, run claim_all, it shouldn't throw an error, but it should
    // run perfectly.
    // buy_token pushes the token's contract twice, so the second call to _claim should do
    // absolutely nothing.
    // But claim won't work until the token is deployed to Ekubo sepolia.

    /// transfer from owner to another user 80% of tokens, and try to launch a presale
    ///

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

    fn launch_presale(
        token_address: ContractAddress, details: PresaleDetails, dispatcher: IICODispatcher,
    ) {
        let contract = dispatcher.contract_address;
        cheat_caller_address(contract, USER, CheatSpan::TargetCalls(1));
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

    fn config_for_buy_token(buy_tokens: Array<ContractAddress>) -> ContractConfig {
        ContractConfig {
            exchange_address: Option::None,
            accepted_buy_tokens: buy_tokens,
            fee: Option::None,
            max_token_supply: Option::None,
            paid_in: Option::None,
            token_class_hash: Option::None,
        }
    }

    #[test]
    fn test_ico_launch_presale_with_created_token() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let buy_token = deploy_erc20();
        cheat_caller_address(contract_address, USER, CheatSpan::TargetCalls(1));
        let token = dispatcher.create_token(get_default_token_details());

        cheat_caller_address(contract_address, ADMIN, CheatSpan::TargetCalls(1));
        let config = config_for_buy_token(array![buy_token]);
        let config_dispatcher = IICOConfigDispatcher { contract_address };
        config_dispatcher.set_config(config);
        let details = init_presale_details(buy_token, false);
        launch_presale(token, details, dispatcher);
    }

    #[test]
    #[should_panic(expected: 'BUY TOKEN NOT SUPPORTED')]
    fn test_ico_launch_presale_invalid_buy_token() {
        let contract_address = deploy_default();
        let dispatcher = IICODispatcher { contract_address };
        let buy_token = deploy_erc20();
        cheat_caller_address(contract_address, USER, CheatSpan::TargetCalls(1));
        let token = dispatcher.create_token(get_default_token_details());

        let details = init_presale_details(buy_token, false);
        launch_presale(token, details, dispatcher);
    }

    #[test]
    fn test_ico_launch_presale_with_existing_token() {}

    #[test]
    fn test_ico_launch_presale_with_token() { // launch with a token that the owner has sent more than 80 percent of it's supply to another
    // user then call `launch_presale` with that token_address
    }

    #[test]
    #[should_panic]
    fn test_ico_launch_presale_incorrect_presale_details() {}

    #[test]
    #[should_panic(expected: 'PRESALE ALREADY LAUNCHED')]
    fn test_ico_launch_presale_with_already_launched_token() {}

    #[test]
    #[should_panic(expected: "CONFIG REQUIRES 20 PERCENT OF SUPPLY TO NOT BE SOLD")]
    fn test_ico_launch_presale_below_min_supply_threshold() {}
    // Remember the storage mutable issh, with update status -- doesn't take in a ref of token.
    // TODO: Don't forget to test this state.

    #[test]
    #[should_panic(expected: 'CALLER NOT WHITELISTED')]
    fn test_ico_buy_token_should_panic_on_caller_not_whitelisted() {}

    #[test]
    fn test_ico_buy_token_success() {}

    #[test]
    #[should_panic(expected: 'PRESALE STATUS ERROR')]
    fn test_ico_buy_token_should_panic_on_invalid_presale() {}
}
