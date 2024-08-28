use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20Mintable<TContractState> {
    fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256);
    fn burn(ref self: TContractState, recipient: ContractAddress, amount: u256);
    fn set_role(
        ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool
    );
}
