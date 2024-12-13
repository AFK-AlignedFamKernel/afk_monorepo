#[cfg(test)]
mod tap_tests {
    use afk_games::interfaces::quest::{ITapQuestsDispatcher, ITapQuestsDispatcherTrait};
    use snforge_std::{
        declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
        start_cheat_block_timestamp,
    };

    use starknet::{ContractAddress, get_block_timestamp};

    const DAILY_TIMESTAMP_SECONDS: u64 = 60 * 60 * 24;

    fn deploy_tap() -> ITapQuestsDispatcher {
        let class = declare("TapQuests").unwrap().contract_class();
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
