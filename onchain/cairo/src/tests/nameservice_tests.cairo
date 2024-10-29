#[cfg(test)]
mod nameservice_tests {
    use afk::afk_id::nameservice::Nameservice::Event;
    use afk::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::interfaces::erc20_mintable::{IERC20MintableDispatcher, IERC20MintableDispatcherTrait};
    use afk::interfaces::nameservice::{INameserviceDispatcher, INameserviceDispatcherTrait};
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, start_cheat_caller_address,
        stop_cheat_caller_address, spy_events, DeclareResultTrait, EventSpyAssertionsTrait,
    };

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress, contract_address_const,
        get_block_timestamp, get_contract_address, ClassHash
    };
    
    fn ADMIN() -> ContractAddress {
        starknet::contract_address_const::<1>()  // Using 1 instead of 123
    }

    fn CALLER() -> ContractAddress {
        starknet::contract_address_const::<2>()  // Using 2 instead of 5
    }

    const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
    const YEAR_IN_SECONDS: u64 = 31536000_u64;

    fn setup() -> (INameserviceDispatcher, IERC20Dispatcher, IERC20MintableDispatcher) {
        let erc20_mintable_class = declare("ERC20Mintable").unwrap().contract_class();
        let (payment_token_dispatcher, payment_token_mintable_dispatcher) = deploy_erc20_mint(
            *erc20_mintable_class, "PaymentToken", "PAY", ADMIN(), 1_000_000_u256,
        );
    
        let nameservice_class = declare("Nameservice").unwrap().contract_class();
    
        let mut calldata = array![];
        ADMIN().serialize(ref calldata); // owner
        ADMIN().serialize(ref calldata); // admin
    
        let (nameservice_address, _) = nameservice_class.deploy(@calldata).unwrap();
    
        let nameservice_dispatcher = INameserviceDispatcher { contract_address: nameservice_address };
    
        // Set the token_quote in the nameservice contract
        start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
        nameservice_dispatcher.set_token_quote(payment_token_dispatcher.contract_address);
        nameservice_dispatcher.update_subscription_price(100_u256);
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
        let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) = setup();
    
        // Mint tokens to CALLER
        start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
        payment_token_mintable_dispatcher.mint(CALLER(), 1000_u256);
        stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);
    
        // Approve Nameservice contract to spend CALLER's tokens
        start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
        payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 1000_u256);
        stop_cheat_caller_address(payment_token_dispatcher.contract_address);
    
        // CALLER claims a username
        let username = "test".try_into().unwrap();
    
        start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
        nameservice_dispatcher.claim_username(username);
        stop_cheat_caller_address(nameservice_dispatcher.contract_address);
    
        // Verify username mapping
        let stored_username = nameservice_dispatcher.get_username(CALLER());
        assert(stored_username == username, 'Username was not set correctly');
    
        let stored_address = nameservice_dispatcher.get_username_address(username);
        assert(stored_address == CALLER(), 'Address was not set correctly');
    
        // Verify subscription expiry
        let expiry = nameservice_dispatcher.get_subscription_expiry(CALLER());
        let current_time = get_block_timestamp();
        assert(expiry > current_time, 'Subscription expiry not set correctly');
    
        // Verify token balances
        let caller_balance = payment_token_dispatcher.balance_of(CALLER());
        assert(caller_balance == 900_u256, 'Payment token balance incorrect');
    
        let contract_balance = payment_token_dispatcher.balance_of(nameservice_dispatcher.contract_address);
        assert(contract_balance == 100_u256, 'Contract token balance incorrect');
    }    

    
    // #[test]
    // fn test_change_username() {
    //     let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) = setup();

    //     // Mint and approve tokens
    //     start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
    //     payment_token_mintable_dispatcher.mint(CALLER(), 1000_u256);
    //     stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

    //     start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
    //     payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 1000_u256);
    //     stop_cheat_caller_address(payment_token_dispatcher.contract_address);

    //     // Claim initial username
    //     let username = 'test'.try_into().unwrap();

    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
    //     nameservice_dispatcher.claim_username(username);
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    //     // Change username
    //     let new_username = 'new'.try_into().unwrap();

    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
    //     nameservice_dispatcher.change_username(new_username);
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    //     // Verify changes
    //     let stored_username = nameservice_dispatcher.get_username(CALLER());
    //     assert(stored_username == new_username, 'Username was not changed correctly');

    //     let old_username_address = nameservice_dispatcher.get_username_address(username);
    //     assert(old_username_address == starknet::contract_address_const::<0>(), 'Old username still mapped');

    //     let new_username_address = nameservice_dispatcher.get_username_address(new_username);
    //     assert(new_username_address == CALLER(), 'New username not mapped correctly');
    // }

    // #[test]
    // fn test_renew_subscription() {
    //     let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) = setup();

    //     // Mint and approve tokens
    //     start_cheat_caller_address(payment_token_mintable_dispatcher.contract_address, ADMIN());
    //     payment_token_mintable_dispatcher.mint(CALLER(), 1000_u256);
    //     stop_cheat_caller_address(payment_token_mintable_dispatcher.contract_address);

    //     start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
    //     payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 1000_u256);
    //     stop_cheat_caller_address(payment_token_dispatcher.contract_address);

    //     // Claim username
    //     let username = 'test'.try_into().unwrap();

    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
    //     nameservice_dispatcher.claim_username(username);
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    //     // Get current expiry
    //     let current_expiry = nameservice_dispatcher.get_subscription_expiry(CALLER());

    //     // Advance time by half a year
    //     let half_year = 15768000_u64;
    //     let new_timestamp = get_block_timestamp() + half_year;
    //     start_warp(nameservice_dispatcher.contract_address, new_timestamp);

    //     // Renew subscription
    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
    //     nameservice_dispatcher.renew_subscription();
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    //     // Verify new expiry
    //     let new_expiry = nameservice_dispatcher.get_subscription_expiry(CALLER());
    //     assert(new_expiry == current_expiry + YEAR_IN_SECONDS, 'Subscription not renewed correctly');

    //     // Verify token balance
    //     let caller_balance = payment_token_dispatcher.balance_of(CALLER());
    //     assert(caller_balance == 800_u256, 'Payment token balance incorrect after renewal');
    // }

    // #[test]
    // fn test_withdraw_fees() {
    //     let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) = setup();

    //     // Mint and approve tokens
    //     start_cheat_caller_address(payment_token_dispatcher.contract_address, ADMIN());
    //     payment_token_dispatcher.mint(CALLER(), 1000_u256);
    //     stop_cheat_caller_address(payment_token_dispatcher.contract_address);

    //     start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
    //     payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 1000_u256);
    //     stop_cheat_caller_address(payment_token_dispatcher.contract_address);

    //     // Claim username
    //     let username = 'test'.try_into().unwrap();

    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
    //     nameservice_dispatcher.claim_username(username);
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    //     // Withdraw fees
    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, ADMIN());
    //     nameservice_dispatcher.withdraw_fees(100_u256);
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    //     // Verify ADMIN balance
    //     let admin_balance = payment_token_dispatcher.balance_of(ADMIN());
    //     assert(admin_balance == 1_000_000_u256 + 100_u256, 'Admin did not receive fees');

    //     // Verify contract balance
    //     let contract_balance = payment_token_dispatcher.balance_of(nameservice_dispatcher.contract_address);
    //     assert(contract_balance == 0_u256, 'Contract balance not zero after withdrawal');
    // }

    // #[test]
    // #[should_panic(expected: ('Username already claimed',))]
    // fn test_claim_username_already_claimed() {
    //     let (nameservice_dispatcher, payment_token_dispatcher, payment_token_mintable_dispatcher) = setup();

    //     let other_user: ContractAddress = 6.try_into().unwrap();

    //     // Mint and approve tokens for CALLER and other_user
    //     start_cheat_caller_address(payment_token_dispatcher.contract_address, ADMIN());
    //     payment_token_dispatcher.mint(CALLER(), 1000_u256);
    //     payment_token_dispatcher.mint(other_user, 1000_u256);
    //     stop_cheat_caller_address(payment_token_dispatcher.contract_address);

    //     start_cheat_caller_address(payment_token_dispatcher.contract_address, CALLER());
    //     payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 1000_u256);
    //     stop_cheat_caller_address(payment_token_dispatcher.contract_address);

    //     start_cheat_caller_address(payment_token_dispatcher.contract_address, other_user);
    //     payment_token_dispatcher.approve(nameservice_dispatcher.contract_address, 1000_u256);
    //     stop_cheat_caller_address(payment_token_dispatcher.contract_address);

    //     // CALLER claims a username
    //     let username = 'test'.try_into().unwrap();

    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, CALLER());
    //     nameservice_dispatcher.claim_username(username);
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);

    //     // other_user tries to claim the same username
    //     start_cheat_caller_address(nameservice_dispatcher.contract_address, other_user);
    //     nameservice_dispatcher.claim_username(username);
    //     stop_cheat_caller_address(nameservice_dispatcher.contract_address);
    // }

}
