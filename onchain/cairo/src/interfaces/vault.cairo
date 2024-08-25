use starknet::{ContractAddress, get_caller_address, contract_address_const, ClassHash};

#[starknet::interface]
pub trait IERCVault<TContractState> {
    // Mint the token with a specific ratio
    fn mint_by_token(ref self: TContractState, token_address:ContractAddress, amount: u256);
    fn withdraw_coin_by_token(ref self: TContractState, token_address:ContractAddress, amount: u256);
}