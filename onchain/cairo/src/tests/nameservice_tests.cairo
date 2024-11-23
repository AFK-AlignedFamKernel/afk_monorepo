#[cfg(test)]
mod nameservice_tests {
    use afk::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::interfaces::erc20_mintable::{IERC20MintableDispatcher, IERC20MintableDispatcherTrait};
    use afk::interfaces::nameservice::{INameserviceDispatcher, INameserviceDispatcherTrait};
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, start_cheat_caller_address,
        stop_cheat_caller_address, DeclareResultTrait
    };
    use starknet::{ContractAddress, get_block_timestamp};

    fn ADMIN() -> ContractAddress {
        starknet::contract_address_const::<1>()
    }
    fn CALLER() -> ContractAddress {
        starknet::contract_address_const::<2>()
    }
    fn NEW_CALLER() -> ContractAddress {
        starknet::contract_address_const::<3>()
    }
    const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
    const YEAR_IN_SECONDS: u64 = 31536000_u64;
    const PAYMENT_AMOUNT: felt252 = 10;

    fn setup() -> (INameserviceDispatcher, IERC20Dispatcher, IERC20MintableDispatcher) {
        let erc20_mintable_class = declare("ERC20Mintable").unwrap().contract_class();

        let (payment_token_dispatcher, payment_token_mintable_dispatcher) = deploy_erc20_mint(
            *erc20_mintable_class, "PaymentToken", "PAY", ADMIN(), 50_u256,
        );

        let nameservice_class = declare("Nameservice").unwrap().contract_class();

        // let mut calldata = array![ADMIN().into(), ADMIN().into()];
        let mut calldata = array![];
        ADMIN().serialize(ref calldata);
        ADMIN().serialize(ref calldata);
        10_u256.serialize(ref calldata);
        payment_token_dispatcher.contract_address.serialize(ref calldata);
        // calldata.append_serde(PAYMENT_AMOUNT);
        // calldata.append_serde(payment_token_dispatcher.contract_address);

        let (nameservice_address, _) = nameservice_class.deploy(@calldata).unwrap();

        let nameservice_dispatcher = INameserviceDispatcher {
            contract_address: nameservice_address
        };

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.set_token_quote(payment_token_dispatcher.contract_address);
        nameservice_dispatcher.update_subscription_price(10_u256); // Reduced price
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher)
    }

    fn deploy_erc20_mint(
        class: ContractClass,
        name: ByteArray,
        symbol: ByteArray,
        owner: ContractAddress,
        initial_supply: u256,
    ) -> (IERC20Dispatcher, IERC20MintableDispatcher) {
        let mut calldata: Array<felt252> = ArrayTrait::new();

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        owner.serialize(ref calldata);
        initial_supply.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        let erc20_dispatcher = IERC20Dispatcher { contract_address };
        let erc20_mintable_dispatcher = IERC20MintableDispatcher { contract_address };
        (erc20_dispatcher, erc20_mintable_dispatcher)
    }

    #[test]
    fn test_claim_username() {
        let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) =
            setup();

        let MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

        start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
        payment_token_mintable_dispatcher
            .set_role(recipient: ADMIN(), role: MINTER_ROLE, is_enable: true);
        payment_token_mintable_dispatcher.mint(CALLER(), 20_u256); // Reduced amount
        stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

        start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
        payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 20_u256);
        stop_cheat_caller_address(payment_token_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.set_is_payment_enabled(true);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let username = selector!("test");
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let stored_username = nameservice_dispatcher.get_username(CALLER());
        assert(stored_username == username, 'Username not set');

        let stored_address = nameservice_dispatcher.get_username_address(username);
        assert(stored_address == CALLER(), 'Address not set');

        let expiry = nameservice_dispatcher.get_subscription_expiry(CALLER());
        let current_time = get_block_timestamp();
        assert(expiry > current_time, 'Sub exp not set');

        let caller_balance = payment_token_dispatcher.balance_of(CALLER());
        assert(caller_balance == 10_u256, 'balance incorrect');

        let contract_balance = payment_token_dispatcher
            .balance_of(nameservice_dispatcher.contract_address);
        println!("The contract_balance is : {}", contract_balance);

        assert(contract_balance == 10_u256, 'token balance incorrect');
    }

    #[test]
    fn test_change_username() {
        let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) =
            setup();
        let MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

        start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
        payment_token_mintable_dispatcher
            .set_role(recipient: ADMIN(), role: MINTER_ROLE, is_enable: true);
        payment_token_mintable_dispatcher.mint(CALLER(), 20_u256);
        stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

        start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
        payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 20_u256);
        stop_cheat_caller_address(payment_token_dispatcher.contract_address);

        let username = selector!("test");
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let new_username = selector!("new");
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.change_username(new_username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let stored_username = nameservice_dispatcher.get_username(CALLER());
        assert(stored_username == new_username, 'Username incorrectly changed');

        let old_username_address = nameservice_dispatcher.get_username_address(username);
        assert(
            old_username_address == starknet::contract_address_const::<0>(),
            'Old usrnamestill mapped'
        );

        let new_username_address = nameservice_dispatcher.get_username_address(new_username);
        assert(new_username_address == CALLER(), 'User not mapped correctly');
    }

    #[test]
    fn test_renew_subscription() {
        let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) =
            setup();
        let MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

        start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
        payment_token_mintable_dispatcher
            .set_role(recipient: ADMIN(), role: MINTER_ROLE, is_enable: true);
        payment_token_mintable_dispatcher.mint(CALLER(), 20_u256);
        stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

        start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
        payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 20_u256);
        stop_cheat_caller_address(payment_token_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.set_is_payment_enabled(true);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let username = selector!("test");
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let current_expiry = nameservice_dispatcher.get_subscription_expiry(CALLER());

        let half_year = 15768000_u64;
        let new_timestamp = get_block_timestamp() + half_year;

        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.renew_subscription();
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let new_expiry = nameservice_dispatcher.get_subscription_expiry(CALLER());
        assert(new_expiry == current_expiry + YEAR_IN_SECONDS, 'Subscription not renewed');

        let caller_balance = payment_token_dispatcher.balance_of(CALLER());
        assert(caller_balance == 0_u256, 'Token balance incorrect');
    }

    #[test]
    fn test_withdraw_fees() {
        let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) =
            setup();
        let MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

        start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
        payment_token_mintable_dispatcher
            .set_role(recipient: ADMIN(), role: MINTER_ROLE, is_enable: true);
        payment_token_mintable_dispatcher.mint(CALLER(), 20_u256);
        stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

        start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
        payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 20_u256);
        stop_cheat_caller_address(payment_token_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.set_is_payment_enabled(true);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let username = selector!("test");
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.withdraw_fees(10_u256);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let admin_balance = payment_token_dispatcher.balance_of(ADMIN());
        assert(
            admin_balance == 60_u256, 'Admin did not receive fees'
        ); // 50 initial + 10 withdrawn

        let contract_balance = payment_token_dispatcher
            .balance_of(nameservice_dispatcher.contract_address);
        assert(contract_balance == 0_u256, 'Contract balance not zeroy');
    }

    #[test]
    fn test_subscription_price() {
        let (nameservice_dispatcher, _, _) = setup();

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        let subscription_price = nameservice_dispatcher.get_subscription_price();
        nameservice_dispatcher.update_subscription_price(30_u256);
        let new_subscription_price = nameservice_dispatcher.get_subscription_price();
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        assert(subscription_price == 10_u256, 'Price is not correct');
        assert(new_subscription_price == 30_u256, 'Price is not correct');
    }

    #[test]
    #[should_panic(expected: 'Username already claimed')]
    fn test_username_already_claimed() {
        let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) = setup();

        let MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

        start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
        payment_token_mintable_dispatcher.set_role(recipient: ADMIN(), role: MINTER_ROLE, is_enable: true);
        payment_token_mintable_dispatcher.mint(CALLER(), 20_u256);  // Reduced amount
        stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

        start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
        payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 20_u256);
        stop_cheat_caller_address(payment_token_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.set_is_payment_enabled(true);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let username = selector!("test");
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, NEW_CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);
    }

    #[test]
    #[should_panic(expected: 'User already has a username')]
    fn test_user_already_claimed() {
        let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) = setup();

        let MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

        start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
        payment_token_mintable_dispatcher.set_role(recipient: ADMIN(), role: MINTER_ROLE, is_enable: true);
        payment_token_mintable_dispatcher.mint(CALLER(), 20_u256);  // Reduced amount
        stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

        start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
        payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 20_u256);
        stop_cheat_caller_address(payment_token_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.set_is_payment_enabled(true);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        let username = selector!("test");
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    }
}
