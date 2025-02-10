use afk::types::defi_types::{TokenPermitted, DepositUser, MintDepositEvent, WithdrawDepositEvent};
use starknet::ContractAddress;

// TODO
// Create the as a Vault component
#[starknet::component]
pub mod VoteComponent {
    use afk::interfaces::erc20_mintable::{IERC20MintableDispatcher, IERC20MintableDispatcherTrait};
    use afk::interfaces::voting::{
        IVoteProposal, Proposal, ProposalStatus, ProposalType, UserVote, VoteState
    };
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::types::constants::{MINTER_ROLE, ADMIN_ROLE};
    use core::num::traits::Zero;

    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use starknet::event::EventEmitter;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, // Stor
         StoragePointerReadAccess,
        StoragePointerWriteAccess, StoragePathEntry,
        // MutableEntryStoragePathEntry, StorableEntryReadAccess, StorageAsPathReadForward,
    // MutableStorableEntryReadAccess, MutableStorableEntryWriteAccess,
    // StorageAsPathWriteForward,PathableStorageEntryImpl
    };

    use starknet::{
        ContractAddress, get_caller_address, contract_address_const, get_block_timestamp,
        get_contract_address, ClassHash
    };
    use super::{DepositUser, TokenPermitted, MintDepositEvent, WithdrawDepositEvent};


    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ComponentState<TContractState>>;
    impl AccessControlInternalImpl =
        AccessControlComponent::InternalImpl<ComponentState<TContractState>>;

    #[storage]
    struct Storage {
        proposals: Map<u256, Proposal>,
        proposal_by_user: Map<ContractAddress, u256>,
        total_proposal: u256,
        vote_state_by_proposal: Map<u256, VoteState>,
        vote_by_proposal: Map<u256, Proposal>,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }


    #[constructor]
    fn constructor(
        ref self: ComponentState<TContractState>,
        token_address: ContractAddress,
        admin: ContractAddress
    ) {
        // Give MINTER role to the Vault for the token used
        self.total_proposal.write(0);
        // self.token_address.write(token_address);
    // self.accesscontrol.initializer();
    // self.accesscontrol._grant_role(ADMIN_ROLE, admin);
    // self.accesscontrol._grant_role(MINTER_ROLE, admin);
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        MintDepositEvent: MintDepositEvent,
        WithdrawDepositEvent: WithdrawDepositEvent,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[embeddable_as(Vote)]
    impl VoteImpl<
        TContractState, +HasComponent<TContractState>
    > of IVoteProposal<ComponentState<TContractState>> {
        fn create_proposal(ref self: ComponentState<TContractState>, proposal: Proposal) {
            let caller = get_caller_address();
            let proposal_id = self.total_proposal.read();
            self.total_proposal.write(proposal_id + 1);
            self.proposals.entry(proposal_id).write(proposal);

            let vote_state = VoteState {
                votes_by_proposal: Map::new(), user_votes: Map::new(), has_voted: Map::new(),
            };
            self.proposal_by_user.entry(caller).write(proposal_id);
            self.vote_state_by_proposal.entry(proposal_id).write(vote_state);
        }

        fn cast_vote_type(
            ref self: ComponentState<TContractState>, proposal_id: u256, vote: UserVote
        ) {
            let caller = get_caller_address();
            self.vote_by_proposal.entry(proposal_id).write(vote);
            self.user_votes.entry(caller).write(proposal_id);
            self.has_voted.entry(caller).write(true);
            self.user_vote_type.entry(caller).write(vote);
        }

        fn cast_vote(ref self: ComponentState<TContractState>, proposal_id: u256, vote: u64) {
            let caller = get_caller_address();
            self.vote_by_proposal.entry(proposal_id).write(vote);
            self.user_votes.entry(caller).write(proposal_id);
            self.has_voted.entry(caller).write(true);

            let mut vote_state = self.vote_state_by_proposal.read(proposal_id);

            vote_state.user_votes.entry(caller).write(vote);
            vote_state.has_voted.entry(caller).write(true);
            // vote_state.votes_by_proposal.entry(vote).write(vote_state.votes_by_proposal.read(vote)
            // + 1);

            self.vote_state_by_proposal.entry(proposal_id).write(vote_state);
            self.user_vote_type.entry(caller).write(vote);
        }

        fn get_vote_state(
            ref self: ComponentState<TContractState>, proposal_id: u256
        ) -> VoteState {
            let caller = get_caller_address();
            self.vote_by_proposal.read(proposal_id)
        }

        fn get_proposal(ref self: ComponentState<TContractState>, proposal_id: u256) -> Proposal {
            let caller = get_caller_address();
            self.proposals.read(proposal_id)
        }

        fn get_user_vote(
            ref self: ComponentState<TContractState>, proposal_id: u256, user: ContractAddress
        ) -> UserVote {
            let caller = get_caller_address();
            self.vote_by_proposal.read(proposal_id)
        }
    }
    // Admin
// Add OPERATOR role to the Vault escrow
// #[external(v0)]
// fn set_control_role(
//     ref self: TContractState, recipient: ContractAddress, role: felt252, is_enable: bool
// ) {
//     self.accesscontrol.assert_only_role(ADMIN_ROLE);
//     assert!(
//         role == ADMIN_ROLE
//             || role == OPERATOR_ROLE // Think and Add others roles needed on the protocol
//             ,
//         "role not enable"
//     );
//     if is_enable {
//         self.accesscontrol._grant_role(role, recipient);
//     } else {
//         self.accesscontrol._revoke_role(role, recipient);
//     }
// }

}
