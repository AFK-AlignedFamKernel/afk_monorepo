#[starknet::contract]
pub mod QuestFactory {
    use afk::interfaces::quest::{
        IQuestFactory, IQuestDispatcher, IQuestDispatcherTrait, IQuestNFTDispatcher,
        IQuestNFTDispatcherTrait
    };
    use afk::interfaces::vault::{IERCVaultDispatcher, IERCVaultDispatcherTrait};
    use afk::types::quest::{QuestInfo, UserQuestInfo};


    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        // Map quest_id -> quest info
        quests: LegacyMap<u32, QuestInfo>,
        quest_count: u32,
        user_quests: LegacyMap<ContractAddress, u32>,
        // Map (user address, quest_id) -> user quest info
        user_quest_info: LegacyMap<(ContractAddress, u32), UserQuestInfo>,
        quest_nft: ContractAddress,
        vault: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, quest_nft: ContractAddress, vault: ContractAddress) {
        self.quest_nft.write(quest_nft);
        self.vault.write(vault);
    }

    #[abi(embed_v0)]
    impl QuestFactoryImpl of IQuestFactory<ContractState> {
        fn get_reward(self: @ContractState, quest: ContractAddress) -> (u32, bool) {
            IQuestDispatcher { contract_address: quest }.get_reward()
        }

        fn add_quest(ref self: ContractState, quest: QuestInfo) {
            let mut new_quest = quest.clone();
            new_quest.quest_id = self.quest_count.read();
            self.quests.write(self.quest_count.read(), new_quest);
            self.quest_count.write(self.quest_count.read() + 1);
        //TODO emit add quest event
        }

        fn get_quests(self: @ContractState) -> Span<QuestInfo> {
            let mut quest_array = array![];
            let mut i = 0;

            while i < self
                .quest_count
                .read() {
                    let quest = self.quests.read(i);
                    quest_array.append(quest);
                    i += 1;
                };

            quest_array.span()
        }

        fn get_quest(self: @ContractState, quest_id: u32) -> QuestInfo {
            self.quests.read(quest_id)
        }

        fn claim_reward(ref self: ContractState, quest_id: u32) {
            let caller = get_caller_address();
            let quest = self.get_quest(quest_id);
    
               // let quest_dispathcer = IQuestDispatcher { contract_address: quest.address };
            let quest_nft_dispatcher = IQuestNFTDispatcher {
                contract_address: self.quest_nft.read()
            };
            let vault_dispatcher = IERCVaultDispatcher { contract_address: self.vault.read() };

            // check if caller is eligible to claim reward
            assert(IQuestDispatcher { contract_address: quest.address }.is_claimable(caller), 'Quest not claimable');

            let (token_reward, nft_reward) = self.get_reward(quest.address);

            if token_reward > 0 {
                // mint erc20 token
                vault_dispatcher.mint_quest_token_reward(caller, token_reward);
            };

            // mint nft if it part of reward
            let mut nft_id = 0;
            if nft_reward {
                nft_id = quest_nft_dispatcher.mint(caller);
            };

            // update user quest info state
            let mut user_quest = UserQuestInfo {
                quest_id: quest_id,
                user_address: caller,
                is_complete: true,
                claimed_token: token_reward,
                claimed_nft_id: nft_id.try_into().unwrap()
            };

            self.user_quest_info.write((caller, quest_id), user_quest);
            self.user_quests.write(caller, quest_id);
        //TODO emit claim event
        }

        fn get_user_quest_info(self: @ContractState, quest_id: u32) -> UserQuestInfo {
            self.user_quest_info.read((get_caller_address(), quest_id))}
    }
}
