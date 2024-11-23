// TODO: create component of it, implement a factory in the future
use starknet::ContractAddress;

#[starknet::interface]
pub trait IDN404<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, to: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256
    ) -> bool;
    fn mirror_erc721(self: @TContractState) -> ContractAddress;
    fn get_skip_nft(self: @TContractState, owner: ContractAddress) -> bool;
    fn set_skip_nft(ref self: TContractState, skip_nft: bool) -> bool;

    // Methods assumed by DN404 mirror fallback:

    fn transfer_from_nft(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256, 
        msg_sender: ContractAddress
    );

    fn set_approval_for_all_nft(
        ref self: TContractState, 
        spender: ContractAddress, 
        status: bool, 
        msg_sender: ContractAddress
    );

    fn is_approved_for_all_nft(
        self: @TContractState, 
        owner: ContractAddress, 
        operator: ContractAddress
    ) -> bool;

    fn owner_of_nft(self: @TContractState, id: u256) -> ContractAddress;

    fn owner_at_nft(self: @TContractState, id: u256) -> ContractAddress;

    fn approve_nft(
        ref self: TContractState, 
        spender: ContractAddress, 
        id: u256, 
        msg_sender: ContractAddress
    ) -> ContractAddress;

    fn get_approved_nft(self: @TContractState, id: u256) -> ContractAddress;

    fn balance_of_nft(self: @TContractState, owner: ContractAddress) -> u256;

    fn total_nft_supply(self: @TContractState) -> u256;

    fn token_uri_nft(self: @TContractState, id: u256) -> felt252;

    fn implements_dn404(self: @TContractState) -> bool;
}

#[starknet::contract]
pub mod DN404 {
    use starknet::ContractAddress;
    use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess};

    // TODO
    type u96 = u128;
    type u88 = u128;
    
    #[storage]
    struct Storage {
        num_aliases: u32,
        next_token_id: u32,
        burned_pool_head: u32,
        burned_pool_tail: u32,
        total_nft_supply: u32,
        total_supply: u96,
        mirror_erc721: ContractAddress,
        alias_to_address: Map<u32, ContractAddress>,
        operator_approvals: Map<(ContractAddress, ContractAddress), u256>,
        nft_approvals: Map<u256, ContractAddress>,
        may_have_nft_approval: Map<u256, bool>,
        exists: Map<u256, bool>,
        allowance: Map<(ContractAddress, ContractAddress), u256>,
        owned: Map<ContractAddress, Span<u32>>,
        burned_pool: Span<u32>,
        oo: Map<u256, u32>,
        address_data: Map<ContractAddress, AddressData>,
    }

    struct AddressData {
        aux: u88,
        flags: u8,
        address_alias: u32,
        owned_length: u32,
        balance: u96,
    }


    #[derive(Drop, starknet::Event)]
    struct TransferEvent {
        from: ContractAddress,
        to: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ApprovalEvent {
        owner: ContractAddress,
        spender: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SkipNFTSetEvent {
        owner: ContractAddress,
        status: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: TransferEvent,
        Approval: ApprovalEvent,
        SkipNFTSet: SkipNFTSetEvent,
    }
}