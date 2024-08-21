use starknet::{
    ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
    contract_address_const, get_block_timestamp, get_contract_address, ClassHash
};

#[starknet::interface]
pub trait IFactoryAfkId<T> {
    fn get_afk_id(self: @T, user:ContractAddress) -> AfkIdentiyState;
    fn create_afk_identity(ref self: T);
}

#[starknet::contract]
mod FactoryAfkIdentity {
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
    impl FactoryIdImpl of super::IFactoryAfkId<ContractState> {
      
      fn create_afk_identity(ref self:ContractState) {

      }

      fn get_afk_id(self:@ContractState, user:ContractAddress) {

      }
    }
}
