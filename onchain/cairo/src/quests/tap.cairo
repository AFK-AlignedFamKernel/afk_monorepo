#[starknet::contract]
mod TapQuests {
    use afk::interfaces::quest::{ITapQuests, IQuest};
    use afk::types::tap_types::{TapUserStats, TapDailyEvent};
    use core::num::traits::Zero;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    const DAILY_TIMESTAMP_SECONDS: u64 = 60 * 60 * 24;

    #[storage]
    struct Storage {
        tap_by_users: Map<ContractAddress, TapUserStats>,
        token_reward: u32,
        claimed: Map<ContractAddress, bool>,
        is_claimable: Map<ContractAddress, bool>,
        is_reward_nft: bool,
        is_reward_token: bool,
    }


    #[constructor]
    fn constructor(
        ref self: ContractState, token_reward: u32, is_reward_nft: bool, is_reward_token: bool
    ) {
        self.token_reward.write(token_reward);
        self.is_reward_nft.write(is_reward_nft);
        self.is_reward_token.write(is_reward_token);
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TapDailyEvent: TapDailyEvent,
    }

    #[abi(embed_v0)]
    impl TapQuestImpl of ITapQuests<ContractState> {
        fn get_tap_user_stats(self: @ContractState, user: ContractAddress) -> TapUserStats {
            self.tap_by_users.read(user)
        }

        fn handle_tap_daily(ref self: ContractState) {
            let caller = get_contract_address();
            let tap_old = self.tap_by_users.read(caller);
            let timestamp = get_block_timestamp();
            if tap_old.owner.is_zero() {
                let tap = TapUserStats { owner: caller, last_tap: timestamp, total_tap: 1 };
                self.tap_by_users.entry(caller).write(tap);
                self.is_claimable.entry(caller).write(true);
                self.emit(TapDailyEvent { owner: caller, last_tap: timestamp, total_tap: 1 });
            } else {
                let mut tap = self.tap_by_users.read(caller);
                let last_tap = tap.last_tap.clone();

                assert(timestamp >= last_tap + DAILY_TIMESTAMP_SECONDS, 'too early');

                tap.last_tap = get_block_timestamp();
                let total = tap.total_tap + 1;
                tap.total_tap = total.clone();
                self.tap_by_users.entry(caller).write(tap);
                self.is_claimable.entry(caller).write(true);
                self.emit(TapDailyEvent { owner: caller, last_tap: timestamp, total_tap: total });
            }
        }
    }

    #[abi(embed_v0)]
    impl TapQuest of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> (u32, bool) {
            if self.is_reward_token.read() && self.is_reward_nft.read() {
                return (self.token_reward.read(), true);
            } else if self.is_reward_token.read() {
                return (self.token_reward.read(), false);
            } else {
                (0, true)
            }
        }

        fn is_claimable(self: @ContractState, user: ContractAddress) -> bool {
            //TODO self.is_claimable.read(user)
            true
        }
    }
}
