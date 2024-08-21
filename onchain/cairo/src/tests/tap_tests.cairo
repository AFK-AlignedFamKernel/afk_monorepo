#[cfg(test)]
mod identity_tests {
    use afk::quests::tap::{ITapQuestsDispatcher, ITapQuestsDispatcherTrait};
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
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


    fn request_fixture() -> (ContractAddress, IERC20Dispatcher, ITapQuestsDispatcher) {
        // println!("request_fixture");
        let erc20_class = declare_erc20();
        let factory_class = declare_tap();
        request_fixture_custom_classes(erc20_class, factory_class)
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass, factory_class: ContractClass
    ) -> (ContractAddress, IERC20Dispatcher, ITapQuestsDispatcher) {
        let sender_address: ContractAddress = 123.try_into().unwrap();
        let erc20 = deploy_erc20(erc20_class, 'USDC token', 'USDC', 1_000_000, sender_address);
        // let token_address = erc20.contract_address.clone();
        let factory = deploy_tap(factory_class, sender_address);
        (sender_address, erc20, factory)
    }

    fn deploy_tap(class: ContractClass, admin: ContractAddress,) -> ITapQuestsDispatcher {
        let mut calldata = array![];
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        ITapQuestsDispatcher { contract_address }
    }

    fn declare_tap() -> ContractClass {
        declare("TapQuests").unwrap()
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

    fn run_tap_daily(tap: ITapQuestsDispatcher,) {
        tap.handle_tap_daily();
    }

    #[test]
    fn tap_daily() {
        println!("tap_daily");
        let (sender_address, _, factory) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(factory.contract_address, sender_address);
        run_tap_daily(factory);
    }
// #[test]
// #[should_panic]
// fn tap_daily_already_done() {
//     println!("tap_daily_already_done");
//     let (sender_address, _, factory) = request_fixture();
//     cheat_caller_address_global(sender_address);
//     start_cheat_caller_address(factory.contract_address, sender_address);
//     run_tap_daily(factory);
//     println!("redo one tap too early");
//     run_tap_daily(factory);
// }
}
