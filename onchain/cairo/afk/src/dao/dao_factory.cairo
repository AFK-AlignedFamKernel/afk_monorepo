use starknet::{ContractAddress, ClassHash};

#[starknet::interface]
pub trait IDaoFactory<TContractState> {
    fn create_dao(
        ref self: TContractState,
        token_contract_address: ContractAddress,
        public_key: u256,
        starknet_address: felt252
    ) -> ContractAddress;
    fn get_dao_class_hash(self: @TContractState) -> ClassHash;
    fn update_dao_class_hash(ref self: TContractState, new_class_hash: ClassHash);
    // TODO: NOTE, THE DAO IS NOT UPGRADEABLE YET.
}

#[starknet::contract]
pub mod DaoFactory {
    use core::num::traits::Zero;
    use openzeppelin::access::ownable::OwnableComponent;
    use starknet::storage::{
        Map, StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry
    };
    use starknet::{ContractAddress, ClassHash, get_caller_address, syscalls::deploy_syscall};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        dao_aa_list: Map<(ContractAddress, ContractAddress), ClassHash>,
        dao_class_hash: ClassHash,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        ClassHashUpdated: ClassHashUpdated,
        DaoAACreated: DaoAACreated
    }

    #[derive(Drop, starknet::Event)]
    pub struct ClassHashUpdated {
        pub old_class_hash: ClassHash,
        #[key]
        pub new_class_hash: ClassHash
    }

    #[derive(Drop, starknet::Event)]
    pub struct DaoAACreated {
        #[key]
        pub contract_address: ContractAddress,
        pub creator: ContractAddress,
        pub token_contract_address: ContractAddress,
        pub starknet_address: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, class_hash: ClassHash) {
        assert(class_hash.is_non_zero(), 'CLASS HASH IS ZERO');
        self.dao_class_hash.write(class_hash);
        self.ownable.initializer(get_caller_address());
    }

    #[abi(embed_v0)]
    impl DaoFactoryImpl of super::IDaoFactory<ContractState> {
        fn create_dao(
            ref self: ContractState,
            token_contract_address: ContractAddress,
            public_key: u256,
            starknet_address: felt252
        ) -> ContractAddress {
            let mut calldata = array![];
            let creator = get_caller_address();
            (creator, token_contract_address, public_key, starknet_address).serialize(ref calldata);
            let (contract_address, _) = deploy_syscall(
                self.dao_class_hash.read(), 0, calldata.span(), false
            )
                .unwrap();
            // track instances
            self.dao_aa_list.entry((creator, contract_address)).write(self.dao_class_hash.read());

            self
                .emit(
                    DaoAACreated {
                        creator, contract_address, token_contract_address, starknet_address
                    }
                );

            contract_address
        }

        fn get_dao_class_hash(self: @ContractState) -> ClassHash {
            self.dao_class_hash.read()
        }

        fn update_dao_class_hash(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            assert(new_class_hash.is_non_zero(), 'CLASS HASH IS ZERO');
            let old_class_hash = self.dao_class_hash.read();
            self.dao_class_hash.write(new_class_hash);

            self.emit(ClassHashUpdated { old_class_hash, new_class_hash });
        }
    }
}

#[cfg(test)]
mod tests {
    use afk::dao::dao_factory::{IDaoFactoryDispatcher, IDaoFactoryDispatcherTrait};
    use openzeppelin::access::ownable::interface::{IOwnableDispatcher, IOwnableDispatcherTrait};
    use snforge_std::{
        declare, cheat_caller_address, ContractClassTrait, DeclareResultTrait, CheatSpan,
        spy_events, EventSpyAssertionsTrait
    };
    use starknet::{ContractAddress, contract_address_const, ClassHash, get_contract_address};

    fn CREATOR() -> ContractAddress {
        contract_address_const::<'CREATOR'>()
    }

    fn OWNER() -> ContractAddress {
        contract_address_const::<'OWNER'>()
    }

    fn deploy_dao_factory(class_hash: ClassHash) -> ContractAddress {
        let mut constructor_calldata = array![];
        class_hash.serialize(ref constructor_calldata);
        let contract = declare("DaoFactory").unwrap().contract_class();
        let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

        contract_address
    }

    #[test]
    fn test_dao_factory_create_dao() {
        let contract = declare("DaoAA").unwrap().contract_class();
        let class_hash: ClassHash = *contract.class_hash;
        let dao_factory_contract = deploy_dao_factory(class_hash);
        let dispatcher = IDaoFactoryDispatcher { contract_address: dao_factory_contract };
        let ownable = IOwnableDispatcher { contract_address: dao_factory_contract };

        let mut spy = spy_events();
        assert(ownable.owner() == get_contract_address(), 'WRONG INIT');

        // create a dao
        cheat_caller_address(dao_factory_contract, CREATOR(), CheatSpan::TargetCalls(1));
        let contract = dispatcher
            .create_dao(contract_address_const::<'TOKEN'>(), 6732_u256, 'STRK TOKEN');

        println!("New Contract: {:?}", contract);
        assert(contract > contract_address_const::<0x0>(), 'CREATION FAILED');

        let creation_event = super::DaoFactory::Event::DaoAACreated(
            super::DaoFactory::DaoAACreated {
                creator: CREATOR(),
                contract_address: contract,
                token_contract_address: contract_address_const::<'TOKEN'>(),
                starknet_address: 'STRK TOKEN'
            }
        );

        spy.assert_emitted(@array![(dao_factory_contract, creation_event)]);
    }
}
