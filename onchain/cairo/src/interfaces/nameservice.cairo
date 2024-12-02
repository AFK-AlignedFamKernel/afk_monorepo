use starknet::ContractAddress;
use afk::afk_id::nameservice::Nameservice::{Auction};

#[starknet::interface]
pub trait INameservice<TContractState> {
    fn claim_username(ref self: TContractState, key: felt252);
    fn change_username(ref self: TContractState, new_username: felt252);
    fn change_main_username(ref self: TContractState, new_username: felt252);
    fn create_auction_for_username(
        ref self: TContractState,
        username: felt252,
        minimal_price: u256,
    );
    fn place_order(ref self: TContractState, username: felt252, amount: u256);
    fn cancel_order(ref self: TContractState, username: felt252, id: u64);
    fn accept_order(ref self: TContractState, username: felt252, id: u64);
    fn get_username(self: @TContractState, address: ContractAddress) -> felt252;
    fn get_username_address(self: @TContractState, key: felt252) -> ContractAddress;
    fn get_token_quote(self: @TContractState,) -> ContractAddress;
    fn renew_subscription(ref self: TContractState);
    fn get_subscription_expiry(self: @TContractState, address: ContractAddress) -> u64;
    fn get_subscription_price(self: @TContractState) -> u256;
    fn withdraw_fees(ref self: TContractState, amount: u256);

    // Add these functions
    fn set_token_quote(ref self: TContractState, token_quote: ContractAddress);
    fn update_subscription_price(ref self: TContractState, new_price: u256);
    fn set_is_payment_enabled(ref self: TContractState, new_status: bool) -> bool;
    fn get_is_payment_enabled(self: @TContractState) -> bool;
    fn get_auction(self: @TContractState, username: felt252) -> Auction;
}
