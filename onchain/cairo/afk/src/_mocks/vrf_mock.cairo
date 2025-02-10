use starknet::ContractAddress;
use stark_vrf::ecvrf::{Point, Proof, ECVRF, ECVRFImpl};

#[starknet::interface]
trait IVrfProvider<TContractState> {
    fn request_random(self: @TContractState, caller: ContractAddress, source: Source);
    fn submit_random(ref self: TContractState, seed: felt252, proof: Proof);
    fn consume_random(ref self: TContractState, source: Source) -> felt252;
    fn assert_consumed(ref self: TContractState, seed: felt252);

    fn get_public_key(self: @TContractState) -> PublicKey;
    fn set_public_key(ref self: TContractState, new_pubkey: PublicKey);
}

#[derive(Drop, Copy, Clone, Serde, starknet::Store)]
pub struct PublicKey {
    x: felt252,
    y: felt252,
}

impl PublicKeyIntoPoint of Into<PublicKey, Point> {
    fn into(self: PublicKey) -> Point {
        Point { x: self.x, y: self.y }
    }
}

#[derive(Drop, Copy, Clone, Serde)]
pub enum Source {
    Nonce: ContractAddress,
    Salt: felt252,
}


#[starknet::component]
pub mod VrfProviderComponent {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use core::poseidon::poseidon_hash_span;
    use starknet::storage::Map;

    use openzeppelin_access::ownable::{
        OwnableComponent, OwnableComponent::InternalImpl as OwnableInternalImpl,
    };

    use super::{PublicKey, Source};

    use stark_vrf::ecvrf::{Point, Proof, ECVRF, ECVRFImpl};

    #[storage]
    struct Storage {
        VrfProvider_pubkey: PublicKey,
        // wallet -> nonce
        VrfProvider_nonces: Map<ContractAddress, felt252>,
        // seed -> random
        VrfProvider_random: Map<felt252, felt252>,
    }

    #[derive(Drop, starknet::Event)]
    struct PublicKeyChanged {
        pubkey: PublicKey,
    }

    #[derive(Drop, starknet::Event)]
    struct SubmitRandom {
        #[key]
        seed: felt252,
        proof: Proof,
    }

    #[derive(Drop, starknet::Event)]
    #[event]
    enum Event {
        PublicKeyChanged: PublicKeyChanged,
        SubmitRandom: SubmitRandom,
    }

    pub mod Errors {
        pub const PUBKEY_ZERO: felt252 = 'VrfProvider: pubkey is zero';
        pub const INVALID_PROOF: felt252 = 'VrfProvider: invalid proof';
        pub const NOT_FULFILLED: felt252 = 'VrfProvider: not fulfilled';
        pub const NOT_CONSUMED: felt252 = 'VrfProvider: not consumed';
    }

    #[embeddable_as(VrfProviderImpl)]
    impl VrfProvider<
        TContractState,
        +Drop<TContractState>,
        +HasComponent<TContractState>,
        impl Owner: OwnableComponent::HasComponent<TContractState>,
    > of super::IVrfProvider<ComponentState<TContractState>> {
        fn request_random(
            self: @ComponentState<TContractState>, caller: ContractAddress, source: Source,
        ) {}

        fn submit_random(ref self: ComponentState<TContractState>, seed: felt252, proof: Proof) {
            let pubkey: Point = self.get_public_key().into();
            let ecvrf = ECVRFImpl::new(pubkey);

            let random = ecvrf
                .verify(proof.clone(), array![seed.clone()].span())
                .expect(Errors::INVALID_PROOF);

            self.VrfProvider_random.write(seed, random);

            self.emit(SubmitRandom { seed, proof });
        }

        fn consume_random(ref self: ComponentState<TContractState>, source: Source) -> felt252 {
            let caller = get_caller_address();
            let tx_info = starknet::get_execution_info().tx_info.unbox();

            let seed = match source {
                Source::Nonce(addr) => {
                    let nonce = self.VrfProvider_nonces.read(addr);
                    self.VrfProvider_nonces.write(addr, nonce + 1);
                    poseidon_hash_span(array![nonce, caller.into(), tx_info.chain_id].span())
                },
                Source::Salt(salt) => {
                    poseidon_hash_span(array![salt, caller.into(), tx_info.chain_id].span())
                },
            };

            // Always return 0 during fee estimation to avoid leaking vrf info.
            if tx_info.max_fee == 0
                && *tx_info.resource_bounds.at(0).max_amount == 0
                && *tx_info.resource_bounds.at(1).max_amount == 0 {
                // simulate consumed
                self.VrfProvider_random.write(seed, 0);
                return 0;
            }

            let random = self.VrfProvider_random.read(seed);
            assert(random != 0, Errors::NOT_FULFILLED);

            self.VrfProvider_random.write(seed, 0);

            random
        }

        fn assert_consumed(ref self: ComponentState<TContractState>, seed: felt252) {
            let random = self.VrfProvider_random.read(seed);
            assert(random == 0, Errors::NOT_CONSUMED);
        }

        fn get_public_key(self: @ComponentState<TContractState>) -> PublicKey {
            self.VrfProvider_pubkey.read()
        }

        fn set_public_key(ref self: ComponentState<TContractState>, new_pubkey: PublicKey) {
            let mut ownable_component = get_dep_component_mut!(ref self, Owner);
            ownable_component.assert_only_owner();

            self._set_public_key(new_pubkey);
        }
    }

    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn initializer(ref self: ComponentState<TContractState>, pubkey: PublicKey) {
            self._set_public_key(pubkey);
        }

        fn _set_public_key(ref self: ComponentState<TContractState>, new_pubkey: PublicKey) {
            assert(new_pubkey.x != 0 && new_pubkey.y != 0, Errors::PUBKEY_ZERO);
            self.VrfProvider_pubkey.write(new_pubkey);

            self.emit(PublicKeyChanged { pubkey: new_pubkey })
        }
    }
}
