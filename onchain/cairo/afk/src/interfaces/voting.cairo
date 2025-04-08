use starknet::ContractAddress;
use starknet::account::Call;
use starknet::storage::{
    Map, Vec // MutableEntryStoragePathEntry, StorableEntryReadAccess, StorageAsPathReadForward,
    // MutableStorableEntryReadAccess, MutableStorableEntryWriteAccess,
// StorageAsPathWriteForward,PathableStorageEntryImpl
};

pub const SET_PROPOSAL_DURATION_IN_SECONDS: u64 = 60 * 60 * 24 * 7; // 1 week, can be adjusted.
pub const TOKEN_DECIMALS: u64 = 1_000_000_000_000_000_000; // say 

#[derive(Serde, Copy, // Clone,
Drop, starknet::Store, PartialEq, Default //  PartialEq
)]
pub enum UserVote {
    #[default]
    Yes,
    No,
    Abstention,
}

#[derive(Serde, Copy, // Clone,
Drop, starknet::Store, PartialEq, Default)]
pub enum ProposalType {
    SavedAutomatedTransaction,
    Execution,
    #[default]
    Proposal,
}
#[derive(Serde, Copy, // Clone,
Drop, starknet::Store, PartialEq, Default)]
pub enum ProposalAutomatedTransaction {
    #[default]
    Transfer,
    Mint,
    Burn,
    Buy,
    Sell,
    Invest,
    Withdraw,
}
#[derive(Serde, Copy, // Clone,
Drop, starknet::Store, PartialEq, Default)]
pub enum ProposalStatus {
    #[default]
    Pending,
    Active,
    Passed,
    Failed,
    Executed,
    Canceled,
}

#[derive(Serde, Copy, // Clone,
Drop, starknet::Store, PartialEq, Default //  PartialEq
)]
pub enum ProposalResult {
    #[default]
    InProgress,
    Passed,
    Failed,
    Executed,
    Canceled,
}

#[derive(Drop, Serde, Clone, starknet::Store, PartialEq)]
pub struct Proposal {
    pub id: u256,
    pub created_at: u64,
    pub end_at: u64,
    pub is_whitelisted: bool,
    pub proposal_params: ProposalParams,
    // pub whitelisted_users: Array<ContractAddress>,
    pub proposal_status: ProposalStatus,
    pub proposal_result: ProposalResult,
    pub proposal_result_at: u64,
    pub owner: ContractAddress,
    pub proposal_result_by: ContractAddress,
}

#[derive(Drop, Serde, Clone, starknet::Store, PartialEq)]
pub struct ProposalParams {
    pub content: ByteArray,
    pub proposal_type: ProposalType,
    pub proposal_automated_transaction: ProposalAutomatedTransaction,
}

#[derive(Drop, Copy, starknet::Event)]
pub struct ProposalCreated {
    #[key]
    pub id: u256,
    pub owner: ContractAddress,
    pub created_at: u64,
    pub end_at: u64,
}

#[derive(Drop, Copy, starknet::Event)]
pub struct ProposalVoted {
    #[key]
    pub id: u256,
    pub voter: ContractAddress,
    pub vote: UserVote,
    pub votes: u256,
    pub total_votes: u256,
    pub voted_at: u64,
}

#[derive(Drop, Copy, starknet::Event)]
pub struct ProposalCanceled {
    #[key]
    pub id: u256,
    pub owner: ContractAddress,
    pub is_canceled: bool,
    // pub votes: u256, // subject to review
}

#[derive(Drop, Copy, starknet::Event)]
pub struct ProposalResolved {
    #[key]
    pub id: u256,
    pub owner: ContractAddress,
    pub result: ProposalResult,
}

#[derive(Drop, Copy, Serde)]
pub struct ConfigParams {
    pub is_admin_bypass_available: Option<bool>,
    pub is_only_dao_execution: Option<bool>,
    pub token_contract_address: Option<ContractAddress>,
    pub minimal_balance_voting: Option<u256>,
    pub max_balance_per_vote: Option<u256>,
    pub minimal_balance_create_proposal: Option<u256>,
    pub minimum_threshold_percentage: Option<u64>,
}

#[derive(Drop, Copy, Serde)]
pub struct ConfigResponse {
    pub is_admin_bypass_available: bool,
    pub is_only_dao_execution: bool,
    pub token_contract_address: ContractAddress,
    pub minimal_balance_voting: u256,
    pub max_balance_per_vote: u256,
    pub minimal_balance_create_proposal: u256,
    pub minimum_threshold_percentage: u64,
}

#[starknet::storage_node]
pub struct Calldata {
    pub to: ContractAddress,
    pub selector: felt252,
    pub calldata: Vec<felt252>,
    pub is_executed: bool,
}

// #[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
// pub struct VoteState {
//     pub votes_by_proposal: Map<u256, u256>, // Maps proposal ID to vote count
//     pub user_votes: Map<(u256, ContractAddress), u64>, // Maps user address to proposal ID they
//     voted for pub has_voted: Map<(u256, ContractAddress), bool>,
//     pub user_vote_type: Map<(u256, ContractAddress), UserVote>,
// }

#[starknet::storage_node]
pub struct VoteState {
    pub no_of_votes: u256,
    pub voter_count: u64,
    pub user_votes: Map<ContractAddress, (UserVote, u256)>, // Map Voter => (UserVote, power)
    pub user_has_voted: Map<ContractAddress, bool>,
    pub voters_list: Vec<ContractAddress>,
    pub yes_votes: (u64, u256), // (number of votes, power)
    pub no_votes: (u64, u256),
}

#[starknet::interface]
pub trait IVoteProposal<TContractState> {
    fn create_proposal(
        ref self: TContractState, proposal_params: ProposalParams, calldata: Array<Call>,
    ) -> u256;
    fn cast_vote(ref self: TContractState, proposal_id: u256, opt_vote_type: Option<UserVote>);
    fn get_proposal(self: @TContractState, proposal_id: u256) -> Proposal;
    fn get_user_vote(self: @TContractState, proposal_id: u256, user: ContractAddress) -> UserVote;
    fn cancel_proposal(ref self: TContractState, proposal_id: u256);
    fn process_result(ref self: TContractState, proposal_id: u256);
    // debugging
    fn is_executable(ref self: TContractState, calldata: Call) -> bool;
}
// Possible extracted Proposal Functions
// Mint the token with a specific ratio
// fn create_proposal(ref self: TContractState, token_address: ContractAddress, amount: u256);
// fn cast_vote(ref self: TContractState, proposal_id: u256, vote: u64);
// fn get_vote_state( self: @TContractState, proposal_id: u256) -> VoteState;
// fn set_token_permitted(
//     ref self: TContractState,
//     token_address: ContractAddress,
//     // ratio: u256,
//     ratio_mint: u256,
//     is_available: bool,
//     pooling_timestamp: u64
// );

// fn cast_vote_type(ref self: TContractState, proposal_id: u256, vote: UserVote);


