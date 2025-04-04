use starknet::{
    ContractAddress, //  get_caller_address,
    storage_access::StorageBaseAddress,
    contract_address_const, get_block_timestamp, get_contract_address,
};

pub const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
pub const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");
pub const OPERATOR: felt252 = selector!("OPERATOR");

// Storage

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct TokenQuoteBuyKeys {
    pub token_address: ContractAddress,
    pub initial_key_price: u256,
    pub price: u256,
    pub step_increase_linear: u256,
    pub is_enable: bool,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct Keys {
    // pub struct Keys<C> {
    pub owner: ContractAddress,
    pub token_address: ContractAddress,
    pub price: u256,
    pub initial_key_price: u256,
    pub total_supply: u256,
    pub bonding_curve_type: Option<BondingType>,
    pub created_at: u64,
    pub token_quote: TokenQuoteBuyKeys,
    pub nostr_public_key: u256,
}

#[derive(Drop, Serde, Clone, starknet::Store)]
pub struct SharesKeys {
    pub owner: ContractAddress,
    pub key_address: ContractAddress,
    pub amount_owned: u256,
    pub amount_buy: u256,
    pub amount_sell: u256,
    pub created_at: u64,
    pub total_paid: u256,
}

#[derive(Serde, Copy, // Clone,
Drop, starknet::Store //  PartialEq
)]
pub enum BondingType {
    Linear,
    Scoring, // Nostr data with Appchain connected to a Relayer
    Exponential,
    Limited,
}

// Event

#[derive(Drop, starknet::Event)]
pub struct StoredName {
    #[key]
    pub user: ContractAddress,
    pub name: felt252,
}

#[derive(Drop, starknet::Event)]
pub struct BuyKeys {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub key_user: ContractAddress,
    pub amount: u256,
    pub price: u256,
    pub protocol_fee: u256,
    pub creator_fee: u256,
}

#[derive(Drop, starknet::Event)]
pub struct SellKeys {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub key_user: ContractAddress,
    pub amount: u256,
    pub price: u256,
    pub protocol_fee: u256,
    pub creator_fee: u256,
}

#[derive(Drop, starknet::Event)]
pub struct CreateKeys {
    #[key]
    pub caller: ContractAddress,
    #[key]
    pub key_user: ContractAddress,
    pub amount: u256,
    pub price: u256,
}

#[derive(Drop, starknet::Event)]
pub struct KeysUpdated {
    #[key]
    user: ContractAddress,
    supply: u256,
    price: u256,
}


pub trait KeysBonding {
    fn get_price(self: Keys, supply: u256) -> u256;
}


pub fn get_current_price(key: @Keys, supply: u256, amount_to_buy: u256) -> u256 {
    let total_cost = 0;
    total_cost
}


pub fn get_linear_price( // key: @Keys, 
key: Keys, supply: u256 //  amount_to_buy: u256
) -> u256 {
    let step_increase_linear = key.token_quote.step_increase_linear.clone();
    let initial_key_price = key.token_quote.initial_key_price.clone();
    let price_for_this_key = initial_key_price + (supply * step_increase_linear);
    price_for_this_key
}


pub impl KeysBondingImpl of KeysBonding {
    fn get_price(self: Keys, supply: u256) -> u256 {
        match self.bonding_curve_type {
            Option::Some(x) => {
                match x {
                    BondingType::Linear => { get_linear_price(self, supply) },
                    // BondingType::Scoring => { 0 },
                    // BondingType::Exponential => { 0 },
                    // BondingType::Limited => { 0 },

                    _ => { get_linear_price(self, supply) },
                }
            },
            Option::None => { get_linear_price(self, supply) },
        }
    }
}
