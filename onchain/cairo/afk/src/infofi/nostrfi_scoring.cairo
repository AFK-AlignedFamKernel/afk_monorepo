#[starknet::contract]
pub mod NostrFiScoring {
    use afk::infofi::errors;
    use afk::interfaces::nostrfi_scoring_interfaces::{
        ADMIN_ROLE, CreateTokenProfile, DepositRewardsType, DistributionRewardsByUserEvent,
        INostrFiScoring, LinkedResult, LinkedStarknetAddress, LinkedStarknetAddressEncodeImpl,
        LinkedWalletProfileDefault, NostrAccountScoring, NostrFiAdminStorage, NostrPublicKey,
        OPERATOR_ROLE, ProfileAlgorithmScoring, ProfileVoteScoring, PushAlgoScoreEvent,
        PushAlgoScoreNostrNote, TipByUser, TokenLaunchType, TotalAlgoScoreRewards,
        TotalDepositRewards, TotalScoreRewards, Vote, VoteNostrNote, VoteParams, VoteProfile,
        VoteUserForProfile,
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
    use starknet::syscalls::{deploy_syscall, library_call_syscall};
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

    impl LinkedWalletDefault of Default<LinkedWalletProfileDefault> {
        #[inline(always)]
        fn default() -> LinkedWalletProfileDefault {
            LinkedWalletProfileDefault {
                starknet_address: 0.try_into().unwrap(), nostr_address: 0.try_into().unwrap(),
            }
        }
    }

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
        oracle_nostr_pubkey: u256, // Oracle Nostr pubkey for Scoring Algorithm data
        name: ByteArray,
        description: ByteArray,
        owner: ContractAddress,
        admin: ContractAddress,
        admin_params: NostrFiAdminStorage,
        percentage_algo_score_distribution: u256,
        // Duration
        epoch_duration: u64,
        batch_timestamp: u64,
        last_batch_timestamp: u64,
        end_epoch_time: u64,
        start_epoch_time: u64,
        new_epoch_duration: u64,
        // Rewards
        total_deposit_rewards: TotalDepositRewards,
        total_score_rewards: TotalScoreRewards,
        total_algo_score_rewards: TotalAlgoScoreRewards,
        // Epoch rewards
        deposit_rewards_per_start_epoch: Map<u64, TotalDepositRewards>,
        score_rewards_per_start_epoch: Map<u64, TotalScoreRewards>,
        algo_score_rewards_per_start_epoch: Map<u64, TotalAlgoScoreRewards>,
        // Users logic state
        total_tip_by_user: Map<u256, TipByUser>,
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
        nostr_account_scoring_algo: Map<u256, ProfileAlgorithmScoring>,
        nostr_vote_profile: Map<u256, VoteProfile>,
        old_nostr_account_scoring: Map<Map<ContractAddress, u256>, NostrAccountScoring>,
        old_nostr_vote_profile: Map<Map<ContractAddress, u256>, VoteProfile>,
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
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress, deployer: ContractAddress) {
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

        let now = get_block_timestamp();
        self.start_epoch_time.write(now);

        let end_epoch_time = now + EPOCH_DURATION_DEFAULT;
        self.end_epoch_time.write(end_epoch_time);

        self.percentage_algo_score_distribution.write(PERCENTAGE_ALGO_SCORE_DISTRIBUTION);

        self
            .admin_params
            .write(
                NostrFiAdminStorage {
                    quote_token_address: 0.try_into().unwrap(),
                    is_paid_storage_pubkey_profile: false,
                    is_paid_storage_event_id: false,
                    amount_paid_storage_pubkey_profile: 0,
                    amount_paid_storage_event_id: 0,
                    is_multi_token_vote: false,
                    amount_paid_for_subscription: 0,
                    percentage_algo_score_distribution: PERCENTAGE_ALGO_SCORE_DISTRIBUTION,
                    vote_token_address: 0.try_into().unwrap(),
                    subscription_time: 0,
                },
            );

        self
            .total_deposit_rewards
            .write(
                TotalDepositRewards {
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
                },
            );
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
            assert(now >= next_time, 'Epoch not ended');
        }

        fn _assert_epoch_is_ended(ref self: ContractState, end_epoch_time: u64) {
            let now = get_block_timestamp();
            assert(now >= end_epoch_time, 'Epoch not ended');
        }

        fn _check_epoch_is_ended(ref self: ContractState, end_epoch_time: u64) -> bool {
            let now = get_block_timestamp();
            now >= end_epoch_time
        }

        fn _check_epoch_next_time_started(ref self: ContractState) -> bool {
            let now = get_block_timestamp();
            let next_time = self.last_batch_timestamp.read() + self.epoch_duration.read();
            now >= next_time
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
            let nostr_to_sn = self.nostr_to_sn.read(vote_params.nostr_address);
            let old_tip_by_user = self.total_tip_by_user.read(vote_params.nostr_address);

            let mut reward_to_claim_by_user_because_not_linked = old_tip_by_user
                .reward_to_claim_by_user_because_not_linked;
            let mut new_reward_to_claim_by_user_because_not_linked =
                reward_to_claim_by_user_because_not_linked;

            let mut is_amount_to_send = false;
            if nostr_to_sn == 0.try_into().unwrap() {
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
                self
                    .emit(
                        TipToClaimByUserBecauseNotLinked {
                            nostr_address: vote_params.nostr_address,
                            amount_token: vote_params.amount_token,
                        },
                    );
            } else {
                // assert(nostr_to_sn != 0.try_into().unwrap(), 'Starknet address not linked');
                let erc20_token_address = self.main_token_address.read();
                assert(erc20_token_address != 0.try_into().unwrap(), 'Main token address not set');

                is_amount_to_send = true;
                let erc20 = IERC20Dispatcher { contract_address: erc20_token_address };

                if reward_to_claim_by_user_because_not_linked > 0 {
                    new_reward_to_claim_by_user_because_not_linked = 0;
                    erc20
                        .transfer_from(
                            get_caller_address(),
                            nostr_to_sn,
                            reward_to_claim_by_user_because_not_linked + vote_params.amount_token,
                        );
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

        // Distribution of rewards for one user
        // Algorithm + User vote tips
        // TODO:
        // Add end epoch check
        fn _distribute_rewards_by_user(
            ref self: ContractState, starknet_user_address: ContractAddress,
        ) {
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

            // Distribute tips rewards
            let tip_by_user = self.total_tip_by_user.read(nostr_address);

            // if !tip_by_user.is_claimed {
            //     // Distribute Topic tips
            //     let tip_by_user = self.total_tip_by_user.read(nostr_address);
            //     let tip_by_user_amount = tip_by_user.total_amount_deposit;
            //     let tip_by_user_amount_by_algo = tip_by_user.total_amount_deposit_by_algo;
            //     let tip_by_user_amount_rewards = tip_by_user.rewards_amount;

            //     // Distribute rewards by Algorithm scoring

            //     let update_tip_by_user = TipByUser {
            //         nostr_address,
            //         total_amount_deposit: tip_by_user_amount,
            //         total_amount_deposit_by_algo: tip_by_user_amount_by_algo,
            //         rewards_amount: tip_by_user_amount_rewards,
            //         is_claimed: true,
            //         end_epoch_time: tip_by_user.end_epoch_time,
            //         start_epoch_time: tip_by_user.start_epoch_time,
            //         epoch_duration: tip_by_user.epoch_duration,
            //         reward_to_claim_by_user_because_not_linked: tip_by_user
            //             .reward_to_claim_by_user_because_not_linked,
            //         is_claimed_tip_by_user_because_not_linked: tip_by_user
            //             .is_claimed_tip_by_user_because_not_linked,
            //     };
            //     self.total_tip_by_user.entry(nostr_address).write(update_tip_by_user);
            // }

            // Verify the epoch params

            let old_total_deposit_rewards = self.total_deposit_rewards.read();
            let end_epoch_time = old_total_deposit_rewards.end_epoch_time;

            let mut new_epoch_duration = old_total_deposit_rewards.epoch_duration;
            let mut new_start_epoch_time = old_total_deposit_rewards.start_epoch_time;
            // let mut new_end_epoch_time = old_total_deposit_rewards.end_epoch_time;
            // if now >= end_epoch_time { // TODO: add event to the contract
            // } else {
            //     new_start_epoch_time = now;
            //     self.last_batch_timestamp.write(now);
            //     self.end_epoch_time.write(now + new_epoch_duration);
            //     self.last_batch_timestamp.write(now);
            // }

            // TODO:

            // General rewards distribution
            // Admins params percentage between user and algo

            let total_algo_score_rewards = self.total_algo_score_rewards.read();
            let profile_scoring_by_algo = self.nostr_account_scoring_algo.read(nostr_address);

            // Start distribution by algo
            let total_score_rewards = self.total_score_rewards.read();

            let total_score_vote = total_score_rewards.total_score_vote;
            let total_algo_score_rewards = self.total_algo_score_rewards.read();

            let percentage_distribution_algo = self
                .admin_params
                .read()
                .percentage_algo_score_distribution;

            let total_deposit_rewards = self.total_deposit_rewards.read();

            let total_amount_deposit = total_deposit_rewards.total_amount_deposit;
            let erc20_token_address = self.admin_params.read().quote_token_address;
            let erc20 = IERC20Dispatcher { contract_address: erc20_token_address };
            let balance_contract = erc20.balance_of(get_contract_address());

            let total_amount_to_claim_share = total_amount_deposit
                * percentage_distribution_algo
                / BPS;
            let total_amount_to_claim = total_deposit_rewards.total_amount_to_claim;

            let amount_for_algo = total_amount_deposit * percentage_distribution_algo / BPS;

            let total_ai_score = total_algo_score_rewards.total_score_ai;

            let data_algo_score = self.nostr_account_scoring_algo.read(nostr_address);
            let my_ai_score = data_algo_score.ai_score;

            // V2 weight
            let my_vote_score = data_algo_score.overview_score;
            let my_vote_score = data_algo_score.skills_score;
            let my_vote_score = data_algo_score.value_shared_score;

            // User share by Algo score
            // V2 create weight and equations based on several parameters of the algorith scoring
            let mut user_share_algo = my_ai_score * amount_for_algo / total_ai_score;

            if user_share_algo > balance_contract {
                user_share_algo = balance_contract;
            }

            if user_share_algo > total_amount_to_claim {
                user_share_algo = total_amount_to_claim;
            }

            // Distribute Topic User vote tips

            // Distribute general rewards send to vault
            let total_deposit_rewards = self.total_deposit_rewards.read();
            let profile_vote_scoring_by_user = self.nostr_vote_profile.read(nostr_address);

            // Calculate rewards by user
            // Depends on User tips + Weight + Vote
            // Distribute rewards by User vote tips
            // V2: add weight for user vote tips
            // Whitelisted OG for topics and moderators
            // DAO whitelisted
            // Algo whitelist based on Algo score
            let remaining_percentage_distribution_user = BPS - percentage_distribution_algo;

            let profile_scoring_by_user = self.nostr_account_scoring.read(nostr_address);

            let tip_by_user = self.total_tip_by_user.read(nostr_address);

            let mut total_user_share_vote = total_amount_deposit
                * remaining_percentage_distribution_user
                / BPS;

            let my_vote_score = total_score_vote * percentage_distribution_algo / BPS;
            let my_vote_score = total_score_vote * percentage_distribution_algo / BPS;
            let mut user_share_vote = my_vote_score * total_user_share_vote / total_score_vote;

            let mut veracity_score = 0;

            let tip_by_user_amount = tip_by_user.total_amount_deposit;
            let tip_by_user_amount_rewards = tip_by_user.rewards_amount;

            if user_share_vote > balance_contract {
                user_share_vote = balance_contract;
            }

            if user_share_vote > total_amount_to_claim {
                user_share_vote = total_amount_to_claim;
            }

            // Update all state
            let update_total_deposit_rewards = TotalDepositRewards {
                epoch_duration: total_deposit_rewards.epoch_duration,
                start_epoch_time: total_deposit_rewards.start_epoch_time,
                end_epoch_time: total_deposit_rewards.end_epoch_time,
                general_total_amount_deposit: total_deposit_rewards.general_total_amount_deposit,
                total_amount_deposit: total_deposit_rewards.total_amount_deposit,
                user_total_amount_deposit: total_deposit_rewards.user_total_amount_deposit,
                algo_total_amount_deposit: total_deposit_rewards.algo_total_amount_deposit,
                rewards_amount: total_deposit_rewards.rewards_amount,
                is_claimed: total_deposit_rewards.is_claimed,
                total_amount_to_claim: total_amount_to_claim - user_share_algo - user_share_vote,
            };

            self.total_deposit_rewards.write(update_total_deposit_rewards);

            // let old_nostr_account_scoring = self.nostr_account_scoring.read(nostr_address);
            // let old_nostr_vote_profile = self.nostr_vote_profile.read(nostr_address);

            // self.old_nostr_account_scoring.entry(nostr_address).write(old_nostr_account_scoring);
            // self.old_nostr_vote_profile.entry(nostr_address).write(old_nostr_vote_profile);

            let updated_profile_algorithm_scoring = ProfileAlgorithmScoring {
                nostr_address: 0.try_into().unwrap(),
                starknet_address: 0.try_into().unwrap(),
                ai_score: profile_scoring_by_user.ai_score,
                overview_score: profile_scoring_by_algo.overview_score,
                skills_score: profile_scoring_by_algo.skills_score,
                value_shared_score: profile_scoring_by_algo.value_shared_score,
                is_claimed: false,
                ai_score_to_claimed: 0,
                overview_score_to_claimed: 0,
                skills_score_to_claimed: 0,
                value_shared_score_to_claimed: 0,
                total_score: 0,
                veracity_score: 0,
            };
            // Reinit vote per batch
            let profile_vote_scoring = ProfileVoteScoring {
                nostr_address: 0.try_into().unwrap(),
                starknet_address: 0.try_into().unwrap(),
                upvote_amount: 0,
                downvote_amount: 0,
                rewards_amount: 0,
                unique_address: 0,
            };

            // External call

            // Transfer token user share by algo and user vote

            erc20.transfer(starknet_user_address, user_share_algo);

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
                token_launch_type: TokenLaunchType::Fairlaunch,
            };
            self.nostr_account_scoring.entry(request.public_key).write(nostr_account_scoring);

            let now = get_block_timestamp();
            let tip_by_user = TipByUser {
                nostr_address: request.public_key,
                total_amount_deposit: 0,
                total_amount_deposit_by_algo: 0,
                rewards_amount: 0,
                is_claimed: false,
                end_epoch_time: self.end_epoch_time.read(),
                start_epoch_time: now,
                epoch_duration: self.epoch_duration.read(),
                is_claimed_tip_by_user_because_not_linked: false,
                reward_to_claim_by_user_because_not_linked: 0,
            };

            self.total_tip_by_user.entry(request.public_key).write(tip_by_user);
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
                        total_amount_deposit: amount,
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

            self.total_deposit_rewards.write(total_deposit_rewards);
        }


        // Distribution of rewards for one user
        // Not needed to be the caller: auto distribution by automation
        // Algorithm + User vote tips
        // TODO:
        // Add end epoch check
        fn distribute_rewards_by_user(
            ref self: ContractState, starknet_user_address: ContractAddress,
        ) {
            let caller = get_caller_address();
            self._distribute_rewards_by_user(caller);
        }


        fn claim_and_distribute_my_rewards(ref self: ContractState) {
            let caller = get_caller_address();

            self._distribute_rewards_by_user(caller);
        }

        // Operator and admin functions

        // Algorithm profil scoring
        // Nostr oracle admin to fetch the event offchain after the calculation
        // LLM + ML + Algorithm scripts for scoring
        fn push_profile_score_algo(
            ref self: ContractState,
            request: SocialRequest<PushAlgoScoreNostrNote>,
            score_algo: ProfileAlgorithmScoring,
        ) {
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), 'Role required');

            // Verify if the token address is set
            // V2 let change users main address or add multi token vault
            assert(
                self.main_token_address.read() != 0.try_into().unwrap(),
                'Main token address not set',
            );

            // self.nostr_nostrfi_scoring.linked_nostr_profile(request);
            let profile_default = request.content.clone();
            let nostr_address: NostrPublicKey = profile_default.nostr_address;
            let sn_address_linked = self.nostr_to_sn.read(nostr_address);

            let admin_nostr_pubkey = self.admin_nostr_pubkey.read();
            // Verify signature Nostr oracle admin
            assert(request.public_key == admin_nostr_pubkey, 'Invalid pubkey');
            //
            request.verify().expect('can\'t verify signature');

            let now = get_block_timestamp();

            // Update nostr account scoring by algo
            let mut algo_nostr_account_scoring = self
                .nostr_account_scoring_algo
                .read(nostr_address);
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
            self.nostr_account_scoring_algo.entry(nostr_address).write(algo_nostr_account_scoring);

            self.last_timestamp_oracle_score_by_user.entry(nostr_address).write(now);

            // Update total algo score stats
            let total_algo_score_rewards = self.total_algo_score_rewards.read();
            let total_score_rewards = self.total_score_rewards.read();

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
                veracity_score: 0,
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
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), 'Role required');
            self.last_batch_timestamp.write(next_epoch);
        }

        fn set_admin_params(ref self: ContractState, admin_params: NostrFiAdminStorage) {
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), 'Role required');
            let mut old_admin_params = self.admin_params.read();

            let new_admin_params = NostrFiAdminStorage {
                quote_token_address: old_admin_params.quote_token_address,
                is_paid_storage_pubkey_profile: old_admin_params.is_paid_storage_pubkey_profile,
                is_paid_storage_event_id: old_admin_params.is_paid_storage_event_id,
                amount_paid_storage_pubkey_profile: old_admin_params
                    .amount_paid_storage_pubkey_profile,
                amount_paid_storage_event_id: old_admin_params.amount_paid_storage_event_id,
                is_multi_token_vote: old_admin_params.is_multi_token_vote,
                amount_paid_for_subscription: old_admin_params.amount_paid_for_subscription,
                percentage_algo_score_distribution: admin_params.percentage_algo_score_distribution,
                vote_token_address: old_admin_params.vote_token_address,
                subscription_time: old_admin_params.subscription_time,
            };

            self.admin_params.write(new_admin_params);
        }


        // Admin functions

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
                'Role required',
            );
            let mut main_token_address = self.main_token_address.read();

            // Verify if the token address is set
            // V2 let change users main address or add multi token vault
            assert(main_token_address == 0.try_into().unwrap(), 'Main token address already set');

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
                token_launch_type: token_type.clone(),
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
            assert(self.accesscontrol.has_role(ADMIN_ROLE, get_caller_address()), 'Role required');
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
                'Role required',
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

        // Init nostr profile
        fn add_nostr_profile_admin(ref self: ContractState, nostr_event_id: u256) {
            // TODO assert if address is owner
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            let caller = get_caller_address();

            assert(
                self.accesscontrol.has_role(ADMIN_ROLE, caller)
                    || self.accesscontrol.has_role(OPERATOR_ROLE, caller),
                'Role required',
            );

            self.nostr_pubkeys.entry(self.total_pubkeys.read()).write(nostr_event_id);
            self.total_pubkeys.write(self.total_pubkeys.read() + 1);

            let nostr_account_scoring = NostrAccountScoring {
                nostr_address: nostr_event_id,
                starknet_address: 0.try_into().unwrap(),
                ai_score: 0,
                token_launch_type: TokenLaunchType::Fairlaunch,
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
// #[cfg(test)]
// mod tests {
//     use afk::bip340::SchnorrSignature;
//     use afk::interfaces::nostrfi_scoring_interfaces::{
//         INostrFiScoring, INostrFiScoringDispatcher, INostrFiScoringDispatcherTrait, LinkedResult,
//         LinkedStarknetAddress, NostrPublicKey,
//     };
//     use afk::social::request::SocialRequest;
//     // use core::array::SpanTrait;
//     // use core::traits::Into;
//     use snforge_std::{
//         ContractClass, ContractClassTrait, DeclareResultTrait, declare,
//         start_cheat_caller_address, start_cheat_caller_address_global,
//         stop_cheat_caller_address_global,
//     };
//     use starknet::ContractAddress;

//     fn declare_nostrfi_scoring() -> ContractClass {
//         // declare("nostrfi_scoring").unwrap().contract_class()
//         *declare("NostrFiScoring").unwrap().contract_class()
//     }

//     fn deploy_nostrfi_scoring(class: ContractClass) -> INostrFiScoringDispatcher {
//         let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
//         let mut calldata = array![];
//         ADMIN_ADDRESS.serialize(ref calldata);
//         let (contract_address, _) = class.deploy(@calldata).unwrap();

//         INostrFiScoringDispatcher { contract_address }
//     }

//     fn request_fixture_custom_classes(
//         nostrfi_scoring_class: ContractClass,
//     ) -> (
//         SocialRequest<LinkedStarknetAddress>,
//         NostrPublicKey,
//         ContractAddress,
//         INostrFiScoringDispatcher,
//         SocialRequest<LinkedStarknetAddress>,
//     ) {
//         // recipient private key:
//         59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35 // just for testing, do
//         not use for anything else // let recipient_public_key =
//         //     0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

//         let recipient_public_key =
//             0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

//         let sender_address: ContractAddress = 123.try_into().unwrap();

//         let nostrfi_scoring = deploy_nostrfi_scoring(nostrfi_scoring_class);

//         let recipient_address_user: ContractAddress = 678.try_into().unwrap();

//         // TODO change with the correct signature with the content LinkedWalletProfileDefault id
//         and // strk recipient TODO Uint256 to felt on Starknet js
//         // for test data see claim to:
//         // https://replit.com/@msghais135/WanIndolentKilobyte-claimto#linked_to.js

//         let linked_wallet = LinkedStarknetAddress {
//             starknet_address: sender_address.try_into().unwrap(),
//         };

//         // @TODO format the content and get the correct signature
//         let request_linked_wallet_to = SocialRequest {
//             public_key: recipient_public_key,
//             created_at: 1716285235_u64,
//             kind: 1_u16,
//             tags: "[]",
//             content: linked_wallet.clone(),
//             sig: SchnorrSignature {
//                 r: 0x4e04216ca171673375916f12e1a56e00dca1d39e44207829d659d06f3a972d6f_u256,
//                 s: 0xa16bc69fab00104564b9dad050a29af4d2380c229de984e49ad125fe29b5be8e_u256,
//                 // r: 0x051b6d408b709d29b6ef55b1aa74d31a9a265c25b0b91c2502108b67b29c0d5c_u256,
//             // s: 0xe31f5691af0e950eb8697fdbbd464ba725b2aaf7e5885c4eaa30a1e528269793_u256
//             },
//         };

//         let linked_wallet_not_caller = LinkedStarknetAddress {
//             starknet_address: recipient_address_user.try_into().unwrap(),
//         };

//         // @TODO format the content and get the correct signature
//         let fail_request_linked_wallet_to_caller = SocialRequest {
//             public_key: recipient_public_key,
//             created_at: 1716285235_u64,
//             kind: 1_u16,
//             tags: "[]",
//             content: linked_wallet_not_caller.clone(),
//             sig: SchnorrSignature {
//                 r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
//                 s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
//             },
//         };

//         (
//             request_linked_wallet_to,
//             recipient_public_key,
//             sender_address,
//             nostrfi_scoring,
//             fail_request_linked_wallet_to_caller,
//         )
//     }

//     fn request_fixture() -> (
//         SocialRequest<LinkedStarknetAddress>,
//         NostrPublicKey,
//         ContractAddress,
//         INostrFiScoringDispatcher,
//         SocialRequest<LinkedStarknetAddress>,
//     ) {
//         let nostrfi_scoring_class = declare_nostrfi_scoring();
//         request_fixture_custom_classes(nostrfi_scoring_class)
//     }

//     #[test]
//     fn linked_wallet_to() {
//         let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _) =
//         request_fixture();
//         start_cheat_caller_address_global(sender_address);
//         start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
//         nostrfi_scoring.linked_nostr_profile(request);

//         let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(recipient_nostr_key);
//         assert!(nostr_linked == sender_address, "nostr not linked");
//     }

//     #[test]
//     #[should_panic()]
//     fn link_incorrect_signature() {
//         let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to_caller) =
//             request_fixture();
//         stop_cheat_caller_address_global();
//         start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);

//         let request_test_failed_sig = SocialRequest {
//             sig: SchnorrSignature {
//                 r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
//                 s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966606f_u256,
//             },
//             ..fail_request_linked_wallet_to_caller,
//         };
//         nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
//     }

//     #[test]
//     #[should_panic()]
//     fn link_incorrect_signature_link_to() {
//         let (request, _, sender_address, nostrfi_scoring, _) = request_fixture();
//         start_cheat_caller_address_global(sender_address);
//         stop_cheat_caller_address_global();
//         start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
//         let request_test_failed_sig = SocialRequest {
//             sig: SchnorrSignature {
//                 r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
//                 s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
//             },
//             ..request,
//         };

//         nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
//     }

//     #[test]
//     #[should_panic()]
//     // #[should_panic(expected: ' invalid caller ')]
//     fn link_incorrect_caller_link_to() {
//         let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to) =
//             request_fixture();
//         start_cheat_caller_address_global(sender_address);
//         stop_cheat_caller_address_global();
//         start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
//         nostrfi_scoring.linked_nostr_profile(fail_request_linked_wallet_to);
//     }
// }


