use starknet::{
    ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
    contract_address_const, get_block_timestamp, get_contract_address, ClassHash
};

#[starknet::interface]
pub trait IAfkId<T> {
}

#[starknet::contract]
mod AfkIdentity {
    const DAILY_TIMESTAMP_SECONDS:u256=60*60*24;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        id_user_exist:LegacyMap<ContractAddress, bool>
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
    }

    #[abi(embed_v0)]
    impl FactoryIdImpl of super::IAfkId<ContractState> {
      
    }
}
