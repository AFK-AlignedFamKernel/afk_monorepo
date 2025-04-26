use afk::interfaces::common_interfaces::{LinkedStarknetAddress, NostrPublicKey};
use afk::interfaces::nostrfi_scoring_interfaces::{NostrMetadata, TokenLaunchType};
use afk::social::request::SocialRequest;
use starknet::{ClassHash, ContractAddress};
// Structs
#[derive(Clone, Debug, Drop, Serde, starknet::Store)]
pub struct Topic {
    pub topic_address: ContractAddress,
    pub admin: ContractAddress,
    pub admin_nostr_pubkey: NostrPublicKey,
    pub score_class_hash: ClassHash,
    pub contract_address_salt: felt252,
    pub created_at: u64,
    pub deployer: ContractAddress,
}

// Events

#[derive(Clone, Debug, Drop, Serde, starknet::Event)]
pub struct TopicEvent {
    pub topic_address: ContractAddress,
    pub admin: ContractAddress,
    pub admin_nostr_pubkey: NostrPublicKey,
    pub score_class_hash: ClassHash,
    pub contract_address_salt: felt252,
    pub created_at: u64,
    pub main_token_address: ContractAddress,
    pub deployer: ContractAddress,
}
#[derive(Clone, Debug, Drop, Serde, starknet::Event)]
pub struct CreateTokenTopicEvent {
    pub main_token_address: ContractAddress,
    pub deployer: ContractAddress,
    pub token_type: TokenLaunchType,
}


#[starknet::interface]
pub trait IFactoryNostrFiScoring<TContractState> {
    fn create_dao_with_nostr(
        ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>,
    );
    fn create_dao(ref self: TContractState);
    fn create_nostr_topic(
        ref self: TContractState,
        admin: ContractAddress,
        admin_nostr_pubkey: NostrPublicKey,
        main_token_address: ContractAddress,
        contract_address_salt: felt252,
        nostr_metadata: NostrMetadata,
    ) -> ContractAddress;
    fn create_token_topic_reward_and_vote(
        ref self: TContractState,
        token_type: TokenLaunchType,
        is_create_staking_vault: bool,
        is_create_dao: bool,
    );
}

#[starknet::contract]
pub mod FactoryNostrFiScoring {
    use afk::infofi::errors;

    use afk::interfaces::nostrfi_scoring_interfaces::{
        ADMIN_ROLE, NostrAccountScoringDefault, NostrMetadata, NostrPublicKey, OPERATOR_ROLE,
        PushAlgoScoreEvent, TipByUserDefault, TipUserWithVote, TotalAlgoScoreRewardsDefault,
        TotalDepositRewardsDefault, TotalScoreRewardsDefault,
        // VoteProfile, NostrAccountScoring
    };
    // use afk_launchpad::launchpad::{ILaunchpadDispatcher, ILaunchpadDispatcherTrait};
    // use crate::afk_launchpad::launchpad::{ILaunchpadDispatcher, ILaunchpadDispatcherTrait};
    use afk::social::request::{Encode, SocialRequestImpl, SocialRequestTrait};
    use core::num::traits::Zero;
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc20::interface::{
        IERC20CamelDispatcherTrait, IERC20Dispatcher, IERC20DispatcherTrait,
    };


    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, // Stor
        StoragePointerReadAccess,
        StoragePointerWriteAccess, StoragePathEntry, Vec, VecTrait,
        // MutableEntryStoragePathEntry, StorableEntryReadAccess, StorageAsPathReadForward,
    // MutableStorableEntryReadAccess, MutableStorableEntryWriteAccess,
    // StorageAsPathWriteForward,PathableStorageEntryImpl
    };
    use starknet::storage_access::StorageBaseAddress;
    use starknet::syscalls::{deploy_syscall, library_call_syscall};
    use starknet::{
        ClassHash, ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
    };
    use super::{
        CreateTokenTopicEvent, IFactoryNostrFiScoring, LinkedStarknetAddress, SocialRequest,
        TokenLaunchType, Topic, TopicEvent,
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

    const EPOCH_DURATION_7d: u64 = 604800; // 7 days
    const EPOCH_DURATION_1d: u64 = 86400; // 1 day
    const EPOCH_DURATION_DEFAULT: u64 = EPOCH_DURATION_7d; // 7 days
    const PERCENTAGE_ALGO_SCORE_DISTRIBUTION: u256 = 8000; //80%
    const BPS: u256 = 10_000; // 100% = 10_000 bps


    #[storage]
    struct Storage {
        topic_created: Map<u64, Topic>,
        total_topic: u64,
        // Admin setup

        main_token_address: ContractAddress,
        vote_token_address: ContractAddress,
        admin_nostr_pubkey: u256, // Admin Nostr pubkey
        // External hash
        score_class_hash: ClassHash,
        class_hash_memecoin: ClassHash,
        vault_staking_class_hash: ClassHash,
        dao_class_hash: ClassHash,
        // External address
        namespace_address: ContractAddress,
        token_vault: ContractAddress,
        fairlaunch_address: ContractAddress,
        dao_factory_address: ContractAddress,
        dutch_auction_address: ContractAddress,
        ico_address: ContractAddress,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TopicEvent: TopicEvent,
        PushAlgoScoreEvent: PushAlgoScoreEvent,
        TipUserWithVote: TipUserWithVote,
        CreateTokenTopicEvent: CreateTokenTopicEvent,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        admin_nostr_pubkey: NostrPublicKey,
        score_class_hash: ClassHash,
        namespace_address: ContractAddress,
    ) {
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
        self.accesscontrol._grant_role(OPERATOR_ROLE, admin);
        self.accesscontrol._grant_role(OPERATOR_ROLE, get_caller_address());
        self.accesscontrol._grant_role(ADMIN_ROLE, get_caller_address());
        self.total_topic.write(0);

        self.score_class_hash.write(score_class_hash);
        self.admin_nostr_pubkey.write(admin_nostr_pubkey);

        self.namespace_address.write(namespace_address);
    }

    // #[abi(embed_v0)]
    // impl UpgradeableImpl of IUpgradeable<ContractState> {
    //     fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
    //         // This function can only be called by the ADMIN
    //         self.accesscontrol.assert_only_role(ADMIN_ROLE);
    //         // Replace the class hash upgrading the contract
    //         self.upgradeable.upgrade(new_class_hash);
    //     }
    // }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _check_epoch_is_ended(ref self: ContractState, end_epoch_time: u64) -> bool {
            let now = get_block_timestamp();
            println!("now: {:?}", now);
            println!("end_epoch_time: {:?}", end_epoch_time);

            now >= end_epoch_time
        }


        fn _create_dao() {}

        // Create a new DAO for this topic with the main token address
        // TODO:
        // Implement logic to create a new DAO for this topic with the main token address
        fn _create_nostr_topic(
            ref self: ContractState,
            admin: ContractAddress,
            admin_nostr_pubkey: NostrPublicKey,
            main_token_address: ContractAddress,
            contract_address_salt: felt252,
            nostr_metadata: NostrMetadata,
        ) -> ContractAddress {
            let current_index = self.total_topic.read();
            let mut calldata = array![];
            Serde::serialize(@admin.clone(), ref calldata);
            Serde::serialize(@admin.clone(), ref calldata);
            Serde::serialize(@main_token_address.clone(), ref calldata);
            Serde::serialize(@self.admin_nostr_pubkey.read(), ref calldata);
            Serde::serialize(@self.namespace_address.read(), ref calldata);
            Serde::serialize(@nostr_metadata.clone(), ref calldata);
            let score_class_hash = self.score_class_hash.read();
            let (topic_address, _) = deploy_syscall(
                score_class_hash, contract_address_salt, calldata.span(), false,
            )
                .unwrap();
            // .unwrap_syscall();

            let topic = Topic {
                topic_address: topic_address,
                admin: admin,
                admin_nostr_pubkey: admin_nostr_pubkey,
                score_class_hash: score_class_hash,
                contract_address_salt: contract_address_salt,
                created_at: get_block_timestamp(),
                deployer: get_caller_address(),
            };

            self.topic_created.entry(current_index).write(topic);
            self.total_topic.write(current_index + 1);

            self
                .emit(
                    TopicEvent {
                        topic_address: topic_address,
                        admin: admin,
                        admin_nostr_pubkey: admin_nostr_pubkey,
                        score_class_hash: score_class_hash,
                        contract_address_salt: contract_address_salt,
                        main_token_address: main_token_address,
                        created_at: get_block_timestamp(),
                        deployer: get_caller_address(),
                    },
                );
            topic_address
        }


        // Factory or deployer of the contract
        // Launch token topic for rewards and voting
        fn _create_token_topic_reward_and_vote(
            ref self: ContractState,
            token_type: TokenLaunchType,
            is_create_staking_vault: bool,
            is_create_dao: bool,
        ) -> ContractAddress {
            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address())
                    || self.accesscontrol.has_role(OPERATOR_ROLE, get_caller_address()),
                errors::ROLE_REQUIRED,
            );
            let mut main_token_address = self.main_token_address.read();

            // Verify if the token address is set
            // V2 let change users main address or add multi token vault
            assert(
                main_token_address == 0.try_into().unwrap(), errors::MAIN_TOKEN_ADDRESS_ALREADY_SET,
            );

            let token_address: ContractAddress = match token_type {
                TokenLaunchType::Later => { // TODO: add a new event to the contract
                    let mut token_address = 0.try_into().unwrap();
                    token_address
                },
                TokenLaunchType::Fairlaunch => { // external call to the fairlaunch contract
                    let fairlaunch_address = self.fairlaunch_address.read();
                    let mut token_address = 0.try_into().unwrap();
                    if fairlaunch_address == 0.try_into().unwrap() {
                        token_address = 0.try_into().unwrap();
                    } else {
                        // let token_address =
                        // ILaunchpadDispatcher::create_and_launch_vault(fairlaunch_address,
                        token_address = 0.try_into().unwrap();
                        // let (token_address, _) = deploy_syscall(
                    //     self.score_class_hash.read(), contract_address_salt, calldata.span(),
                    //     false,
                    // )
                    // .unwrap();
                    }
                    token_address
                },
            };

            let score_class_hash = self.score_class_hash.read();

            token_address
            // self.nostr_account_scoring.entry(request.public_key).write(nostr_account_scoring);
        // self
        //     .emit(
        //         LinkedDefaultStarknetAddressEvent {
        //             nostr_address: request.public_key, starknet_address,
        //         },
        //     );
        }
    }
    #[abi(embed_v0)]
    impl FactoryNostrFiScoringImpl of IFactoryNostrFiScoring<ContractState> {
        // Create a new DAO for this topic with the main token address
        // TODO:
        // Implement logic to create a new DAO for this topic with the main token address
        fn create_dao(ref self: ContractState) {}

        fn create_dao_with_nostr(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        ) {
            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()),
                errors::ADMIN_ROLE_REQUIRED,
            );
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
        }
        // Create a new DAO for this topic with the main token address
        // TODO:
        // Implement logic to create a new DAO for this topic with the main token address
        fn create_nostr_topic(
            ref self: ContractState,
            admin: ContractAddress,
            admin_nostr_pubkey: NostrPublicKey,
            main_token_address: ContractAddress,
            contract_address_salt: felt252,
            nostr_metadata: NostrMetadata,
        ) -> ContractAddress {
            let topic_address = self
                ._create_nostr_topic(
                    admin,
                    admin_nostr_pubkey,
                    main_token_address,
                    contract_address_salt,
                    nostr_metadata,
                );
            topic_address
        }

        // Factory or deployer of the contract
        // Launch token topic for rewards and voting
        fn create_token_topic_reward_and_vote(
            ref self: ContractState,
            token_type: TokenLaunchType,
            is_create_staking_vault: bool,
            is_create_dao: bool,
        ) {
            let token_address = self
                ._create_token_topic_reward_and_vote(
                    token_type, is_create_staking_vault, is_create_dao,
                );
            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address())
                    || self.accesscontrol.has_role(OPERATOR_ROLE, get_caller_address()),
                errors::ROLE_REQUIRED,
            );
        }
    }
}
