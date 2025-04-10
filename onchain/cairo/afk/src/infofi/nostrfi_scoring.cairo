use afk::social::request::{ConvertToBytes, Encode, SocialRequest, SocialRequestImpl};
use core::fmt::Display;
use starknet::ContractAddress;

// Add this ROLE on a constants file
pub const OPERATOR_ROLE: felt252 = selector!("OPERATOR_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

type NostrPublicKey = u256;
type AddressId = felt252;

#[derive(Clone, Debug, Drop, Serde)]
pub struct LinkedStarknetAddress {
    pub starknet_address: ContractAddress,
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct LinkedWalletProfileDefault {
    nostr_address: NostrPublicKey,
    starknet_address: ContractAddress,
    // Add NIP-05 and stats profil after. Gonna write a proposal for it
}

// TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr content
pub impl LinkedStarknetAddressEncodeImpl of Encode<LinkedStarknetAddress> {
    fn encode(self: @LinkedStarknetAddress) -> @ByteArray {
        let recipient_address_user_felt: felt252 = self
            .starknet_address
            .clone()
            .try_into()
            .unwrap();

        @format!("link to {:?}", recipient_address_user_felt)
    }
}


#[derive(Clone, Debug, Drop, Serde)]
pub struct CreateTokenProfile {
    pub starknet_address: ContractAddress,
    pub is_create_staking_vault: bool,
}

// TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr content
pub impl CreateTokenProfileEncodeImpl of Encode<CreateTokenProfile> {
    fn encode(self: @CreateTokenProfile) -> @ByteArray {
        let recipient_address_user_felt: felt252 = self
            .starknet_address
            .clone()
            .try_into()
            .unwrap();

        let is_create_staking_vault_felt: felt252 = self
            .is_create_staking_vault
            .clone()
            .try_into()
            .unwrap();

        @format!("link to {:?}", recipient_address_user_felt)
    }
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct LinkedThisNostrNote {
    nostr_address: NostrPublicKey,
    nostr_event_id: NostrPublicKey,
    starknet_address: ContractAddress,
    // Add NIP-05 and stats profil after. Gonna write a proposal for it
}
#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct NostrFiAdminStorage {
    quote_token_address: ContractAddress,
    is_paid_storage_pubkey_profile: bool,
    is_paid_storage_event_id: bool,
    amount_paid_storage_pubkey_profile: u256,
    amount_paid_storage_event_id: u256,
    is_multi_token_vote: bool,
    vote_token_address: ContractAddress,
}


#[derive(Copy, Debug, Drop, Serde, starknet::Store)]
pub enum Vote {
    Good,
    Bad,
}
#[derive(Copy, Debug, Drop, Serde, starknet::Store)]
pub enum TokenLaunchType {
    Later,
    Fairlaunch,
    PrivateSale,
    PublicSale,
    ICO,
    DutchAuction,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountBasic {
    nostr_address: u256,
    starknet_address: ContractAddress,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountScoring {
    nostr_address: u256,
    starknet_address: ContractAddress,
    ai_score: u256,
    token_launch_type: TokenLaunchType,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct VoteProfile {
    nostr_address: u256,
    starknet_address: ContractAddress,
    good_score: u256,
    bad_score: u256,
    unique_address: u256,
    vote: Vote,
    ai_score: u256,
    points: u256,
    invested_points: u256,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct VoteUserForProfile {
    nostr_address: u256,
    starknet_address: ContractAddress,
    vote: Vote,
    points: u256,
    invested_points: u256,
    token_address: ContractAddress,
    staked_token_amount: u256,
}
#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountParams {
    starknet_address: ContractAddress,
    token_address: ContractAddress,
    vault_address: ContractAddress,
    tip_address: ContractAddress,
    dao_address: ContractAddress,
    token_launch_type: TokenLaunchType,
    is_create_staking_vault: bool,
    is_create_dao: bool,
}


// TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr content
// impl LinkedStarknetAddressEncodeImpl of Encode<LinkedStarknetAddress> {
//     fn encode(self: @LinkedStarknetAddress) -> @ByteArray {
//         let recipient_address_user_felt: felt252 = self
//             .starknet_address
//             .clone()
//             .try_into()
//             .unwrap();

//         @format!("link to {:?}", recipient_address_user_felt)
//     }
// }

pub impl LinkedStarknetAddressImpl of ConvertToBytes<LinkedStarknetAddress> {
    fn convert_to_bytes(self: @LinkedStarknetAddress) -> ByteArray {
        let mut ba: ByteArray = "";
        let starknet_address_felt: felt252 = (*self.starknet_address).into();
        ba.append_word(starknet_address_felt, 1_u32);
        ba
    }
}
#[derive(Copy, Debug, Drop, Serde)]
pub enum LinkedResult {
    Transfer: ContractAddress,
    // LinkedStarknetAddress: LinkedStarknetAddress
}

#[starknet::interface]
pub trait INostrFiScoring<TContractState> {
    // Getters
    fn get_nostr_by_sn_default(
        self: @TContractState, nostr_public_key: NostrPublicKey,
    ) -> ContractAddress;

    fn get_sn_by_nostr_default(
        self: @TContractState, starknet_address: ContractAddress,
    ) -> NostrPublicKey;
    // Admin
    fn set_control_role(
        ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool,
    );
    // User
    fn linked_nostr_profile(
        ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>,
    );

    fn create_token_profile(
        ref self: TContractState,
        request: SocialRequest<LinkedStarknetAddress>,
        token_type: TokenLaunchType,
        is_create_staking_vault: bool,
        is_create_dao: bool,
    );

    fn vote_token_profile(ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>);
    // fn linked_nostr_note(ref self: TContractState, request:
// SocialRequest<LinkedStarknetAddress>);
// fn linked_this_nostr_note(ref self: TContractState, request:
// SocialRequest<LinkedThisNostrNote>);
// // External call protocol
// fn protocol_linked_nostr_default_account(
//     ref self: TContractState,
//     nostr_public_key: NostrPublicKey,
//     starknet_address: ContractAddress
// );
}

#[starknet::contract]
pub mod NostrFiScoring {
    // use afk::bip340::{SchnorrSignature, Signature};
    // use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    // use core::num::traits::Zero;
    use afk::social::request::{Encode, SocialRequest, SocialRequestImpl, SocialRequestTrait};
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    // use starknet::account::Call;
    use starknet::storage::{
        Map, MutableVecTrait, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
        Vec, VecTrait,
    };
    use starknet::{ClassHash, ContractAddress, get_caller_address};
    use super::{
        ADMIN_ROLE, CreateTokenProfile, INostrFiScoring, LinkedResult, LinkedStarknetAddress,
        LinkedStarknetAddressEncodeImpl, LinkedWalletProfileDefault, NostrAccountScoring,
        NostrFiAdminStorage, NostrPublicKey, OPERATOR_ROLE, TokenLaunchType, Vote, VoteProfile,
        VoteUserForProfile,
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

    // impl LinkedThisNostrNoteDefault of Default<LinkedThisNostrNote> {
    //     #[inline(always)]
    //     fn default() -> LinkedThisNostrNote {
    //         LinkedThisNostrNote {
    //             starknet_address: 0.try_into().unwrap(),
    //             nostr_address: 0.try_into().unwrap(),
    //             nostr_event_id: 0.try_into().unwrap(),
    //         }
    //     }
    // }

    #[storage]
    struct Storage {
        nostr_to_sn: Map<NostrPublicKey, ContractAddress>,
        sn_to_nostr: Map<ContractAddress, NostrPublicKey>,
        nostr_event_id_to_sn: Map<NostrPublicKey, ContractAddress>,
        sn_to_nostr_event_id: Map<ContractAddress, NostrPublicKey>,
        nostr_account_scoring: Map<u256, NostrAccountScoring>,
        nostr_vote_profile: Map<u256, VoteProfile>,
        // events_by_user: Map<ContractAddress, Vec<LinkedThisNostrNote>>,
        // events_by_nostr_user: Map<NostrPublicKey, Vec<LinkedThisNostrNote>>,

        // rewards to refacto in a new contract
        rewards_contract: ContractAddress,
        deposited_rewards: Map<ContractAddress, u256>,
        claimed_rewards: Map<ContractAddress, u256>,
        protocol_rewards: u256,
        protocol_rewards_claimed: u256,
        // Admin setup
        admin_storage: NostrFiAdminStorage,
        // External contract
        token_vault: ContractAddress,
        fairlaunch_address: ContractAddress,
        class_hash_memecoin: ClassHash,
        vault_staking_class_hash: ClassHash,
        dao_class_hash: ClassHash,
        // dutch_auction_address: ContractAddress,
        // ico_address: ContractAddress,
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
    struct LinkedNoteToCheckEvent {
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
    impl NostrFiScoringImpl of INostrFiScoring<ContractState> {
        // Admin
        // Add OPERATOR role to the Deposit escrow
        fn set_control_role(
            ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert!(
                role == ADMIN_ROLE
                    || role == OPERATOR_ROLE // Think and Add others roles needed on the protocol
                    ,
                "role not enable",
            );
            if is_enable {
                self.accesscontrol._grant_role(role, recipient);
            } else {
                self.accesscontrol._revoke_role(role, recipient);
            }
        }

        // Getters
        fn get_nostr_by_sn_default(
            self: @ContractState, nostr_public_key: NostrPublicKey,
        ) -> ContractAddress {
            self.nostr_to_sn.read(nostr_public_key)
        }


        fn get_sn_by_nostr_default(
            self: @ContractState, starknet_address: ContractAddress,
        ) -> NostrPublicKey {
            self.sn_to_nostr.read(starknet_address)
        }


        // User request to be on the Marketplace for:
        // Visibility as a Content creator
        // Scoring users by Algo AFK with NLP, LLM and more
        // Get rewards from the protocol
        // Vote by users
        fn linked_nostr_profile(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        ) {
            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
            self.nostr_to_sn.entry(request.public_key).write(profile_default.starknet_address);
            self.sn_to_nostr.entry(profile_default.starknet_address).write(request.public_key);

            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: request.public_key,
                starknet_address,
                ai_score: 0,
                token_launch_type: TokenLaunchType::Fairlaunch,
            };
            self.nostr_account_scoring.entry(request.public_key).write(nostr_account_scoring);
            self
                .emit(
                    LinkedDefaultStarknetAddressEvent {
                        nostr_address: request.public_key, starknet_address,
                    },
                );
        }

        fn create_token_profile(
            ref self: ContractState,
            request: SocialRequest<LinkedStarknetAddress>,
            token_type: TokenLaunchType,
            is_create_staking_vault: bool,
            is_create_dao: bool,
        ) {
            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
            self.nostr_to_sn.entry(request.public_key).write(profile_default.starknet_address);
            self.sn_to_nostr.entry(profile_default.starknet_address).write(request.public_key);

            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: request.public_key,
                starknet_address,
                ai_score: 0,
                token_launch_type: token_type.clone(),
            };

            match token_type {
                TokenLaunchType::Later => {// TODO: add a new event to the contract
                },
                TokenLaunchType::Fairlaunch => { // external call to the fairlaunch contract
                // let fairlaunch_address = self.fairlaunch_address.read();

                },
                TokenLaunchType::PrivateSale => { // external call to the private sale contract
                // self.private_sale_address.write(starknet_address);

                },
                TokenLaunchType::PublicSale => { // external call to the public sale contract
                // self.public_sale_address.write(starknet_address);

                },
                TokenLaunchType::ICO => { // external call to the ico contract
                // self.ico_address.write(starknet_address);

                },
                TokenLaunchType::DutchAuction => { // external call to the dutch auction contract
                // self.dutch_auction_address.write(starknet_address);

                },
            }
            self.nostr_account_scoring.entry(request.public_key).write(nostr_account_scoring);
            self
                .emit(
                    LinkedDefaultStarknetAddressEvent {
                        nostr_address: request.public_key, starknet_address,
                    },
                );
        }

        fn vote_token_profile(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        ) {}
        // fn linked_nostr_note(
    //     ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
    // ) {
    //     let note_default = request.content.clone();
    //     let starknet_address: ContractAddress = note_default.starknet_address;

        //     assert!(starknet_address == get_caller_address(), "invalid caller");
    //     request.verify().expect('can\'t verify signature');
    //     self.nostr_to_sn.entry(request.public_key).write(note_default.starknet_address);
    //     self.sn_to_nostr.entry(note_default.starknet_address).write(request.public_key);
    //     self
    //         .emit(
    //             LinkedNoteToCheckEvent { nostr_address: request.public_key, starknet_address
    //             },
    //         );
    // }

        // fn linked_this_nostr_note(
    //     ref self: ContractState, request: SocialRequest<LinkedThisNostrNote>,
    // ) {
    //     let note_default = request.content.clone();
    //     let starknet_address: ContractAddress = note_default.starknet_address;
    //     let nostr_event_id: NostrPublicKey = note_default.nostr_event_id;
    //     assert!(starknet_address == get_caller_address(), "invalid caller");
    //     request.verify().expect('can\'t verify signature');
    //     self.nostr_to_sn.entry(request.public_key).write(note_default.starknet_address);
    //     self.sn_to_nostr.entry(note_default.starknet_address).write(request.public_key);
    //     self
    //         .emit(
    //             LinkedNoteToCheckEvent { nostr_address: request.public_key, starknet_address
    //             },
    //         );
    // }
    }
}

#[cfg(test)]
mod tests {
    use afk::bip340::SchnorrSignature;
    use afk::social::request::SocialRequest;
    // use core::array::SpanTrait;
    // use core::traits::Into;
    use snforge_std::{
        ContractClass, ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
        start_cheat_caller_address_global, stop_cheat_caller_address_global,
    };
    use starknet::ContractAddress;
    use super::{
        INostrFiScoring, INostrFiScoringDispatcher, INostrFiScoringDispatcherTrait, LinkedResult,
        LinkedStarknetAddress, NostrPublicKey,
    };

    fn declare_nostrfi_scoring() -> ContractClass {
        // declare("nostrfi_scoring").unwrap().contract_class()
        *declare("NostrFiScoring").unwrap().contract_class()
    }

    fn deploy_nostrfi_scoring(class: ContractClass) -> INostrFiScoringDispatcher {
        let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
        let mut calldata = array![];
        ADMIN_ADDRESS.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();

        INostrFiScoringDispatcher { contract_address }
    }

    fn request_fixture_custom_classes(
        nostrfi_scoring_class: ContractClass,
    ) -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrFiScoringDispatcher,
        SocialRequest<LinkedStarknetAddress>,
    ) {
        // recipient private key: 59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35
        // just for testing, do not use for anything else
        // let recipient_public_key =
        //     0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let recipient_public_key =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let sender_address: ContractAddress = 123.try_into().unwrap();

        let nostrfi_scoring = deploy_nostrfi_scoring(nostrfi_scoring_class);

        let recipient_address_user: ContractAddress = 678.try_into().unwrap();

        // TODO change with the correct signature with the content LinkedWalletProfileDefault id and
        // strk recipient TODO Uint256 to felt on Starknet js
        // for test data see claim to:
        // https://replit.com/@msghais135/WanIndolentKilobyte-claimto#linked_to.js

        let linked_wallet = LinkedStarknetAddress {
            starknet_address: sender_address.try_into().unwrap(),
        };

        // @TODO format the content and get the correct signature
        let request_linked_wallet_to = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: linked_wallet.clone(),
            sig: SchnorrSignature {
                r: 0x4e04216ca171673375916f12e1a56e00dca1d39e44207829d659d06f3a972d6f_u256,
                s: 0xa16bc69fab00104564b9dad050a29af4d2380c229de984e49ad125fe29b5be8e_u256,
                // r: 0x051b6d408b709d29b6ef55b1aa74d31a9a265c25b0b91c2502108b67b29c0d5c_u256,
            // s: 0xe31f5691af0e950eb8697fdbbd464ba725b2aaf7e5885c4eaa30a1e528269793_u256
            },
        };

        let linked_wallet_not_caller = LinkedStarknetAddress {
            starknet_address: recipient_address_user.try_into().unwrap(),
        };

        // @TODO format the content and get the correct signature
        let fail_request_linked_wallet_to_caller = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: linked_wallet_not_caller.clone(),
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
        };

        (
            request_linked_wallet_to,
            recipient_public_key,
            sender_address,
            nostrfi_scoring,
            fail_request_linked_wallet_to_caller,
        )
    }

    fn request_fixture() -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrFiScoringDispatcher,
        SocialRequest<LinkedStarknetAddress>,
    ) {
        let nostrfi_scoring_class = declare_nostrfi_scoring();
        request_fixture_custom_classes(nostrfi_scoring_class)
    }

    #[test]
    fn linked_wallet_to() {
        let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        nostrfi_scoring.linked_nostr_profile(request);

        let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(recipient_nostr_key);
        assert!(nostr_linked == sender_address, "nostr not linked");
    }

    #[test]
    #[should_panic()]
    fn link_incorrect_signature() {
        let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to_caller) =
            request_fixture();
        stop_cheat_caller_address_global();
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);

        let request_test_failed_sig = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966606f_u256,
            },
            ..fail_request_linked_wallet_to_caller,
        };
        nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
    }

    #[test]
    #[should_panic()]
    fn link_incorrect_signature_link_to() {
        let (request, _, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        let request_test_failed_sig = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
            ..request,
        };

        nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: ' invalid caller ')]
    fn link_incorrect_caller_link_to() {
        let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to) =
            request_fixture();
        start_cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        nostrfi_scoring.linked_nostr_profile(fail_request_linked_wallet_to);
    }
}
