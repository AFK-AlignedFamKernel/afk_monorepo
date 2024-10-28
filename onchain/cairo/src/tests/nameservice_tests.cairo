#[cfg(test)]
mod nameservice_tests {
    // Imports from your project
    // use afk::afk_id::nameservice::Nameservice::Event;
    use afk::interfaces::nameservice::{INameserviceDispatcher, INameserviceDispatcherTrait};
    use afk::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    // use afk::types::id_types::{
    //     UserNameClaimed, UserNameChanged, SubscriptionRenewed, PriceUpdated
    // };

    // Standard library imports
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, 
        get_block_timestamp, ClassHash
    };
    use core::{
        array::SpanTrait, traits::Into, array::ArrayTrait,
        option::OptionTrait, result::ResultTrait
    };
    use openzeppelin::utils::serde::SerializedAppend;

    // Test framework imports
    use snforge_std::{declare, ContractClass, ContractClassTrait, DeclareResult};
    use snforge_std::cheatcodes::{
        CheatTarget, EventSpy, spy_events, start_cheat_caller_address,
        stop_cheat_caller_address, start_cheat_block_timestamp,
        stop_cheat_block_timestamp, EventAssertions
    };
        
    // Constants
    const YEAR_IN_SECONDS: u64 = 31536000_u64;
    const INITIAL_PRICE: u256 = 1000000;
    const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

    // Test Fixture
    fn setup() -> (ContractAddress, IERC20Dispatcher, INameserviceDispatcher) {
        let owner: ContractAddress = contract_address_const::<'OWNER'>();
        let admin: ContractAddress = contract_address_const::<'ADMIN'>();

        // Deploy mock ERC20
        let erc20_class = declare('MockERC20');
        let mut constructor_calldata = array![];
        'Test Token'.serialize(ref constructor_calldata);
        'TST'.serialize(ref constructor_calldata);
        1000000_u256.serialize(ref constructor_calldata);
        owner.serialize(ref constructor_calldata);
        18_u8.serialize(ref constructor_calldata);

        let (erc20_address, _) = erc20_class.deploy(@constructor_calldata).unwrap();
        let erc20 = IERC20Dispatcher { contract_address: erc20_address };

        // Deploy Nameservice
        let nameservice_class = declare('Nameservice');
        let mut ns_calldata = array![
            owner.into(), 
            admin.into(),
            erc20_address.into()
        ];

        let (nameservice_address, _) = nameservice_class.deploy(@ns_calldata).unwrap();
        let nameservice = INameserviceDispatcher { contract_address: nameservice_address };

        (owner, erc20, nameservice)
    }

    // #[test]
    // fn test_constructor() {
    //     let (owner, erc20, nameservice) = setup();
        
    //     // Check initial state
    //     let price = nameservice.get_subscription_price();
    //     assert(price == INITIAL_PRICE, 'Wrong initial price');
        
    //     // Try to get subscription expiry for a non-existent user
    //     let random_user = contract_address_const::<'RANDOM'>();
    //     let expiry = nameservice.get_subscription_expiry(random_user);
    //     assert(expiry == 0, 'Non-zero expiry for new user');
    // }

    // #[test]
    // fn test_claim_username() {
    //     let (owner, erc20, nameservice) = setup();
    //     let mut spy = spy_events(nameservice.contract_address);
        
    //     // Setup test user
    //     let user = contract_address_const::<'USER'>();
    //     let username: felt252 = 'test.afk';

    //     // Fund and approve
    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), owner);
    //     erc20.transfer(user, INITIAL_PRICE);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), user);
    //     erc20.approve(nameservice.contract_address, INITIAL_PRICE);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     // Claim username
    //     start_cheat_caller_address(CheatTarget::One(nameservice.contract_address), user);
    //     nameservice.claim_username(username);

    //     // Verify username claimed
    //     let claimed_address = nameservice.get_username_address(username);
    //     assert(claimed_address == user, 'Wrong username owner');

    //     let user_username = nameservice.get_username(user);
    //     assert(user_username == username, 'Wrong username stored');

    //     // Verify event
    //     // spy.assert_emitted(
    //     //     array![
    //     //         (
    //     //             nameservice.contract_address,
    //     //             UserNameClaimed { 
    //     //                 username, 
    //     //                 address: user,
    //     //                 expiry: get_block_timestamp() + YEAR_IN_SECONDS
    //     //             }
    //     //         )
    //     //     ]
    //     // );
        
    //     stop_cheat_caller_address(CheatTarget::One(nameservice.contract_address));
    // }

    // #[test]
    // fn test_change_username() {
    //     let (owner, erc20, nameservice) = setup();
    //     let mut spy = spy_events(nameservice.contract_address);
        
    //     // Setup and claim initial username
    //     let user = contract_address_const::<'USER'>();
    //     let username1: felt252 = 'test1.afk';
    //     let username2: felt252 = 'test2.afk';

    //     // Fund and approve for initial claim
    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), owner);
    //     erc20.transfer(user, INITIAL_PRICE);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), user);
    //     erc20.approve(nameservice.contract_address, INITIAL_PRICE);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     // Claim first username
    //     start_cheat_caller_address(CheatTarget::One(nameservice.contract_address), user);
    //     nameservice.claim_username(username1);

    //     // Change username
    //     nameservice.change_username(username2);

    //     // Verify changes
    //     assert(nameservice.get_username_address(username2) == user, 'Wrong new username owner');
    //     assert(
    //         nameservice.get_username_address(username1) == contract_address_const::<0>(),
    //         'Old username not cleared'
    //     );

    //     // Verify event
    //     spy.assert_emitted(
    //         array![
    //             (
    //                 nameservice.contract_address,
    //                 UserNameChanged { 
    //                     old_username: username1,
    //                     new_username: username2,
    //                     address: user
    //                 }
    //             )
    //         ]
    //     );

    //     stop_cheat_caller_address(CheatTarget::One(nameservice.contract_address));
    // }

    // #[test]
    // fn test_renew_subscription() {
    //     let (owner, erc20, nameservice) = setup();
    //     let mut spy = spy_events(nameservice.contract_address);
        
    //     // Setup and claim username
    //     let user = contract_address_const::<'USER'>();
    //     let username: felt252 = 'test.afk';

    //     // Initial setup and claim
    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), owner);
    //     erc20.transfer(user, INITIAL_PRICE * 2);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), user);
    //     erc20.approve(nameservice.contract_address, INITIAL_PRICE * 2);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     // Claim username
    //     start_cheat_caller_address(CheatTarget::One(nameservice.contract_address), user);
    //     nameservice.claim_username(username);

    //     // Move time forward
    //     start_cheat_block_timestamp(YEAR_IN_SECONDS / 2);

    //     // Renew subscription
    //     nameservice.renew_subscription();

    //     // Verify renewal
    //     let new_expiry = nameservice.get_subscription_expiry(user);
    //     assert(
    //         new_expiry == YEAR_IN_SECONDS * 3 / 2, 
    //         'Wrong expiry after renewal'
    //     );

    //     // Verify event
    //     spy.assert_emitted(
    //         array![
    //             (
    //                 nameservice.contract_address,
    //                 SubscriptionRenewed { 
    //                     address: user,
    //                     expiry: new_expiry
    //                 }
    //             )
    //         ]
    //     );

    //     stop_cheat_block_timestamp();
    //     stop_cheat_caller_address(CheatTarget::One(nameservice.contract_address));
    // }

    // #[test]
    // #[should_panic(expected: ('Username already claimed', ))]
    // fn test_cannot_claim_taken_username() {
    //     let (owner, erc20, nameservice) = setup();
    //     let username: felt252 = 'test.afk';

    //     // Setup two users
    //     let user1 = contract_address_const::<'USER1'>();
    //     let user2 = contract_address_const::<'USER2'>();

    //     // Fund and approve for both users
    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), owner);
    //     erc20.transfer(user1, INITIAL_PRICE);
    //     erc20.transfer(user2, INITIAL_PRICE);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), user1);
    //     erc20.approve(nameservice.contract_address, INITIAL_PRICE);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     start_cheat_caller_address(CheatTarget::One(erc20.contract_address), user2);
    //     erc20.approve(nameservice.contract_address, INITIAL_PRICE);
    //     stop_cheat_caller_address(CheatTarget::One(erc20.contract_address));

    //     // First user claims
    //     start_cheat_caller_address(CheatTarget::One(nameservice.contract_address), user1);
    //     nameservice.claim_username(username);
    //     stop_cheat_caller_address(CheatTarget::One(nameservice.contract_address));

    //     // Second user attempts to claim same username
    //     start_cheat_caller_address(CheatTarget::One(nameservice.contract_address), user2);
    //     nameservice.claim_username(username); // Should panic
    // }
}