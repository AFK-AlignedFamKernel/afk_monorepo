#[starknet::contract]
pub mod HodlQuest {
    use afk::interfaces::pixel::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
    use afk::interfaces::quests::{IQuest};
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    #[storage]
    struct Storage {
        art_peace: ContractAddress,
        reward: u32,
        extra_pixels_needed: u32,
        claimed: Map<ContractAddress, bool>,
    }


    #[derive(Drop, Serde)]
    pub struct HodlQuestInitParams {
        pub art_peace: ContractAddress,
        pub reward: u32,
        pub extra_pixels_needed: u32
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: HodlQuestInitParams) {
        self.art_peace.write(init_params.art_peace);
        self.reward.write(init_params.reward);
        self.extra_pixels_needed.write(init_params.extra_pixels_needed);
    }

    #[abi(embed_v0)]
    impl HodlQuestImpl of IQuest<ContractState> {
        fn get_reward(self: @ContractState) -> u32 {
            self.reward.read()
        }

        fn is_claimable(
            self: @ContractState, user: ContractAddress, calldata: Span<felt252>
        ) -> bool {
            if self.claimed.read(user) {
                return false;
            }

            let art_peace_dispatcher = IArtPeaceDispatcher {
                contract_address: self.art_peace.read()
            };

            let user_extra_pixels = art_peace_dispatcher.get_user_extra_pixels_count(user.into());

            if user_extra_pixels >= self.extra_pixels_needed.read() {
                return true;
            }

            false
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
