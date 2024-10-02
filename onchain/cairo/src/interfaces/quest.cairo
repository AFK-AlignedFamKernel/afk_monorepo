use afk::types::quest::{QuestInfo, UserQuestInfo};
use afk::types::tap_types::{TapUserStats};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IQuest<TContractState> {
    // Return the reward for the quest. (token, nft)
    fn get_reward(self: @TContractState) -> (u32, bool);
    // Return if the user can claim the quest reward.
    fn is_claimable(self: @TContractState, user: ContractAddress) -> bool;
}

#[starknet::interface]
pub trait ITapQuests<TContractState> {
    fn get_tap_user_stats(self: @TContractState, user: ContractAddress) -> TapUserStats;
    fn handle_tap_daily(ref self: TContractState);
}

#[starknet::interface]
pub trait IQuestNFT<TContractState> {
    fn mint(ref self: TContractState, user: ContractAddress) -> u256;
    fn set_role(
        ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool
    );
}

#[starknet::interface]
pub trait IQuestFactory<TContractState> {
    fn get_reward(self: @TContractState, quest: ContractAddress) -> (u32, bool);
    fn add_quest(ref self: TContractState, quest: QuestInfo);
    fn get_quests(self: @TContractState) -> Span<QuestInfo>;
    fn get_quest(self: @TContractState, quest_id: u32) -> QuestInfo;
    fn claim_reward(ref self: TContractState, quest_id: u32);
    fn get_user_quest_info(self: @TContractState, quest_id: u32) -> UserQuestInfo;
}
