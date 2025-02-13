#[starknet::contract]
pub mod UsernameQuest {
    use afk_games::interfaces::quests::{IQuest};
    use afk_games::interfaces::username_store::{
        IUsernameStoreDispatcher, IUsernameStoreDispatcherTrait,
    };
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    use starknet::{ContractAddress, get_caller_address};
    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        reward: u32,
        username_store: IUsernameStoreDispatcher,
        claimed: Map<ContractAddress, bool>,
    }


    #[derive(Drop, Serde)]
    pub struct UsernameQuestInitParams {
        pub art_peace: ContractAddress,
        pub reward: u32,
        pub username_store: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: UsernameQuestInitParams) {
        self.art_peace.write(init_params.art_peace);
        self.reward.write(init_params.reward);
        self
            .username_store
            .write(IUsernameStoreDispatcher { contract_address: init_params.username_store });
    }

    #[abi(embed_v0)]
    impl UsernameQuestImpl of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let username = self.username_store.read().get_username(user);
            if username == 0 {
                return false;
            }

            return true;
        }

        fn claim(ref self: ContractState, user: ContractAddress, calldata: Span<felt252>) -> u32 {
            assert(get_caller_address() == self.art_peace.read(), 'Only ArtPeace can claim quests');

            assert(self.is_claimable(user, calldata), 'Quest not claimable');

            self.claimed.entry(user).write(true);
            let reward = self.reward.read();

            reward
        }
    }
}
