use starknet::ContractAddress;

#[starknet::interface]
pub trait IERCVault<TContractState> {
    // Mint the token with a specific ratio
    fn mint_by_token(ref self: TContractState, token_address: ContractAddress, amount: u256);
    fn withdraw_coin_by_token(
        ref self: TContractState, token_address: ContractAddress, amount: u256,
    );
    fn is_token_permitted(ref self: TContractState, token_address: ContractAddress) -> bool;


    fn set_token_permitted(
        ref self: TContractState,
        token_address: ContractAddress,
        // ratio: u256,
        ratio_mint: u256,
        is_available: bool,
        pooling_timestamp: u64,
    );

    fn get_token_ratio(ref self: TContractState, token_address: ContractAddress) -> u256;
    fn mint_quest_token_reward(ref self: TContractState, user: ContractAddress, amount: u32);
}
