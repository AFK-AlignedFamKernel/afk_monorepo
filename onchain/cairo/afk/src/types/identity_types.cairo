use starknet::{ContractAddress};

pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct AfkIdentityState {
    pub owner: ContractAddress,
    pub created_at: u64,
    pub token_address: ContractAddress,
}


#[derive(Drop, starknet::Event)]
pub struct AfkIdentityCreated {
    #[key]
    pub owner: ContractAddress,
    pub created_at: u64,
    pub token_address: ContractAddress,
}

