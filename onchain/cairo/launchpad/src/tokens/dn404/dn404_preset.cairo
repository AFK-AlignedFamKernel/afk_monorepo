#[starknet::contract]
pub mod DN404Preset {
    use DN404Component::DN404HooksTrait;
    use openzeppelin::access::ownable::OwnableComponent;
    use starknet::ContractAddress;
    use crate::tokens::dn404::dn404_component::{DN404Component, DN404Options, IDN404};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: DN404Component, storage: dn404, event: DN404Event);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // DN404
    #[abi(embed_v0)]
    impl DN404Impl = DN404Component::DN404Impl<ContractState>;
    impl DN404InternalImpl = DN404Component::InternalFunctions<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        dn404: DN404Component::Storage,
        base_uri: ByteArray,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        DN404Event: DN404Component::Event,
    }

    /// Assigns `initial_supply_owner` as the contract owner.
    /// Forwards arguments to DN404 initializer
    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        base_uri: ByteArray,
        decimals: u8,
        initial_token_supply: u256,
        initial_supply_owner: ContractAddress,
        mirror: ContractAddress,
        options: DN404Options,
    ) {
        self
            .dn404
            .initializer(
                name, symbol, decimals, initial_token_supply, initial_supply_owner, mirror, options,
            );
        self.ownable.initializer(initial_supply_owner);
        self.base_uri.write(base_uri);
    }

    impl DN404HooksImpl of DN404HooksTrait<ContractState> {
        fn token_uri(self: @DN404Component::ComponentState<ContractState>, id: u256) -> ByteArray {
            let contract_state = DN404Component::HasComponent::get_contract(self);
            format!("{}/{}", contract_state.base_uri.read(), id)
        }

        fn after_nft_transfers(
            ref self: DN404Component::ComponentState<ContractState>,
            from: ContractAddress,
            to: ContractAddress,
            ids: Array<u256>,
        ) {}
    }
}
