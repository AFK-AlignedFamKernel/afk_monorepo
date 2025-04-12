use starknet::storage::Map;
use starknet::{ContractAddress, get_block_timestamp};

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

    /// This function first checks if the token liquidity providing phase has reached, and makes
    /// necessary changes
    fn launch_liquidity_providing(ref self: TContractState, token_address: ContractAddress);

    /// Buys a certain amount of token with `token_address` worth of `amount`
    ///
    /// #param
    /// - `token_address`: Contract Address of the token
    /// - `amount`: Amount of buy_token to give in exchange for presale token
    fn buy_token(ref self: TContractState, token_address: ContractAddress, amount: u256);
    fn cancel_buy(ref self: TContractState, token_address: ContractAddress);
    fn claim(ref self: TContractState, token_address: ContractAddress);
    fn claim_all(ref self: TContractState);
    fn whitelist(ref self: TContractState, token_address: ContractAddress, buyer: ContractAddress);
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

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct PresaleDetails {
    pub buy_token: ContractAddress,
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

// Give room for precision too.
#[starknet::storage_node]
pub struct Token {
    pub owner_access: Option<ContractAddress>,
    pub presale_details: PresaleDetails,
    pub status: PresaleStatus,
    pub current_supply: u256,
    pub funds_raised: u256,
    pub whitelist: Map<ContractAddress, bool>,
    pub buyers: Map<ContractAddress, u256>, // with buy_token
    pub holders: Map<ContractAddress, u256>, // holders of token
    pub successful: bool,
}

#[derive(Drop, Copy, Default, Serde, PartialEq, starknet::Store)]
pub enum PresaleStatus {
    #[default]
    None,
    Launched,
    Liquidity,
    Active,
    Finished: u256,
}

#[starknet::storage_node]
pub struct TokenInitParams {
    pub max_token_supply: u256,
    pub fee_amount: u256,
    pub fee_to: ContractAddress,
    pub paid_in: ContractAddress,
}

// TODO:
// To be edited
pub fn default_presale_details() -> PresaleDetails {
    PresaleDetails {
        buy_token: ETH,
        presale_rate: 0,
        whitelist: false,
        soft_cap: 0,
        hard_cap: 0,
        liquidity_percentage: 0,
        listing_rate: 0,
        start_time: get_block_timestamp(),
        end_time: get_block_timestamp() + 100000,
        liquidity_lockup: get_block_timestamp() + (60 * 24 * 30 * 30) // in seconds
    }
}

const ETH: ContractAddress = 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    .try_into()
    .unwrap();

#[derive(Drop, Copy, Serde)]
pub struct TokenConfig {}

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

#[derive(Drop, starknet::Event)]
pub struct PresaleLaunched {
    pub buy_token: ContractAddress,
    pub presale_rate: u256,
    pub soft_cap: u256,
    pub hard_cap: u256,
    pub liquidity_percentage: u64,
    pub listing_rate: u256,
    pub start_time: u64,
    pub end_time: u64,
    pub liquidity_lockup: u64,
}

