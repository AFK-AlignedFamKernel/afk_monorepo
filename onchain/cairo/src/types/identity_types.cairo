use starknet::{ContractAddress};

pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct AfkIdentiyState {
    pub owner: ContractAddress,
    pub last_tap:u64,
    pub total_tap:u256,
    pub token_address:ContractAddress,
}


#[derive(Drop, starknet::Event)]
pub struct AfkIdentityCreated {
    #[key]
    pub owner: ContractAddress,
    pub last_tap:u64,
    pub total_tap:u256,
}

