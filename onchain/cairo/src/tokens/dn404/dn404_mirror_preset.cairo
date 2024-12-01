#[starknet::contract]
pub mod DN404MirrorPreset {
    use starknet::ContractAddress;
    use crate::tokens::dn404::dn404_mirror_component::{IDN404Mirror, DN404MirrorComponent};
    use openzeppelin::introspection::src5::SRC5Component;


    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: DN404MirrorComponent, storage: dn404_mirror, event: DN404MirrorEvent);

    // DN404
    #[abi(embed_v0)]
    impl DN404MirrorImpl = DN404MirrorComponent::DN404MirrorImpl<ContractState>;
    impl DN404MirrorInternalImpl = DN404MirrorComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        dn404_mirror: DN404MirrorComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        DN404MirrorEvent: DN404MirrorComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        deployer: ContractAddress,
    ) {
        self.dn404_mirror.initializer(deployer);
    }

}