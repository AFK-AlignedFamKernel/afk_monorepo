use starknet::ContractAddress;

pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct TapUserStats {
    pub owner: ContractAddress,
    pub last_tap: u64,
    pub total_tap: u256,
}


#[derive(Drop, starknet::Event)]
pub struct TapDailyEvent {
    #[key]
    pub owner: ContractAddress,
    pub last_tap: u64,
    pub total_tap: u256,
}

