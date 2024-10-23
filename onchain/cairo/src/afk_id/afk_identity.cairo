use afk::types::identity_types::{};
use starknet::{
    ContractAddress, get_caller_address, storage_access::StorageBaseAddress, contract_address_const,
    get_block_timestamp, get_contract_address, ClassHash
};
#[starknet::interface]
pub trait IAfkId<T> {}

#[starknet::contract]
mod AfkIdentity {
    use core::num::traits::Zero;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    #[storage]
    struct Storage {
        id_user_exist: Map<ContractAddress, bool>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[abi(embed_v0)]
    impl FactoryIdImpl of super::IAfkId<ContractState> {}
}
