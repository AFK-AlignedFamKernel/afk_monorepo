use afk::social::request::{ConvertToBytes, Encode, SocialRequest, SocialRequestImpl};
use core::fmt::Display;
use starknet::ContractAddress;

// Add this ROLE on a constants file
pub const OPERATOR_ROLE: felt252 = selector!("OPERATOR_ROLE");
pub const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

pub type NostrPublicKey = u256;
pub type AddressId = felt252;

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
    fn init_nostr_profile(ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>);
    fn add_nostr_profile_admin(ref self: TContractState, nostr_event_id: u256);
    fn push_profile_score_algo(
        ref self: TContractState,
        request: SocialRequest<LinkedStarknetAddress>,
        score_algo: ProfileAlgorithmScoring,
    );

    fn set_change_batch_interval(ref self: TContractState, next_epoch: u64);
    fn set_admin_params(ref self: TContractState, admin_params: NostrFiAdminStorage);
    fn create_dao(ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>);

    // Users functions
    fn linked_nostr_profile(
        ref self: TContractState, request: SocialRequest<LinkedStarknetAddress>,
    );

    fn create_token_topic_reward_and_vote(
        ref self: TContractState,
        request: SocialRequest<LinkedStarknetAddress>,
        token_type: TokenLaunchType,
        is_create_staking_vault: bool,
        is_create_dao: bool,
    );

    // Deposit, Voting and tips
    fn deposit_rewards(
        ref self: TContractState, amount: u256, deposit_rewards_type: DepositRewardsType,
    );
    fn vote_token_profile(ref self: TContractState, request: SocialRequest<VoteNostrNote>);
    fn vote_nostr_note(ref self: TContractState, request: SocialRequest<VoteNostrNote>);
    fn vote_nostr_profile_starknet_only(ref self: TContractState, vote_params: VoteParams);
    fn distribute_rewards_by_user(ref self: TContractState);
    fn claim_and_distribute_my_rewards(ref self: TContractState);
    fn distribute_algo_rewards_by_user(ref self: TContractState);


    // Getters
    fn get_admin_params(self: @TContractState) -> NostrFiAdminStorage;
    fn get_is_pay_subscription(self: @TContractState) -> bool;
    fn get_amount_paid_for_subscription(self: @TContractState) -> u256;
    fn get_token_to_pay_subscription(self: @TContractState) -> ContractAddress;
    fn get_tokens_address_accepted(self: @TContractState, token_address: ContractAddress) -> bool;
    // fn deposit_rewards_topic_to_vault_for_user(ref self: TContractState, amount: u256,);
// fn deposit_rewards_topic_to_vault_for_algo(ref self: TContractState, amount: u256);
}


#[derive(Clone, Debug, Drop, Serde)]
pub struct LinkedStarknetAddress {
    pub starknet_address: ContractAddress,
}

#[derive(Clone, Debug, Drop, Serde)]
pub enum DepositRewardsType {
    General,
    // V2 users can select the type of rewards they want to deposit
// User,
// Algo,
}


#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct LinkedWalletProfileDefault {
    pub nostr_address: NostrPublicKey,
    pub starknet_address: ContractAddress,
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

// TODO fix the Content format for NostruPublicKey as felt252 to send the same as the Nostr content
pub impl VoteNostrNoteEncodeImpl of Encode<VoteNostrNote> {
    fn encode(self: @VoteNostrNote) -> @ByteArray {
        let recipient_address_user_felt: felt252 = self
            .starknet_address
            .clone()
            .try_into()
            .unwrap();

        let nostr_address_felt: felt252 = self.nostr_address.clone().try_into().unwrap();

        @format!(
            "vote to {:?} {:?} {:?} {:?} {:?} {:?} ",
            recipient_address_user_felt,
            nostr_address_felt,
            self.vote,
            self.is_upvote,
            self.upvote_amount,
            self.downvote_amount,
        )
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
    pub nostr_address: NostrPublicKey,
    pub nostr_event_id: NostrPublicKey,
    pub starknet_address: ContractAddress,
    // Add NIP-05 and stats profil after. Gonna write a proposal for it
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct DistributionRewardsByUser {
    #[key]
    pub starknet_address: ContractAddress,
    #[key]
    pub nostr_address: NostrPublicKey,
    pub claimed_at: u64,
    pub amount_algo: u256,
    pub amount_vote: u256,
    pub amount_total: u256,
    // Add NIP-05 and stats profil after. Gonna write a proposal for it
}


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

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TipByUser {
    pub nostr_address: u256,
    pub total_amount_deposit: u256,
    pub total_amount_deposit_by_algo: u256,
    pub rewards_amount: u256,
    pub is_claimed: bool,
    pub end_epoch_time: u64,
    pub start_epoch_time: u64,
    pub epoch_duration: u64,
    pub reward_to_claim_by_user_because_not_linked: u256,
    pub is_claimed_tip_by_user_because_not_linked: bool,
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
    pub user_total_amount_deposit: u256,
    pub algo_total_amount_deposit: u256,
    pub rewards_amount: u256,
    pub is_claimed: bool,
    pub total_amount_to_claim: u256,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalScoreRewards {
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


#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalAlgoScoreRewards {
    pub epoch_duration: u64,
    pub end_epoch_time: u64,
    pub total_score_ai: u256,
    pub total_score_overview: u256,
    pub total_score_skills: u256,
    pub total_score_value_shared: u256,
    pub total_nostr_address: u256,
    pub to_claimed_ai_score: u256,
    pub to_claimed_overview_score: u256,
    pub to_claimed_skills_score: u256,
    pub to_claimed_value_shared_score: u256,
    pub rewards_amount: u256,
    pub total_points_weight: u256,
    pub is_claimed: bool,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
pub struct TotalVoteTipsRewards {
    pub epoch_duration: u64,
    pub total_amount_deposit: u256,
    pub rewards_amount: u256,
    pub total_points_weight: u256,
    pub is_claimed: bool,
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
    PrivateSale,
    PublicSale,
    ICO,
    DutchAuction,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountBasic {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountScoring {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub ai_score: u256,
    pub token_launch_type: TokenLaunchType,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct ProfileVoteScoring {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub upvote_amount: u256,
    pub downvote_amount: u256,
    pub rewards_amount: u256,
    pub unique_address: u256,
}


#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct ProfileAlgorithmScoring {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub ai_score: u256,
    pub ai_score_to_claimed: u256,
    pub overview_score: u256,
    pub overview_score_to_claimed: u256,
    pub skills_score: u256,
    pub skills_score_to_claimed: u256,
    pub value_shared_score: u256,
    pub value_shared_score_to_claimed: u256,
    pub is_claimed: bool,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct VoteProfile {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub good_score: u256,
    pub bad_score: u256,
    pub unique_address: u256,
    pub vote: Vote,
    pub ai_score: u256,
    pub points: u256,
    pub invested_points: u256,
}

#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct VoteUserForProfile {
    pub nostr_address: u256,
    pub starknet_address: ContractAddress,
    pub vote: Vote,
    pub points: u256,
    pub invested_points: u256,
    pub token_address: ContractAddress,
    pub staked_token_amount: u256,
}
#[derive(Copy, Debug, Drop, starknet::Store, Serde)]
pub struct NostrAccountParams {
    pub starknet_address: ContractAddress,
    pub token_address: ContractAddress,
    pub vault_address: ContractAddress,
    pub tip_address: ContractAddress,
    pub dao_address: ContractAddress,
    pub token_launch_type: TokenLaunchType,
    pub is_create_staking_vault: bool,
    pub is_create_dao: bool,
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


