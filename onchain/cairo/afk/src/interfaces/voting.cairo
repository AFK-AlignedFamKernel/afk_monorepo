use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, // Stor
     StoragePointerReadAccess,
    StoragePointerWriteAccess, StoragePathEntry,
    // MutableEntryStoragePathEntry, StorableEntryReadAccess, StorageAsPathReadForward,
// MutableStorableEntryReadAccess, MutableStorableEntryWriteAccess,
// StorageAsPathWriteForward,PathableStorageEntryImpl
};
use starknet::{ContractAddress};

#[derive(Serde, Copy, // Clone,
 Drop, starknet::Store, PartialEq //  PartialEq
)]
pub enum UserVote {
    Yes,
    No,
    Abstention,
}

#[derive(Serde, Copy, // Clone,
 Drop, starknet::Store, PartialEq //  PartialEq
)]
pub enum ProposalType {
    SavedAutomatedTransaction,
    Execution,
    Proposal,
}
#[derive(Serde, Copy, // Clone,
 Drop, starknet::Store, PartialEq //  PartialEq
)]
pub enum ProposalAutomatedTransaction {
    Transfer,
    Mint,
    Burn,
    Buy,
    Sell,
    Invest,
    Withdraw,
}
#[derive(Serde, Copy, // Clone,
 Drop, starknet::Store, PartialEq //  PartialEq
)]
pub enum ProposalStatus {
    Pending,
    Active,
    Passed,
    Failed,
    Executed,
    Canceled
}

#[derive(Serde, Copy, // Clone,
 Drop, starknet::Store, PartialEq //  PartialEq
)]
pub enum ProposalResult {
    Passed,
    Failed,
    Executed,
    Canceled
}


#[derive(Drop, Serde, Clone, starknet::Store, PartialEq)]
pub struct Proposal {
    pub id: u256,
    pub created_at: u64,
    pub end_at: u64,
    pub content: ByteArray,
    pub is_whitelisted: bool,
    // pub whitelisted_users: Array<ContractAddress>,
    // pub calldata: Array<felt252>,
    pub proposal_type: ProposalType,
    pub proposal_status: ProposalStatus,
    pub proposal_result: ProposalResult,
    pub proposal_result_at: u64,
    pub owner_proposal: ContractAddress,
    pub proposal_result_by: ContractAddress,
    pub is_executed: bool,
    pub is_canceled: bool,
}


// #[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
// pub struct VoteState {
//     pub votes_by_proposal: Map<u256, u256>, // Maps proposal ID to vote count
//     pub user_votes: Map<(u256, ContractAddress), u64>, // Maps user address to proposal ID they
//     voted for pub has_voted: Map<(u256, ContractAddress), bool>,
//     pub user_vote_type: Map<(u256, ContractAddress), UserVote>,
// }

#[starknet::interface]
pub trait IVoteProposal<TContractState> {
    // Mint the token with a specific ratio
    fn create_proposal(ref self: TContractState, token_address: ContractAddress, amount: u256);
    fn cast_vote_type(ref self: TContractState, proposal_id: u256, vote: UserVote);
    fn cast_vote(ref self: TContractState, proposal_id: u256, vote: u64);
    // fn cast_vote(ref self: TContractState, proposal_id: u256, vote: u64);
    // fn get_vote_state( self: @TContractState, proposal_id: u256) -> VoteState;
    fn get_proposal(self: @TContractState, proposal_id: u256) -> Proposal;
    fn get_user_vote(self: @TContractState, proposal_id: u256, user: ContractAddress) -> UserVote;

    fn set_token_permitted(
        ref self: TContractState,
        token_address: ContractAddress,
        // ratio: u256,
        ratio_mint: u256,
        is_available: bool,
        pooling_timestamp: u64
    );
}
