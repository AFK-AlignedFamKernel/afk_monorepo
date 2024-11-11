use starknet::ContractAddress;

#[starknet::interface]
pub trait IUsernameStore<TContractState> {
    fn claim_username(ref self: TContractState, key: felt252);
    fn change_username(ref self: TContractState, new_username: felt252);
    fn get_username(self: @TContractState, address: ContractAddress) -> felt252;
    fn get_username_address(self: @TContractState, key: felt252) -> ContractAddress;
    fn withdraw_fees(ref self: TContractState, amount: u256);
    fn renew_subscription(ref self: TContractState);
}
