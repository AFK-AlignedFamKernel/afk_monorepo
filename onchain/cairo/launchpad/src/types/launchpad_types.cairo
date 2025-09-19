use ekubo::types::bounds::Bounds;
use ekubo::types::i129::i129;
use ekubo::types::keys::PoolKey;
use starknet::{ContractAddress // get_caller_address,
// storage_access::StorageBaseAddress, contract_address_const,
// get_block_timestamp,
// get_contract_address,
};

pub const DEFAULT_MIN_LOCKTIME: u64 = 15_721_200; // 6 months
pub const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
pub const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");
pub const OPERATOR: felt252 = selector!("OPERATOR");

#[derive(Drop, Copy, Serde, Hash, PartialEq, starknet::Store)]
pub enum SupportedExchanges {
    Jediswap,
    Ekubo,
    // Starkdefi,
}

#[derive(Serde, Copy, // Clone,
Drop, starknet::Store, PartialEq //  PartialEq
)]
pub enum BondingType {
    Linear,
    Exponential,
    // Trapezoidal,
// Scoring, // Nostr data with Appchain connected to a Relayer
// Limited
}

// Storage
#[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
pub struct AdminsFeesParams {
    pub token_address_to_paid_launch: ContractAddress,
    pub token_address_to_paid_create_token: ContractAddress,
    pub amount_to_paid_launch: u256,
    pub amount_to_paid_create_token: u256,
    pub is_fees_protocol_buy_enabled: bool,
    pub is_fees_protocol_sell_enabled: bool,
    pub is_fees_protocol_enabled: bool,
    pub is_paid_create_token_enable: bool,
    pub is_paid_launch_enable: bool,
}

#[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
pub struct TokenQuoteBuyCoin {
    pub token_address: ContractAddress,
    pub is_enable: bool,
}


#[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
pub struct TokenICOQuoteBuyCoin {
    pub token_address: ContractAddress,
    pub is_enable: bool,
    pub price: u256,
}


#[derive(Drop, Serde, Clone, starknet::Store)]
pub struct Token {
    pub owner: ContractAddress,
    pub creator: ContractAddress,
    pub token_address: ContractAddress,
    pub symbol: ByteArray,
    pub name: ByteArray,
    pub total_supply: u256,
    pub initial_supply: u256,
    pub token_type: Option<TokenType>,
    pub created_at: u64,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct TokenLaunch {
    pub owner: ContractAddress, // Can be the launchpad at one time and reset to the creator after launch on DEX
    pub creator: ContractAddress,
    pub token_address: ContractAddress,
    pub available_supply: u256, // Available to buy
    pub initial_pool_supply: u256, // Liquidity token to add in the DEX
    pub initial_available_supply: u256, // Init available to buy
    pub total_supply: u256, // Total supply to buy
    pub bonding_curve_type: BondingType,
    pub created_at: u64,
    pub token_quote: TokenQuoteBuyCoin, // Token launched
    pub liquidity_raised: u256, // Amount of quote raised. Need to be below threshold
    pub total_token_holded: u256, // Number of token holded and buy
    pub is_liquidity_launch: bool, // Liquidity launch through Ekubo or Unrug
    pub threshold_liquidity: u256, // Amount of maximal quote token to paid the coin launched
    pub liquidity_type: Option<LiquidityType>,
    pub protocol_fee_percent: u256,
    pub creator_fee_percent: u256,
    // TODO V2
    pub creator_amount_received: u256,
    pub creator_fee_destination: ContractAddress,
    pub creator_amount_distributed: u256,
    pub creator_amount_to_distribute: u256,
    // TODO V2
// pub address_treasury_dao:ContractAddress,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct LaunchLiquidity {
    pub owner: ContractAddress, // Can be the launchpad at one time and reset to the creator after launch on DEX
    pub creator: ContractAddress,
    pub token_address: ContractAddress,
    pub price: u256, // Last price of the token. In TODO
    pub available_supply: u256, // Available to buy
    pub initial_pool_supply: u256, // Liquidity token to add in the DEX
    pub initial_available_supply: u256, // Init available to buy
    pub total_supply: u256, // Total supply to buy
    pub created_at: u64,
    pub liquidity_raised: u256, // Amount of quote raised. Need to be below threshold
    pub threshold_liquidity: u256, // Amount of maximal quote token to paid the coin launched
    pub liquidity_type: Option<LiquidityType>,
    pub starting_price: u256,
    pub protocol_fee_percent: u256,
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
    pub is_claimable: bool,
}

// #[derive(Copy, Drop, starknet::Store, Serde)]
// pub enum TypeProject {
//     Project,
//     Memecoin,
//     Brand,
//     Creator,
// }
#[derive(Drop, Serde, Clone, starknet::Store, PartialEq)]
pub struct MetadataLaunchParams {
    pub token_address: ContractAddress,
    pub nostr_event_id: u256,
    pub ipfs_hash: ByteArray,
    pub url: ByteArray,
    pub twitter: ByteArray,
    pub github: ByteArray,
    pub telegram: ByteArray,
    pub website: ByteArray,
    pub description: ByteArray,
}

#[derive(Drop, Serde, Clone, starknet::Store, PartialEq)]
pub struct MetadataLaunch {
    pub token_address: ContractAddress,
    pub nostr_event_id: u256,
    pub ipfs_hash: ByteArray,
    pub url: ByteArray,
    // pub twitter: ByteArray,
// pub github: ByteArray,
// pub telegram: ByteArray,
// pub website: ByteArray,
// pub description: ByteArray,
}

#[derive(Drop, starknet::Event)]
pub struct MetadataCoinAdded {
    #[key]
    pub token_address: ContractAddress,
    pub metadata_url: ByteArray,
}

#[derive(Drop, starknet::Event)]
pub struct OldMetadataCoinAdded {
    #[key]
    pub token_address: ContractAddress,
    pub nostr_event_id: u256,
    pub ipfs_hash: ByteArray,
    pub url: ByteArray,
    pub twitter: ByteArray,
    pub website: ByteArray,
    pub telegram: ByteArray,
    pub github: ByteArray,
    pub description: ByteArray,
}

#[derive(Drop, starknet::Event)]
pub struct CreatorFeeDistributed {
    #[key]
    pub token_address: ContractAddress,
    pub amount: u256,
    pub creator_fee_destination: ContractAddress,
    pub memecoin_address: ContractAddress,
}
// Struct for Liquidity Ekubo and more

#[derive(Copy, Drop, Serde)]
pub struct LaunchParameters {
    pub memecoin_address: starknet::ContractAddress,
    pub transfer_restriction_delay: u64,
    pub max_percentage_buy_launch: u16,
    pub quote_address: starknet::ContractAddress,
    pub initial_holders: Span<starknet::ContractAddress>,
    pub initial_holders_amounts: Span<u256>,
}

#[derive(Copy, Drop, Serde)]
pub struct EkuboLaunchParameters {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub quote_address: ContractAddress,
    pub lp_supply: u256,
    pub pool_params: EkuboPoolParameters,
}

#[derive(Copy, Drop, Serde)]
pub struct EkuboUnrugLaunchParameters {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub quote_address: ContractAddress,
    pub lp_supply: u256,
    pub lp_quote_supply: u256,
    pub pool_params: EkuboPoolParameters,
    pub caller: ContractAddress,
    pub creator_fee_percent: u256,
    pub protocol_fee_percent: u256,
}

#[derive(Copy, Drop, Serde, PartialEq)]
pub struct EkuboLP {
    pub owner: ContractAddress,
    pub quote_address: ContractAddress,
    pub pool_key: PoolKey,
    pub bounds: Bounds,
}

#[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
pub struct EkuboLPStore {
    pub id: u64,
    pub owner: ContractAddress,
    pub quote_address: ContractAddress,
    pub token0: ContractAddress,
    pub token1: ContractAddress,
    pub fee: u128,
    pub tick_spacing: u128,
    pub extension: ContractAddress,
    pub lower_bound: i129,
    pub upper_bound: i129,
}
// #[derive(Drop, Copy, starknet::Store, Serde)]
// pub struct EkuboPoolParameters {
//     pub fee: u128,
//     pub tick_spacing: u128,
//     // the sign of the starting tick is positive (false) if quote/token < 1 and negative (true)
//     // otherwise
//     pub starting_price: i129,
//     // The LP providing bound, upper/lower determined by the address of the LPed tokens
//     pub bound: u128,
//     pub bound_spacing: u128,
//     pub bounds: Bounds,
// }

#[derive(Drop, Copy, Serde)]
pub struct EkuboPoolParameters {
    pub fee: u128,
    pub tick_spacing: u128,
    // the sign of the starting tick is positive (false) if quote/token < 1 and negative (true)
    // otherwise
    pub starting_price: i129,
    // The LP providing bound, upper/lower determined by the address of the LPed tokens
    pub bound: u128,
    pub bound_spacing: u128,
    pub bounds: Bounds,
}


#[derive(Copy, Drop, starknet::Store, Serde)]
pub enum LiquidityType {
    JediERC20: ContractAddress,
    StarkDeFiERC20: ContractAddress,
    EkuboNFT: u64,
}

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct EkuboLiquidityParametersStore {
    pub ekubo_pool_parameters: EkuboPoolParametersStore,
    pub quote_address: ContractAddress,
}

pub struct EkuboLiquidityParameters {
    pub ekubo_pool_parameters: EkuboPoolParameters,
    pub quote_address: ContractAddress,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct EkuboPoolParametersStore {
    pub fee: u128,
    pub tick_spacing: u128,
    // the sign of the starting tick is positive (false) if quote/token < 1 and negative (true)
    // otherwise
    pub starting_price: i129,
    // The LP providing bound, upper/lower determined by the address of the LPed tokens
    pub bound: u128,
    pub bound_spacing: u128,
}


// #[derive(Copy, Drop, starknet::Store, Serde)]
// struct StarkDeFiLiquidityParameters {
//     quote_address: ContractAddress,
//     quote_amount: u256,
// }

#[derive(Copy, Drop, starknet::Store, Serde)]
pub enum LiquidityParameters {
    Ekubo: EkuboLiquidityParametersStore,
    // pub Jediswap: (JediswapLiquidityParameters, ContractAddress),
// StarkDeFi: (StarkDeFiLiquidityParameters, ContractAddress),
}

#[derive(Serde, Drop, Copy)]
pub struct LaunchCallback {
    pub params: EkuboLaunchParameters,
}

#[derive(Serde, Drop, Copy)]
pub struct UnrugLaunchCallback {
    pub unrug_params: EkuboUnrugLaunchParameters,
}

#[derive(Serde, Drop, Copy)]
pub struct WithdrawFeesCallback {
    // pub id: u64,
    pub recipient: ContractAddress,
    pub token_address: ContractAddress,
    pub quote_address: ContractAddress,
}

#[derive(Serde, Drop, Copy)]
pub enum CallbackData {
    // WithdrawFeesCallback: WithdrawFeesCallback,
    LaunchCallback: LaunchCallback,
}

#[derive(Serde, Drop, Copy)]
pub enum UnrugCallbackData {
    UnrugLaunchCallback: UnrugLaunchCallback,
    WithdrawFeesCallback: WithdrawFeesCallback,
}

#[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
pub struct LockPosition {
    pub id_position: u256,
    pub asset_address: ContractAddress,
    pub quote_address: ContractAddress,
    pub exchange: SupportedExchanges,
    pub created_at: u64,
    pub unlock_time: u64,
    pub owner: ContractAddress,
    pub caller: ContractAddress,
}

// Events of smart contract
// Emit by Launchpad and Unrug

#[derive(Drop, starknet::Event)]
pub struct BuyToken {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub token_address: ContractAddress,
    pub amount: u256,
    pub protocol_fee: u256,
    pub timestamp: u64,
    pub quote_amount: u256,
    pub creator_fee_amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct SellToken {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub key_user: ContractAddress,
    pub amount: u256,
    pub protocol_fee: u256,
    pub creator_fee: u256,
    pub timestamp: u64,
    pub coin_amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct CreateToken {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub token_address: ContractAddress,
    pub symbol: ByteArray,
    pub name: ByteArray,
    pub initial_supply: u256,
    pub total_supply: u256,
    pub owner: ContractAddress,
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
    pub total_supply: u256,
    pub threshold_liquidity: u256,
    pub bonding_type: BondingType,
    pub creator_fee_percent: u256,
    pub owner: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct MemecoinCreated {
    pub owner: ContractAddress,
    pub name: felt252,
    pub symbol: felt252,
    pub initial_supply: u256,
    pub memecoin_address: ContractAddress,
}


#[derive(Drop, starknet::Event)]
pub struct SetJediswapV2Factory {
    pub address_jediswap_factory_v2: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct SetJediswapNFTRouterV2 {
    pub address_jediswap_nft_router_v2: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct SetJediswapRouterV2 {
    pub address_jediswap_router_v2: ContractAddress,
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
    pub owner: ContractAddress,
    pub exchange: SupportedExchanges,
    pub is_unruggable: bool,
}

#[derive(Drop, starknet::Event)]
pub struct FeesCollected {
    #[key]
    pub id: u256,
    #[key]
    pub pool: ContractAddress,
    #[key]
    pub asset: ContractAddress,
    #[key]
    pub quote_token_address: ContractAddress,
    // pub token_id:u256,
    pub owner: ContractAddress,
    pub exchange: SupportedExchanges,
    pub is_unruggable: bool,
    pub fees0: u128,
    pub fees1: u128,
}

#[derive(Drop, starknet::Event)]
pub struct CollectedFees {
    #[key]
    pub id: u64,
    #[key]
    pub caller: ContractAddress,
    pub fees0: u128,
    pub fees1: u128,
    pub recipient: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct TokenClaimed {
    #[key]
    pub token_address: ContractAddress,
    #[key]
    pub owner: ContractAddress,
    pub amount: u256,
    pub timestamp: u64,
}

// #[derive(Drop, starknet::Event)]
// pub struct MetadataCoinAdded {
//     #[key]
//     pub token_address: ContractAddress,
//     pub url: ByteArray,
//     pub nostr_event_id: u256,
//     pub timestamp: u64,
//     pub twitter: ByteArray,
//     pub website: ByteArray,
//     pub telegram: ByteArray,
//     pub github: ByteArray,
//     pub description: ByteArray,
// }

#[derive(Copy, Drop, starknet::Store, Serde)]
pub struct JediswapLiquidityParameters {
    pub quote_address: ContractAddress,
    pub quote_amount: u256,
}

//

#[derive(Drop, starknet::Event)]
pub struct MemecoinLaunched {
    pub memecoin_address: ContractAddress,
    pub quote_token: ContractAddress,
    pub exchange_name: felt252,
}

#[derive(Drop, starknet::Event)]
pub struct LaunchUpdated {
    #[key]
    user: ContractAddress,
    supply: u256,
    price: u256,
}


#[derive(Serde, Copy, // Clone,
Drop, starknet::Store //  PartialEq
)]
pub enum TokenType {
    ERC20,
    ERC404,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct TokenLaunchFair {
    // pub struct Keys<C> {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub price: u256,
    pub starting_price: u256,
    pub total_supply: u256,
    pub bonding_curve_type: Option<BondingType>,
    pub created_at: u64,
    pub token_quote: TokenQuoteBuyCoin,
    pub final_time: u64,
}

// Events
#[derive(Drop, starknet::Event)]
pub struct StoredName {
    #[key]
    pub user: ContractAddress,
    pub name: felt252,
}
