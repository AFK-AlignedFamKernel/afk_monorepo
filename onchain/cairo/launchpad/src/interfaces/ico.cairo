use core::num::traits::Zero;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IICO<TContractState> {
    /// This function never stores the created token, because the `launch_presale` takes in a token
    /// address that might also not be stored. Whether the token_address exists or not is up to the
    /// caller.
    /// Here, anybody can create a token.
    fn create_token(ref self: TContractState, token_details: TokenDetails) -> ContractAddress;
    fn launch_presale(
        ref self: TContractState,
        token_address: ContractAddress,
        presale_details: Option<PresaleDetails>,
    );
    // fn launch_dutch_auction(ref self: TContractState);
// fn launch_liquidity_providing(ref self: TContractState, token_address: ContractAddress);
// fn buy_token(ref self: TContractState);
// fn cancel_buy(ref self: TContractState, token_address: ContractAddress);    // This might
// need the timelock component.
// fn claim(ref self: TContractState);
}

#[starknet::interface]
pub trait IICOConfig<TContractState> {
    fn set_token_config(ref self: TContractState, config: TokenConfig);
}

/// CREATE A TOKEN AND LAUNCH, OR INPUT THE TOKEN ADDRESS FOR PRESALE
///

/// Check this details if they are sufficient
#[derive(Clone, Drop, Serde, PartialEq)]
pub struct TokenDetails {
    pub name: ByteArray,
    pub symbol: ByteArray,
    pub initial_supply: u256,
    pub decimals: u8,
    pub salt: felt252,
}

#[derive(Drop, Copy, Serde, Default, starknet::Store)]
pub struct PresaleDetails {
    pub presale_rate: u256,
    pub whitelist: bool,
    pub soft_cap: u256,
    pub hard_cap: u256,
    pub liquidity_percentage: u64,
    pub listing_rate: u256,
    pub start_time: u64,
    pub end_time: u64,
    pub liquidity_lockup: u64 // in hours.
}

#[derive(Drop, starknet::Event)]
pub struct TokenCreated {
    pub token_address: ContractAddress,
    pub owner: ContractAddress,
    pub name: ByteArray,
    pub symbol: ByteArray,
    pub decimals: u8,
    pub initial_supply: u256,
    pub created_at: u64,
}

// Give room for precision too.
#[starknet::storage_node]
pub struct Token {
    pub owner_access: Option<ContractAddress>,
    pub presale_details: Option<PresaleDetails>,
    pub status: PresaleStatus,
    pub current_supply: u256,
}

#[derive(Drop, Copy, Default, Serde, PartialEq, starknet::Store)]
pub enum PresaleStatus {
    #[default]
    None,
    Pending,
    InProgress,
    Finished: u256,
}

#[starknet::storage_node]
pub struct TokenInitParams {
    pub max_token_supply: u256,
    pub fee_amount: u256,
    pub fee_to: ContractAddress,
    pub paid_in: ContractAddress,
}

// pub struct PresaleDetails {
//     pub coin_address: ContractAddress,
//     pub whitelist: bool,
//     pub fee: ContractAddress,
// }

// TODO:
// use default values for now
pub fn default_presale_details() -> PresaleDetails {
    Default::default()
}

#[derive(Drop, Copy, Serde)]
pub struct TokenConfig {}
