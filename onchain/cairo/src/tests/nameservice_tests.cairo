#[cfg(test)]
mod nameservice_tests {
    use starknet::ContractAddress;
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, EventSpy, Event,
        start_cheat_caller_address, stop_cheat_caller_address,
        start_cheat_block_timestamp, stop_cheat_block_timestamp, DeclareResultTrait,
    };
    use core::array::SpanTrait;
    use core::traits::Into;
    use core::array::ArrayTrait;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::interfaces::username_store::IUsernameStore;
    use core::option::OptionTrait;
    use core::result::ResultTrait;
    use openzeppelin::utils::serde::SerializedAppend;

    const YEAR_IN_SECONDS: u64 = 31536000_u64;
    const INITIAL_PRICE: u256 = 1000000;

    fn request_fixture() -> (ContractAddress, IERC20Dispatcher, IUsernameStoreDispatcher) {
        let erc20_class = declare_erc20();
        let nameservice_class = declare_nameservice();
        request_fixture_custom_classes(*erc20_class, *nameservice_class)
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass, nameservice_class: ContractClass
    ) -> (ContractAddress, IERC20Dispatcher, IUsernameStoreDispatcher) {
        let owner_address: ContractAddress = 123.try_into().unwrap();
        let admin_address: ContractAddress = 456.try_into().unwrap();
        
        // Deploy ERC20 token
        let erc20 = deploy_erc20(
            erc20_class, 'Test Token', 'TST', 1_000_000, owner_address
        );
        let token_address = erc20.contract_address;

        // Deploy Nameservice
        let nameservice = deploy_nameservice(
            nameservice_class, owner_address, admin_address
        );

        (owner_address, erc20, nameservice)
    }

    fn declare_nameservice() -> @ContractClass {
        declare("Nameservice").unwrap().contract_class()
    }

    fn declare_erc20() -> @ContractClass {
        declare("MockERC20").unwrap().contract_class()
    }

    fn deploy_nameservice(
        class: ContractClass, owner: ContractAddress, admin: ContractAddress
    ) -> IUsernameStoreDispatcher {
        let mut calldata = array![owner.into(), admin.into()];
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        IUsernameStoreDispatcher { contract_address }
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
        initial_supply.serialize(ref calldata);
        recipient.serialize(ref calldata);
        18_u8.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();
        IERC20Dispatcher { contract_address }
    }

    #[test]
    fn test_nameservice_end_to_end() {
        let (owner_address, erc20, nameservice) = request_fixture();
        
        // Set up test user
        let user_address: ContractAddress = 789.try_into().unwrap();
        let username: felt252 = 'test.afk';

        // Setup token approvals
        start_cheat_caller_address(erc20.contract_address, user_address);
        erc20.approve(nameservice.contract_address, INITIAL_PRICE);
        erc20.mint(user_address, INITIAL_PRICE * 2);
        stop_cheat_caller_address(erc20.contract_address);

        // Claim username
        start_cheat_caller_address(nameservice.contract_address, user_address);
        nameservice.claim_username(username);

        // Verify username claimed
        let claimed_address = nameservice.get_username_address(username);
        assert(claimed_address == user_address, 'Wrong username owner');

        let user_username = nameservice.get_username(user_address);
        assert(user_username == username, 'Wrong username stored');

        // Change username
        let new_username: felt252 = 'newtest.afk';
        nameservice.change_username(new_username);

        // Verify username changed
        let new_claimed_address = nameservice.get_username_address(new_username);
        assert(new_claimed_address == user_address, 'Wrong new username owner');

        let old_claimed_address = nameservice.get_username_address(username);
        assert(old_claimed_address == 0.try_into().unwrap(), 'Old username not cleared');

        // Test subscription renewal
        start_cheat_block_timestamp(YEAR_IN_SECONDS / 2); // Warp 6 months forward

        start_cheat_caller_address(erc20.contract_address, user_address);
        erc20.approve(nameservice.contract_address, INITIAL_PRICE);
        stop_cheat_caller_address(erc20.contract_address);

        nameservice.renew_subscription();
        stop_cheat_block_timestamp();
        
        stop_cheat_caller_address(nameservice.contract_address);
    }

    #[test]
    fn test_multiple_users() {
        let (owner_address, erc20, nameservice) = request_fixture();
        
        // Setup test users
        let user1: ContractAddress = 789.try_into().unwrap();
        let user2: ContractAddress = 101112.try_into().unwrap();
        let username1: felt252 = 'user1.afk';
        let username2: felt252 = 'user2.afk';

        // Setup token approvals for user1
        start_cheat_caller_address(erc20.contract_address, user1);
        erc20.approve(nameservice.contract_address, INITIAL_PRICE);
        erc20.mint(user1, INITIAL_PRICE);
        stop_cheat_caller_address(erc20.contract_address);

        // Claim username for user1
        start_cheat_caller_address(nameservice.contract_address, user1);
        nameservice.claim_username(username1);
        stop_cheat_caller_address(nameservice.contract_address);

        // Setup token approvals for user2
        start_cheat_caller_address(erc20.contract_address, user2);
        erc20.approve(nameservice.contract_address, INITIAL_PRICE);
        erc20.mint(user2, INITIAL_PRICE);
        stop_cheat_caller_address(erc20.contract_address);

        // Claim username for user2
        start_cheat_caller_address(nameservice.contract_address, user2);
        nameservice.claim_username(username2);
        stop_cheat_caller_address(nameservice.contract_address);

        // Verify usernames were claimed correctly
        assert(nameservice.get_username_address(username1) == user1, 'Wrong user1 username owner');
        assert(nameservice.get_username_address(username2) == user2, 'Wrong user2 username owner');
        assert(nameservice.get_username(user1) == username1, 'Wrong username for user1');
        assert(nameservice.get_username(user2) == username2, 'Wrong username for user2');
    }

    #[test]
    fn test_admin_functions() {
        let (owner_address, erc20, nameservice) = request_fixture();
        let admin_address: ContractAddress = 456.try_into().unwrap();
        
        // Test withdraw fees
        let withdraw_amount: u256 = 100000;
        
        // Add some tokens to contract
        start_cheat_caller_address(erc20.contract_address, nameservice.contract_address);
        erc20.mint(nameservice.contract_address, withdraw_amount);
        stop_cheat_caller_address(erc20.contract_address);

        // Withdraw as admin
        start_cheat_caller_address(nameservice.contract_address, admin_address);
        nameservice.withdraw_fees(withdraw_amount);

        // Verify withdrawal
        let admin_balance = erc20.balance_of(admin_address);
        assert(admin_balance == withdraw_amount, 'Wrong withdrawal amount');
        
        stop_cheat_caller_address(nameservice.contract_address);
    }
}