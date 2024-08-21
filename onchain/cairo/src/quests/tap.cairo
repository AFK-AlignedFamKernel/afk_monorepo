use afk::types::tap_types::{TapUserStats, TapDailyEvent};
use starknet::{ContractAddress, ClassHash};

#[starknet::interface]
pub trait ITapsQuests<T> {
    fn get_tap_user_stats(self: @T, user: ContractAddress) -> TapUserStats;
    fn handle_tap_daily(ref self: T);
}

#[starknet::contract]
mod TapQuests {
    use core::num::traits::Zero;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use super::{TapUserStats, TapDailyEvent};

    const DAILY_TIMESTAMP_SECONDS: u64 = 60 * 60 * 24;

    #[storage]
    struct Storage {
        tap_by_users: LegacyMap<ContractAddress, TapUserStats>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TapDailyEvent: TapDailyEvent,
    }

    #[abi(embed_v0)]
    impl TapsQuestImpl of super::ITapsQuests<ContractState> {
        fn get_tap_user_stats(self: @ContractState, user: ContractAddress) -> TapUserStats {
            self.tap_by_users.read(user)
        }

        fn handle_tap_daily(ref self: ContractState) {
            let caller = get_contract_address();
            let tap_old = self.tap_by_users.read(caller);
            let timestamp = get_block_timestamp();
            if tap_old.owner.is_zero() {
                let tap = TapUserStats { owner: caller, last_tap: timestamp, total_tap: 1 };
                self.tap_by_users.write(caller, tap);
                self.emit(TapDailyEvent { owner: caller, last_tap: timestamp, total_tap: 1 });
            } else {
                let mut tap = tap_old.clone();
                let last_tap = tap.last_tap;
                assert!(timestamp - last_tap < DAILY_TIMESTAMP_SECONDS, "too early");
                tap.last_tap = timestamp;

                let total = tap_old.total_tap + 1;
                tap.total_tap = total.clone();
                self.tap_by_users.write(caller, tap);
                self.emit(TapDailyEvent { owner: caller, last_tap: timestamp, total_tap: total });
            }
        }
    }
}
