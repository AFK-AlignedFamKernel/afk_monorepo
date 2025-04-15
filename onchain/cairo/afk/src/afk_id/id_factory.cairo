use afk::types::identity_types::AfkIdentityState;
use starknet::storage_access::StorageBaseAddress;
use starknet::{
    ClassHash, ContractAddress, contract_address_const, get_block_timestamp, get_caller_address,
    get_contract_address,
};

#[starknet::interface]
pub trait IFactoryAfkIdentity<T> {
    fn get_afk_id(self: @T, user: ContractAddress) -> AfkIdentityState;
    fn create_afk_identity(ref self: T);
}

#[starknet::contract]
mod FactoryAfkIdentity {
    use afk::types::identity_types::{AfkIdentityCreated, AfkIdentityState};
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
        user_identity: Map<ContractAddress, AfkIdentityState>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AfkIdentityCreated: AfkIdentityCreated,
    }

    #[abi(embed_v0)]
    impl FactoryIdImpl of super::IFactoryAfkIdentity<ContractState> {
        fn create_afk_identity(ref self: ContractState) {
            let caller = get_contract_address();
            let id_afk_old = self.user_identity.read(caller);
            assert!(id_afk_old.owner.is_zero(), "id already created");

            // TODO create tokenbound/souldbound and/or AA
            let token_address = caller;
            let afk_identity = AfkIdentityState {
                owner: caller,
                token_address: token_address.clone(),
                created_at: get_block_timestamp(),
            };
            self.user_identity.entry(caller).write(afk_identity);
            self
                .emit(
                    AfkIdentityCreated {
                        owner: caller, token_address, created_at: get_block_timestamp(),
                    },
                );
        }

        fn get_afk_id(self: @ContractState, user: ContractAddress) -> AfkIdentityState {
            self.user_identity.read(user)
        }
    }
}

