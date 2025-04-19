use afk::interfaces::common_interfaces::{LinkedStarknetAddress, LinkedStarknetAddressImpl};

// Add this ROLE on a constants file
use afk::interfaces::nostrfi_scoring_interfaces::{
    INostrFiScoring, ProfileAlgorithmScoring, PushAlgoScoreNostrNote,
};
use core::fmt::Display;
use core::to_byte_array::FormatAsByteArray;
use starknet::{ContractAddress, get_caller_address, get_contract_address, get_tx_info};
use super::request::{ConvertToBytes, Encode, SocialRequest, SocialRequestImpl, SocialRequestTrait};
pub const OPERATOR_ROLE: felt252 = selector!("OPERATOR_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

type NostrPublicKey = u256;
type AddressId = felt252;

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountScoring {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub ai_score: u256,
    // pub token_launch_type: TokenLaunchType,
}

#[starknet::interface]
pub trait INostrNamespace<TContractState> {
    // Getters
    fn get_nostr_address_by_sn_default(
        self: @TContractState, starknet_address: ContractAddress,
    ) -> NostrPublicKey;


    fn get_nostr_by_sn_default(
        self: @TContractState, nostr_public_key: NostrPublicKey,
    ) -> ContractAddress;

    fn get_sn_by_nostr_default(
        self: @TContractState, starknet_address: ContractAddress,
    ) -> NostrPublicKey;

    fn get_nostr_scoring_by_nostr_address(
        self: @TContractState, nostr_address: NostrPublicKey,
    ) -> NostrAccountScoring;
    // // Admin
    // fn set_control_role(
    //     ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool,
    // );
    // User
    // Users functions
    fn linked_nostr_profile(
        ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>,
    );

    fn linked_nostr_default_account(
        ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>,
    );
    // Admin
    fn set_control_role(
        ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool,
    );
    // fn init_nostr_profile(ref self: TContractState, request:
    // SocialRequest<LinkedStarknetAddress>);
    fn add_nostr_profile_admin(ref self: TContractState, nostr_event_id: u256);
    fn push_profile_score_algo(
        ref self: TContractState,
        request: SocialRequest<PushAlgoScoreNostrNote>,
        score_algo: ProfileAlgorithmScoring,
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
    // use afk::components::nostr_namespace::LinkedStarknetAddress;
    use afk::interfaces::common_interfaces::LinkedStarknetAddress;

    use afk::interfaces::nostrfi_scoring_interfaces::{
        AdminAddNostrProfile, INostrFiScoring, ProfileAlgorithmScoring, PushAlgoScoreEvent,
        PushAlgoScoreNostrNote, TotalAlgoScoreRewards, TotalScoreRewards,
        // LinkedStarknetAddress,
    };
    use afk::social::errors;

    // use afk::components::nostr_namespace::{
    //     INostrNamespaceComponent, LinkedStarknetAddress, NostrNamespaceComponent,
    // };
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::num::traits::Zero;
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    // use starknet::account::Call;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
        StorageMapReadAccess, StorageMapWriteAccess // Stor
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use super::super::request::{Encode, SocialRequest, SocialRequestImpl, SocialRequestTrait};
    use super::{ADMIN_ROLE, INostrNamespace, NostrAccountScoring, NostrPublicKey, OPERATOR_ROLE};
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    // component!(path: NostrNamespaceComponent, storage: nostr_namespace, event:
    // NostrNamespaceEvent);
    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // #[abi(embed_v0)]
    // impl NostrNamespaceImpl =
    //     NostrNamespaceComponent::NostrNamespaceImpl<ContractState>;

    // impl NostrNamespaceInternalComponentImpl =
    //     NostrNamespaceComponent::NostrNamespaceInternalImpl<ContractState>;

    #[storage]
    struct Storage {
        // Profile link between nostr and starknet

        admin_nostr_pubkey: NostrPublicKey,
        total_admin_nostr_pubkeys: u64,
        all_admin_nostr_pubkeys: Map<u64, NostrPublicKey>,
        is_admin_nostr_pubkey_added: Map<NostrPublicKey, bool>,
        // users state
        nostr_pubkeys: Map<u64, u256>,
        total_pubkeys: u64,
        nostr_to_sn: Map<NostrPublicKey, ContractAddress>,
        sn_to_nostr: Map<ContractAddress, NostrPublicKey>,
        is_nostr_address_added: Map<NostrPublicKey, bool>,
        is_nostr_address_linked_to_sn: Map<NostrPublicKey, bool>,
        nostr_account_scoring: Map<u256, NostrAccountScoring>,
        events_by_user: Map<ContractAddress, Vec<u256>>,
        events_by_nostr_user: Map<u256, Vec<u256>>,
        nostr_account_scoring_algo: Map<u256, ProfileAlgorithmScoring>,
        // total stats
        total_score_rewards: TotalScoreRewards,
        total_algo_score_rewards: TotalAlgoScoreRewards,
        // External state management by ACCESS CONTROL

        is_scoring_enabled: bool,
        is_scoring_address_enabled: Map<ContractAddress, bool>,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        // #[substorage(v0)]
    // nostr_namespace: NostrNamespaceComponent::Storage,
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
        PushAlgoScoreEvent: PushAlgoScoreEvent,
        AdminAddNostrProfile: AdminAddNostrProfile,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, admin: ContractAddress, admin_nostr_pubkey: NostrPublicKey,
    ) {
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
        self.accesscontrol._grant_role(OPERATOR_ROLE, admin);
        self.admin_nostr_pubkey.write(admin_nostr_pubkey);
        // self.nostr_namespace.initializer();
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _link_nostr_to_sn(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        ) {
            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
            self.nostr_to_sn.entry(request.public_key).write(profile_default.starknet_address);
            self.sn_to_nostr.entry(profile_default.starknet_address).write(request.public_key);
            self.is_nostr_address_added.entry(request.public_key).write(true);
            self.is_nostr_address_linked_to_sn.entry(request.public_key).write(true);
            self.nostr_pubkeys.entry(self.total_pubkeys.read()).write(request.public_key);
            self.total_pubkeys.write(self.total_pubkeys.read() + 1);
            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: request.public_key, starknet_address, ai_score: 0,
                // token_launch_type: TokenLaunchType::Fairlaunch,
            };
            self.nostr_account_scoring.entry(request.public_key).write(nostr_account_scoring);

            self
                .emit(
                    LinkedDefaultStarknetAddressEvent {
                        nostr_address: request.public_key, starknet_address,
                    },
                );
        }
    }
    #[abi(embed_v0)]
    impl NamespaceImpl of INostrNamespace<ContractState> {
        // Admin
        // Add OPERATOR role to the Deposit escrow
        // fn set_control_role(
        //     ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool,
        // ) {
        //     self.accesscontrol.assert_only_role(ADMIN_ROLE);
        //     assert!(
        //         role == ADMIN_ROLE
        //             || role == OPERATOR_ROLE // Think and Add others roles needed on the protocol
        //             ,
        //         "role not enable",
        //     );
        //     if is_enable {
        //         self.accesscontrol._grant_role(role, recipient);
        //     } else {
        //         self.accesscontrol._revoke_role(role, recipient);
        //     }
        // }

        // Getters
        fn get_nostr_by_sn_default(
            self: @ContractState, nostr_public_key: NostrPublicKey,
        ) -> ContractAddress {
            self.nostr_to_sn.read(nostr_public_key)
            // self.nostr_namespace.nostr_to_sn.read(nostr_public_key)
        }


        fn get_sn_by_nostr_default(
            self: @ContractState, starknet_address: ContractAddress,
        ) -> NostrPublicKey {
            self.sn_to_nostr.read(starknet_address)
            // self.nostr_namespace.sn_to_nostr.read(starknet_address)
        }

        fn get_nostr_address_by_sn_default(
            self: @ContractState, starknet_address: ContractAddress,
        ) -> NostrPublicKey {
            self.sn_to_nostr.read(starknet_address)
        }

        fn get_nostr_scoring_by_nostr_address(
            self: @ContractState, nostr_address: NostrPublicKey,
        ) -> NostrAccountScoring {
            self.nostr_account_scoring.read(nostr_address)
            // self.nostr_namespace.sn_to_nostr.read(starknet_address)
        }

        // User request with a Nostr event
        fn linked_nostr_profile(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        ) {
            self._link_nostr_to_sn(request);
        }

        fn linked_nostr_default_account(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        ) { // self.nostr_namespace.linked_nostr_default_account(request);
            self._link_nostr_to_sn(request);
        }

        // ROLE ACCESS CONTROL
        // ADMIN functions
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


        // // Init nostr profile
        // fn init_nostr_profile(
        //     ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        // ) {
        //     // TODO assert if address is owner
        //     let caller = get_caller_address();
        //     assert(
        //         self.accesscontrol.has_role(ADMIN_ROLE, caller)
        //             || self.accesscontrol.has_role(OPERATOR_ROLE, caller),
        //         errors::ROLE_REQUIRED,
        //     );

        //     let profile_default = request.content.clone();
        //     let starknet_address: ContractAddress = profile_default.starknet_address;

        //     assert!(starknet_address == get_caller_address(), "invalid caller");
        //     request.verify().expect('can\'t verify signature');
        //     self.nostr_pubkeys.entry(self.total_pubkeys.read()).write(request.public_key);
        //     self.total_pubkeys.write(self.total_pubkeys.read() + 1);
        //     let nostr_account_scoring = NostrAccountScoring {
        //         nostr_address: request.public_key, starknet_address, ai_score: 0,
        //         // token_launch_type: TokenLaunchType::Fairlaunch,
        //     };
        //     self.nostr_account_scoring.entry(request.public_key).write(nostr_account_scoring);
        //         self
        //         .emit(
        //             AdminAddNostrProfile {
        //                 nostr_address: request.public_key, // starknet_address:
        //                 0.try_into().unwrap(),
        //             },
        //         );
        //     self
        //         .emit(
        //             LinkedDefaultStarknetAddressEvent {
        //                 nostr_address: request.public_key, starknet_address,
        //             },
        //         );
        // }

        // Init nostr profile
        fn add_nostr_profile_admin(ref self: ContractState, nostr_event_id: u256) {
            // TODO assert if address is owner
            // self.accesscontrol.assert_only_role(ADMIN_ROLE);
            let caller = get_caller_address();

            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, caller)
                    || self.accesscontrol.has_role(OPERATOR_ROLE, caller),
                errors::ROLE_REQUIRED,
            );

            self.nostr_pubkeys.entry(self.total_pubkeys.read()).write(nostr_event_id);
            self.total_pubkeys.write(self.total_pubkeys.read() + 1);

            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: nostr_event_id, starknet_address: 0.try_into().unwrap(), ai_score: 0,
                // token_launch_type: TokenLaunchType::Fairlaunch,
            };
            self.nostr_account_scoring.entry(nostr_event_id).write(nostr_account_scoring);
            self
            .emit(
                AdminAddNostrProfile {
                    nostr_address: nostr_event_id // starknet_address: 0.try_into().unwrap(),
                },
            );
        }

        fn push_profile_score_algo(
            ref self: ContractState,
            request: SocialRequest<PushAlgoScoreNostrNote>,
            score_algo: ProfileAlgorithmScoring,
        ) {
            // println!("push_profile_score_algo");
            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()),
                errors::ROLE_REQUIRED,
            );
            let admin_nostr_pubkey = self.admin_nostr_pubkey.read();

            // println!("admin_nostr_pubkey: {}", admin_nostr_pubkey);

            let is_admin_nostr_pubkey_added = self
                .is_admin_nostr_pubkey_added
                .read(admin_nostr_pubkey);
            assert(
                is_admin_nostr_pubkey_added || request.public_key == admin_nostr_pubkey,
                errors::INVALID_PUBKEY,
            );

            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            let profile_default = request.content.clone();
            let nostr_address: NostrPublicKey = profile_default.nostr_address.try_into().unwrap();
            let sn_address_linked = self.nostr_to_sn.read(nostr_address);

            // println!("verify signature");
            // Verify signature Nostr oracle admin
            request.verify().expect('can\'t verify signature');
            let now = get_block_timestamp();
            // Update nostr account scoring by algo
            let mut algo_nostr_account_scoring = self
                .nostr_account_scoring_algo
                .read(nostr_address);

            if algo_nostr_account_scoring.nostr_address != 0.try_into().unwrap() {
                // println!("algo_nostr_account_scoring.nostr_address != 0.try_into().unwrap()");
                algo_nostr_account_scoring.nostr_address = nostr_address;
                algo_nostr_account_scoring.starknet_address = sn_address_linked;
                algo_nostr_account_scoring.ai_score = score_algo.ai_score;
                // algo_nostr_account_scoring.overview_score = score_algo.overview_score;
                // algo_nostr_account_scoring.skills_score = score_algo.skills_score;
                // algo_nostr_account_scoring.value_shared_score = score_algo.value_shared_score;
                // algo_nostr_account_scoring.ai_score_to_claimed = score_algo.ai_score_to_claimed;
                // algo_nostr_account_scoring
                //     .overview_score_to_claimed = score_algo
                //     .overview_score_to_claimed;
                // algo_nostr_account_scoring
                //     .skills_score_to_claimed = score_algo
                //     .skills_score_to_claimed;
                // algo_nostr_account_scoring
                //     .value_shared_score_to_claimed = score_algo
                //     .value_shared_score_to_claimed;
                // algo_nostr_account_scoring.total_score = score_algo.ai_score
                //     + score_algo.overview_score
                //     + score_algo.skills_score
                //     + score_algo.value_shared_score;
                self
                    .nostr_account_scoring_algo
                    .entry(nostr_address)
                    .write(algo_nostr_account_scoring);
            } else {
                // println!("algo_nostr_account_scoring.nostr_address == 0.try_into().unwrap()");
                // println!("init algo_nostr_account_scoring: {}", nostr_address);
                algo_nostr_account_scoring =
                    ProfileAlgorithmScoring {
                        nostr_address: nostr_address.try_into().unwrap(),
                        starknet_address: sn_address_linked,
                        ai_score: score_algo.ai_score,
                        veracity_score: score_algo.veracity_score,
                        is_claimed: false,
                        total_score: score_algo.ai_score,
                        // overview_score: score_algo.overview_score,
                        // skills_score: score_algo.skills_score,
                        // value_shared_score: score_algo.value_shared_score,
                        // ai_score_to_claimed: score_algo.ai_score,
                        // overview_score_to_claimed: score_algo.overview_score,
                        // skills_score_to_claimed: score_algo.skills_score,
                        // value_shared_score_to_claimed: score_algo.value_shared_score,
                        // total_score: score_algo.ai_score
                        //     + score_algo.overview_score
                        //     + score_algo.skills_score
                        //     + score_algo.value_shared_score,
                    };
                self
                    .nostr_account_scoring_algo
                    .entry(nostr_address)
                    .write(algo_nostr_account_scoring);
            }
            // Update the algo score
            // Current
            // By epoch indexer
            self.nostr_account_scoring_algo.entry(nostr_address).write(algo_nostr_account_scoring);

            // Update total algo score stats
            let total_algo_score_rewards = self.total_algo_score_rewards.read();

            // TODO
            // Check if decrease score to reflect
            let mut new_total_algo_score_rewards = total_algo_score_rewards.clone();
            new_total_algo_score_rewards.total_score_ai = total_algo_score_rewards.total_score_ai
                + score_algo.ai_score;
            // new_total_algo_score_rewards
            //     .total_score_overview = total_algo_score_rewards
            //     .total_score_overview
            //     + score_algo.overview_score;
            // new_total_algo_score_rewards
            //     .total_score_skills = total_algo_score_rewards
            //     .total_score_skills
            //     + score_algo.skills_score;
            // new_total_algo_score_rewards
            //     .total_score_value_shared = total_algo_score_rewards
            //     .total_score_value_shared
            //     + score_algo.value_shared_score;
            // let old_total_algo_score_rewards = TotalAlgoScoreRewards {
            //     epoch_duration: total_algo_score_rewards.epoch_duration,
            //     end_epoch_time: total_algo_score_rewards.end_epoch_time,
            //     total_score_ai: total_algo_score_rewards.total_score_ai + score_algo.ai_score,
            //     total_score_overview: total_algo_score_rewards.total_score_overview
            //         + score_algo.overview_score,
            //     total_score_skills: total_algo_score_rewards.total_score_skills
            //         + score_algo.skills_score,
            //     total_score_value_shared: total_algo_score_rewards.total_score_value_shared
            //         + score_algo.value_shared_score,
            //     total_nostr_address: total_algo_score_rewards.total_nostr_address,
            //     to_claimed_ai_score: total_algo_score_rewards.to_claimed_ai_score,
            //     to_claimed_overview_score: total_algo_score_rewards.to_claimed_overview_score,
            //     to_claimed_skills_score: total_algo_score_rewards.to_claimed_skills_score,
            //     to_claimed_value_shared_score: total_algo_score_rewards
            //         .to_claimed_value_shared_score,
            //     rewards_amount: total_algo_score_rewards.rewards_amount,
            //     total_points_weight: total_algo_score_rewards.total_points_weight,
            //     is_claimed: total_algo_score_rewards.is_claimed,
            //     veracity_score: total_algo_score_rewards.veracity_score,
            //     start_epoch_time: total_algo_score_rewards.start_epoch_time,
            // };

            self.total_algo_score_rewards.write(new_total_algo_score_rewards);

            self
                .emit(
                    PushAlgoScoreEvent {
                        nostr_address,
                        starknet_address: sn_address_linked,
                        total_score_ai: total_algo_score_rewards.total_score_ai
                            + score_algo.ai_score,
                        total_points_weight: total_algo_score_rewards.total_points_weight,
                        is_claimed: total_algo_score_rewards.is_claimed,
                        claimed_at: now,
                        total_nostr_address: total_algo_score_rewards.total_nostr_address,
                        // veracity_score: 0,
                        //   total_score_overview: total_algo_score_rewards.total_score_overview
                        //     + score_algo.overview_score,
                        // total_score_skills: total_algo_score_rewards.total_score_skills
                        //     + score_algo.skills_score,
                        // total_score_value_shared: total_algo_score_rewards.total_score_value_shared
                        //     + score_algo.value_shared_score,
                        // total_nostr_address: total_algo_score_rewards.total_nostr_address,
                        // rewards_amount: total_algo_score_rewards.rewards_amount,
                    },
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
    use afk::bip340::SchnorrSignature;
    use afk::components::nostr_namespace::NostrNamespaceComponent::Event as NostrNamespaceEvent;
    use afk::components::nostr_namespace::{
        INostrNamespaceComponent, LinkedResult, LinkedWalletProfileDefault, NostrNamespaceComponent,
    };
    use afk::interfaces::common_interfaces::{LinkedStarknetAddress, LinkedStarknetAddressImpl};
    use core::array::SpanTrait;
    use core::traits::Into;
    use snforge_std::{
        ContractClass, ContractClassTrait, DeclareResultTrait, Event, EventSpy,
        EventSpyAssertionsTrait, declare, spy_events, start_cheat_block_timestamp,
        start_cheat_caller_address, start_cheat_caller_address_global,
        stop_cheat_caller_address_global,
    };
    use starknet::{
        ContractAddress, contract_address_const, get_block_timestamp, get_caller_address,
        get_contract_address,
    };
    use super::super::request::{Encode, SocialRequest};
    use super::super::transfer::Transfer;
    use super::{
        AddressId, INostrNamespaceDispatcher, INostrNamespaceDispatcherTrait, NostrPublicKey,
    };

    fn declare_namespace() -> ContractClass {
        // declare("Namespace").unwrap().contract_class()
        *declare("Namespace").unwrap().contract_class()
    }

    fn deploy_namespace(class: ContractClass) -> INostrNamespaceDispatcher {
        let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
        let admin_nostr_pubkey =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;
        let mut calldata = array![];
        ADMIN_ADDRESS.serialize(ref calldata);
        admin_nostr_pubkey.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();

        INostrNamespaceDispatcher { contract_address }
    }

    fn request_fixture_custom_classes(
        namespace_class: ContractClass,
    ) -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrNamespaceDispatcher,
        SocialRequest<LinkedStarknetAddress>,
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
            namespace,
            fail_request_linked_wallet_to_caller,
        )
    }

    fn request_fixture() -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrNamespaceDispatcher,
        SocialRequest<LinkedStarknetAddress>,
    ) {
        let namespace_class = declare_namespace();
        request_fixture_custom_classes(namespace_class)
    }

    #[test]
    fn linked_wallet_to() {
        let (request, recipient_nostr_key, sender_address, namespace, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(namespace.contract_address, sender_address);
        namespace.linked_nostr_default_account(request);

        let nostr_linked = namespace.get_nostr_by_sn_default(recipient_nostr_key);
        assert!(nostr_linked == sender_address, "nostr not linked");
    }

    #[test]
    #[should_panic()]
    fn link_incorrect_signature() {
        let (_, _, sender_address, namespace, fail_request_linked_wallet_to_caller) =
            request_fixture();
        stop_cheat_caller_address_global();
        start_cheat_caller_address(namespace.contract_address, sender_address);

        let request_test_failed_sig = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966606f_u256,
            },
            ..fail_request_linked_wallet_to_caller,
        };
        namespace.linked_nostr_default_account(request_test_failed_sig);
    }

    #[test]
    #[should_panic()]
    fn link_incorrect_signature_link_to() {
        let (request, _, sender_address, namespace, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(namespace.contract_address, sender_address);
        let request_test_failed_sig = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
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
        start_cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(namespace.contract_address, sender_address);
        namespace.linked_nostr_default_account(fail_request_linked_wallet_to);
    }
}
