#[cfg(test)]
mod keys_tests {
    use afk::keys::keys::{IKeysMarketplaceDispatcher, IKeysMarketplaceDispatcherTrait};
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::types::keys_types::{
        MINTER_ROLE, ADMIN_ROLE, KeysBonding, TokenQuoteBuyKeys, BondingType
    };
    use core::array::SpanTrait;
    use core::traits::Into;
    use openzeppelin::account::interface::{ISRC6Dispatcher, ISRC6DispatcherTrait};
    use openzeppelin::utils::serde::SerializedAppend;

    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, EventSpy, Event,
        start_cheat_caller_address, start_cheat_caller_address_global, stop_cheat_caller_address,
        stop_cheat_caller_address_global, start_cheat_block_timestamp, DeclareResultTrait,
    };
    // const INITIAL_KEY_PRICE:u256=1/100;

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        get_block_timestamp, get_contract_address
    };

    // const INITIAL_KEY_PRICE:u256=1/100;
    const INITIAL_KEY_PRICE: u256 = 1;
    const STEP_LINEAR_INCREASE: u256 = 1;

    fn request_fixture() -> (ContractAddress, IERC20Dispatcher, IKeysMarketplaceDispatcher) {
        // println!("request_fixture");
        let erc20_class = declare_erc20();
        let keys_class = declare_marketplace();
        request_fixture_custom_classes(*erc20_class, *keys_class)
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass, escrow_class: ContractClass
    ) -> (ContractAddress, IERC20Dispatcher, IKeysMarketplaceDispatcher) {
        let sender_address: ContractAddress = 123.try_into().unwrap();
        let erc20 = deploy_erc20(erc20_class, 'USDC token', 'USDC', 1_000_000, sender_address);
        let token_address = erc20.contract_address.clone();
        let keys = deploy_marketplace(
            escrow_class,
            sender_address,
            token_address.clone(),
            INITIAL_KEY_PRICE,
            STEP_LINEAR_INCREASE
        );
        (sender_address, erc20, keys)
    }

    fn declare_marketplace() -> @ContractClass {
        declare("KeysMarketplace").unwrap().contract_class()
    }

    fn declare_erc20() -> @ContractClass {
        declare("ERC20").unwrap().contract_class()
    }

    fn deploy_marketplace(
        class: ContractClass,
        admin: ContractAddress,
        token_address: ContractAddress,
        initial_key_price: u256,
        step_increase_linear: u256
    ) -> IKeysMarketplaceDispatcher {
        // println!("deploy marketplace");
        let mut calldata = array![admin.into()];
        calldata.append_serde(initial_key_price);
        calldata.append_serde(token_address);
        calldata.append_serde(step_increase_linear);
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        IKeysMarketplaceDispatcher { contract_address }
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

    // #[test]
    // fn test_instantiate_keys() {
    //     let (sender_address, erc20, keys) = request_fixture();
    //     let default_token = keys.get_default_token();
    //     assert(default_token.token_address == erc20.contract_address, 'no default token');
    //     assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');
    //     // println!("instantiate keys");
    //     start_cheat_caller_address(keys.contract_address, sender_address);
    //     keys.instantiate_keys();
    //     let mut key_user = keys.get_key_of_user(sender_address);
    //     println!("test key_user.owner {:?}", key_user.owner);
    //     println!("test sender_address {:?}", sender_address);
    //     assert(key_user.owner == sender_address, 'not same owner');
    //     // assert(key_user.token_quote == erc20.contract_address, 'not same token');
    // }

    #[test]
    fn keys_end_to_end() {
        let (sender_address, erc20, keys) = request_fixture();
        let amount_key_buy = 1_u256;
        start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        // start_cheat_caller_address(key_address, sender_address);
        erc20.approve(keys.contract_address, amount_key_buy);
        // Call a view function of the contract
        // Check default token used
        let default_token = keys.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');

        // Instantiate keys
        // start_cheat_caller_address(key_address, sender_address);
        stop_cheat_caller_address(erc20.contract_address);

        // println!("instantiate keys");
        start_cheat_caller_address(keys.contract_address, sender_address);

        keys.instantiate_keys();
        // println!("get all_keys");

        // let mut all_keys = keys.get_all_keys();
        let mut key_user = keys.get_key_of_user(sender_address);
        println!("test key_user.owner {:?}", key_user.owner);
        println!("test sender_address {:?}", sender_address);
        assert(key_user.owner == sender_address, 'not same owner');
        // println!("all_keys {:?}", all_keys);
        // println!("all_keys {:?}", all_keys);
        let amount_to_paid = keys
            .get_price_of_supply_key(sender_address, amount_key_buy, false, //    1,
            // BondingType::Basic, default_token.clone()
            );
        println!("test amount_to_paid {:?}", amount_to_paid);

        // erc20.approve(keys.contract_address, amount_to_paid*2);

        start_cheat_caller_address(erc20.contract_address, sender_address);
        // erc20.approve(keys.contract_address, amount_approve);
        erc20.approve(keys.contract_address, amount_to_paid);

        let allowance = erc20.allowance(sender_address, keys.contract_address);
        println!("test allowance {}", allowance);
        stop_cheat_caller_address(erc20.contract_address);

        start_cheat_caller_address(keys.contract_address, sender_address);
        keys.buy_keys(sender_address, amount_key_buy);

        let mut key_user = keys.get_key_of_user(sender_address);
        println!("test key_user total supply {:?}", key_user.total_supply);

        // Buy others key
        stop_cheat_caller_address(keys.contract_address);

        let amount_key_buy = 3_u256;

        // println!("all_keys {:?}", all_keys);
        let amount_to_paid = keys
            .get_price_of_supply_key(sender_address, amount_key_buy, false, //    1,
            // BondingType::Basic, default_token.clone()
            );
        start_cheat_caller_address(erc20.contract_address, sender_address);

        erc20.approve(keys.contract_address, amount_to_paid);

        let allowance = erc20.allowance(sender_address, keys.contract_address);
        println!("test allowance {}", allowance);
        stop_cheat_caller_address(erc20.contract_address);

        start_cheat_caller_address(keys.contract_address, sender_address);
        keys.buy_keys(sender_address, amount_key_buy);
        let mut key_user = keys.get_key_of_user(sender_address);

        println!("test key_user total supply {:?}", key_user.total_supply);
    }
}

