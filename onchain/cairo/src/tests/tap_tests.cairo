#[cfg(test)]
mod tap_tests {
    // use afk::quests::tap::{ITapQuestsDispatcher, ITapQuestsDispatcherTrait};
    use afk::interfaces::quest::{
        ITapQuests, IQuest, ITapQuestsDispatcher, ITapQuestsDispatcherTrait
    };
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use core::array::SpanTrait;
    use core::num::traits::Zero;
    use core::traits::Into;
    use openzeppelin::account::interface::{ISRC6Dispatcher, ISRC6DispatcherTrait};
    use openzeppelin::utils::serde::SerializedAppend;

    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, SpyOn, EventSpy, EventFetcher,
        Event, EventAssertions, start_cheat_caller_address, cheat_caller_address_global,
        stop_cheat_caller_address, stop_cheat_caller_address_global, start_cheat_block_timestamp,
        CheatSpan, stop_cheat_block_timestamp
    };
    use starknet::syscalls::deploy_syscall;

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        get_block_timestamp, get_contract_address, ClassHash
    };

    const DAILY_TIMESTAMP_SECONDS: u64 = 60 * 60 * 24;

    fn deploy_tap() -> ITapQuestsDispatcher {
        let class = declare("TapQuests").unwrap();
        let mut calldata = array![];
        5.serialize(ref calldata);
        true.serialize(ref calldata);
        true.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();
        ITapQuestsDispatcher { contract_address }
    }

    fn run_tap_daily(tap: ITapQuestsDispatcher,) {
        tap.handle_tap_daily();
    }

    fn SENDER() -> ContractAddress {
        123.try_into().unwrap()
    }

    #[test]
    fn tap_daily() {
        let tap_dispatcher = deploy_tap();

        run_tap_daily(tap_dispatcher);

        start_cheat_caller_address(tap_dispatcher.contract_address, SENDER());
    }

    #[test]
    #[should_panic(expected: 'too early',)]
    fn tap_daily_already_done() {
        let tap_dispatcher = deploy_tap();

        run_tap_daily(tap_dispatcher);

        run_tap_daily(tap_dispatcher);
    }

    #[test]
    fn tap_daily_already_done_() {
        let tap_dispatcher = deploy_tap();

        run_tap_daily(tap_dispatcher);

        let end_timestamp = get_block_timestamp() + DAILY_TIMESTAMP_SECONDS;

        //simulate passage of time
        start_cheat_block_timestamp(tap_dispatcher.contract_address, end_timestamp);
        run_tap_daily(tap_dispatcher);
    }
}
