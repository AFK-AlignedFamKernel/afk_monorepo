use afk::types::identity_types::{AfkIdentityState};
use starknet::{
    ContractAddress, get_caller_address, storage_access::StorageBaseAddress, contract_address_const,
    get_block_timestamp, get_contract_address, ClassHash
};

#[starknet::interface]
pub trait IFactoryAfkIdentity<T> {
    fn get_afk_id(self: @T, user: ContractAddress) -> AfkIdentityState;
    fn create_afk_identity(ref self: T);
}

#[starknet::contract]
mod FactoryAfkIdentity {
    use afk::types::identity_types::{AfkIdentityState, AfkIdentityCreated};
    use core::num::traits::Zero;

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };

    #[storage]
    struct Storage {
        id_user_exist: LegacyMap<ContractAddress, bool>,
        user_identity: LegacyMap<ContractAddress, AfkIdentityState>
    }

    #[abi(embed_v0)]
    impl FactoryIdImpl of super::IFactoryAfkIdentity<ContractState> {
        fn create_afk_identity(ref self: ContractState) {
            let caller = get_contract_address();
            let id_afk_old = self.user_identity.read(caller);
            assert!(id_afk_old.owner.is_zero(), "id already created");
        }

        fn get_afk_id(self: @ContractState, user: ContractAddress) -> AfkIdentityState {
            self.user_identity.read(user)
        }
    }
}

