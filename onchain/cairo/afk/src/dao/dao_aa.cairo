// use starknet::{ContractAddress, get_caller_address, get_contract_address,
// contract_address_const};
use afk::social::profile::NostrProfile;
use afk::social::request::SocialRequest;
use afk::tokens::transfer::Transfer;
use starknet::account::Call;
use starknet::{ContractAddress};

#[starknet::interface]
pub trait IDaoAA<TContractState> {
    fn get_public_key(self: @TContractState) -> u256;
    fn get_token_contract_address(self: @TContractState) -> ContractAddress;
    // fn __execute__(self: @TContractState, calls: Array<Call>) -> Array<Span<felt252>>;
// fn __validate__(self: @TContractState, calls: Array<Call>) -> felt252;
// fn is_valid_signature(self: @TContractState, hash: felt252, signature: Array<felt252>) ->
// felt252;
}

#[starknet::interface]
pub trait ISRC6<TState> {
    fn __execute__(self: @TState, calls: Array<Call>) -> Array<Span<felt252>>;
    fn __validate__(self: @TState, calls: Array<Call>) -> felt252;
    fn is_valid_signature(self: @TState, hash: felt252, signature: Array<felt252>) -> felt252;
}


#[starknet::contract(account)]
pub mod DaoAA {
    use afk::bip340::{Signature, SchnorrSignature};
    use afk::bip340;
    use afk::interfaces::voting::{
        IVoteProposal, Proposal, ProposalParams, ProposalStatus, ProposalType, UserVote, VoteState,
        ProposalCreated, SET_PROPOSAL_DURATION_IN_SECONDS, TOKEN_DECIMALS, ProposalVoted
    };
    use afk::social::request::{SocialRequest, SocialRequestImpl, SocialRequestTrait, Encode};
    use afk::social::transfer::Transfer;
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::utils::{
        MIN_TRANSACTION_VERSION, QUERY_OFFSET, execute_calls // is_valid_stark_signature
    };
    use core::num::traits::Zero;
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::governance::timelock::TimelockControllerComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::upgrades::upgradeable::UpgradeableComponent;
    use starknet::account::Call;

    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map,
        StorageMapWriteAccess, Vec, MutableVecTrait
    };
    use starknet::{
        get_caller_address, get_contract_address, get_tx_info, ContractAddress,
        contract_address_const
    };
    use super::ISRC6;
    use super::{IDaoAADispatcher, IDaoAADispatcherTrait};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    // component!(path: TimelockControllerComponent, storage: timelock, event: TimelockEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // // Timelock Mixin
    // #[abi(embed_v0)]
    // impl TimelockMixinImpl =
    //     TimelockControllerComponent::TimelockMixinImpl<ContractState>;
    // impl TimelockInternalImpl = TimelockControllerComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[key]
        public_key: u256,
        owner: ContractAddress,
        is_admin_bypass_available: bool,
        is_only_dao_execution: bool,
        // Voting storage
        token_contract_address: ContractAddress,
        minimal_balance_voting: u256,
        max_balance_per_vote: u256,
        minimal_balance_create_proposal: u256,
        is_multi_vote_available_per_token_balance: bool,
        transfers: Map<u256, bool>,
        proposals: Map<u256, Option<Proposal>>, // Map ProposalID => Proposal
        proposals_calldata: Map<u256, Vec<felt252>>, // Map ProposalID => calldata
        proposal_by_user: Map<ContractAddress, u256>,
        total_proposal:  u256,
        vote_state_by_proposal: Map<u256, VoteState>, // Map ProposalID => VoteState
        // vote_by_proposal: Map<u256, Proposal>,
        tx_data_per_proposal: Map<u256, Span<felt252>>,
        // votes_by_proposal: Map<u256, u256>, // Maps proposal ID to vote count
        // here
        // user_votes: Map<
        //     (u256, ContractAddress), u64,
        // >, // Maps user address to proposal ID they voted for
        // has_voted: Map<(u256, ContractAddress), bool>,
        // user_vote_type: Map<(u256, ContractAddress), UserVote>,
        vote_token_address: ContractAddress,
        total_voters: u128,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AccountCreated: AccountCreated,
        ProposalCreated: ProposalCreated,
        ProposalVoted: ProposalVoted,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct AccountCreated {
        #[key]
        public_key: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, owner: ContractAddress, token_contract_address: ContractAddress, public_key: u256
    ) {
        // self.public_key.write(public_key);
        self.owner.write(owner);
        self.token_contract_address.write(token_contract_address);
        self.total_proposal.write(0);
        // self.accesscontrol.initializer();
        // self.accesscontrol._grant_role(ADMIN_ROLE, owner);
        // self.accesscontrol._grant_role(MINTER_ROLE, admin);
        self.emit(AccountCreated { public_key: public_key });
    }

    #[abi(embed_v0)]
    impl DaoAA of super::IDaoAA<ContractState> {
        fn get_public_key(self: @ContractState) -> u256 {
            self.public_key.read()
        }

        fn get_token_contract_address(self: @ContractState) -> ContractAddress {
            self.token_contract_address.read()
        }
    }

    #[abi(embed_v0)]
    impl DaoAAProposalImpl of IVoteProposal<ContractState> {
        // TODO
        // Check if ERC20 minimal balance to create a proposal is needed, if yes check the  balance
        // Add TX Calldata for this proposal
        fn create_proposal(
            ref self: ContractState, proposal_params: ProposalParams, calldata: Array<felt252>
        ) -> u256 {
            assert(calldata.len() > 0, 'EMPTY CALLDATA');
            let owner = get_caller_address();
            let id = self.total_proposal.read() + 1;
            let created_at = starknet::get_block_timestamp();
            let end_at = starknet::get_block_timestamp() + SET_PROPOSAL_DURATION_IN_SECONDS;

            let proposal = Proposal {
                id,
                created_at,
                end_at,
                is_whitelisted: false,
                proposal_params,
                proposal_status: Default::default(),
                proposal_result: Default::default(),
                proposal_result_at: 0,
                owner,
                proposal_result_by: contract_address_const::<0x0>(),
                is_executed: false,
                is_canceled: false
            };

            self.proposals.entry(id).write(Option::Some(proposal));

            let proposal_calldata = self.proposals_calldata.entry(id);
            for i in 0
                ..calldata
                    .len() {
                        let data = *calldata.at(i);
                        proposal_calldata.append().write(data);
                    };

            self.total_proposal.write(id);
            self.emit(ProposalCreated { id, owner, created_at, end_at });

            id
        }

        fn cast_vote(
            ref self: ContractState, proposal_id: u256, vote: u64, opt_vote_type: Option<UserVote>
        ) {
            // TODO
        // Check if ERC20 minimal balance is needed
        // Check if ERC20 max balance is needed
        // Check is_multi_vote_available_per_token_balance
        // Finish the voting part
            let caller = get_caller_address();
            let proposal = self._get_proposal(proposal_id);
            assert(!proposal.is_canceled || !proposal.is_executed, 'CANNOT VOTE ON PROPOSAL');

            let mut vote_state = self.vote_state_by_proposal.entry(proposal_id);
            assert(!vote_state.user_has_voted.entry(caller).read(), 'CALLER HAS VOTED');

            // Use balance for vote power
            let vote_token_dispatcher = IERC20Dispatcher {
                contract_address: self.vote_token_address.read()
            };
            let caller_votes = vote_token_dispatcher
                .balance_of(caller); // this is without its decimals
            // let number_of_votes: u64 = (caller_balance /
            // TOKEN_DECIMALS.into()).try_into().unwrap();

            let previous_vote_count = vote_state.no_of_votes.read();
            vote_state.no_of_votes.write(previous_vote_count + caller_votes);
            let previous_voter_count = vote_state.voter_count.read();
            vote_state.voter_count.write(previous_voter_count + 1);

            let vote_type: UserVote = match opt_vote_type {
                Option::Some(vote_type) => vote_type,
                _ => Default::default()
            };

            vote_state.user_votes.entry(caller).write((vote_type, caller_votes));
            vote_state.user_has_voted.entry(caller).write(true);
            vote_state.voters_list.append().write(caller);
            self.total_voters.write(self.total_voters.read() + 1);

            self
                .emit(
                    ProposalVoted {
                        id: proposal_id,
                        voter: caller,
                        vote: vote_type,
                        votes: caller_votes,
                        total_votes: previous_vote_count + caller_votes,
                        voted_at: starknet::get_block_timestamp()
                    }
                );
        }

        // fn get_vote_state(ref self: ContractState, proposal_id: u256) -> VoteState {
        //     let caller = get_caller_address();
        //     self.vote_by_proposal.read(proposal_id)
        // }

        fn get_proposal(self: @ContractState, proposal_id: u256) -> Proposal {
            self._get_proposal(proposal_id)
        }

        fn get_user_vote(
            self: @ContractState, proposal_id: u256, user: ContractAddress,
        ) -> UserVote {
            let caller = get_caller_address();
            let _ = self._get_proposal(proposal_id); // assert
            let mut vote_state = self.vote_state_by_proposal.entry(proposal_id);
            assert(vote_state.user_has_voted.entry(caller).read(), 'CALLER HAS NO VOTES');

            let (user_vote, _) = vote_state.user_votes.entry(caller).read();
            user_vote
        }

        fn cancel_proposal(ref self: ContractState, proposal_id: u256) {
            let mut proposal = self._get_proposal(proposal_id);
            assert(get_caller_address() == proposal.owner, 'UNAUTHORIZED CALLER');
            assert(!proposal.is_canceled, 'PROPOSAL ALREADY CANCELED');
            assert(!proposal.is_executed, 'PROPOSAL ALREADY EXECUTED');
            proposal.is_canceled = true;
            self.proposals.entry(proposal_id).write(Option::Some(proposal));
        }
    }

    #[abi(embed_v0)]
    impl ISRC6Impl of ISRC6<ContractState> {
        //  TODO
        // Verify the TX is automated of the proposal is valid for this calldata
        // CENSORED the owner/signature for a real AA Autonomous for DAO and agents
        fn __execute__(self: @ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            assert!(get_caller_address().is_zero(), "invalid caller");

            // Check tx version
            let tx_info = get_tx_info().unbox();
            let tx_version: u256 = tx_info.version.into();
            // Check if tx is a query
            if (tx_version >= QUERY_OFFSET) {
                assert!(QUERY_OFFSET + MIN_TRANSACTION_VERSION <= tx_version, "invalid tx version");
            } else {
                assert!(MIN_TRANSACTION_VERSION <= tx_version, "invalid tx version");
            }

            execute_calls(calls)
        }

        //  TODO
        // Verify the TX is automated of the proposal is valid for this calldata
        // CENSORED the owner/signature for a real AA Autonomous for DAO and agents
        fn __validate__(self: @ContractState, calls: Array<Call>) -> felt252 {
            let tx_info = get_tx_info().unbox();
            self._is_valid_signature(tx_info.transaction_hash, tx_info.signature)
        }

        fn is_valid_signature(
            self: @ContractState, hash: felt252, signature: Array<felt252>,
        ) -> felt252 {
            self._is_valid_signature(hash, signature.span())
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        //  TODO
        // Verify the TX is automated of the proposal is valid for this calldata
        // CENSORED the owner/signature for a real AA Autonomous for DAO and agents
        fn _is_valid_signature(
            self: @ContractState, hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            let is_valid_length = signature.len() == 2_u32;
            // assert(is_valid_length, 'Account: Incorrect tx signature');

            if !is_valid_length {
                return 'INVALID_LENGTH';
            }

            let account_address: felt252 = self.starknet_address.read().try_into().unwrap();
            let is_valid = check_ecdsa_signature(
                hash, account_address, *signature.at(0_u32), *signature.at(1_u32)
            );
            if is_valid {
                return starknet::VALIDATED;
            }
            // assert(is_valid, 'INVALIDATED');
            0
            // let public_key = self.public_key.read();

            // let mut signature = signature;
        // let r: u256 = Serde::deserialize(ref signature).expect('invalid signature format');
        // let s: u256 = Serde::deserialize(ref signature).expect('invalid signature format');

            // let hash: u256 = hash.into();
        // let mut hash_as_ba = Default::default();
        // hash_as_ba.append_word(hash.high.into(), 16);
        // hash_as_ba.append_word(hash.low.into(), 16);

            // if bip340::verify(public_key, r, s, hash_as_ba) {
            //     starknet::VALIDATED
            // } else {
            //     0
            // }
        }

        fn _get_proposal(self: @ContractState, proposal_id: u256) -> Proposal {
            let opt_proposal = self.proposals.entry(proposal_id).read();
            assert(opt_proposal.is_some(), 'INVALID PROPOSAL ID');

            opt_proposal.unwrap()
        }
    }
}
