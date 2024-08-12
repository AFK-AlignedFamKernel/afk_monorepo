use core::fmt::Display;
use core::to_byte_array::FormatAsByteArray;
use starknet::{get_caller_address, get_contract_address, get_tx_info, ContractAddress};
use super::request::{SocialRequest, SocialRequestImpl, SocialRequestTrait, Encode, Signature};

// Add this ROLE on a constants file
pub const OPERATOR_ROLE: felt252 = selector!("OPERATOR_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

type NostrPublicKey = u256;
type AddressId = felt252;

#[derive(Clone, Debug, Drop, Serde)]
pub struct LinkedStarknetAddress {
    pub starknet_address: ContractAddress
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
struct LinkedWalletProfileDefault {
    nostr_address: NostrPublicKey,
    starknet_address: ContractAddress,
// Add NIP-05 and stats profil after. Gonna write a proposal for it
}

// TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr content
impl LinkedStarknetAddressEncodeImpl of Encode<LinkedStarknetAddress> {
    fn encode(self: @LinkedStarknetAddress) -> @ByteArray {
        let recipient_address_user_felt: felt252 = self
            .starknet_address
            .clone()
            .try_into()
            .unwrap();

        @format!("link to {:?}", recipient_address_user_felt)
    }
}

#[derive(Copy, Debug, Drop, Serde)]
pub enum LinkedResult {
    Transfer: ContractAddress,
// LinkedStarknetAddress: LinkedStarknetAddress
}

#[starknet::interface]
pub trait INamespace<TContractState> {
    // Getters
    fn get_nostr_to_sn_default(
        self: @TContractState, nostr_public_key: NostrPublicKey
    ) -> ContractAddress;

    fn get_sn_to_nostr_default(
        self: @TContractState, starknet_address: ContractAddress
    ) -> NostrPublicKey;
    // Admin
    fn set_control_role(
        ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool
    );
    // User
    fn linked_nostr_default_account(
        ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>
    );
// // External call protocol
// fn protocol_linked_nostr_default_account(
//     ref self: TContractState,
//     nostr_public_key: NostrPublicKey,
//     starknet_address: ContractAddress
// );
}

#[starknet::contract]
pub mod Namespace {
    use afk::bip340;
    use afk::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::num::traits::Zero;

    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;

    use starknet::account::Call;
    use starknet::{
        get_block_timestamp, get_caller_address, get_contract_address, get_tx_info, ContractAddress
    };
    use super::super::request::{
        SocialRequest, SocialRequestImpl, SocialRequestTrait, Encode, Signature
    };

    use super::{
        LinkedWalletProfileDefault, LinkedResult, INamespace, NostrPublicKey,
        LinkedStarknetAddressEncodeImpl, LinkedStarknetAddress, OPERATOR_ROLE, ADMIN_ROLE
    };

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    impl LinkedWalletDefault of Default<LinkedWalletProfileDefault> {
        #[inline(always)]
        fn default() -> LinkedWalletProfileDefault {
            LinkedWalletProfileDefault {
                starknet_address: 0.try_into().unwrap(), nostr_address: 0.try_into().unwrap(),
            }
        }
    }

    #[storage]
    struct Storage {
        nostr_to_sn: LegacyMap<NostrPublicKey, ContractAddress>,
        sn_to_nostr: LegacyMap<ContractAddress, NostrPublicKey>,
        nostr_to_sn_list: LegacyMap<NostrPublicKey, (u8, ContractAddress)>,
        nostr_starknet_next_id: LegacyMap<NostrPublicKey, u8>,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[derive(Drop, starknet::Event)]
    struct LinkedDefaultStarknetAddressEvent {
        #[key]
        nostr_address: NostrPublicKey,
        #[key]
        starknet_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct AddStarknetAddressEvent {
        #[key]
        nostr_address: NostrPublicKey,
        #[key]
        starknet_address: ContractAddress,
        #[key]
        id: u8,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        LinkedDefaultStarknetAddressEvent: LinkedDefaultStarknetAddressEvent,
        AddStarknetAddressEvent: AddStarknetAddressEvent,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
    }

    #[abi(embed_v0)]
    impl NamespaceImpl of INamespace<ContractState> {
        // Admin
        // Add OPERATOR role to the Deposit escrow
        fn set_control_role(
            ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert!(
                role == ADMIN_ROLE
                    || role == OPERATOR_ROLE // Think and Add others roles needed on the protocol
                    ,
                "role not enable"
            );
            if is_enable {
                self.accesscontrol._grant_role(role, recipient);
            } else {
                self.accesscontrol._revoke_role(role, recipient);
            }
        }

        // Getters
        fn get_nostr_to_sn_default(
            self: @ContractState, nostr_public_key: NostrPublicKey
        ) -> ContractAddress {
            self.nostr_to_sn.read(nostr_public_key)
        }


        fn get_sn_to_nostr_default(
            self: @ContractState, starknet_address: ContractAddress
        ) -> NostrPublicKey {
            self.sn_to_nostr.read(starknet_address)
        }


        // Create list getter

        // User request with a Nostr event

        fn linked_nostr_default_account(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>
        ) {
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
            self.nostr_to_sn.write(request.public_key, profile_default.starknet_address);
            self.sn_to_nostr.write(profile_default.starknet_address, request.public_key);
            self
                .emit(
                    LinkedDefaultStarknetAddressEvent {
                        nostr_address: request.public_key, starknet_address,
                    }
                );
        }
    // Protocol request with OPERATOR_ROLE
    // Call by Deposit Escrow at this stage in claim or deposit functions
    // fn protocol_linked_nostr_default_account(
    //     ref self: ContractState,
    //     nostr_public_key: NostrPublicKey,
    //     starknet_address: ContractAddress
    // ) {
    //     self.accesscontrol.assert_only_role(OPERATOR_ROLE);
    //     self.nostr_to_sn.write(nostr_public_key, starknet_address);
    //     self
    //         .emit(
    //             LinkedDefaultStarknetAddressEvent {
    //                 nostr_address: nostr_public_key, starknet_address,
    //             }
    //         );
    // }

    }
}

#[cfg(test)]
mod tests {
    use afk::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use core::array::SpanTrait;
    use core::traits::Into;
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, SpyOn, EventSpy, EventFetcher,
        Event, EventAssertions, start_cheat_caller_address, cheat_caller_address_global,
        stop_cheat_caller_address_global, start_cheat_block_timestamp,
    };
    use starknet::{
        ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
        contract_address_const,
    };

    use super::super::request::{SocialRequest, Signature, Encode};
    use super::super::transfer::Transfer;
    use super::{
        LinkedWalletProfileDefault, AddressId, LinkedResult, INamespace, NostrPublicKey,
        LinkedStarknetAddress
    };
    use super::{INamespaceDispatcher, INamespaceDispatcherTrait};

    fn declare_namespace() -> ContractClass {
        declare("Namespace").unwrap()
    }

    fn deploy_namespace(class: ContractClass) -> INamespaceDispatcher {
        let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
        let mut calldata = array![];
        ADMIN_ADDRESS.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();

        INamespaceDispatcher { contract_address }
    }

    fn request_fixture_custom_classes(
        namespace_class: ContractClass
    ) -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INamespaceDispatcher,
        SocialRequest<LinkedStarknetAddress>
    ) {
        // recipient private key: 59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35
        // just for testing, do not use for anything else
        // let recipient_public_key =
        //     0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let recipient_public_key =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let sender_address: ContractAddress = 123.try_into().unwrap();

        let namespace = deploy_namespace(namespace_class);

        let recipient_address_user: ContractAddress = 678.try_into().unwrap();

        // TODO change with the correct signature with the content LinkedWalletProfileDefault id and strk recipient
        // TODO Uint256 to felt on Starknet js
        // for test data see claim to:   https://replit.com/@msghais135/WanIndolentKilobyte-claimto#linked_to.js

        let linked_wallet = LinkedStarknetAddress {
            starknet_address: sender_address.try_into().unwrap()
        };

        // @TODO format the content and get the correct signature
        let request_linked_wallet_to = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: linked_wallet.clone(),
            sig: Signature {
                r: 0x8ffbabf63d0fd526dffb8c04d04a216bb03743fae22826a2b42005d478c48360_u256,
                s: 0x6aa0f5295635d03d6d3f61aaf7f4163175ed1a9001550b9da4c0a3a6098c0caf_u256,
            // r: 0x051b6d408b709d29b6ef55b1aa74d31a9a265c25b0b91c2502108b67b29c0d5c_u256,
            // s: 0xe31f5691af0e950eb8697fdbbd464ba725b2aaf7e5885c4eaa30a1e528269793_u256
            }
        };

        let linked_wallet_not_caller = LinkedStarknetAddress {
            starknet_address: recipient_address_user.try_into().unwrap()
        };

        // @TODO format the content and get the correct signature
        let fail_request_linked_wallet_to_caller = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: linked_wallet_not_caller.clone(),
            sig: Signature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            }
        };

        (
            request_linked_wallet_to,
            recipient_public_key,
            sender_address,
            namespace,
            fail_request_linked_wallet_to_caller
        )
    }

    fn request_fixture() -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INamespaceDispatcher,
        SocialRequest<LinkedStarknetAddress>
    ) {
        let namespace_class = declare_namespace();
        request_fixture_custom_classes(namespace_class)
    }

    #[test]
    fn linked_wallet_to() {
        let (request, recipient_nostr_key, sender_address, namespace, _) = request_fixture();
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(namespace.contract_address, sender_address);
        namespace.linked_nostr_default_account(request);

        let nostr_linked = namespace.get_nostr_to_sn_default(recipient_nostr_key);
        assert!(nostr_linked == sender_address, "nostr not linked");
    }

    #[test]
    #[should_panic(expected: 'can\'t verify signature')]
    fn link_incorrect_signature() {
        let (_, _, sender_address, namespace, fail_request_linked_wallet_to_caller) =
            request_fixture();
        stop_cheat_caller_address_global();
        start_cheat_caller_address(namespace.contract_address, sender_address);

        let request_test_failed_sig = SocialRequest {
            sig: Signature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966606f_u256,
            },
            ..fail_request_linked_wallet_to_caller,
        };
        namespace.linked_nostr_default_account(request_test_failed_sig);
    }

    #[test]
    #[should_panic(expected: 'can\'t verify signature')]
    fn link_incorrect_signature_link_to() {
        let (request, _, sender_address, namespace, _) = request_fixture();
        cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(namespace.contract_address, sender_address);
        let request_test_failed_sig = SocialRequest {
            sig: Signature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
            ..request,
        };

        namespace.linked_nostr_default_account(request_test_failed_sig);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: ' invalid caller ')]
    fn link_incorrect_caller_link_to() {
        let (_, _, sender_address, namespace, fail_request_linked_wallet_to) = request_fixture();
        cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(namespace.contract_address, sender_address);
        namespace.linked_nostr_default_account(fail_request_linked_wallet_to);
    }
}
