use starknet::account::Call;
// use starknet::{ContractAddress, get_caller_address, get_contract_address,
// contract_address_const};
use super::profile::NostrProfile;
use super::request::SocialRequest;
use super::transfer::Transfer;


#[starknet::interface]
pub trait INostrDAOAccount<TContractState> {
    fn get_public_key(self: @TContractState) -> u256;
    fn handle_transfer(ref self: TContractState, request: SocialRequest<Transfer>);
    // fn __execute__(self: @TContractState, calls: Array<Call>) -> Array<Span<felt252>>;
// fn __validate__(self: @TContractState, calls: Array<Call>) -> felt252;
// fn is_valid_signature(self: @TContractState, hash: felt252, signature: Array<felt252>) ->
// felt252;
}

#[starknet::interface]
pub trait ISRC6<TState> {
    fn __execute__(self: @TState, calls: Array<Call>) -> Array<Span<felt252>>;
    fn __validate__(self: @TState, calls: Array<Call>) -> felt252;
    fn is_valid_signature(self: @TState, hash: felt252, signature: Array<felt252>) -> felt252;
}


#[starknet::contract(account)]
pub mod NostrDAOAccount {
    use afk::bip340;
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::utils::{
        MIN_TRANSACTION_VERSION, QUERY_OFFSET, execute_calls, // is_valid_stark_signature
    };
    use core::num::traits::Zero;
    use starknet::account::Call;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    use starknet::{get_caller_address, get_contract_address, get_tx_info, ContractAddress};
    use super::ISRC6;

    use super::super::request::{
        SocialRequest, SocialRequestImpl, SocialRequestTrait, Encode, Signature
    };
    use super::super::transfer::Transfer;
    use super::{INostrDAOAccountDispatcher, INostrDAOAccountDispatcherTrait};
    #[storage]
    struct Storage {
        #[key]
        public_key: u256,
        transfers: Map<u256, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AccountCreated: AccountCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct AccountCreated {
        #[key]
        public_key: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: u256) {
        self.public_key.write(public_key);
        self.emit(AccountCreated { public_key: public_key });
    }

    #[abi(embed_v0)]
    impl NostrDAOAccount of super::INostrDAOAccount<ContractState> {
        fn get_public_key(self: @ContractState) -> u256 {
            self.public_key.read()
        }
        fn handle_transfer(ref self: ContractState, request: SocialRequest<Transfer>) {
            // TODO: is this check necessary
            assert!(request.public_key == self.public_key.read(), "wrong sender");

            let erc20 = IERC20Dispatcher { contract_address: request.content.token_address };
            assert!(erc20.symbol() == request.content.token, "wrong token");

            let recipient = INostrDAOAccountDispatcher {
                contract_address: request.content.recipient_address
            };

            assert!(
                recipient.get_public_key() == request.content.recipient.public_key,
                "wrong recipient"
            );

            if let Option::Some(id) = request.verify() {
                assert!(!self.transfers.read(id), "double spend");
                self.transfers.entry(id).write(true);
                erc20.transfer(request.content.recipient_address, request.content.amount);
            } else {
                panic!("can't verify signature");
            }
        }
    }

    #[abi(embed_v0)]
    impl ISRC6Impl of ISRC6<ContractState> {
        fn __execute__(self: @ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            assert!(get_caller_address().is_zero(), "invalid caller");

            // Check tx version
            let tx_info = get_tx_info().unbox();
            let tx_version: u256 = tx_info.version.into();
            // Check if tx is a query
            if (tx_version >= QUERY_OFFSET) {
                assert!(QUERY_OFFSET + MIN_TRANSACTION_VERSION <= tx_version, "invalid tx version");
            } else {
                assert!(MIN_TRANSACTION_VERSION <= tx_version, "invalid tx version");
            }

            execute_calls(calls)
        }

        fn __validate__(self: @ContractState, calls: Array<Call>) -> felt252 {
            let tx_info = get_tx_info().unbox();
            self._is_valid_signature(tx_info.transaction_hash, tx_info.signature)
        }

        fn is_valid_signature(
            self: @ContractState, hash: felt252, signature: Array<felt252>
        ) -> felt252 {
            self._is_valid_signature(hash, signature.span())
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _is_valid_signature(
            self: @ContractState, hash: felt252, signature: Span<felt252>
        ) -> felt252 {
            let public_key = self.public_key.read();

            let mut signature = signature;
            let r: u256 = Serde::deserialize(ref signature).expect('invalid signature format');
            let s: u256 = Serde::deserialize(ref signature).expect('invalid signature format');

            let hash: u256 = hash.into();
            let mut hash_as_ba = Default::default();
            hash_as_ba.append_word(hash.high.into(), 16);
            hash_as_ba.append_word(hash.low.into(), 16);

            if bip340::verify(public_key, r, s, hash_as_ba) {
                starknet::VALIDATED
            } else {
                0
            }
        }
    }
}
