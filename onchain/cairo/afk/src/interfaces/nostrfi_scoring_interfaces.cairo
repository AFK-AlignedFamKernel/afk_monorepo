use afk::social::request::{ConvertToBytes, Encode, SocialRequest, SocialRequestImpl};
use starknet::storage::{Map, Vec};
use starknet::{ClassHash, ContractAddress};
// Add this ROLE on a constants file
pub const OPERATOR_ROLE: felt252 = selector!("OPERATOR_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
pub const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
pub type NostrPublicKey = u256;
pub type AddressId = felt252;
pub const DEFAULT_BATCH_INTERVAL_WEEK: u64 = 60 * 60 * 24 * 7; // 1 week, can be adjusted.
use afk::interfaces::common_interfaces::{LinkedStarknetAddress, LinkedStarknetAddressImpl};
#[starknet::interface]
pub trait INostrFiScoring<TContractState> {
    // Admin
    fn set_control_role(
        ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool,
    );

    // fn init_nostr_profile(ref self: TContractState, request:
    // SocialRequest<LinkedStarknetAddress>);
    // fn add_nostr_profile_admin(ref self: TContractState, nostr_event_id: u256);
    fn push_profile_score_algo(
        ref self: TContractState,
        request: SocialRequest<PushAlgoScoreNostrNote>,
        score_algo: ProfileAlgorithmScoring,
    );

    fn set_change_batch_interval(ref self: TContractState, epoch_duration: u64);
    fn set_admin_nostr_pubkey(
        ref self: TContractState, admin_nostr_pubkey: NostrPublicKey, is_enable: bool,
    );
    fn set_admin_params(ref self: TContractState, admin_params: NostrFiAdminStorage);
    fn set_external_contracts(ref self: TContractState, external_contracts: ExternalContracts);
    // fn create_dao(ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>);

    // Users functions
    fn linked_nostr_profile(
        ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>,
    );

    // fn create_token_topic_reward_and_vote(
    //     ref self: TContractState,
    //     request: SocialRequest<LinkedStarknetAddress>,
    //     token_type: TokenLaunchType,
    //     is_create_staking_vault: bool,
    //     is_create_dao: bool,
    // );

    // Deposit, Voting and tips
    fn deposit_rewards(
        ref self: TContractState, amount: u256, deposit_rewards_type: DepositRewardsType,
    );
    fn vote_token_profile(ref self: TContractState, request: SocialRequest<VoteNostrNote>);
    fn vote_nostr_profile_starknet_only(ref self: TContractState, vote_params: VoteParams);

    // Distribution of rewards
    fn distribute_rewards_by_user(
        ref self: TContractState, starknet_user_address: ContractAddress, epoch_index: u64,
    );
    fn claim_and_distribute_my_rewards(ref self: TContractState, epoch_index: u64);

    // Getters
    fn get_admin_params(self: @TContractState) -> NostrFiAdminStorage;

    fn get_nostr_by_sn_default(
        self: @TContractState, nostr_public_key: NostrPublicKey,
    ) -> ContractAddress;

    fn get_sn_by_nostr_default(
        self: @TContractState, starknet_address: ContractAddress,
    ) -> NostrPublicKey;


    fn add_metadata(ref self: TContractState, metadata: NostrMetadata);
    fn add_topics_metadata(
        ref self: TContractState,
        keywords: ByteArray,
        main_topic: ByteArray // topics_per_order:Map<u64,ByteArray>,
    );
    // fn get_metadata(ref self: TContractState) -> NostrMetadata;
// fn get_topics_metadata(ref self: TContractState) -> TopicsMetadata;
// fn get_is_pay_subscription(self: @TContractState) -> bool;
// fn get_amount_paid_for_subscription(self: @TContractState) -> u256;
// fn get_token_to_pay_subscription(self: @TContractState) -> ContractAddress;
}

#[starknet::interface]
pub trait INostrVaultEscrow<TContractState> {
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

    fn set_admin_nostr_pubkey(
        ref self: TContractState, admin_nostr_pubkey: NostrPublicKey, is_enable: bool,
    );

    // Deposit, Voting and tips
    fn deposit_rewards(
        ref self: TContractState, amount: u256, deposit_rewards_type: DepositRewardsType,
    );
    fn vote_token_profile(ref self: TContractState, request: SocialRequest<VoteNostrNote>);
    fn vote_nostr_profile_starknet_only(ref self: TContractState, vote_params: VoteParams);

    // Distribution of rewards
    fn distribute_rewards_by_user(
        ref self: TContractState, starknet_user_address: ContractAddress, epoch_index: u64,
    );
    fn claim_and_distribute_my_rewards(ref self: TContractState, epoch_index: u64);
}

// Enums

#[derive(Copy, Debug, Drop, Serde)]
pub enum LinkedResult {
    Transfer: ContractAddress,
    // LinkedStarknetAddress: LinkedStarknetAddress
}


#[derive(Copy, Debug, Drop, Serde, starknet::Store, PartialEq)]
pub enum Vote {
    Good,
    Bad,
}

#[derive(Copy, Debug, Drop, Serde, starknet::Store)]
pub enum BenefitFromUser {
    Learn,
    Knowledge,
    Experience,
    Fun,
}

#[derive(Copy, Debug, Drop, Serde, starknet::Store)]
pub enum TokenLaunchType {
    Later,
    Fairlaunch,
    // PrivateSale,
// PublicSale,
// ICO,
// DutchAuction,
}

#[derive(Clone, Debug, Drop, Serde)]
pub enum DepositRewardsType {
    General,
    // V2 users can select the type of rewards they want to deposit
// User,
// Algo,
}


// Structs

#[derive(Clone, Debug, Drop, Serde, starknet::Store)]
pub struct ExternalContracts {
    pub token_address: ContractAddress,
    pub namespace_address: ContractAddress,
    pub main_token_address: ContractAddress,
    pub fairlaunch_address: ContractAddress,
    pub class_hash_memecoin: ClassHash,
    pub vault_staking_class_hash: ClassHash,
    pub dao_class_hash: ClassHash,
}

#[derive(Clone, Debug, Drop, Serde)]
pub struct PushAlgoScoreNostrNote {
    pub nostr_address: NostrPublicKey,
    // pub nostr_address: felt252,
// pub starknet_address: ContractAddress,
}

// TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr content

pub impl PushAlgoScoreNostrNoteEncodeImpl of Encode<PushAlgoScoreNostrNote> {
    fn encode(self: @PushAlgoScoreNostrNote) -> @ByteArray {
        // let recipient_address_user_felt: felt252 = self
        //     .starknet_address
        //     .clone()
        //     .try_into()
        //     .unwrap();
        // println!("try get nostr_address_felt");
        // let nostr_address_felt: felt252 = self.nostr_address.clone().try_into().unwrap();

        // println!("nostr_address_felt {:?}", nostr_address_felt);
        @format!("score nostr profile {}", self.nostr_address.clone())
    }
}


impl PushAlgoScoreNostrNoteImpl of ConvertToBytes<PushAlgoScoreNostrNote> {
    fn convert_to_bytes(self: @PushAlgoScoreNostrNote) -> ByteArray {
        let mut ba: ByteArray = "";
        let nostr_address: felt252 = self.nostr_address.clone().try_into().unwrap();
        ba.append_word(nostr_address, 1_u32);
        ba
    }
}


#[derive(Clone, Debug, Drop, Serde)]
pub struct VoteNostrNote {
    pub nostr_address: NostrPublicKey,
    pub starknet_address: ContractAddress,
    pub vote: Vote,
    pub is_upvote: bool,
    pub upvote_amount: u256,
    pub downvote_amount: u256,
    pub amount_token: u256,
    pub amount: u256,
}


impl VoteNostrNoteDefault of Default<VoteNostrNote> {
    #[inline(always)]
    fn default() -> VoteNostrNote {
        VoteNostrNote {
            nostr_address: 0.try_into().unwrap(),
            starknet_address: 0.try_into().unwrap(),
            vote: Vote::Good,
            is_upvote: true,
            upvote_amount: 0,
            downvote_amount: 0,
            amount_token: 0,
            amount: 0,
        }
    }
}


// TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr content
pub impl VoteNostrNoteEncodeImpl of Encode<VoteNostrNote> {
    fn encode(self: @VoteNostrNote) -> @ByteArray {
        // let recipient_address_user_felt: felt252 = self
        //     .starknet_address
        //     .clone()
        //     .try_into()
        //     .unwrap();

        // let nostr_address_felt: felt252 = self.nostr_address.clone().try_into().unwrap();
        @format!(
            "vote to {:?} {:?} {:?}",
            self.nostr_address,
            self.is_upvote,
            self.amount_token // self.amount,
        )
        // @format!(
    //     "vote to {:?}, {:?} {:?} {:?}",
    //     self.nostr_address,
    //     self.vote,
    //     self.is_upvote,
    //     self.amount_token,
    //     // self.amount,
    // )
    // @format!(
    //     "vote to {:?}, {:?} {:?} {:?}",
    //     nostr_address_felt,
    //     self.vote,
    //     self.is_upvote,
    //     self.amount_token,
    //     // self.amount,
    // )
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


// Events

#[derive(Copy, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct DepositRewardsByUserEvent {
    #[key]
    pub starknet_address: ContractAddress,
    pub epoch_index: u64,
    pub amount_token: u256,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct DistributionRewardsByUserEvent {
    #[key]
    pub starknet_address: ContractAddress,
    #[key]
    pub nostr_address: NostrPublicKey,
    pub current_index_epoch: u64,
    pub claimed_at: u64,
    pub amount_algo: u256,
    pub amount_vote: u256,
    pub amount_total: u256,
    // pub veracity_score: u256,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct PushAlgoScoreEvent {
    #[key]
    pub starknet_address: ContractAddress,
    #[key]
    pub nostr_address: NostrPublicKey,
    pub claimed_at: u64,
    pub total_score_ai: u256,
    pub total_nostr_address: u256,
    pub total_points_weight: u256,
    pub is_claimed: bool,
    pub current_index_epoch: u64,
    // Optional
// pub veracity_score: u256,

    // pub total_score_overview: u256,
// pub total_score_skills: u256,
// pub total_score_value_shared: u256,
// pub rewards_amount: u256,

    // Add NIP-05 and stats profil after. Gonna write a proposal for it
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct NewEpochEvent {
    #[key]
    pub old_epoch_index: u64,
    #[key]
    pub current_index_epoch: u64,
    pub start_duration: u64,
    pub end_duration: u64,
    pub epoch_duration: u64,
}

#[derive(Drop, starknet::Event)]
pub struct AdminAddNostrProfile {
    #[key]
    pub nostr_address: NostrPublicKey,
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct TipUserWithVote {
    #[key]
    pub nostr_address: NostrPublicKey,
    #[key]
    pub starknet_address: ContractAddress,
    pub current_index_epoch: u64,
    pub amount_token: u256,
    pub amount_vote: u256,
    pub nostr_event_id: NostrPublicKey,
}

pub impl TipUserWithVoteDefault of Default<TipUserWithVote> {
    #[inline(always)]
    fn default() -> TipUserWithVote {
        TipUserWithVote {
            nostr_address: 0.try_into().unwrap(),
            starknet_address: 0.try_into().unwrap(),
            amount_token: 0,
            amount_vote: 0,
            current_index_epoch: 0,
            nostr_event_id: 0.try_into().unwrap(),
        }
    }
}


// Storage structs

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct LinkedWalletProfileDefault {
    pub nostr_address: NostrPublicKey,
    pub starknet_address: ContractAddress,
    // Add NIP-05 and stats profil after. Gonna write a proposal for it
}


impl LinkedWalletDefault of Default<LinkedWalletProfileDefault> {
    #[inline(always)]
    fn default() -> LinkedWalletProfileDefault {
        LinkedWalletProfileDefault {
            starknet_address: 0.try_into().unwrap(), nostr_address: 0.try_into().unwrap(),
        }
    }
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct LinkedThisNostrNote {
    pub nostr_address: NostrPublicKey,
    pub nostr_event_id: NostrPublicKey,
    pub starknet_address: ContractAddress,
}


#[derive(Clone, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct NostrMetadata {
    pub nostr_address: NostrPublicKey,
    pub name: ByteArray,
    pub about: ByteArray,
    pub event_id_nip_72: u256,
    pub event_id_nip_29: u256,
    pub main_tag: ByteArray,
    // pub about: ByteArray,
// pub picture: ByteArray,
// pub nip05: ByteArray,
// pub lud06: ByteArray,
// pub lud16: ByteArray,
// pub topics: Vec<ByteArray>,
}

#[derive(Clone, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct NostrMetadataEvent {
    #[key]
    pub nostr_address: NostrPublicKey,
    pub main_tag: ByteArray,
    pub about: ByteArray,
    pub event_id_nip_72: u256,
    pub event_id_nip_29: u256,
}

#[derive(Clone, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct AddTopicsMetadataEvent {
    #[key]
    pub current_index_keywords: u64,
    pub keywords: ByteArray,
    pub main_topic: ByteArray,
}


#[derive(Clone, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct NostrMetadataTopics {
    pub nostr_address: NostrPublicKey,
    pub name: ByteArray,
    pub about: ByteArray,
    pub picture: ByteArray,
    pub nip05: ByteArray,
    pub lud06: ByteArray,
    pub lud16: ByteArray,
    pub main_tag: ByteArray,
    pub main_keyword: ByteArray,
    // pub topics: Vec<ByteArray>,
}

#[derive(Clone, Debug, Drop, PartialEq, starknet::Event, Serde)]
pub struct TopicsMetadataParams {
    pub topics_per_order: Span<ByteArray>, // Map Voter => (UserVote, power)
    pub main_topic: ByteArray,
    pub topics_list: Span<ByteArray>,
    pub keywords: Span<ByteArray>,
}

#[starknet::storage_node]
pub struct TopicsMetadata {
    pub topics_per_order: Map<u64, ByteArray>, // Map Voter => (UserVote, power)
    pub main_topic: ByteArray,
    pub topics_list: Vec<ByteArray>,
    pub keywords: Vec<ByteArray>,
}

// #[derive(  starknet::Event, Serde)]
// pub struct TopicsMetadataEvent {
//     #[key]
//     pub starknet_address: ContractAddress,
//     #[key]
//     pub nostr_address: NostrPublicKey,
//     pub topics_per_order: Map<u64, ByteArray>, // Map Voter => (UserVote, power)
//     pub main_topic:ByteArray,
//     pub topics_list:Vec<ByteArray>,
//     pub keywords:Vec<ByteArray>,
// }

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct NostrFiAdminStorage {
    pub quote_token_address: ContractAddress,
    pub is_paid_storage_pubkey_profile: bool,
    pub is_paid_storage_event_id: bool,
    pub amount_paid_storage_pubkey_profile: u256,
    pub amount_paid_storage_event_id: u256,
    pub is_multi_token_vote: bool,
    pub amount_paid_for_subscription: u256,
    pub vote_token_address: ContractAddress,
    pub subscription_time: u64,
    pub percentage_algo_score_distribution: u256,
    pub epoch_duration: u64,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct VoteParams {
    pub nostr_address: NostrPublicKey,
    pub vote: Vote,
    pub is_upvote: bool,
    pub upvote_amount: u256,
    pub downvote_amount: u256,
    pub amount: u256,
    pub amount_token: u256,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalTipByUserVote {
    pub nostr_address: u256,
    pub total_amount_tips: u256,
    pub total_to_claim_because_not_linked: u256,
    pub rewards_amount: u256,
    pub end_epoch_time: u64,
    pub start_epoch_time: u64,
    pub epoch_duration: u64,
    pub total_vote_amount: u256,
    pub total_points: u256,
    pub total_points_weight: u256,
}

pub impl TotalTipByUserVoteDefault of Default<TotalTipByUserVote> {
    #[inline(always)]
    fn default() -> TotalTipByUserVote {
        TotalTipByUserVote {
            nostr_address: 0.try_into().unwrap(),
            total_amount_tips: 0,
            total_to_claim_because_not_linked: 0,
            rewards_amount: 0,
            end_epoch_time: 0,
            start_epoch_time: 0,
            epoch_duration: 0,
            total_vote_amount: 0,
            total_points: 0,
            total_points_weight: 0,
        }
    }
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TipByUser {
    pub nostr_address: u256,
    pub total_amount_deposit: u256,
    // pub total_amount_deposit_by_algo: u256,
    // pub rewards_amount: u256,
    pub is_claimed: bool,
    pub end_epoch_time: u64,
    pub start_epoch_time: u64,
    pub epoch_duration: u64,
    pub reward_to_claim_by_user_because_not_linked: u256,
    pub is_claimed_tip_by_user_because_not_linked: bool,
}

pub impl TipByUserDefault of Default<TipByUser> {
    #[inline(always)]
    fn default() -> TipByUser {
        TipByUser {
            nostr_address: 0.try_into().unwrap(),
            total_amount_deposit: 0,
            // total_amount_deposit_by_algo: 0,
            // rewards_amount: 0,
            is_claimed: false,
            end_epoch_time: 0,
            start_epoch_time: 0,
            epoch_duration: 0,
            reward_to_claim_by_user_because_not_linked: 0,
            is_claimed_tip_by_user_because_not_linked: false,
        }
    }
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct OverviewTotalContractState {
    pub epoch_duration: u64,
    pub start_epoch_time: u64,
    pub end_epoch_time: u64,
    pub general_total_amount_deposit: u256, // V2
    pub total_amount_deposit: u256,
    pub user_total_amount_deposit: u256,
    pub algo_total_amount_deposit: u256,
    pub rewards_amount: u256,
    pub total_amount_to_claim: u256,
    pub total_amount_claimed: u256,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalDepositRewards {
    pub epoch_duration: u64,
    pub start_epoch_time: u64,
    pub end_epoch_time: u64,
    pub general_total_amount_deposit: u256, // V2
    pub total_amount_deposit: u256,
    // pub user_total_amount_deposit: u256,
    // pub algo_total_amount_deposit: u256,
    // pub rewards_amount: u256,
    pub is_claimed: bool,
    pub total_amount_to_claim: u256,
}


pub impl TotalDepositRewardsDefault of Default<TotalDepositRewards> {
    #[inline(always)]
    fn default() -> TotalDepositRewards {
        TotalDepositRewards {
            epoch_duration: 0,
            start_epoch_time: 0,
            end_epoch_time: 0,
            general_total_amount_deposit: 0,
            total_amount_deposit: 0,
            is_claimed: false,
            total_amount_to_claim: 0,
            // user_total_amount_deposit: 0,
        // algo_total_amount_deposit: 0,
        // rewards_amount: 0,
        }
    }
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalScoreRewards {
    pub start_epoch_time: u64,
    pub epoch_duration: u64,
    pub end_epoch_time: u64,
    pub total_score_ai: u256,
    pub total_score_vote: u256,
    pub total_tips_amount_token_vote: u256,
    pub total_nostr_address: u256,
    pub rewards_amount: u256,
    pub total_points_weight: u256,
    pub is_claimed: bool,
}


pub impl TotalScoreRewardsDefault of Default<TotalScoreRewards> {
    #[inline(always)]
    fn default() -> TotalScoreRewards {
        TotalScoreRewards {
            start_epoch_time: 0,
            epoch_duration: 0,
            end_epoch_time: 0,
            total_score_ai: 0,
            total_score_vote: 0,
            total_tips_amount_token_vote: 0,
            total_nostr_address: 0,
            rewards_amount: 0,
            total_points_weight: 0,
            is_claimed: false,
        }
    }
}


trait TotalScoreRewardsTrait {
    fn new(start_epoch_time: u64, epoch_duration: u64, end_epoch_time: u64) -> TotalScoreRewards;
}

pub impl TotalScoreRewardsImpl of TotalScoreRewardsTrait {
    #[inline(always)]
    fn new(start_epoch_time: u64, epoch_duration: u64, end_epoch_time: u64) -> TotalScoreRewards {
        TotalScoreRewards {
            start_epoch_time: start_epoch_time,
            epoch_duration: epoch_duration,
            end_epoch_time: end_epoch_time,
            total_score_ai: 0,
            total_score_vote: 0,
            total_tips_amount_token_vote: 0,
            total_nostr_address: 0,
            rewards_amount: 0,
            total_points_weight: 0,
            is_claimed: false,
        }
    }
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalAlgoScoreRewards {
    pub start_epoch_time: u64,
    pub epoch_duration: u64,
    pub end_epoch_time: u64,
    pub total_score_ai: u256,
    // pub total_score_overview: u256,
    // pub total_score_skills: u256,
    // pub total_score_value_shared: u256,
    pub total_nostr_address: u256,
    // pub to_claimed_ai_score: u256,
    // pub to_claimed_overview_score: u256,
    // pub to_claimed_skills_score: u256,
    // pub to_claimed_value_shared_score: u256,
    pub rewards_amount: u256,
    pub total_points_weight: u256,
    pub is_claimed: bool,
    // pub veracity_score: u256,
}

pub impl TotalAlgoScoreRewardsDefault of Default<TotalAlgoScoreRewards> {
    #[inline(always)]
    fn default() -> TotalAlgoScoreRewards {
        TotalAlgoScoreRewards {
            start_epoch_time: 0,
            epoch_duration: 0,
            end_epoch_time: 0,
            total_score_ai: 0,
            total_nostr_address: 0,
            rewards_amount: 0,
            total_points_weight: 0,
            is_claimed: false,
            // to_claimed_ai_score: 0,
        // to_claimed_overview_score: 0,
        // to_claimed_skills_score: 0,
        //  to_claimed_value_shared_score: 0,
        // total_score_overview: 0,
        // total_score_skills: 0,
        // total_score_value_shared: 0,
        // veracity_score: 0,
        }
    }
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalVoteTipsRewards {
    pub epoch_duration: u64,
    pub total_amount_deposit: u256,
    pub rewards_amount: u256,
    pub total_points_weight: u256,
    pub is_claimed: bool,
}


// pub impl TotalVoteTipsRewardsDefault of Default<TotalVoteTipsRewards> {
//     #[inline(always)]
//     fn default() -> TotalVoteTipsRewards {
//         TotalVoteTipsRewards {
//             epoch_duration: 0,
//             total_amount_deposit: 0,
//             rewards_amount: 0,
//             total_points_weight: 0,
//             is_claimed: false,
//         }
//     }
// }

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct EpochRewards {
    pub index: u64,
    pub epoch_duration: u64,
    pub start_epoch_time: u64,
    pub end_epoch_time: u64,
    pub is_finalized: bool,
    pub is_claimed: bool,
    pub total_score_ai: u256,
    pub total_score_tips: u256,
    pub total_score_algo: u256,
}

pub impl EpochRewardsDefault of Default<EpochRewards> {
    #[inline(always)]
    fn default() -> EpochRewards {
        EpochRewards {
            index: 0,
            epoch_duration: 0,
            start_epoch_time: 0,
            end_epoch_time: 0,
            is_finalized: false,
            is_claimed: false,
            total_score_ai: 0,
            total_score_tips: 0,
            total_score_algo: 0,
        }
    }
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountScoring {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub ai_score: u256,
    // pub token_launch_type: TokenLaunchType,
}


pub impl NostrAccountScoringDefault of Default<NostrAccountScoring> {
    #[inline(always)]
    fn default() -> NostrAccountScoring {
        NostrAccountScoring {
            nostr_address: 0.try_into().unwrap(),
            starknet_address: 0.try_into().unwrap(),
            ai_score: 0,
            // token_launch_type: TokenLaunchType::Later,
        }
    }
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct ProfileAlgorithmScoring {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub ai_score: u256,
    // pub ai_score_to_claimed: u256,
    // pub overview_score: u256,
    // pub overview_score_to_claimed: u256,
    // pub skills_score: u256,
    // pub skills_score_to_claimed: u256,
    // pub value_shared_score: u256,
    // pub value_shared_score_to_claimed: u256,
    pub is_claimed: bool,
    pub total_score: u256,
    pub veracity_score: u256,
}
// pub impl ProfileAlgorithmScoringDefault of Default<ProfileAlgorithmScoring> {
//     #[inline(always)]
//     fn default() -> ProfileAlgorithmScoring {
//         ProfileAlgorithmScoring {
//             nostr_address: 0.try_into().unwrap(),
//             starknet_address: 0.try_into().unwrap(),
//             ai_score: 0,
//             ai_score_to_claimed: 0,
//             overview_score: 0,
//             overview_score_to_claimed: 0,
//             skills_score: 0,
//             skills_score_to_claimed: 0,
//             value_shared_score: 0,
//             value_shared_score_to_claimed: 0,
//             is_claimed: false,
//             total_score: 0,
//             veracity_score: 0,
//         }
//     }
// }

// #[derive(Copy, Debug, Drop, starknet::Store, Serde)]
// pub struct VoteProfile {
//     pub nostr_address: u256,
//     pub starknet_address: ContractAddress,
//     pub good_score: u256,
//     pub bad_score: u256,
//     pub unique_address: u256,
//     pub vote: Vote,
//     pub ai_score: u256,
//     pub points: u256,
//     pub invested_points: u256,
//     pub staked_token_amount: u256,
// }

// pub impl VoteProfileDefault of Default<VoteProfile> {
//     #[inline(always)]
//     fn default() -> VoteProfile {
//         VoteProfile {
//             nostr_address: 0.try_into().unwrap(),
//             starknet_address: 0.try_into().unwrap(),
//             good_score: 0,
//             bad_score: 0,
//             unique_address: 0.try_into().unwrap(),
//             vote: Vote::Good,
//             ai_score: 0,
//             points: 0,
//             invested_points: 0,
//             staked_token_amount: 0,
//         }
//     }
// }

// #[derive(Copy, Debug, Drop, starknet::Store, Serde)]
// pub struct NostrAccountParams {
//     pub starknet_address: ContractAddress,
//     pub token_address: ContractAddress,
//     pub vault_address: ContractAddress,
//     pub tip_address: ContractAddress,
//     pub dao_address: ContractAddress,
//     pub token_launch_type: TokenLaunchType,
//     pub is_create_staking_vault: bool,
//     pub is_create_dao: bool,
// }

// pub impl NostrAccountParamsDefault of Default<NostrAccountParams> {
//     #[inline(always)]
//     fn default() -> NostrAccountParams {
//         NostrAccountParams {
//             starknet_address: 0.try_into().unwrap(),
//             token_address: 0.try_into().unwrap(),
//             vault_address: 0.try_into().unwrap(),
//             tip_address: 0.try_into().unwrap(),
//             dao_address: 0.try_into().unwrap(),
//             token_launch_type: TokenLaunchType::Later,
//             is_create_staking_vault: false,
//             is_create_dao: false,
//         }
//     }
// }
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

// #[derive(Clone, Debug, Drop, Serde)]
// pub struct LinkedStarknetAddress {
//     pub starknet_address: ContractAddress,
// }
// // TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr
// content pub impl LinkedStarknetAddressEncodeImpl of Encode<LinkedStarknetAddress> {
//     fn encode(self: @LinkedStarknetAddress) -> @ByteArray {
//         let recipient_address_user_felt: felt252 = self
//             .starknet_address
//             .clone()
//             .try_into()
//             .unwrap();

//         @format!("link to {:?}", recipient_address_user_felt)
//     }
// }


