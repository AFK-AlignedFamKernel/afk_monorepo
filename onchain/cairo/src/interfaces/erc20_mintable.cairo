use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20Mintable<TContractState> { 
    
    fn mint(
        ref self: TContractState,recipient: ContractAddress, amount: u256
    );
  
}