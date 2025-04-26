use starknet::storage_access::StorageBaseAddress;
use starknet::{
    ClassHash, ContractAddress, contract_address_const, get_block_timestamp, get_caller_address,
    get_contract_address,
};
#[starknet::interface]
pub trait IAfkId<T> {}

#[starknet::contract]
mod AfkIdentity {
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::storage_access::StorageBaseAddress;
    use starknet::{
        ClassHash, ContractAddress, contract_address_const, get_block_timestamp, get_caller_address,
        get_contract_address,
    };
    #[storage]
    struct Storage {
        id_user_exist: Map<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[abi(embed_v0)]
    impl FactoryIdImpl of super::IAfkId<ContractState> {}
}
