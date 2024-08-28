use starknet::{
    ContractAddress, get_caller_address, storage_access::StorageBaseAddress, contract_address_const,
    get_block_timestamp, get_contract_address,
};

pub const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
pub const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");
pub const OPERATOR: felt252 = selector!("OPERATOR");

#[derive(Drop, Copy, Serde, Hash)]
pub enum SupportedExchanges {
    Jediswap,
// Ekubo,
// Starkdefi,
}

#[derive(Serde, Copy, // Clone,
 Drop, starknet::Store, //  PartialEq
)]
pub enum BondingType {
    Linear,
    Trapezoidal,
    Scoring, // Nostr data with Appchain connected to a Relayer
    Exponential,
    Limited
}


// Storage

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct TokenQuoteBuyCoin {
    pub token_address: ContractAddress,
    pub initial_key_price: u256,
    pub price: u256,
    pub step_increase_linear: u256,
    pub is_enable: bool
}


#[derive(Serde, Copy, // Clone,
 Drop, starknet::Store, //  PartialEq
)]
pub enum TokenType {
    ERC20,
    ERC404,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct Token {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub symbol: felt252,
    pub name: felt252,
    pub total_supply: u256,
    pub initial_supply: u256,
    pub token_type: Option<TokenType>,
    pub created_at: u64,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct TokenLaunch {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub initial_key_price: u256,
    pub price: u256,
    pub available_supply: u256,
    pub initial_pool_supply: u256,
    pub total_supply: u256,
    pub bonding_curve_type: Option<BondingType>,
    pub created_at: u64,
    pub token_quote: TokenQuoteBuyCoin,
    pub liquidity_raised: u256,
    pub token_holded: u256,
    pub is_liquidity_launch: bool,
    pub slope: u256,
    pub threshold_liquidity: u256,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct TokenLaunchFair {
    // pub struct Keys<C> {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub price: u256,
    pub initial_key_price: u256,
    pub total_supply: u256,
    pub bonding_curve_type: Option<BondingType>,
    pub created_at: u64,
    pub token_quote: TokenQuoteBuyCoin,
    pub final_time: u64,
}

#[derive(Drop, Serde, Clone, starknet::Store)]
pub struct SharesTokenUser {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub amount_owned: u256,
    pub amount_buy: u256,
    pub amount_sell: u256,
    pub created_at: u64,
    pub total_paid: u256,
}


// Events

#[derive(Drop, starknet::Event)]
pub struct StoredName {
    #[key]
    pub user: ContractAddress,
    pub name: felt252,
}

#[derive(Drop, starknet::Event)]
pub struct BuyToken {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub token_address: ContractAddress,
    pub amount: u256,
    pub price: u256,
    pub protocol_fee: u256,
    pub last_price: u256,
    pub timestamp: u64,
    pub quote_amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct SellToken {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub key_user: ContractAddress,
    pub amount: u256,
    pub price: u256,
    pub protocol_fee: u256,
    pub creator_fee: u256,
    pub timestamp: u64,
    pub last_price: u256,
}

#[derive(Drop, starknet::Event)]
pub struct CreateToken {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub token_address: ContractAddress,
    pub symbol: felt252,
    pub name: felt252,
    pub initial_supply: u256,
    pub total_supply: u256,
}

#[derive(Drop, starknet::Event)]
pub struct CreateLaunch {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub token_address: ContractAddress,
    #[key]
    pub quote_token_address: ContractAddress,
    pub amount: u256,
    pub price: u256,
    pub total_supply: u256,
    pub slope: u256,
    pub threshold_liquidity: u256,
}

#[derive(Drop, starknet::Event)]
pub struct LaunchUpdated {
    #[key]
    user: ContractAddress,
    supply: u256,
    price: u256
}

#[derive(Drop, starknet::Event)]
pub struct SetJediwapV2Factory {
    pub address_jediswap_factory_v2: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct SetJediwapNFTRouterV2 {
    pub address_jediswap_nft_router_v2: ContractAddress,
}


#[derive(Drop, starknet::Event)]
pub struct LiquidityCanBeAdded {
    #[key]
    pub pool: ContractAddress,
    #[key]
    pub asset: ContractAddress,
    #[key]
    pub quote_token_address: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct LiquidityCreated {
    #[key]
    pub id: u256,
    #[key]
    pub pool: ContractAddress,
    #[key]
    pub asset: ContractAddress,
    #[key]
    pub quote_token_address: ContractAddress,
    // pub token_id:u256,
    pub owner: ContractAddress
}

#[derive(Drop, starknet::Event)]
pub struct TokenClaimed {
    #[key]
    pub token_address: ContractAddress,
    #[key]
    pub owner: ContractAddress,
    pub amount: u256,
    pub timestamp: u64
}

