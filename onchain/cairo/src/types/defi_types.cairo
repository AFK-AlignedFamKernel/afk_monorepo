use starknet::ContractAddress;
// Storage
#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct TokenPermitted {
    pub token_address: ContractAddress,
    pub ratio_mint: u256,
    pub is_available: bool,
    pub pooling_timestamp: u64,
}

// Storage
#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct DepositUser {
    pub token_address: ContractAddress,
    pub deposited: u256,
    pub minted: u256,
    pub withdraw: u256,
}


// Events
#[derive(Drop, starknet::Event)]
pub struct MintDepositEvent {
    #[key]
    pub caller: ContractAddress,
    pub token_deposited: ContractAddress,
    pub amount_deposit: u256,
    pub mint_receive: u256,
}

// Events
#[derive(Drop, starknet::Event)]
pub struct WithdrawDepositEvent {
    #[key]
    pub caller: ContractAddress,
    pub token_deposited: ContractAddress,
    pub amount_deposit: u256,
    pub mint_receive: u256,
    pub mint_to_get_after_poolin: u256,
    pub pooling_interval: u64,
}
