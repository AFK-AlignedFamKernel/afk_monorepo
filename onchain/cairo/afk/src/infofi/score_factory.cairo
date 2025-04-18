#[starknet::interface]
pub trait IFactoryNostrFiScoring<TContractState> {
    fn create_dao(ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>);
    fn create_nostr_topic(
        ref self: TContractState,
        admin: ContractAddress,
        admin_nostr_pubkey: NostrPublicKey,
        score_class_hash: ClassHash,
        contract_address_salt: felt252,
    );
    fn create_token_topic_reward_and_vote(
        ref self: TContractState,
        request: SocialRequest<LinkedStarknetAddress>,
        token_type: TokenLaunchType,
        is_create_staking_vault: bool,
        is_create_dao: bool,
    );
}

#[starknet::contract]
pub mod FactoryNostrFiScoring {
    use afk::infofi::errors;
    use afk::interfaces::nostrfi_scoring_interfaces::{
        ADMIN_ROLE, DepositRewardsType, DistributionRewardsByUserEvent, EpochRewards,
        INostrFiScoring, INostrFiScoringAdmin, LinkedStarknetAddress,
        LinkedStarknetAddressEncodeImpl, NostrAccountScoring, NostrAccountScoringDefault,
        NostrFiAdminStorage, NostrPublicKey, OPERATOR_ROLE, ProfileAlgorithmScoring,
        PushAlgoScoreEvent, PushAlgoScoreNostrNote, TipByUser, TipByUserDefault, TipUserWithVote,
        TokenLaunchType, TotalAlgoScoreRewards, TotalAlgoScoreRewardsDefault, TotalDepositRewards,
        TotalDepositRewardsDefault, TotalScoreRewards, TotalScoreRewardsDefault,
        TotalVoteTipsRewardsDefault, Vote, VoteNostrNote, VoteParams, VoteProfile,
    };
    // use afk_launchpad::launchpad::{ILaunchpadDispatcher, ILaunchpadDispatcherTrait};
    // use crate::afk_launchpad::launchpad::{ILaunchpadDispatcher, ILaunchpadDispatcherTrait};
    use afk::social::request::{Encode, SocialRequest, SocialRequestImpl, SocialRequestTrait};
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
    // use starknet::syscalls::{deploy_syscall, library_call_syscall};
    use starknet::{
        ClassHash, ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
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
        // External contract
        score_class_hash: ClassHash,
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


    // Structs

    #[derive(Clone, Debug, Drop, Serde)]
    pub struct Topic {
        pub topic_address: ContractAddress,
        pub admin: ContractAddress,
        pub admin_nostr_pubkey: NostrPublicKey,
        pub score_class_hash: ClassHash,
        pub contract_address_salt: felt252,
        pub created_at: u64,
    }


    #[derive(Drop, starknet::Event)]
    struct CreateTokenProfileEvent {
        #[key]
        nostr_address: NostrPublicKey,
        #[key]
        starknet_address: ContractAddress,
        token_address: ContractAddress,
        token_type: TokenLaunchType,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TipToClaimByUserBecauseNotLinked: TipToClaimByUserBecauseNotLinked,
        DistributionRewardsByUserEvent: DistributionRewardsByUserEvent,
        PushAlgoScoreEvent: PushAlgoScoreEvent,
        TipUserWithVote: TipUserWithVote,
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
    ) {
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
        self.accesscontrol._grant_role(OPERATOR_ROLE, admin);
        self.accesscontrol._grant_role(OPERATOR_ROLE, deployer);
        self.accesscontrol._grant_role(ADMIN_ROLE, deployer);
        self.total_topic.write(0);
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

        fn _check_epoch_transition(
            ref self: ContractState, epoch_index: u64,
        ) -> (EpochRewards, bool) {
            let mut selected_epoch = self.epoch_rewards.read(epoch_index);

            let is_ended = self._check_epoch_is_ended(selected_epoch.end_epoch_time);
            println!("is_ended: {:?}", is_ended);
            if is_ended {
                let updated_epoch = self._finalize_epoch(selected_epoch);
                println!("updated_epoch: {:?}", updated_epoch.is_finalized);
                if epoch_index == self.epoch_index.read() {
                    println!("transition to next epoch");
                    self._transition_to_next_epoch_current_epoch(epoch_index);
                    println!("finalize epoch state");

                    self._finalize_epoch_state(epoch_index);
                } else {}
            }
            (selected_epoch, is_ended)
        }


        // Transition to next epoch
        // Epoch transition

        fn _finalize_epoch(ref self: ContractState, mut epoch: EpochRewards) -> EpochRewards {
            epoch.is_finalized = true;
            let mut current_epoch_rewards = epoch;
            current_epoch_rewards.is_finalized = true;
            self.epoch_rewards.entry(epoch.index).write(current_epoch_rewards);
            epoch
            // self.epoch_rewards_per_start_epoch.entry(now).write(current_epoch_rewards);
        // self.epoch_rewards_per_end_epoch.entry(current_epoch_rewards.end_epoch_time).write(current_epoch_rewards);
        }
    }
    #[abi(embed_v0)]
    impl FactoryNostrFiScoringImpl of IFactoryNostrFiScoring<ContractState> {
        // Create a new DAO for this topic with the main token address
        // TODO:
        // Implement logic to create a new DAO for this topic with the main token address
        fn create_dao(ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>) {
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
            score_class_hash: ClassHash,
            contract_address_salt: felt252,
        ) {
            let current_index = self.total_topic.read();
            let mut calldata = array![];
            Serde::serialize(@admin.clone(), ref calldata);
            Serde::serialize(@self.admin_nostr_pubkey.read(), ref calldata);
            // Serde::serialize(@admin_nostr_pubkey.clone(), ref calldata);
            Serde::serialize(@score_class_hash.clone(), ref calldata);
            Serde::serialize(@contract_address_salt.clone(), ref calldata);
            Serde::serialize(@get_block_timestamp(), ref calldata);

            let (topic_address, _) = deploy_syscall(
                self.coin_class_hash.read(), score_class_hash, calldata.span(), false,
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
            };

            self.topic_created.entry(current_index).write(topic);
            self.total_topic.write(current_index + 1);
        }

        // Factory or deployer of the contract
        // Launch token topic for rewards and voting
        fn create_token_topic_reward_and_vote(
            ref self: ContractState,
            request: SocialRequest<LinkedStarknetAddress>,
            token_type: TokenLaunchType,
            is_create_staking_vault: bool,
            is_create_dao: bool,
        ) {
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

            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
            self.nostr_to_sn.entry(request.public_key).write(profile_default.starknet_address);
            self.sn_to_nostr.entry(profile_default.starknet_address).write(request.public_key);
            self.is_nostr_address_added.entry(request.public_key).write(true);
            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: request.public_key, starknet_address, ai_score: 0,
                // token_launch_type: token_type.clone(),
            };

            match token_type {
                TokenLaunchType::Later => { // TODO: add a new event to the contract
                },
                TokenLaunchType::Fairlaunch => { // external call to the fairlaunch contract
                    let fairlaunch_address = self.fairlaunch_address.read();
                    assert!(
                        fairlaunch_address != 0.try_into().unwrap(), "fairlaunch address not set",
                    );
                    // ILaunchpadDispatcher::create_and_launch_vault(fairlaunch_address,
                // starknet_address);

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
    }
}
