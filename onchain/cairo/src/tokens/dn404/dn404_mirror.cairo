use starknet::ContractAddress;

#[starknet::interface]
pub trait IDN404Mirror<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn token_uri(self: @TContractState, id: u256) -> felt252;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, nft_owner: ContractAddress) -> u256;
    fn owner_of(self: @TContractState, id: u256) -> ContractAddress;
    fn owner_at(self: @TContractState, id: u256) -> ContractAddress;
    fn approve(ref self: TContractState, spender: ContractAddress, id: u256);
    fn get_approved(self: @TContractState, id: u256) -> ContractAddress;
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
    fn is_approved_for_all(
        self: @TContractState, 
        nft_owner: ContractAddress, 
        operator: ContractAddress
    ) -> bool;
    fn transfer_from(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256
    );

    fn safe_transfer_from(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256
    );

    fn safe_transfer_from_with_data(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256, 
        data: felt252
    );

    // TODO use OZ SRC5
    fn supports_interface(self: @TContractState, interface_id: felt252) -> bool;
    // TODO use OZ Ownable
    fn owner(self: @TContractState) -> ContractAddress;
    fn pull_owner(ref self: TContractState) -> bool;
    fn base_erc20(self: @TContractState) -> ContractAddress;


    // Methods assumed by DN404 Fallback

    fn log_transfer(ref self: TContractState, packed_logs: Span<felt252>);

    fn log_direct_transfer(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        direct_logs: Span<felt252>
    );

    fn link_mirror_contract(ref self: TContractState, deployer: ContractAddress);
}

