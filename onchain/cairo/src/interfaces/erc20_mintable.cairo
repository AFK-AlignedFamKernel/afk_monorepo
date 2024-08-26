use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20Mintable<TContractState> {
    fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256);
    fn burn(ref self: TContractState, recipient: ContractAddress, amount: u256);
    fn transfer_token(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    );
}
