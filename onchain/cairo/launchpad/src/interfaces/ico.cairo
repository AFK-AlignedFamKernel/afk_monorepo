use alexandria_math::fast_power::fast_power;
use starknet::storage::Map;
use starknet::{ClassHash, ContractAddress, get_block_timestamp};
use crate::types::launchpad_types::{
    BondingType, LiquidityType, TokenICOQuoteBuyCoin, TokenQuoteBuyCoin,
};

#[starknet::interface]
pub trait IICO<TContractState> {
    fn create_token(ref self: TContractState, token_details: TokenDetails) -> ContractAddress;
    fn launch_presale(
        ref self: TContractState,
        token_address: ContractAddress,
        presale_details: Option<PresaleDetails>,
    );
    fn launch_dutch_auction(ref self: TContractState, token_address: ContractAddress);
    fn launch_liquidity(
        ref self: TContractState, token_address: ContractAddress, bonding_type: Option<BondingType>,
    ) -> u64;

    /// Buys a certain amount of token with `token_address` worth of `amount`
    ///
    /// #param
    /// - `token_address`: Contract Address of the token
    /// - `amount`: Amount of buy_token to give in exchange for presale token
    fn buy_token(ref self: TContractState, token_address: ContractAddress, amount: u256);
    fn cancel_buy(ref self: TContractState, token_address: ContractAddress);
    fn claim(ref self: TContractState, token_address: ContractAddress);
    fn claim_all(ref self: TContractState);
    fn whitelist(
        ref self: TContractState, token_address: ContractAddress, targets: Array<ContractAddress>,
    );
    fn distribute(
        ref self: TContractState,
        token_address: ContractAddress,
        recipients: Array<ContractAddress>,
        amounts: Array<u256>,
    );

    // for testing
    fn is_successful(ref self: TContractState, token_address: ContractAddress) -> bool;
}

#[starknet::interface]
pub trait IICOConfig<TContractState> {
    fn set_config(ref self: TContractState, config: ContractConfig);
    fn set_liquidity_config(ref self: TContractState, config: LaunchConfig);
}

pub fn default_supply() -> u256 {
    1_000_000 * fast_power(10, 18)
}

pub fn min_presale_rate() -> u256 {
    2000 * fast_power(10, 18)
}

pub fn default_presale_details() -> PresaleDetails {
    let expected_lp_tokens = (default_supply() * 100) / (2 * 70);
    PresaleDetails {
        buy_token: ETH,
        // presale_rate: default_supply() / 2,
        presale_rate: 40,
        whitelist: false,
        soft_cap: expected_lp_tokens / 2, // 50% of hard cap
        hard_cap: expected_lp_tokens,
        liquidity_percentage: 70,
        listing_rate: 20, // 1 quote to 20 presale tokens
        start_time: get_block_timestamp(),
        end_time: get_block_timestamp() + 100000,
        liquidity_lockup: get_block_timestamp() + (60 * 24 * 30 * 30) // in seconds
    }
}

const ETH: ContractAddress = 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    .try_into()
    .unwrap();

/// CREATE A TOKEN AND LAUNCH, OR INPUT THE TOKEN ADDRESS FOR PRESALE
///

/// Check this details if they are sufficient
#[derive(Clone, Drop, Serde, PartialEq)]
pub struct TokenDetails {
    pub name: felt252,
    pub symbol: felt252,
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
    pub status: TokenStatus,
    pub current_supply: u256,
    pub funds_raised: u256,
    pub whitelist: Map<ContractAddress, bool>,
    pub buyers: Map<ContractAddress, u256>, // with buy_token
    pub holders: Map<ContractAddress, u256> // holders of token
}

#[starknet::storage_node]
pub struct TokenInitParams {
    pub max_token_supply: u256,
    pub fee_amount: u256,
    pub fee_to: ContractAddress,
    pub paid_in: ContractAddress,
    pub accepted_buy_tokens: Map<ContractAddress, bool>,
}

#[starknet::storage_node]
pub struct Launch {
    pub unrug_address: ContractAddress,
    pub fee_amount: u256,
    pub fee_to: ContractAddress,
    pub paid_in: ContractAddress,
    pub quote_token: ContractAddress,
    pub launched_tokens: Map<ContractAddress, LaunchParams>,
    pub total_launched: u256,
}

#[derive(Drop, Copy, Serde)]
pub struct LaunchConfig {
    pub unrug_address: Option<ContractAddress>,
    pub fee: Option<(u256, ContractAddress, ContractAddress)>, // amount, to, in
    pub quote_token: Option<ContractAddress>,
}

#[derive(Drop, Copy, Default, Serde, PartialEq, starknet::Store)]
pub enum TokenStatus {
    #[default]
    None,
    Presale,
    Finalized,
    Active,
    Void,
}

impl StatusIntoU8 of Into<TokenStatus, u8> {
    #[inline(always)]
    fn into(self: TokenStatus) -> u8 {
        match self {
            TokenStatus::None => 0,
            TokenStatus::Presale => 1,
            TokenStatus::Finalized => 2,
            TokenStatus::Active => 3,
            TokenStatus::Void => 4,
        }
    }
}

#[derive(Drop, Clone, Serde)]
pub struct ContractConfig {
    pub exchange_address: Option<ContractAddress>,
    pub accepted_buy_tokens: Array<ContractAddress>,
    pub fee: Option<(u256, ContractAddress)>, // amount, to
    pub max_token_supply: Option<u256>,
    pub paid_in: Option<ContractAddress>,
    pub token_class_hash: Option<ClassHash>,
    pub unrug_address: Option<ContractAddress>,
}

#[derive(Drop, starknet::Event)]
pub struct TokenCreated {
    #[key]
    pub token_address: ContractAddress,
    pub owner: ContractAddress,
    pub name: felt252,
    pub symbol: felt252,
    pub decimals: u8,
    pub initial_supply: u256,
    pub created_at: u64,
}

#[derive(Drop, starknet::Event)]
pub struct PresaleLaunched {
    #[key]
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

#[derive(Drop, starknet::Event)]
pub struct TokenBought {
    #[key]
    pub token_address: ContractAddress,
    pub amount: u256,
    pub buyer: ContractAddress,
    pub bought_at: u64,
}

#[derive(Drop, starknet::Event)]
pub struct BuyCanceled {
    #[key]
    pub token_address: ContractAddress,
    pub buyer: ContractAddress,
    pub amount: u256,
    pub canceled_at: u64,
}

#[derive(Drop, starknet::Event)]
pub struct TokenClaimed {
    #[key]
    pub presale_token_address: ContractAddress,
    pub claimed_token_address: ContractAddress,
    pub recipient: ContractAddress,
    pub amount: u256,
    pub claimed_at: u64,
}

#[derive(Drop, starknet::Event)]
pub struct PresaleFinalized {
    #[key]
    pub presale_token_address: ContractAddress,
    pub buy_token_address: ContractAddress,
    pub successful: bool,
}

#[derive(Drop, Copy, starknet::Store)]
pub struct LaunchParams {
    pub bonding_type: BondingType,
    pub token_quote: TokenICOQuoteBuyCoin,
    pub liquidity_type: Option<LiquidityType>,
    pub starting_price: u256,
    pub launched_at: u64,
}

pub struct TokenLaunch {
    pub owner: ContractAddress, // Can be the launchpad at one time and reset to the creator after launch on DEX
    pub creator: ContractAddress,
    pub token_address: ContractAddress,
    pub price: u256, // Last price of the token. In TODO
    pub available_supply: u256, // Available to buy
    pub initial_pool_supply: u256, // Liquidity token to add in the DEX
    pub initial_available_supply: u256, // Init available to buy
    pub total_supply: u256, // Total supply to buy
    pub bonding_curve_type: BondingType,
    pub created_at: u64,
    pub token_quote: TokenICOQuoteBuyCoin, // Token launched
    pub liquidity_raised: u256, // Amount of quote raised. Need to be below threshold
    pub total_token_holded: u256, // Number of token holded and buy
    pub is_liquidity_launch: bool, // Liquidity launch through Ekubo or Unrug
    pub slope: u256,
    pub threshold_liquidity: u256, // Amount of maximal quote token to paid the coin launched
    pub liquidity_type: Option<LiquidityType>,
    pub starting_price: u256,
    pub protocol_fee_percent: u256,
}
