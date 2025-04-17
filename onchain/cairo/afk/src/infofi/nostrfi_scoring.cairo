#[starknet::contract]
pub mod NostrFiScoring {
    use afk::infofi::errors;
    use afk::interfaces::nostrfi_scoring_interfaces::{
        ADMIN_ROLE, CreateTokenProfile, DepositRewardsType, DistributionRewardsByUserEvent,
        INostrFiScoring, LinkedResult, LinkedStarknetAddress, LinkedStarknetAddressEncodeImpl,
        LinkedWalletProfileDefault, NostrAccountScoring, NostrFiAdminStorage, NostrPublicKey,
        OPERATOR_ROLE, ProfileAlgorithmScoring, ProfileVoteScoring, PushAlgoScoreEvent,
        PushAlgoScoreNostrNote, TipByUser, TokenLaunchType, TotalAlgoScoreRewards,
        TotalDepositRewards, TotalScoreRewards, TotalScoreRewardsDefault,
        TotalAlgoScoreRewardsDefault, TotalVoteTipsRewardsDefault, EpochRewards, TotalDepositRewardsDefault,
        Vote, VoteNostrNote, VoteParams, VoteProfile,
         TipUserWithVote, NostrAccountScoringDefault,
        ProfileVoteScoringDefault, 
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
    const EPOCH_DURATION_DEFAULT: u64 = EPOCH_DURATION_7d; // 7 days

    const EPOCH_DURATION_1d: u64 = 86400; // 1 day
    const PERCENTAGE_ALGO_SCORE_DISTRIBUTION: u256 = 8000; //80%
    const BPS: u256 = 10_000; // 100% = 10_000 bps


    #[storage]
    struct Storage {
        // Admin setup

        main_token_address: ContractAddress,
        vote_token_address: ContractAddress,
        admin_nostr_pubkey: u256, // Admin Nostr pubkey
        total_admin_nostr_pubkeys: u64,
        all_admin_nostr_pubkeys: Map<u64, NostrPublicKey>,
        is_admin_nostr_pubkey_added: Map<NostrPublicKey, bool>,
        oracle_nostr_pubkey: u256, // Oracle Nostr pubkey for Scoring Algorithm data
        name: ByteArray,
        description: ByteArray,
        owner: ContractAddress,
        admin: ContractAddress,
        admin_params: NostrFiAdminStorage,
        percentage_algo_score_distribution: u256,
        // Duration
        epoch_index: u64,
        current_epoch_rewards: EpochRewards,
        epoch_rewards: Map<u64, EpochRewards>,
        epoch_rewards_per_start_epoch: Map<u64, EpochRewards>,
        epoch_rewards_per_end_epoch: Map<u64, EpochRewards>,

        epoch_duration: u64,
        batch_timestamp: u64,
        last_batch_timestamp: u64,
        end_epoch_time: u64,
        start_epoch_time: u64,
        new_epoch_duration: u64,
        // Rewards
        overall_total_deposit_rewards: u256,
        total_deposit_rewards: TotalDepositRewards,
        total_score_rewards: TotalScoreRewards,
        total_algo_score_rewards: TotalAlgoScoreRewards,
        // Epoch rewards
        deposit_rewards_per_start_epoch: Map<u64, TotalDepositRewards>,
        deposit_rewards_per_epoch_index: Map<u64, TotalDepositRewards>,
        score_rewards_per_epoch_index: Map<u64, TotalScoreRewards>,
        algo_score_rewards_per_epoch_index: Map<u64, TotalAlgoScoreRewards>,

        is_reward_epoch_claimed_by_nostr_user: Map<u256, bool>,
        is_reward_epoch_claimed_by_user: Map<ContractAddress, bool>,
        is_reward_epoch_claimed_by_user_per_epoch: Map<ContractAddress, Map<u64, bool>>,
        // Users logic state
        total_tip_by_user: Map<u256, TipByUser>,
        total_tip_by_user_per_epoch: Map<u256, Map<u64, TipByUser>>,
        last_timestamp_oracle_score_by_user: Map<u256, u64>,
        // total_tip_by_user_list: Map<u256, TipByUser>,
        old_total_deposit_rewards_for_user: u256,
        // Logic map

        // Profile link between nostr and starknet
        nostr_pubkeys: Map<u64, u256>,
        total_pubkeys: u64,
        nostr_to_sn: Map<NostrPublicKey, ContractAddress>,
        sn_to_nostr: Map<ContractAddress, NostrPublicKey>,
        nostr_event_id_to_sn: Map<NostrPublicKey, ContractAddress>,
        sn_to_nostr_event_id: Map<ContractAddress, NostrPublicKey>,
        is_nostr_address_added: Map<NostrPublicKey, bool>,
        is_nostr_address_linked_to_sn: Map<NostrPublicKey, bool>,
        tip_to_claim_by_user_because_not_linked: Map<NostrPublicKey, u256>,
        // Vote setup
        nostr_account_scoring: Map<u256, NostrAccountScoring>,
        nostr_account_scoring_per_epoch: Map<u256, Map<u64, NostrAccountScoring>>,
        nostr_account_scoring_algo: Map<u256, ProfileAlgorithmScoring>,
        nostr_account_scoring_algo_per_epoch: Map<u256, Map<u64, ProfileAlgorithmScoring>>,
        nostr_vote_profile: Map<u256, VoteProfile>,
        nostr_vote_profile_per_epoch: Map<u256, Map<u64, VoteProfile>>,
        old_nostr_account_scoring: Map<u256, Map<u64, NostrAccountScoring>>, // score per epoch
        old_nostr_vote_profile: Map<u256, Map<u64, VoteProfile>>, 
        old_nostr_account_scoring_algo: Map<u256, Map<u64, ProfileAlgorithmScoring>>,
        old_nostr_account_vote_profile: Map<u256, Map<u64, VoteProfile>>,

        total_score_rewards_per_epoch_index: Map<u64, TotalScoreRewards>,
        total_algo_score_rewards_per_epoch_index: Map<u64, TotalAlgoScoreRewards>,
        total_deposit_rewards_per_epoch_index: Map<u64, TotalDepositRewards>,

        events_by_user: Map<ContractAddress, Vec<u256>>,
        events_by_nostr_user: Map<u256, Vec<u256>>,
        tokens_address_accepted: Map<ContractAddress, bool>,
        is_point_vote_accepted: bool,
        // External contract
        token_vault: ContractAddress,
        fairlaunch_address: ContractAddress,
        class_hash_memecoin: ClassHash,
        vault_staking_class_hash: ClassHash,
        dao_class_hash: ClassHash,
        // rewards to refacto in a new contract
        rewards_contract: ContractAddress,
        deposited_rewards: Map<ContractAddress, u256>,
        claimed_rewards: Map<ContractAddress, u256>,
        protocol_rewards: u256,
        protocol_rewards_claimed: u256,
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
    struct AdminAddNostrProfile {
        #[key]
        nostr_address: NostrPublicKey,
    }

    #[derive(Drop, starknet::Event)]
    struct TipToClaimByUserBecauseNotLinked {
        #[key]
        nostr_address: NostrPublicKey,
        amount_token: u256,
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
        LinkedDefaultStarknetAddressEvent: LinkedDefaultStarknetAddressEvent,
        AddStarknetAddressEvent: AddStarknetAddressEvent,
        CreateTokenProfileEvent: CreateTokenProfileEvent,
        AdminAddNostrProfile: AdminAddNostrProfile,
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
    fn constructor(ref self: ContractState, admin: ContractAddress, deployer: ContractAddress, main_token_address: ContractAddress, admin_nostr_pubkey: NostrPublicKey) {
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
        self.accesscontrol._grant_role(OPERATOR_ROLE, admin);
        self.accesscontrol._grant_role(OPERATOR_ROLE, deployer);
        self.accesscontrol._grant_role(ADMIN_ROLE, deployer);
        self.total_pubkeys.write(0);
        self.owner.write(admin);
        self.admin.write(admin);
        self.is_point_vote_accepted.write(false);
        self.epoch_duration.write(EPOCH_DURATION_DEFAULT); // 7 days
        self.main_token_address.write(main_token_address);
        let now = get_block_timestamp();
        self.start_epoch_time.write(now);
        self.admin_nostr_pubkey.write(admin_nostr_pubkey);
        self.all_admin_nostr_pubkeys.entry(0).write(admin_nostr_pubkey);
        self.is_admin_nostr_pubkey_added.entry(admin_nostr_pubkey).write(true);
        self.total_admin_nostr_pubkeys.write(1);

        let end_epoch_time = now + EPOCH_DURATION_DEFAULT;
        self.end_epoch_time.write(end_epoch_time);

        self.percentage_algo_score_distribution.write(PERCENTAGE_ALGO_SCORE_DISTRIBUTION);

        self.epoch_rewards.entry(0).write(EpochRewards {
            index: 0,
            epoch_duration: EPOCH_DURATION_DEFAULT,
            start_epoch_time: now,
            end_epoch_time: end_epoch_time,
            is_finalized: false,
            is_claimed: false,
            total_score_ai: 0,
            total_score_tips: 0,
            total_score_algo: 0,
        });

        self
            .admin_params
            .write(
                NostrFiAdminStorage {
                    quote_token_address: main_token_address,
                    is_paid_storage_pubkey_profile: false,
                    is_paid_storage_event_id: false,
                    amount_paid_storage_pubkey_profile: 0,
                    amount_paid_storage_event_id: 0,
                    is_multi_token_vote: false,
                    amount_paid_for_subscription: 0,
                    percentage_algo_score_distribution: PERCENTAGE_ALGO_SCORE_DISTRIBUTION,
                    vote_token_address: main_token_address,
                    subscription_time: 0,
                },
            );

        let total_score_rewards = TotalScoreRewards {
            start_epoch_time: now,
            total_score_ai: 0,
            total_score_vote: 0,
            total_tips_amount_token_vote: 0,
            total_nostr_address: 0,
            rewards_amount: 0,
            total_points_weight: 0,
            is_claimed: false,
            epoch_duration: EPOCH_DURATION_DEFAULT,
            end_epoch_time: end_epoch_time,
        };
        self.total_score_rewards.write(total_score_rewards);

        self.total_score_rewards_per_epoch_index.entry(0).write(total_score_rewards);

        let total_algo_score_rewards = TotalAlgoScoreRewards {
            start_epoch_time: now,
            total_score_ai: 0,
            total_score_overview: 0,
            total_score_skills: 0,
            total_score_value_shared: 0,
            total_nostr_address: 0,
            to_claimed_ai_score: 0,
            to_claimed_overview_score: 0,
            to_claimed_skills_score: 0,
            to_claimed_value_shared_score: 0,
            rewards_amount: 0,
            total_points_weight: 0,
            is_claimed: false,
            veracity_score: 0,
            epoch_duration: EPOCH_DURATION_DEFAULT,
            end_epoch_time: end_epoch_time,
        };
        self.total_algo_score_rewards.write(total_algo_score_rewards);

        self.total_algo_score_rewards_per_epoch_index.entry(0).write(total_algo_score_rewards);

        let total_deposit_rewards = TotalDepositRewards {
            epoch_duration: EPOCH_DURATION_DEFAULT,
            end_epoch_time: end_epoch_time,
            start_epoch_time: now,
            general_total_amount_deposit: 0,
                    user_total_amount_deposit: 0,
                    algo_total_amount_deposit: 0,
                    rewards_amount: 0,
                    is_claimed: false,
            total_amount_deposit: 0,
            total_amount_to_claim: 0,
        };

        self.total_deposit_rewards.write(total_deposit_rewards);

        self.total_deposit_rewards_per_epoch_index.entry(0).write(total_deposit_rewards);

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
        fn _assert_check_if_new_epoch_is_started(ref self: ContractState) {
            let now = get_block_timestamp();
            let next_time = self.last_batch_timestamp.read() + self.epoch_duration.read();
            assert(now >= next_time, errors::EPOCH_NOT_ENDED);
        }

        fn _assert_epoch_is_ended(ref self: ContractState, end_epoch_time: u64) {
            let now = get_block_timestamp();
            assert(now >= end_epoch_time, errors::EPOCH_NOT_ENDED);
        }

        fn _check_epoch_is_ended(ref self: ContractState, end_epoch_time: u64) -> bool {
            let now = get_block_timestamp();
          println!("now: {:?}", now);
          println!("end_epoch_time: {:?}", end_epoch_time);

            now >= end_epoch_time
        }

        // fn _check_epoch_transition_current_epoch(ref self: ContractState) {

        //     let is_ended = self._check_epoch_is_ended(self.current_epoch_rewards.read().end_epoch_time);
        //     if is_ended {
        //         self._finalize_epoch_current_epoch();
        //         self._transition_to_next_epoch_current_epoch(); 
        //     }
        // }

        fn _check_epoch_transition(ref self: ContractState, epoch_index: u64) -> (EpochRewards, bool) {

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
                } else {
                }

            } 
            (selected_epoch, is_ended)
        }

        fn _update_user_epoch_state(ref self: ContractState, nostr_address: NostrPublicKey, epoch_index: u64) -> (EpochRewards, bool) {

            let mut selected_epoch = self.epoch_rewards.read(epoch_index);

            let is_ended = self._check_epoch_is_ended(selected_epoch.end_epoch_time);
            println!("is_ended: {:?}", is_ended);
            if is_ended {
                if epoch_index == self.epoch_index.read() {
                } 

            } 
            (selected_epoch, is_ended)
        }



        // Transition to next epoch
        // Epoch transition

        fn _finalize_epoch_current_epoch(ref self: ContractState) {
            let mut current_epoch_rewards = self.current_epoch_rewards.read();
            let epoch_index = self.epoch_index.read();
            current_epoch_rewards.is_finalized = true;
            self.epoch_rewards.entry(epoch_index).write(current_epoch_rewards);
            // self.epoch_rewards_per_start_epoch.entry(now).write(current_epoch_rewards);
            // self.epoch_rewards_per_end_epoch.entry(current_epoch_rewards.end_epoch_time).write(current_epoch_rewards);
        }

        fn _finalize_epoch(ref self: ContractState, mut epoch:EpochRewards) -> EpochRewards {
            epoch.is_finalized=true;
            let mut current_epoch_rewards = epoch;
            current_epoch_rewards.is_finalized = true;
            self.epoch_rewards.entry(epoch.index).write(current_epoch_rewards);
            epoch
            // self.epoch_rewards_per_start_epoch.entry(now).write(current_epoch_rewards);
            // self.epoch_rewards_per_end_epoch.entry(current_epoch_rewards.end_epoch_time).write(current_epoch_rewards);
        }

        fn _finalize_epoch_state(ref self: ContractState, epoch_index: u64) {
           
            let mut total_score_rewards = self.total_score_rewards.read();
            total_score_rewards.is_claimed = true;
            let mut total_algo_score_rewards = self.total_algo_score_rewards.read();
            total_algo_score_rewards.is_claimed = true;
            let mut total_deposit_rewards = self.total_deposit_rewards.read();
            total_deposit_rewards.is_claimed = true;


            println!("total_score_rewards is claimed: {:?}", total_score_rewards.is_claimed);
            println!("total_algo_score_rewards is claimed: {:?}", total_algo_score_rewards.is_claimed);
            println!("total_deposit_rewards is claimed: {:?}", total_deposit_rewards.is_claimed);
            self.score_rewards_per_epoch_index.entry(epoch_index).write(total_score_rewards);
            self.algo_score_rewards_per_epoch_index.entry(epoch_index).write(total_algo_score_rewards);
            self.deposit_rewards_per_epoch_index.entry(epoch_index).write(total_deposit_rewards);


            let mut epoch_rewards=self.epoch_rewards.read(epoch_index);
            
            let end_epoch_time = epoch_rewards.end_epoch_time;
            let epoch_duration = epoch_rewards.epoch_duration;
            let start_epoch_time = epoch_rewards.start_epoch_time;
            epoch_rewards.is_finalized = true;
            self.epoch_rewards.entry(epoch_index).write(epoch_rewards);




            println!("start_epoch_time: {:?}", start_epoch_time);
            println!("end_epoch_time: {:?}", end_epoch_time);
            println!("epoch_duration: {:?}", epoch_duration);
            let mut new_total_score_rewards = TotalScoreRewardsDefault::default();
            println!("new_total_score_rewards is claimed: {:?}", new_total_score_rewards.is_claimed);

            new_total_score_rewards.start_epoch_time = start_epoch_time;
            new_total_score_rewards.end_epoch_time = end_epoch_time;
            new_total_score_rewards.epoch_duration = epoch_duration;
            new_total_score_rewards.is_claimed = false;
            self.total_score_rewards.write(new_total_score_rewards);

            let mut new_total_algo_score_rewards = TotalAlgoScoreRewardsDefault::default();
            println!("new_total_algo_score_rewards is claimed: {:?}", new_total_algo_score_rewards.is_claimed);
            
            new_total_algo_score_rewards.start_epoch_time = start_epoch_time;
            new_total_algo_score_rewards.end_epoch_time = end_epoch_time;
            new_total_algo_score_rewards.epoch_duration = epoch_duration;
            new_total_algo_score_rewards.is_claimed = false;

            self.total_algo_score_rewards.write(new_total_algo_score_rewards);

            let mut new_total_deposit_rewards = TotalDepositRewardsDefault::default();
            println!("new_total_deposit_rewards is claimed: {:?}", new_total_deposit_rewards.is_claimed);
            new_total_deposit_rewards.start_epoch_time = start_epoch_time;
            new_total_deposit_rewards.end_epoch_time = end_epoch_time;
            new_total_deposit_rewards.epoch_duration = epoch_duration;
            new_total_deposit_rewards.is_claimed = false;
            self.total_deposit_rewards.write(new_total_deposit_rewards);

            // self.
         
         
            // self.epoch_rewards_per_start_epoch.entry(now).write(current_epoch_rewards);
            // self.epoch_rewards_per_end_epoch.entry(current_epoch_rewards.end_epoch_time).write(current_epoch_rewards);
        }

        fn _finalize_epoch_state_and_reinitialize(ref self: ContractState, epoch_index: u64) {
            let mut total_score_rewards = self.total_score_rewards.read();
            total_score_rewards.is_claimed = true;
            let mut total_algo_score_rewards = self.total_algo_score_rewards.read();
            total_algo_score_rewards.is_claimed = true;
            let mut total_deposit_rewards = self.total_deposit_rewards.read();
            total_deposit_rewards.is_claimed = true;


            println!("total_score_rewards is claimed: {:?}", total_score_rewards.is_claimed);
            println!("total_algo_score_rewards is claimed: {:?}", total_algo_score_rewards.is_claimed);
            println!("total_deposit_rewards is claimed: {:?}", total_deposit_rewards.is_claimed);
            self.score_rewards_per_epoch_index.entry(epoch_index).write(total_score_rewards);
            self.algo_score_rewards_per_epoch_index.entry(epoch_index).write(total_algo_score_rewards);
            self.deposit_rewards_per_epoch_index.entry(epoch_index).write(total_deposit_rewards);


            let epoch_rewards=self.epoch_rewards.read(epoch_index);
            
            let end_epoch_time = epoch_rewards.end_epoch_time;
            let epoch_duration = epoch_rewards.epoch_duration;
            let start_epoch_time = epoch_rewards.start_epoch_time;

            println!("start_epoch_time: {:?}", start_epoch_time);
            println!("end_epoch_time: {:?}", end_epoch_time);
            println!("epoch_duration: {:?}", epoch_duration);
            let mut new_total_score_rewards = TotalScoreRewardsDefault::default();
            println!("new_total_score_rewards is claimed: {:?}", new_total_score_rewards.is_claimed);

            new_total_score_rewards.start_epoch_time = start_epoch_time;
            new_total_score_rewards.end_epoch_time = end_epoch_time;
            new_total_score_rewards.epoch_duration = epoch_duration;
            new_total_score_rewards.is_claimed = false;
            self.total_score_rewards.write(new_total_score_rewards);

            let mut new_total_algo_score_rewards = TotalAlgoScoreRewardsDefault::default();
            println!("new_total_algo_score_rewards is claimed: {:?}", new_total_algo_score_rewards.is_claimed);
            
            new_total_algo_score_rewards.start_epoch_time = start_epoch_time;
            new_total_algo_score_rewards.end_epoch_time = end_epoch_time;
            new_total_algo_score_rewards.epoch_duration = epoch_duration;
            new_total_algo_score_rewards.is_claimed = false;

            self.total_algo_score_rewards.write(new_total_algo_score_rewards);

            let mut new_total_deposit_rewards = TotalDepositRewardsDefault::default();
            println!("new_total_deposit_rewards is claimed: {:?}", new_total_deposit_rewards.is_claimed);
            new_total_deposit_rewards.start_epoch_time = start_epoch_time;
            new_total_deposit_rewards.end_epoch_time = end_epoch_time;
            new_total_deposit_rewards.epoch_duration = epoch_duration;
            new_total_deposit_rewards.is_claimed = false;
            self.total_deposit_rewards.write(new_total_deposit_rewards);

            // self.
         
         
            // self.epoch_rewards_per_start_epoch.entry(now).write(current_epoch_rewards);
            // self.epoch_rewards_per_end_epoch.entry(current_epoch_rewards.end_epoch_time).write(current_epoch_rewards);
        }

         fn _finalize_user_epoch_state(ref self: ContractState, nostr_address: NostrPublicKey, epoch_index: u64) {
           
         
            let epoch_rewards=self.epoch_rewards.read(epoch_index);
            let end_epoch_time = epoch_rewards.end_epoch_time;
            let last_batch_timestamp = epoch_rewards.start_epoch_time;
            let epoch_duration = epoch_rewards.epoch_duration;
            let start_epoch_time = epoch_rewards.start_epoch_time;
           
        }


        fn _transition_to_next_epoch(ref self: ContractState,) {
            let now = get_block_timestamp();

            let new_epoch_index = self.epoch_index.read() + 1;
            self.epoch_index.write(new_epoch_index);

            let new_epoch_rewards = EpochRewards {
                index: new_epoch_index,
                epoch_duration: self.epoch_duration.read(),
                start_epoch_time: now,
                end_epoch_time: now + self.epoch_duration.read(),
                is_finalized: false,
                is_claimed: false,
                total_score_ai: 0,
                total_score_tips: 0,
                total_score_algo: 0,
            };
            self.epoch_rewards.entry(new_epoch_index).write(new_epoch_rewards);
            self.current_epoch_rewards.write(new_epoch_rewards);
        }

        fn _transition_overall_state(ref self: ContractState,
            start_epoch_time: u64,
            end_epoch_time: u64,
        ) {
            let mut current_epoch_rewards = self.current_epoch_rewards.read();
            let epoch_index = self.epoch_index.read();
            current_epoch_rewards.is_finalized = true;
            self.epoch_rewards.entry(epoch_index).write(current_epoch_rewards);
        }


        fn _transition_to_next_epoch_current_epoch(ref self: ContractState, epoch_index: u64) {


            // change old state
            let mut epoch_rewards=self.epoch_rewards.read(epoch_index);
            epoch_rewards.is_finalized = true;
            self.epoch_rewards.entry(epoch_index).write(epoch_rewards);

            let now = get_block_timestamp();
            
            // init new epoch
            let new_epoch_index = self.epoch_index.read() + 1;
            self.epoch_index.write(new_epoch_index);
            let end_epoch_time = now + self.epoch_duration.read();

            let new_epoch_rewards = EpochRewards {
                index: new_epoch_index,
                epoch_duration: self.epoch_duration.read(),
                start_epoch_time: now,
                end_epoch_time: end_epoch_time,
                is_finalized: false,
                is_claimed: false,
                total_score_ai: 0,
                total_score_tips: 0,
                total_score_algo: 0,
            };
            self.last_batch_timestamp.write(end_epoch_time);
            self.end_epoch_time.write(end_epoch_time);
            self.epoch_rewards.entry(new_epoch_index).write(new_epoch_rewards);
            self.current_epoch_rewards.write(new_epoch_rewards);
        }
        


        
        fn _transition_user_state_to_next_epoch(ref self: ContractState,
            start_epoch_time: u64,
            end_epoch_time: u64,) {

            let caller_address = get_caller_address();
            let nostr_address = self.sn_to_nostr.read(caller_address);
            let now = get_block_timestamp();
            let mut current_epoch_rewards = self.current_epoch_rewards.read();
            let epoch_index = self.epoch_index.read();
            current_epoch_rewards.is_finalized = true;
            self.epoch_rewards.entry(epoch_index).write(current_epoch_rewards);

        }


        fn _generic_vote_nostr_event(
            ref self: ContractState, vote_params: VoteParams // nostr_address: NostrPublicKey,
            // vote: Vote,
        // is_upvote: bool,
        // upvote_amount: u256,
        // downvote_amount: u256,
        // amount: u256,
        // amount_token: u256,

        ) {
            let current_index_epoch = self.epoch_index.read();

            let nostr_to_sn = self.nostr_to_sn.read(vote_params.nostr_address);
            let old_tip_by_user = self.total_tip_by_user.read(vote_params.nostr_address);
            // let old_tip_by_user_per_epoch = self.total_tip_by_user_per_epoch.entry(vote_params.nostr_address).entry(current_index_epoch);

            let mut reward_to_claim_by_user_because_not_linked = old_tip_by_user
                .reward_to_claim_by_user_because_not_linked;
            let mut new_reward_to_claim_by_user_because_not_linked =
                reward_to_claim_by_user_because_not_linked;

            let mut is_amount_to_send = false;

            let erc20_token_address = self.main_token_address.read();
            assert(erc20_token_address != 0.try_into().unwrap(), 'Main token address not set');

            let erc20 = IERC20Dispatcher { contract_address: erc20_token_address };


            let allowance = erc20.allowance(get_caller_address(), get_contract_address());
            println!("allowance: {:?}", allowance);
            println!("amount token: {:?}", vote_params.amount_token);
            if nostr_to_sn == 0.try_into().unwrap() {
                println!("user not linked, rewards to claim after");

                reward_to_claim_by_user_because_not_linked =
                    reward_to_claim_by_user_because_not_linked
                    + vote_params.amount_token;
                new_reward_to_claim_by_user_because_not_linked =
                    reward_to_claim_by_user_because_not_linked
                    + vote_params.amount_token;
                self
                    .tip_to_claim_by_user_because_not_linked
                    .entry(vote_params.nostr_address)
                    .write(vote_params.amount_token);

                    erc20
                    .transfer_from(
                        get_caller_address(),
                        get_contract_address(),
                         vote_params.amount_token,
                    );
                    
                self
                    .emit(
                        TipToClaimByUserBecauseNotLinked {
                            nostr_address: vote_params.nostr_address,
                            amount_token: vote_params.amount_token,
                        },
                    );
            } else {
                println!("user already linked");
                // assert(nostr_to_sn != 0.try_into().unwrap(), 'Starknet address not linked');
     
                is_amount_to_send = true;

                if reward_to_claim_by_user_because_not_linked > 0 {
                    println!("reward to claim by user because not linked: {:?}", reward_to_claim_by_user_because_not_linked);
                    // new_reward_to_claim_by_user_because_not_linked = 0;
                    // erc20
                    //     .transfer_from(
                    //         get_caller_address(),
                    //         nostr_to_sn,
                    //         reward_to_claim_by_user_because_not_linked + vote_params.amount_token,
                    //     );
                    erc20
                    .transfer_from(
                        get_caller_address(),
                        nostr_to_sn,
                         vote_params.amount_token,
                    );

                    // erc20.transfer(nostr_to_sn, reward_to_claim_by_user_because_not_linked);
                } else {
                    erc20
                        .transfer_from(get_caller_address(), nostr_to_sn, vote_params.amount_token);
                }
            }

            // V2
            // Add weight based on profile score



            let tip_by_user = TipByUser {
                nostr_address: vote_params.nostr_address,
                total_amount_deposit: old_tip_by_user.total_amount_deposit
                    + vote_params.upvote_amount,
                total_amount_deposit_by_algo: old_tip_by_user.total_amount_deposit_by_algo
                    + vote_params.downvote_amount,
                rewards_amount: old_tip_by_user.rewards_amount,
                is_claimed: old_tip_by_user.is_claimed,
                end_epoch_time: old_tip_by_user.end_epoch_time,
                start_epoch_time: old_tip_by_user.start_epoch_time,
                epoch_duration: old_tip_by_user.epoch_duration,
                reward_to_claim_by_user_because_not_linked: new_reward_to_claim_by_user_because_not_linked,
                is_claimed_tip_by_user_because_not_linked: old_tip_by_user
                    .is_claimed_tip_by_user_because_not_linked,
            };

            self.total_tip_by_user.entry(vote_params.nostr_address).write(tip_by_user);
            self.total_tip_by_user_per_epoch.entry(vote_params.nostr_address).entry(current_index_epoch).write(tip_by_user);

            let old_total_score_rewards = self.total_score_rewards.read();
            println!("total_score_vote: {:?}", old_total_score_rewards.total_score_vote);

            let new_total_score_vote = old_total_score_rewards.total_score_vote + vote_params.amount_token;
            let update_total_score_vote = TotalScoreRewards {
                total_score_ai: old_total_score_rewards.total_score_ai,
                total_score_vote: new_total_score_vote,
                total_nostr_address: old_total_score_rewards.total_nostr_address,
                total_tips_amount_token_vote: old_total_score_rewards.total_tips_amount_token_vote,
                rewards_amount: old_total_score_rewards.rewards_amount,
                total_points_weight: old_total_score_rewards.total_points_weight,
                is_claimed: old_total_score_rewards.is_claimed,
                epoch_duration: old_total_score_rewards.epoch_duration,
                end_epoch_time: old_total_score_rewards.end_epoch_time,
                start_epoch_time: old_total_score_rewards.start_epoch_time,
            };

            self.total_score_rewards.write(update_total_score_vote);
            self.total_score_rewards_per_epoch_index.entry(current_index_epoch).write(update_total_score_vote);

            self.emit(TipUserWithVote {
                nostr_address: vote_params.nostr_address,
                nostr_event_id: vote_params.nostr_address,
                starknet_address: nostr_to_sn,
                amount_token: vote_params.amount_token,
                amount_vote: vote_params.amount_token,
                current_index_epoch: current_index_epoch,
            });
            
        }

        fn _verify_and_extract_vote_nostr_event(
            ref self: ContractState, request: SocialRequest<VoteNostrNote>,
        ) -> VoteParams {
            let vote_token_profile = request.content.clone();
            // let starknet_address: ContractAddress = vote_token_profile.starknet_address;
            // assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');

            let vote_params = VoteParams {
                nostr_address: vote_token_profile.nostr_address,
                vote: vote_token_profile.vote,
                is_upvote: vote_token_profile.is_upvote,
                upvote_amount: vote_token_profile.upvote_amount,
                downvote_amount: vote_token_profile.downvote_amount,
                amount: vote_token_profile.amount,
                amount_token: vote_token_profile.amount_token,
            };

            return vote_params;
        }


        fn set_tokens_address_accepted(
            self: @ContractState, token_address: ContractAddress, is_accepted: bool,
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            // self.tokens_address_accepted.entry(token_address).write(*is_accepted);
        }

        fn deploy_token_to_use(self: @ContractState) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);

            let fairlaunch_address = self.fairlaunch_address.read();
            assert!(fairlaunch_address != 0.try_into().unwrap(), "fairlaunch address not set");
            // let token_address = ILaunchpadDispatcher::create_token(fairlaunch_address,
        // starknet_address);
        // self.tokens_address_accepted.entry(token_address).write(true);

        }

        fn _old_time_check(ref self: ContractState, starknet_user_address: ContractAddress) {
            let now = get_block_timestamp();

            // check profile nostr id link
            let nostr_address = self.sn_to_nostr.read(starknet_user_address);
            assert(nostr_address != 0.try_into().unwrap(), 'Profile not linked');

            let next_time = self.last_batch_timestamp.read() + self.epoch_duration.read();
            assert(now >= next_time, 'Epoch not ended');

            let last_timestamp_oracle_score_by_user = self
                .last_timestamp_oracle_score_by_user
                .read(nostr_address);

            assert(now - last_timestamp_oracle_score_by_user > 1000, 'Not enough time has passed');

        }
        // Distribution of rewards for one user
        // Algorithm + User vote tips
        // TODO:
        // Add end epoch check
        fn _distribute_rewards_by_user(
            ref self: ContractState, starknet_user_address: ContractAddress, 
            epoch_index: u64
        ) {
            let now = get_block_timestamp();

            // check profile nostr id link
            
            println!("starknet_user_address: {:?}", starknet_user_address);
            let nostr_address = self.sn_to_nostr.read(starknet_user_address);
            println!("nostr_address: {:?}", nostr_address); 
            assert(nostr_address != 0.try_into().unwrap(), errors::PROFILE_NOT_LINKED);
            // Verify the epoch params

            let mut current_epoch_rewards = self.epoch_rewards.read(epoch_index);

            let (epoch_rewards, is_ended) = self._check_epoch_transition(epoch_index);
            
            println!("is_ended: {:?}", is_ended);
            assert(is_ended, errors::EPOCH_NOT_FINALIZED);

            // // let next_time = self.last_batch_timestamp.read() + self.epoch_duration.read();
            // // assert(now >= next_time, errors::EPOCH_NOT_ENDED);

            // let last_timestamp_oracle_score_by_user = self
            //     .last_timestamp_oracle_score_by_user
            //     .read(nostr_address);

            // assert(now - last_timestamp_oracle_score_by_user > 1000, 'Not enough time has passed');



            // TODO:

            // General rewards distribution


            // Check users distribution is claimed per epoch
            println!("nostr_address: {:?}", nostr_address);

            println!(" check user data for epoch: {:?}", epoch_index);
            let profile_scoring_by_algo = self.nostr_account_scoring_algo.read(nostr_address);

            println!("profile_scoring_by_algo: {:?}", profile_scoring_by_algo.ai_score);
            let profile_scoring_algo_by_user_epoch = self.nostr_account_scoring_per_epoch.entry(nostr_address).entry(epoch_index).read();
            println!("profile_scoring_algo_by_user_epoch: {:?}", profile_scoring_algo_by_user_epoch.ai_score);
            // println!("profile_scoring_by_user: {:?}", profile_scoring_by_user.ai_score);
            let tip_by_user_total = self.total_tip_by_user.read(nostr_address);
            println!("tip_by_user_total total_amount_deposit: {:?}", tip_by_user_total.total_amount_deposit);

            let tip_by_user = self.total_tip_by_user_per_epoch.entry(nostr_address).entry(epoch_index).read();

            println!("tip_by_user: {:?}", tip_by_user.total_amount_deposit);
            println!("tip_by_user is claimed: {:?}", tip_by_user.is_claimed);

            let total_deposit_rewards = self.total_deposit_rewards_per_epoch_index.read(epoch_index);
            println!("total_deposit_rewards: {:?}", total_deposit_rewards.total_amount_deposit);

            let mut data_algo_score = self.nostr_account_scoring_algo_per_epoch.entry(nostr_address).entry(epoch_index).read();
            let my_ai_score = data_algo_score.ai_score;

            println!("data algo score is claimed: {:?}", data_algo_score.is_claimed);
            assert(!tip_by_user.is_claimed && !data_algo_score.is_claimed, errors::USER_EPOCH_DISTRIBUTION_CLAIMED);

            // Admins params percentage between user and algo

            // Start distribution by algo


            // Get total state for all users subscribed to the epoch
            let total_score_rewards = self.total_score_rewards_per_epoch_index.read(epoch_index);
            println!("total_score_rewards: {:?}", total_score_rewards.total_score_ai);
            let total_score_vote = total_score_rewards.total_score_vote;
            println!("total_score_vote: {:?}", total_score_vote);
            // let total_algo_score_rewards = self.total_algo_score_rewards.read();
            let total_algo_score_rewards= self.algo_score_rewards_per_epoch_index.read(epoch_index);
            println!("total_algo_score_rewards: {:?}", total_algo_score_rewards.total_score_ai);

            let percentage_distribution_algo = self
                .admin_params
                .read()
                .percentage_algo_score_distribution;


            let total_amount_deposit = total_deposit_rewards.total_amount_deposit;
            // let erc20_token_address = self.admin_params.read().quote_token_address;
            let erc20_token_address = self.main_token_address.read();
            let erc20 = IERC20Dispatcher { contract_address: erc20_token_address };
            let balance_contract = erc20.balance_of(get_contract_address());

            let total_amount_to_claim_algo = total_amount_deposit
                * percentage_distribution_algo
                / BPS;
            let total_amount_to_claim = total_deposit_rewards.total_amount_to_claim;

            let amount_for_algo = total_amount_deposit * percentage_distribution_algo / BPS;
            println!("amount_for_algo: {}", amount_for_algo);

            let total_ai_score = total_algo_score_rewards.total_score_ai;

            println!("total_ai_score: {}", total_ai_score);

            println!("my_ai_score: {}", my_ai_score);

         
            // V2 weight
            let my_overview_score = data_algo_score.overview_score;
            let my_skills_score = data_algo_score.skills_score;
            let my_value_shared_score = data_algo_score.value_shared_score;

            // User share by Algo score
            // V2 create weight and equations based on several parameters of the algorith scoring

            let mut user_share_algo = 0;
            if total_amount_to_claim_algo == 0 {
                user_share_algo = 0;
            } else {
                user_share_algo = my_ai_score * total_amount_to_claim_algo / total_amount_to_claim_algo;
            }
         
            println!("user_share_algo: {}", user_share_algo);
            println!("balance_contract: {}", balance_contract);

            if user_share_algo > balance_contract {
                user_share_algo = balance_contract;
            }

            if user_share_algo > total_amount_to_claim_algo {
                user_share_algo = total_amount_to_claim_algo;
            }

            // Distribute Topic User vote tips

            // Distribute general rewards send to vault
            let total_deposit_rewards = self.total_deposit_rewards.read();
            println!("total_deposit_rewards: {:?}", total_deposit_rewards.total_amount_deposit);
            // let profile_vote_scoring_by_user = self.nostr_vote_profile.read(nostr_address);

            println!("percentage_distribution_algo: {:?}", percentage_distribution_algo);
            // Calculate rewards by user
            // Depends on User tips + Weight + Vote
            // Distribute rewards by User vote tips
            // V2: add weight for user vote tips
            // Whitelisted OG for topics and moderators
            // DAO whitelisted  
            // Algo whitelist based on Algo score
            let remaining_percentage_distribution_user = BPS - percentage_distribution_algo;
            println!("remaining_percentage_distribution_user: {}", remaining_percentage_distribution_user);
         

            let tip_user_total_amount_deposit = tip_by_user.total_amount_deposit;
            println!("tip_user.total_amount_deposit: {}", tip_user_total_amount_deposit);
            let mut total_amount_to_claim_user_vote = total_amount_deposit
                * remaining_percentage_distribution_user
                / BPS;
            println!("total_amount_to_claim_user_vote: {}", total_amount_to_claim_user_vote);

            let my_vote_score = total_score_vote * percentage_distribution_algo / BPS;
            println!("my_vote_score: {}", my_vote_score);
            let mut user_share_vote = 0;
            println!("total_score_vote: {:?}", total_score_vote);

            if total_amount_to_claim_user_vote == 0 {
                user_share_vote = 0;
            } else {
                user_share_vote = my_vote_score * total_amount_to_claim_user_vote / total_amount_to_claim_user_vote;
            }
            println!("user_share_vote: {}", user_share_vote);
            println!("balance_contract: {}", balance_contract);
            let mut veracity_score = 0;

            // let tip_by_user_amount = tip_by_user.total_amount_deposit;
            // let tip_by_user_amount_rewards = tip_by_user.rewards_amount;

            if user_share_vote > balance_contract {
                user_share_vote = balance_contract;
            }

            if user_share_vote > total_amount_to_claim_user_vote {
                user_share_vote = total_amount_to_claim_user_vote;
            }

            println!("user_share_algo: {}", user_share_algo);
            println!("user_share_vote: {}", user_share_vote);

            println!("update state");
            println!("total_amount_to_claim: {}", total_amount_to_claim);
            println!("user_share_algo: {}", user_share_algo);
            println!("user_share_vote: {}", user_share_vote);
            // // Update all state
            // let update_total_deposit_rewards = TotalDepositRewards {
            //     epoch_duration: total_deposit_rewards.epoch_duration,
            //     start_epoch_time: total_deposit_rewards.start_epoch_time,
            //     end_epoch_time: total_deposit_rewards.end_epoch_time,
            //     general_total_amount_deposit: total_deposit_rewards.general_total_amount_deposit,
            //     total_amount_deposit: total_deposit_rewards.total_amount_deposit,
            //     user_total_amount_deposit: total_deposit_rewards.user_total_amount_deposit,
            //     algo_total_amount_deposit: total_deposit_rewards.algo_total_amount_deposit,
            //     rewards_amount: total_deposit_rewards.rewards_amount,
            //     is_claimed: total_deposit_rewards.is_claimed,
            //     total_amount_to_claim: total_deposit_rewards.total_amount_deposit - user_share_algo - user_share_vote,
            // };

            // self.total_deposit_rewards.write(update_total_deposit_rewards);


            // Change user state

            data_algo_score.is_claimed = true;
            self.nostr_account_scoring_algo_per_epoch.entry(nostr_address).entry(epoch_index).write(data_algo_score);

            self.is_reward_epoch_claimed_by_nostr_user.entry(nostr_address).write(true);
            self.is_reward_epoch_claimed_by_user.entry(starknet_user_address).write(true);
            self.is_reward_epoch_claimed_by_user_per_epoch.entry(starknet_user_address).entry(epoch_index).write(true);
            // External call

            // Transfer token user share by algo and user vote

            println!("transfer token user share by algo");
            println!("user_share_algo: {}", user_share_algo);
            erc20.transfer(starknet_user_address, user_share_algo);

            println!("transfer token user share by vote");
            println!("user_share_vote: {}", user_share_vote);
            erc20.transfer(starknet_user_address, user_share_vote);
            // Emit Event distribution by user

            self
                .emit(
                    DistributionRewardsByUserEvent {
                        starknet_address: starknet_user_address,
                        nostr_address,
                        claimed_at: now,
                        amount_algo: user_share_algo,
                        amount_vote: user_share_vote,
                        amount_total: user_share_algo + user_share_vote,
                        veracity_score: 0,
                    },
                );
        }
       
    }
    #[abi(embed_v0)]
    impl NostrFiScoringImpl of INostrFiScoring<ContractState> {
        // Users functions

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
            self.is_nostr_address_added.entry(request.public_key).write(true);
            self.is_nostr_address_linked_to_sn.entry(request.public_key).write(true);
            self.nostr_pubkeys.entry(self.total_pubkeys.read()).write(request.public_key);
            self.total_pubkeys.write(self.total_pubkeys.read() + 1);
            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: request.public_key,
                starknet_address,
                ai_score: 0,
                // token_launch_type: TokenLaunchType::Fairlaunch,
            };
            self.nostr_account_scoring.entry(request.public_key).write(nostr_account_scoring);

            let now = get_block_timestamp();

            let old_tip_by_user = self.total_tip_by_user.read(request.public_key); 
            let tip_by_user = TipByUser {
                nostr_address: request.public_key,
                total_amount_deposit: old_tip_by_user.total_amount_deposit,
                total_amount_deposit_by_algo: old_tip_by_user.total_amount_deposit_by_algo,
                rewards_amount: old_tip_by_user.rewards_amount,
                is_claimed: old_tip_by_user.is_claimed,
                end_epoch_time: old_tip_by_user.end_epoch_time,
                start_epoch_time: old_tip_by_user.start_epoch_time,
                epoch_duration: old_tip_by_user.epoch_duration,
                is_claimed_tip_by_user_because_not_linked: old_tip_by_user.is_claimed_tip_by_user_because_not_linked,
                reward_to_claim_by_user_because_not_linked: old_tip_by_user.reward_to_claim_by_user_because_not_linked,
            };

            self.total_tip_by_user.entry(request.public_key).write(tip_by_user);
            self.total_tip_by_user_per_epoch.entry(request.public_key).entry(self.epoch_index.read()).write(tip_by_user);
            self
                .emit(
                    LinkedDefaultStarknetAddressEvent {
                        nostr_address: request.public_key, starknet_address,
                    },
                );
        }

        fn vote_token_profile(ref self: ContractState, request: SocialRequest<VoteNostrNote>) {
            let vote_params = self._verify_and_extract_vote_nostr_event(request);
            self._generic_vote_nostr_event(vote_params);
        }

        fn vote_nostr_note(ref self: ContractState, request: SocialRequest<VoteNostrNote>) {
            let vote_params = self._verify_and_extract_vote_nostr_event(request);
            self._generic_vote_nostr_event(vote_params);
        }

        // Vote for profile without Nostr event verification
        fn vote_nostr_profile_starknet_only(ref self: ContractState, vote_params: VoteParams) {
            self._generic_vote_nostr_event(vote_params);
        }

        // Deposit rewards to topic vault
        // Fund sent to vault to distribute rewards
        // V:2: User select by vote user or algorithm, or both based on the DAO percentage between
        // User and Algo
        fn deposit_rewards(
            ref self: ContractState, amount: u256, deposit_rewards_type: DepositRewardsType,
        ) {
            // self.accesscontrol.assert_only_role(OPERATOR_ROLE);
            let now = get_block_timestamp();
            let next_time = self.last_batch_timestamp.read() + self.epoch_duration.read();
            let next_time_if_ended = now + self.epoch_duration.read();

            let current_index_epoch = self.epoch_index.read();

            let old_total_deposit_rewards = self.total_deposit_rewards.read();

            let end_epoch_time = old_total_deposit_rewards.end_epoch_time;

            // assert(now >= end_epoch_time, 'Epoch not ended');

            let mut new_epoch_duration = old_total_deposit_rewards.epoch_duration;
            let mut new_start_epoch_time = old_total_deposit_rewards.start_epoch_time;
            let mut new_end_epoch_time = old_total_deposit_rewards.end_epoch_time;
            if now >= end_epoch_time { // TODO: add event to the contract
            } else {
                new_start_epoch_time = now;
                self.last_batch_timestamp.write(now);
                self.end_epoch_time.write(now + new_epoch_duration);
                self.last_batch_timestamp.write(now);
            }


            let total_deposit_per_epoch=self.total_deposit_rewards_per_epoch_index.read(current_index_epoch);

            // MVP with only general deposit rewards
            // V2: users can select the type of rewards distribution when they deposit
            let total_deposit_rewards = match deposit_rewards_type {
                DepositRewardsType::General => {
                    TotalDepositRewards {
                        epoch_duration: old_total_deposit_rewards.epoch_duration,
                        start_epoch_time: old_total_deposit_rewards.start_epoch_time,
                        end_epoch_time: old_total_deposit_rewards.end_epoch_time,
                        // epoch_duration: self.epoch_duration.read(),
                        // end_epoch_time: self.last_batch_timestamp.read()
                        //     + self.epoch_duration.read(),
                        total_amount_deposit: old_total_deposit_rewards.total_amount_deposit + amount,
                        algo_total_amount_deposit: old_total_deposit_rewards
                            .algo_total_amount_deposit,
                        user_total_amount_deposit: old_total_deposit_rewards
                            .user_total_amount_deposit,
                        rewards_amount: old_total_deposit_rewards.rewards_amount,
                        is_claimed: old_total_deposit_rewards.is_claimed,
                        general_total_amount_deposit: old_total_deposit_rewards
                            .general_total_amount_deposit,
                        total_amount_to_claim: old_total_deposit_rewards.total_amount_to_claim,
                    }
                },
                // DepositRewardsType::User => {
            //     // TODO: add user deposit rewards
            //     TotalDepositRewards {
            //         epoch_duration:old_total_deposit_rewards.epoch_duration,
            //         start_epoch_time:old_total_deposit_rewards.start_epoch_time,
            //         end_epoch_time:old_total_deposit_rewards.end_epoch_time,
            //         general_total_amount_deposit:
            //         old_total_deposit_rewards.general_total_amount_deposit, //
            //         epoch_duration: self.epoch_duration.read(), // end_epoch_time:
            //         self.last_batch_timestamp.read()
            //         //     + self.epoch_duration.read(),
            //         total_amount_deposit: old_total_deposit_rewards.total_amount_deposit,
            //         user_total_amount_deposit: old_total_deposit_rewards
            //             .user_total_amount_deposit
            //             + amount,
            //         algo_total_amount_deposit: old_total_deposit_rewards
            //             .algo_total_amount_deposit,
            //         rewards_amount: old_total_deposit_rewards.rewards_amount,
            //         is_claimed: old_total_deposit_rewards.is_claimed,
            //     }
            // },
            // DepositRewardsType::Algo => {
            //     // TODO: add algo deposit rewards
            //     TotalDepositRewards {
            //         epoch_duration:old_total_deposit_rewards.epoch_duration,
            //         start_epoch_time:old_total_deposit_rewards.start_epoch_time,
            //         end_epoch_time:old_total_deposit_rewards.end_epoch_time,
            //         general_total_amount_deposit:
            //         old_total_deposit_rewards.general_total_amount_deposit, //
            //         epoch_duration: self.epoch_duration.read(), // end_epoch_time:
            //         self.last_batch_timestamp.read()
            //         //     + self.epoch_duration.read(),
            //         total_amount_deposit: old_total_deposit_rewards.total_amount_deposit,
            //         user_total_amount_deposit: old_total_deposit_rewards
            //             .user_total_amount_deposit,
            //         algo_total_amount_deposit: old_total_deposit_rewards
            //             .algo_total_amount_deposit
            //             + amount,
            // rewards_amount: old_total_deposit_rewards.rewards_amount,
            // is_claimed: old_total_deposit_rewards.is_claimed,
            // }
            // },
            };
            let erc20_contract_address = self.main_token_address.read();
            let erc20 = IERC20Dispatcher{contract_address: erc20_contract_address};

            let caller=get_caller_address();
            let contract_address=get_contract_address();
            let allowed_amount = erc20.allowance(caller, contract_address);
          
            self.total_deposit_rewards.write(total_deposit_rewards);
            self.total_deposit_rewards_per_epoch_index.entry(current_index_epoch).write(total_deposit_rewards);

            println!("allowed_amount: {}", allowed_amount);
            erc20.transfer_from(caller, contract_address, amount);




         
        }


        // Distribution of rewards for one user
        // Not needed to be the caller: auto distribution by automation
        // Algorithm + User vote tips
        // TODO:
        // Add end epoch check
        fn distribute_rewards_by_user(
            ref self: ContractState, starknet_user_address: ContractAddress, epoch_index: u64
        ) {
            self._distribute_rewards_by_user(starknet_user_address, epoch_index);
        }


        fn claim_and_distribute_my_rewards(ref self: ContractState, epoch_index: u64) {
            let caller = get_caller_address();
            self._distribute_rewards_by_user(caller, epoch_index);
        }

        // ADMINS Access control
        // Operator and admin functions

        // Algorithm profil scoring
        // Nostr oracle admin to fetch the event offchain after the calculation
        // LLM + ML + Algorithm scripts for scoring
        fn push_profile_score_algo(
            ref self: ContractState,
            request: SocialRequest<PushAlgoScoreNostrNote>,
            score_algo: ProfileAlgorithmScoring,
        ) {
            println!("push_profile_score_algo");
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), errors::ROLE_REQUIRED);
            let admin_nostr_pubkey = self.admin_nostr_pubkey.read();


            println!("admin_nostr_pubkey: {}", admin_nostr_pubkey);

            let is_admin_nostr_pubkey_added = self.is_admin_nostr_pubkey_added.read(admin_nostr_pubkey);
            assert(is_admin_nostr_pubkey_added || request.public_key == admin_nostr_pubkey, errors::INVALID_PUBKEY);

            // Verify if the token address is set
            // // V2 let change users main address or add multi token vault
            // assert(
            //     self.main_token_address.read() != 0.try_into().unwrap(),
            //     errors::MAIN_TOKEN_ADDRESS_NOT_SET,
            // );

            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            println!("push_profile_score_algo");
            let profile_default = request.content.clone();
            let nostr_address: NostrPublicKey = profile_default.nostr_address.try_into().unwrap();
            let sn_address_linked = self.nostr_to_sn.read(nostr_address);

            println!("verify signature");
            // Verify signature Nostr oracle admin
            //
            request.verify().expect('can\'t verify signature');

            let now = get_block_timestamp();

            // Update nostr account scoring by algo

            println!("algo_nostr_account_scoring");
            let mut algo_nostr_account_scoring = self
                .nostr_account_scoring_algo
                .read(nostr_address);

            if algo_nostr_account_scoring.nostr_address != 0.try_into().unwrap() {
                println!("algo_nostr_account_scoring.nostr_address != 0.try_into().unwrap()");
                algo_nostr_account_scoring.starknet_address = sn_address_linked;
                algo_nostr_account_scoring.ai_score = score_algo.ai_score;
                algo_nostr_account_scoring.overview_score = score_algo.overview_score;
                algo_nostr_account_scoring.skills_score = score_algo.skills_score;
                algo_nostr_account_scoring.value_shared_score = score_algo.value_shared_score;
                algo_nostr_account_scoring.ai_score_to_claimed = score_algo.ai_score_to_claimed;
                algo_nostr_account_scoring
                    .overview_score_to_claimed = score_algo
                    .overview_score_to_claimed;
                algo_nostr_account_scoring.skills_score_to_claimed = score_algo.skills_score_to_claimed;
                algo_nostr_account_scoring
                    .value_shared_score_to_claimed = score_algo
                    .value_shared_score_to_claimed;
                algo_nostr_account_scoring.total_score = score_algo.ai_score + score_algo.overview_score + score_algo.skills_score + score_algo.value_shared_score;
                self.nostr_account_scoring_algo.entry(nostr_address).write(algo_nostr_account_scoring);
                self.nostr_account_scoring_algo_per_epoch.entry(nostr_address).entry(self.epoch_index.read()).write(algo_nostr_account_scoring);
    
                self.last_timestamp_oracle_score_by_user.entry(nostr_address).write(now);
            } else {
                println!("algo_nostr_account_scoring.nostr_address == 0.try_into().unwrap()");
                println!("init algo_nostr_account_scoring: {}", nostr_address);
                algo_nostr_account_scoring = ProfileAlgorithmScoring {
                    nostr_address: nostr_address.try_into().unwrap(),
                    starknet_address: sn_address_linked,
                    ai_score: score_algo.ai_score,
                    overview_score: score_algo.overview_score,
                    skills_score: score_algo.skills_score,
                    value_shared_score: score_algo.value_shared_score,
                    is_claimed: false,
                    ai_score_to_claimed: score_algo.ai_score,
                    overview_score_to_claimed: score_algo.overview_score,
                    skills_score_to_claimed: score_algo.skills_score,
                    value_shared_score_to_claimed: score_algo.value_shared_score,
                    total_score: score_algo.ai_score + score_algo.overview_score + score_algo.skills_score + score_algo.value_shared_score,
                    veracity_score: score_algo.veracity_score,
                };
                self.nostr_account_scoring_algo.entry(nostr_address).write(algo_nostr_account_scoring);
                self.nostr_account_scoring_algo_per_epoch.entry(nostr_address).entry(self.epoch_index.read()).write(algo_nostr_account_scoring);
    
            }
            // Update the algo score
            // Current
            // By epoch indexer
            self.nostr_account_scoring_algo.entry(nostr_address).write(algo_nostr_account_scoring);
            self.nostr_account_scoring_algo_per_epoch.entry(nostr_address).entry(self.epoch_index.read()).write(algo_nostr_account_scoring);
        

            // Update total algo score stats
            let total_algo_score_rewards = self.total_algo_score_rewards.read();

            // TODO
            // Check if decrease score to reflect

            let new_total_algo_score_rewards = TotalAlgoScoreRewards {
                epoch_duration: total_algo_score_rewards.epoch_duration,
                end_epoch_time: total_algo_score_rewards.end_epoch_time,
                total_score_ai: total_algo_score_rewards.total_score_ai + score_algo.ai_score,
                total_score_overview: total_algo_score_rewards.total_score_overview
                    + score_algo.overview_score,
                total_score_skills: total_algo_score_rewards.total_score_skills
                    + score_algo.skills_score,
                total_score_value_shared: total_algo_score_rewards.total_score_value_shared
                    + score_algo.value_shared_score,
                total_nostr_address: total_algo_score_rewards.total_nostr_address,
                to_claimed_ai_score: total_algo_score_rewards.to_claimed_ai_score,
                to_claimed_overview_score: total_algo_score_rewards.to_claimed_overview_score,
                to_claimed_skills_score: total_algo_score_rewards.to_claimed_skills_score,
                to_claimed_value_shared_score: total_algo_score_rewards
                    .to_claimed_value_shared_score,
                rewards_amount: total_algo_score_rewards.rewards_amount,
                total_points_weight: total_algo_score_rewards.total_points_weight,
                is_claimed: total_algo_score_rewards.is_claimed,
                veracity_score: total_algo_score_rewards.veracity_score,
                start_epoch_time: total_algo_score_rewards.start_epoch_time,
            };

            self.total_algo_score_rewards.write(new_total_algo_score_rewards);

            self
                .emit(
                    PushAlgoScoreEvent {
                        nostr_address,
                        starknet_address: sn_address_linked,
                        total_score_ai: total_algo_score_rewards.total_score_ai
                            + score_algo.ai_score,
                        total_score_overview: total_algo_score_rewards.total_score_overview
                            + score_algo.overview_score,
                        total_score_skills: total_algo_score_rewards.total_score_skills
                            + score_algo.skills_score,
                        total_score_value_shared: total_algo_score_rewards.total_score_value_shared
                            + score_algo.value_shared_score,
                        total_nostr_address: total_algo_score_rewards.total_nostr_address,
                        rewards_amount: total_algo_score_rewards.rewards_amount,
                        total_points_weight: total_algo_score_rewards.total_points_weight,
                        is_claimed: total_algo_score_rewards.is_claimed,
                        claimed_at: now,
                        veracity_score: 0,
                    },
                );
        }


        fn set_change_batch_interval(ref self: ContractState, next_epoch: u64) {
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), errors::ADMIN_ROLE_REQUIRED);
            self.last_batch_timestamp.write(next_epoch);
        }

        fn set_admin_params(ref self: ContractState, admin_params: NostrFiAdminStorage) {
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), errors::ADMIN_ROLE_REQUIRED);

            let new_admin_params = NostrFiAdminStorage {
                quote_token_address: admin_params.quote_token_address,
                is_paid_storage_pubkey_profile: admin_params.is_paid_storage_pubkey_profile,
                is_paid_storage_event_id: admin_params.is_paid_storage_event_id,
                amount_paid_storage_pubkey_profile: admin_params
                    .amount_paid_storage_pubkey_profile,
                amount_paid_storage_event_id: admin_params.amount_paid_storage_event_id,
                is_multi_token_vote: admin_params.is_multi_token_vote,
                amount_paid_for_subscription: admin_params.amount_paid_for_subscription,
                percentage_algo_score_distribution: admin_params.percentage_algo_score_distribution,
                vote_token_address: admin_params.vote_token_address,
                subscription_time: admin_params.subscription_time,
            };

            self.admin_params.write(new_admin_params);
        }


        // Admin functions

        fn set_admin_nostr_pubkey(ref self: ContractState, admin_nostr_pubkey: NostrPublicKey, is_enable: bool) {
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), errors::ROLE_REQUIRED);
            let mut total_admin_nostr_pubkeys = self.total_admin_nostr_pubkeys.read();

            let is_admin_nostr_pubkey_added = self.is_admin_nostr_pubkey_added.read(admin_nostr_pubkey);
            if is_enable {
                if is_admin_nostr_pubkey_added {
                    return;
                }
                self.is_admin_nostr_pubkey_added.entry(admin_nostr_pubkey).write(true);
                self.all_admin_nostr_pubkeys.entry(total_admin_nostr_pubkeys).write(admin_nostr_pubkey);
                self.total_admin_nostr_pubkeys.write(total_admin_nostr_pubkeys + 1);
            } else {
                if !is_admin_nostr_pubkey_added {
                    self.total_admin_nostr_pubkeys.write(total_admin_nostr_pubkeys - 1);
                    return;
                }
                self.is_admin_nostr_pubkey_added.entry(admin_nostr_pubkey).write(false);
                self.all_admin_nostr_pubkeys.entry(total_admin_nostr_pubkeys).write(admin_nostr_pubkey);
            }
        }

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
            assert(main_token_address == 0.try_into().unwrap(), errors::MAIN_TOKEN_ADDRESS_ALREADY_SET);

            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
            self.nostr_to_sn.entry(request.public_key).write(profile_default.starknet_address);
            self.sn_to_nostr.entry(profile_default.starknet_address).write(request.public_key);
            self.is_nostr_address_added.entry(request.public_key).write(true);
            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: request.public_key,
                starknet_address,
                ai_score: 0,
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

        // Create a new DAO for this topic with the main token address
        // TODO:
        // Implement logic to create a new DAO for this topic with the main token address
        fn create_dao(ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>) {
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), errors::ADMIN_ROLE_REQUIRED);
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
        }


        // Init nostr profile
        fn init_nostr_profile(
            ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>,
        ) {
            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);

            // TODO assert if address is owner
            let caller = get_caller_address();
            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, caller)
                    || self.accesscontrol.has_role(OPERATOR_ROLE, caller),
                errors::ROLE_REQUIRED,
            );
            // assert(
            //     caller != self.owner.read() || caller != self.admin.read(),
            //     errors::INVALID_CALLER,
            // );
            let profile_default = request.content.clone();
            let starknet_address: ContractAddress = profile_default.starknet_address;

            assert!(starknet_address == get_caller_address(), "invalid caller");
            request.verify().expect('can\'t verify signature');
            self.nostr_pubkeys.entry(self.total_pubkeys.read()).write(request.public_key);
            self.total_pubkeys.write(self.total_pubkeys.read() + 1);

            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: request.public_key,
                starknet_address,
                ai_score: 0,
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

        // Init nostr profile
        fn add_nostr_profile_admin(ref self: ContractState, nostr_event_id: u256) {
            // TODO assert if address is owner
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            let caller = get_caller_address();

            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, caller)
                    || self.accesscontrol.has_role(OPERATOR_ROLE, caller),
                errors::ROLE_REQUIRED,
            );

            self.nostr_pubkeys.entry(self.total_pubkeys.read()).write(nostr_event_id);
            self.total_pubkeys.write(self.total_pubkeys.read() + 1);

            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: nostr_event_id,
                starknet_address: 0.try_into().unwrap(),
                ai_score: 0,
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


        // Getters
        fn get_tokens_address_accepted(
            self: @ContractState, token_address: ContractAddress,
        ) -> bool {
            self.tokens_address_accepted.read(token_address)
        }

        fn get_admin_params(self: @ContractState) -> NostrFiAdminStorage {
            self.admin_params.read()
        }

        fn get_is_pay_subscription(self: @ContractState) -> bool {
            self.admin_params.read().is_paid_storage_pubkey_profile
        }

        fn get_amount_paid_for_subscription(self: @ContractState) -> u256 {
            self.admin_params.read().amount_paid_for_subscription
        }

        fn get_token_to_pay_subscription(self: @ContractState) -> ContractAddress {
            self.admin_params.read().quote_token_address
        }

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
