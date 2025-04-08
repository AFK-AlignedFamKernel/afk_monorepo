use afk::bip340::SchnorrSignature;
// contract_address_const};
use afk::social::profile::NostrProfile;
use afk::social::request::{
    NostrEventBasic, SocialRequest, UnsignedSocialRequest, UnsignedSocialRequestMessage,
};
use afk::social::transfer::Transfer;
use starknet::account::Call;
use starknet::{ContractAddress, get_caller_address, get_contract_address};

#[starknet::interface]
pub trait INostrAccount<TContractState> {
    fn get_public_key(self: @TContractState) -> u256;
    fn get_nostr_public_key(self: @TContractState) -> u256;
    fn get_starknet_public_key(self: @TContractState) -> ContractAddress;
    fn init_nostr_account(ref self: TContractState);
    fn set_vrf_contract_address(ref self: TContractState, vrf_contract_address: ContractAddress);

    fn sign_message(ref self: TContractState, message: ByteArray) -> SchnorrSignature;
    fn sign_nostr_event(
        ref self: TContractState, nostr_event: UnsignedSocialRequestMessage,
    ) -> SchnorrSignature;
    fn generate_nostr_signature_based_on_inputs(
        ref self: TContractState, created_at: u64, kind: u16, content: ByteArray, tags: ByteArray,
    ) -> SchnorrSignature;
    fn generate_nostr_event(
        ref self: TContractState, created_at: u64, kind: u16, content: ByteArray, tags: ByteArray,
    ) -> NostrEventBasic;
    // fn get_nostr_signature(ref self: TContractState, message: SocialRequest<T>) ->
// Array<felt252>;

    // fn handle_transfer(ref self: TContractState, request: SocialRequest<Transfer>);
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
pub mod NostrAccount {
    use afk::bip340;
    use afk::bip340::{
        SchnorrSignature, Signature, encodeUnsignedSocialRequestMessage, generate_keypair, sign,
        verify, verify_sig,
    };
    use afk::pedersen::{hash_to_curve, pedersen_commit, verify_commitment};
    use afk::social::request::{
        Encode, NostrEventBasic, SocialRequest, SocialRequestImpl, SocialRequestTrait,
        UnsignedSocialRequest, UnsignedSocialRequestMessage,
    };
    use afk::social::transfer::Transfer;
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::utils::{
        MIN_TRANSACTION_VERSION, QUERY_OFFSET, execute_calls // is_valid_stark_signature
    };
    use core::byte_array::ByteArrayTrait;
    use core::ec::stark_curve::{GEN_X, GEN_Y, ORDER};
    use core::ec::{EcPoint, ec_point_unwrap};
    use core::ecdsa::check_ecdsa_signature;
    use core::hash::{HashStateExTrait, HashStateTrait};
    use core::num::traits::Zero;
    use core::poseidon::PoseidonTrait;
    use starknet::account::Call;
    use starknet::secp256_trait::{Secp256PointTrait, Secp256Trait};
    use starknet::secp256k1::Secp256k1Point;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{
        ContractAddress, SyscallResultTrait, get_caller_address, get_contract_address, get_tx_info,
    };
    use super::{INostrAccountDispatcher, INostrAccountDispatcherTrait, ISRC6};

    #[storage]
    struct Storage {
        // #[key]
        public_key: u256,
        // #[key]
        nostr_public_key: u256,
        nostr_point_public_key: Secp256k1Point,
        // #[key]
        starknet_address: ContractAddress,
        private_key: u256,
        encrypted_private_key: u256,
        signature_salt: felt252,
        password: ByteArray,
        address_recovery: ContractAddress,
        transfers: Map<u256, bool>,
        nostr_accounts_public_keys: Map<u256, u256>,
        nostr_accounts_private_keys: Map<u256, u256>,
        vrf_contract_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AccountCreated: AccountCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct AccountCreated {
        #[key]
        public_key: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct NostrAccountCreated {
        #[key]
        public_key: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, // public_key: u256,
        public_key: ContractAddress,
        vrf_contract_address: ContractAddress,
    ) {
        // self.public_key.write(public_key);
        self.starknet_address.write(public_key);
        self.vrf_contract_address.write(vrf_contract_address);

        // Generate a Salt for Pedersen commitment
        // Generate public and private key
        // Saved Private key with Pedersen commitment with the signature of the Starknet account
        self.emit(AccountCreated { public_key: public_key });
    }


    // // Internal functions for create token, launch, add liquidity in DEX
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _is_caller_valid(ref self: ContractState) {
            if !self.starknet_address.read().is_zero() {
                assert!(get_caller_address() == self.starknet_address.read(), "invalid caller");
            }
        }

        fn _is_private_key_initialized(ref self: ContractState) {
            assert!(!self.private_key.read().is_zero(), "account not initialized");
        }
    }
    #[abi(embed_v0)]
    impl NostrAccount of super::INostrAccount<ContractState> {
        fn get_public_key(self: @ContractState) -> u256 {
            self.public_key.read()
        }

        fn get_nostr_public_key(self: @ContractState) -> u256 {
            self.nostr_public_key.read()
        }

        fn get_starknet_public_key(self: @ContractState) -> ContractAddress {
            self.starknet_address.read()
        }

        fn set_vrf_contract_address(
            ref self: ContractState, vrf_contract_address: ContractAddress,
        ) {
            if !self.starknet_address.read().is_zero() {
                assert!(get_caller_address() == self.starknet_address.read(), "invalid caller");
            }
            self.vrf_contract_address.write(vrf_contract_address);
        }

        fn init_nostr_account(ref self: ContractState) {
            assert!(self.private_key.read().is_zero(), "account already initialized");
            if !self.starknet_address.read().is_zero() {
                assert!(get_caller_address() == self.starknet_address.read(), "invalid caller");
            }
            let (private_key, public_key_point, public_key_x) = generate_keypair(
                self.vrf_contract_address.read(),
            );

            // // Get caller's signature to use as encryption key
            // let caller = get_caller_address();
            // let caller_sig = starknet::get_tx_info().unbox().signature;
            // assert(caller_sig.len() > 0, 'Signature required');

            // // Use first signature element as encryption key
            // let encryption_key:felt252 = *caller_sig[0].try_into().unwrap();

            // // XOR encrypt the private key with caller's signature
            // let encrypted_private_key = private_key ^ encryption_key;

            // Store encrypted private key - can only be decrypted by caller's signature
            // self.encrypted_private_key.write(encrypted_private_key.try_into().unwrap());
            self.private_key.write(private_key.try_into().unwrap());
            self.nostr_public_key.write(public_key_x);
        }

        fn sign_message(ref self: ContractState, message: ByteArray) -> SchnorrSignature {
            let private_key = self.private_key.read();
            println!("private_key: {}", private_key);
            assert!(!private_key.is_zero(), "account not initialized");

            // assert!(!self.private_key.read().is_zero(), "account not initialized");
            if !self.starknet_address.read().is_zero() {
                assert!(get_caller_address() == self.starknet_address.read(), "invalid caller");
            }

            // // Get caller's signature to decrypt
            // let caller_sig = starknet::get_tx_info().unbox().signature;
            // assert(caller_sig.len() > 0, 'Signature required');
            // let encryption_key = *caller_sig[0];

            // // Decrypt private key using caller's signature
            // let encrypted_private_key = self.private_key.read();
            // let private_key = encrypted_private_key ^ encryption_key;

            let pk_u256 = private_key.try_into().unwrap();
            let signature = sign(pk_u256, message, self.vrf_contract_address.read());
            signature
        }

        fn sign_nostr_event(
            ref self: ContractState, nostr_event: UnsignedSocialRequestMessage,
        ) -> SchnorrSignature {
            let private_key = self.private_key.read();
            println!("private_key: {}", private_key);

            assert!(!private_key.is_zero(), "account not initialized");
            if !self.starknet_address.read().is_zero() {
                assert!(get_caller_address() == self.starknet_address.read(), "invalid caller");
            }
            let private_key = self.private_key.read();
            let pk_u256 = private_key.try_into().unwrap();
            let message = encodeUnsignedSocialRequestMessage(nostr_event);
            // let message = nostr_event.encode();
            let signature = sign(pk_u256, message, self.vrf_contract_address.read());
            signature
        }

        fn generate_nostr_signature_based_on_inputs(
            ref self: ContractState,
            created_at: u64,
            kind: u16,
            content: ByteArray,
            tags: ByteArray,
        ) -> SchnorrSignature {
            assert!(!self.private_key.read().is_zero(), "account not initialized");
            if !self.starknet_address.read().is_zero() {
                assert!(get_caller_address() == self.starknet_address.read(), "invalid caller");
            }
            let private_key = self.private_key.read();
            let pk_u256 = private_key.try_into().unwrap();

            let public_key = self.nostr_public_key.read();

            let nostr_event = UnsignedSocialRequestMessage {
                public_key: public_key, created_at: created_at, kind, tags, content,
            };
            let message = encodeUnsignedSocialRequestMessage(nostr_event);
            // let message = nostr_event.encode();
            let signature = sign(pk_u256, message, self.vrf_contract_address.read());

            signature
        }

        fn generate_nostr_event(
            ref self: ContractState,
            created_at: u64,
            kind: u16,
            content: ByteArray,
            tags: ByteArray,
        ) -> NostrEventBasic {
            assert!(!self.private_key.read().is_zero(), "account not initialized");
            if !self.starknet_address.read().is_zero() {
                assert!(get_caller_address() == self.starknet_address.read(), "invalid caller");
            }
            let private_key = self.private_key.read();
            let pk_u256 = private_key.try_into().unwrap();

            let public_key = self.nostr_public_key.read();

            let nostr_event = UnsignedSocialRequestMessage {
                public_key: public_key.clone(),
                created_at: created_at.clone(),
                kind: kind.clone(),
                tags: tags.clone(),
                content: content.clone(),
            };
            let message = encodeUnsignedSocialRequestMessage(nostr_event);
            // let message = nostr_event.encode();
            let signature = sign(pk_u256, message, self.vrf_contract_address.read());

            let event_signed = NostrEventBasic {
                public_key: public_key, created_at: created_at, kind, tags, content, sig: signature,
                // ..nostr_event.clone(),
            };

            event_signed
        }
        // fn handle_transfer(ref self: ContractState, request: SocialRequest<Transfer>) {
    //     // TODO: is this check necessary
    //     assert!(request.public_key == self.public_key.read(), "wrong sender");

        //     let erc20 = IERC20Dispatcher { contract_address: request.content.token_address };
    //     assert!(erc20.symbol() == request.content.token, "wrong token");

        //     let recipient = INostrAccountDispatcher {
    //         contract_address: request.content.recipient_address
    //     };

        //     assert!(
    //         recipient.get_public_key() == request.content.recipient.public_key,
    //         "wrong recipient"
    //     );

        //     if let Option::Some(id) = request.verify() {
    //         assert!(!self.transfers.read(id), "double spend");
    //         self.transfers.entry(id).write(true);
    //         erc20.transfer(request.content.recipient_address, request.content.amount);
    //     } else {
    //         panic!("can't verify signature");
    //     }
    // }
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
            self: @ContractState, hash: felt252, signature: Array<felt252>,
        ) -> felt252 {
            self._is_valid_signature(hash, signature.span())
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _is_valid_signature(
            self: @ContractState, hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            let is_valid_length = signature.len() == 2_u32;
            // assert(is_valid_length, 'Account: Incorrect tx signature');

            if !is_valid_length {
                return 'INVALID_LENGTH';
            }

            let account_address: felt252 = self.starknet_address.read().try_into().unwrap();
            let is_valid = check_ecdsa_signature(
                hash, account_address, *signature.at(0_u32), *signature.at(1_u32),
            );
            if is_valid {
                return starknet::VALIDATED;
            }
            // assert(is_valid, 'INVALIDATED');
            0
        }

        fn _is_valid_signature_nostr(
            self: @ContractState, hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            let mut signature = signature;
            let r: u256 = Serde::deserialize(ref signature).expect('invalid signature format');
            let s: u256 = Serde::deserialize(ref signature).expect('invalid signature format');

            let hash: u256 = hash.into();
            let mut hash_as_ba = Default::default();
            hash_as_ba.append_word(hash.high.into(), 16);
            hash_as_ba.append_word(hash.low.into(), 16);

            let public_key = self.nostr_public_key.read();

            if bip340::verify(public_key, r, s, hash_as_ba) {
                starknet::VALIDATED
            } else {
                0
            }
        }
    }
}
#[cfg(test)]
mod tests {
    use afk::bip340::{SchnorrSignature, Signature};
    use afk::social::profile::NostrProfile;
    use afk::social::request::{
        ConvertToBytes, Encode, SocialRequest, UnsignedSocialRequest, UnsignedSocialRequestMessage,
    };
    use afk::social::transfer::Transfer;
    use afk::tokens::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use core::array::SpanTrait;
    use core::traits::Into;
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, EventSpy, DeclareResultTrait,
        EventSpyAssertionsTrait, // Event, EventFetcher, SpyOn
        //  EventAssertions,
        // cheat_transaction_hash_global,
        // cheat_signature_global,
        stop_cheat_transaction_hash_global,
        stop_cheat_signature_global, start_cheat_caller_address_global, stop_cheat_caller_address,
        stop_cheat_caller_address_global, start_cheat_block_timestamp,
    };
    use starknet::{
        ContractAddress, VALIDATED, contract_address_const, get_caller_address,
        get_contract_address,
    };
    use super::{
        INostrAccountDispatcher, INostrAccountDispatcherTrait, INostrAccountSafeDispatcher,
        INostrAccountSafeDispatcherTrait, ISRC6Dispatcher, ISRC6DispatcherTrait,
    };
    // Sepolia
    // const VRF_CONTRACT_ADDRESS: ContractAddress =
    // 0x00be3edf412dd5982aa102524c0b8a0bcee584c5a627ed1db6a7c36922047257;
    // const VRF_CONTRACT_ADDRESS: ContractAddress =
    // 0x00be3edf412dd5982aa102524c0b8a0bcee584c5a627ed1db6a7c36922047257;^
    // fn VRF_CONTRACT_ADDRESS() -> ContractAddress {
    //     0x00be3edf412dd5982aa102524c0b8a0bcee584c5a627ed1db6a7c36922047257.try_into().unwrap()
    // }
    fn VRF_CONTRACT_ADDRESS() -> ContractAddress {
        0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f.try_into().unwrap()
    }

    fn declare_account() -> @ContractClass {
        declare("NostrAccount").unwrap().contract_class()
    }

    fn declare_erc20() -> @ContractClass {
        declare("ERC20").unwrap().contract_class()
    }

    fn deploy_account(
        class: @ContractClass, public_key: ContractAddress, vrf_contract_address: ContractAddress,
    ) -> INostrAccountDispatcher {
        let mut calldata = array![];
        public_key.serialize(ref calldata);
        vrf_contract_address.serialize(ref calldata);

        let address = class.precalculate_address(@calldata);

        // let mut spy = spy_events(SpyOn::One(address));

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        // spy.fetch_events();

        // assert(spy.events.len() == 1, 'there should be one event');

        // TODO: deserialize event instead of manual decoding
        // let (_, event) = spy.events.at(0);
        // assert(event.keys.at(0) == @selector!("AccountCreated"), 'wrong event name');

        // let event_key = u256 {
        //     low: (*event.keys.at(1)).try_into().unwrap(),
        //     high: (*event.keys.at(2)).try_into().unwrap()
        // };

        // assert(event_key == public_key, 'wrong public key');

        INostrAccountDispatcher { contract_address }
    }

    fn deploy_erc20(
        class: @ContractClass,
        name: felt252,
        symbol: felt252,
        initial_supply: u256,
        recipient: ContractAddress,
    ) -> IERC20Dispatcher {
        let mut calldata = array![];

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        (2 * initial_supply).serialize(ref calldata);
        recipient.serialize(ref calldata);
        18_u8.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IERC20Dispatcher { contract_address }
    }

    // Constants
    fn OWNER() -> ContractAddress {
        // 'owner'.try_into().unwrap()
        123.try_into().unwrap()
    }

    fn RECIPIENT() -> ContractAddress {
        'recipient'.try_into().unwrap()
    }

    fn request_fixture_custom_classes(
        erc20_class: @ContractClass, account_class: @ContractClass,
    ) -> (
        SocialRequest<Transfer>,
        INostrAccountDispatcher,
        INostrAccountDispatcher,
        IERC20Dispatcher,
        UnsignedSocialRequestMessage,
    ) {
        // sender private key: 70aca2a9ab722bd56a9a1aadae7f39bc747c7d6735a04d677e0bc5dbefa71d47
        // just for testing, do not use for anything else
        let nostr_sender_public_key =
            0xd6f1cf53f9f52d876505164103b1e25811ec4226a17c7449576ea48b00578171_u256;

        let sender_public_key: ContractAddress = OWNER();
        let sender = deploy_account(account_class, sender_public_key, VRF_CONTRACT_ADDRESS());

        // recipient private key:
        // 59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35 // just for testing, do
        // not use for anything else
        // let recipient_public_key =
        //     0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;
        let recipient_public_key: ContractAddress = RECIPIENT();
        let recipient = deploy_account(account_class, recipient_public_key, VRF_CONTRACT_ADDRESS());

        let joyboy_public_key =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let erc20 = deploy_erc20(erc20_class, 'USDC token', 'USDC', 100, sender.contract_address);

        let transfer = Transfer {
            amount: 1,
            token: erc20.symbol(),
            token_address: erc20.contract_address,
            joyboy: NostrProfile {
                public_key: joyboy_public_key, relays: array!["wss://relay.joyboy.community.com"],
            },
            // recipient: NostrProfile { public_key: recipient_public_key, relays: array![] },
            recipient: NostrProfile { public_key: joyboy_public_key, relays: array![] },
            recipient_address: recipient.contract_address,
        };

        // for test data see: https://replit.com/@maciejka/WanIndolentKilobyte-2

        let request = SocialRequest {
            public_key: nostr_sender_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: transfer.clone(),
            sig: SchnorrSignature {
                r: 0x3570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
        };

        let unsigned_request = UnsignedSocialRequestMessage {
            public_key: nostr_sender_public_key.clone(),
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: "LFG",
        };

        (request, sender, recipient, erc20, unsigned_request)
    }

    fn request_fixture() -> (
        SocialRequest<Transfer>,
        INostrAccountDispatcher,
        INostrAccountDispatcher,
        IERC20Dispatcher,
        UnsignedSocialRequestMessage,
    ) {
        let erc20_class = declare_erc20();
        let account_class = declare_account();
        request_fixture_custom_classes(erc20_class, account_class)
    }

    #[test]
    #[fork("Sepolia")]
    fn init_nostr_account() {
        // let public_key: u256 = 45;
        let public_key: ContractAddress = OWNER();
        start_cheat_caller_address_global(public_key);
        let account = deploy_account(declare_account(), public_key, VRF_CONTRACT_ADDRESS());
        account.init_nostr_account();
        // assert!(account.get_public_key() == public_key, "wrong public_key");
    }

    #[test]
    #[fork("Sepolia")]
    fn test_sign_message() {
        // let public_key: u256 = 45;
        let public_key: ContractAddress = OWNER();
        start_cheat_caller_address_global(public_key);
        let account = deploy_account(declare_account(), public_key, VRF_CONTRACT_ADDRESS());
        account.init_nostr_account();

        let message = "Hello, world!";

        let signature = account.sign_message(message);
        // let is_valid = verify_sig(account.nostr_point_public_key.read(), message, signature,
    // VRF_CONTRACT_ADDRESS());
    // assert!(is_valid, "signature is not valid");
    // assert!(account.get_public_key() == public_key, "wrong public_key");
    }

    #[test]
    #[fork("Sepolia")]
    fn test_sign_nostr_event() {
        let public_key: ContractAddress = OWNER();
        start_cheat_caller_address_global(public_key);
        let account = deploy_account(declare_account(), public_key, VRF_CONTRACT_ADDRESS());
        account.init_nostr_account();

        let erc20_class = declare_erc20();
        let account_class = declare_account();

        let (request, sender, _, _, unsigned_request) = request_fixture_custom_classes(
            erc20_class, account_class,
        );

        let request = UnsignedSocialRequestMessage { ..unsigned_request };
        let signature = account.sign_nostr_event(request);
        // let signature = account.sign_message(message);

        // let is_valid = verify_sig(account.nostr_point_public_key.read(), message, signature,
    // VRF_CONTRACT_ADDRESS());
    // assert!(is_valid, "signature is not valid");
    // assert!(account.get_public_key() == public_key, "wrong public_key");
    }

    #[test]
    #[fork("Sepolia")]
    fn test_generate_nostr_event() {
        let public_key: ContractAddress = OWNER();
        start_cheat_caller_address_global(public_key);
        let account = deploy_account(declare_account(), public_key, VRF_CONTRACT_ADDRESS());
        account.init_nostr_account();

        let erc20_class = declare_erc20();
        let account_class = declare_account();

        let (request, sender, _, _, unsigned_request) = request_fixture_custom_classes(
            erc20_class, account_class,
        );

        let created_at = 1716285235_u64;
        let kind = 1_u16;
        let tags = "[]";
        let content = "LFG";
        // let request = UnsignedSocialRequestMessage {
        //     ..unsigned_request,
        // };
        let nostr_event = account.generate_nostr_event(created_at, kind, content, tags);
        // let signature = account.sign_message(message);

        // let is_valid = verify_sig(account.nostr_point_public_key.read(), message, signature,
    // VRF_CONTRACT_ADDRESS());
    // assert!(is_valid, "signature is not valid");
    // assert!(account.get_public_key() == public_key, "wrong public_key");
    }

    #[test]
    #[fork("Sepolia")]
    fn test_generate_nostr_signature_based_on_inputs() {
        let public_key: ContractAddress = OWNER();
        start_cheat_caller_address_global(public_key);
        let account = deploy_account(declare_account(), public_key, VRF_CONTRACT_ADDRESS());
        account.init_nostr_account();

        let erc20_class = declare_erc20();
        let account_class = declare_account();

        let (request, sender, _, _, unsigned_request) = request_fixture_custom_classes(
            erc20_class, account_class,
        );

        let created_at = 1716285235_u64;
        let kind = 1_u16;
        let tags = "[]";
        let content = "LFG";
        // let request = UnsignedSocialRequestMessage {
        //     ..unsigned_request,
        // };
        let signature = account
            .generate_nostr_signature_based_on_inputs(created_at, kind, content, tags);
        // let signature = account.sign_message(message);

        // let is_valid = verify_sig(account.nostr_point_public_key.read(), message, signature,
    // VRF_CONTRACT_ADDRESS());
    // assert!(is_valid, "signature is not valid");
    // assert!(account.get_public_key() == public_key, "wrong public_key");
    }

    #[test]
    fn test_get_starknet_public_key() {
        // let public_key: u256 = 45;
        let public_key: ContractAddress = OWNER();

        // let account = deploy_account(declare_account(), public_key);
        let account = deploy_account(declare_account(), public_key, VRF_CONTRACT_ADDRESS());

        assert!(account.get_starknet_public_key() == public_key, "wrong public_key");
    }
    // #[fork("Mainnet")]
    #[test]
    #[fork("Sepolia")]
    fn is_valid_signature() {
        let public_key: ContractAddress = OWNER();

        let account_class = declare_account();
        let account = deploy_account(account_class, public_key, VRF_CONTRACT_ADDRESS());

        let account = ISRC6Dispatcher { contract_address: account.contract_address };

        let hash = 0x6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

        let r: u256 = 0x49ae3fa614e2877877a90987726f1b48387bef1f66de78e5075659040cbbf612;
        let s: u256 = 0x11259ae25e0743ac7490df3fef875ea291c7b99cf2295e44aabd677107b9c53a;

        let mut signature = Default::default();
        r.serialize(ref signature);
        s.serialize(ref signature);

        assert!(account.is_valid_signature(hash, signature.clone()) == starknet::VALIDATED);

        let invalid_hash = 0x5a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

        assert!(account.is_valid_signature(invalid_hash, signature) != starknet::VALIDATED);
    }
    // #[test]
// fn validate_transaction() {
//     let public_key: ContractAddress = OWNER();

    //     let account_class = declare_account();
//     let account = deploy_account(account_class, public_key, VRF_CONTRACT_ADDRESS);

    //     let account = ISRC6Dispatcher { contract_address: account.contract_address };

    //     let hash = 0x6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

    //     let r: u256 = 0x49ae3fa614e2877877a90987726f1b48387bef1f66de78e5075659040cbbf612;
//     let s: u256 = 0x11259ae25e0743ac7490df3fef875ea291c7b99cf2295e44aabd677107b9c53a;

    //     let mut signature = Default::default();
//     r.serialize(ref signature);
//     s.serialize(ref signature);

    //     // cheat_transaction_hash_global(hash);
//     // cheat_signature_global(signature.span());

    //     assert!(account.__validate__(Default::default()) == starknet::VALIDATED);

    //     let invalid_hash = 0x5a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;
//     cheat_transaction_hash_global(invalid_hash);

    //     assert!(account.__validate__(Default::default()) != starknet::VALIDATED);

    //     stop_cheat_transaction_hash_global();
//     // stop_cheat_signature_global();
// }

    // #[test]
// fn test_get_public_key() {
//     // let public_key: u256 = 45;
//     let public_key: ContractAddress = OWNER();

    //     // let account = deploy_account(declare_account(), public_key);
//     let account = deploy_account(declare_account(), public_key, VRF_CONTRACT_ADDRESS);

    //     assert!(account.get_public_key() == public_key, "wrong public_key");
// }

    // #[test]
// fn successful_transfer() {
//     let (request, sender, _, _) = request_fixture();
//     // sender.handle_transfer(request);
// }

    // #[test]
// #[should_panic(expected: "can't verify signature")]
// fn incorrect_signature() {
//     let (request, sender, _, _) = request_fixture();

    //     let request = SocialRequest {
//         sig: Signature {
//             r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
//             s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
//         },
//         ..request,
//     };

    //     // sender.handle_transfer(request);
// }

    // #[test]
// #[should_panic(expected: "wrong sender")]
// fn wrong_sender() {
//     let (request, sender, _, _) = request_fixture();

    //     let request = SocialRequest { public_key: 123_u256, ..request, };

    //     // sender.handle_transfer(request);
// }

    // #[test]
// #[should_panic(expected: "wrong recipient")]
// fn wrong_recipient() {
//     let (request, sender, _, _) = request_fixture();

    //     // let content = request.content.clone();

    //     let request = SocialRequest {
//         content: Transfer {
//             recipient_address: sender.contract_address, ..request.content.clone()
//         },
//         ..request,
//     };

    //     // sender.handle_transfer(request);
// }

    // #[test]
// #[should_panic(expected: "wrong token")]
// fn wrong_token() {
//     let erc20_class = declare_erc20();
//     let account_class = declare_account();

    //     let dai = deploy_erc20(erc20_class, 'DAI token', 'DAI', 100, 21.try_into().unwrap());

    //     let (request, sender, _, _) = request_fixture_custom_classes(erc20_class, account_class);

    //     let request = SocialRequest {
//         content: Transfer { token_address: dai.contract_address, ..request.content.clone() },
//         ..request,
//     };

    //     // sender.handle_transfer(request);
// }

    // #[test]
// #[should_panic(expected: "double spend")]
// fn double_transfer() {
//     let erc20_class = declare_erc20();
//     let account_class = declare_account();
//     let (request, sender, _, _) = request_fixture_custom_classes(erc20_class, account_class);
//     let (request2, _, _, _) = request_fixture_custom_classes(erc20_class, account_class);

    //     sender.handle_transfer(request);
//     sender.handle_transfer(request2);
// }

}

