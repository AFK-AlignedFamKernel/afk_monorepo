use starknet::ContractAddress;

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct QuestInfo {
    pub name: felt252,
    pub address: ContractAddress,
    pub quest_id: u32,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct UserQuestInfo {
    pub user_address: ContractAddress,
    pub quest_id: u32,
    pub is_complete: bool,
    pub claimed_token: u32,
    pub claimed_nft_id: u32,
}
