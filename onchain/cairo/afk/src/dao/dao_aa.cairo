use afk::profile::NostrProfile;
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
        IVoteProposal, Proposal, ProposalStatus, ProposalType, UserVote, VoteState
    };
    use afk::social::request::{SocialRequest, SocialRequestImpl, SocialRequestTrait, Encode};
    use afk::social::transfer::Transfer;
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::utils::{
        MIN_TRANSACTION_VERSION, QUERY_OFFSET, execute_calls, // is_valid_stark_signature
    };
    use core::num::traits::Zero;
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_governance::timelock::TimelockControllerComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::account::Call;

    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    use starknet::{get_caller_address, get_contract_address, get_tx_info, ContractAddress};
    use super::ISRC6;
    use super::{IDaoAADispatcher, IDaoAADispatcherTrait};

    component!(path: AccessControlComponent, storage: access_control, event: AccessControlEvent);
    // component!(path: TimelockControllerComponent, storage: timelock, event: TimelockEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

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

    // TODO refacto the voting part later
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
        proposals: Map<u256, Proposal>,
        proposal_by_user: Map<ContractAddress, u256>,
        total_proposal: u256,
        vote_state_by_proposal: Map<u256, VoteState>,
        vote_by_proposal: Map<u256, Proposal>,
        tx_data_per_proposal: Map<u256, Span<felt252>>,
        // votes_by_proposal: Map<u256, u256>, // Maps proposal ID to vote count
        user_votes: Map<
            (u256, ContractAddress), u64
        >, // Maps user address to proposal ID they voted for
        has_voted: Map<(u256, ContractAddress), bool>,
        user_vote_type: Map<(u256, ContractAddress), UserVote>,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AccountCreated: AccountCreated,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[derive(Drop, starknet::Event)]
    struct AccountCreated {
        #[key]
        public_key: u256
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, owner: ContractAddress, token_contract_address: ContractAddress
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
    impl DaoAA of super::IVoteProposal<ContractState> {
        // TODO
        // Check if ERC20 minimal balance to create a proposal is needed, if yes check the  balance
        // Add TX Calldata for this proposal
        fn create_proposal(ref self: ContractState, proposal: Proposal) {
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

        // TODO
        // Check if ERC20 minimal balance is needed
        // Check if ERC20 max balance is needed
        // Check is_multi_vote_available_per_token_balance
        // Finish the voting part
        fn cast_vote_type(ref self: ContractState, proposal_id: u256, vote: UserVote) {
            let caller = get_caller_address();
            self.vote_by_proposal.entry(proposal_id).write(vote);
            self.user_votes.entry(caller).write(proposal_id);
            self.has_voted.entry(caller).write(true);
            self.user_vote_type.entry(caller).write(vote);
        }

        // TODO
        // Check if ERC20 minimal balance is needed
        // Check if ERC20 max balance is needed
        // Check is_multi_vote_available_per_token_balance
        // Finish the voting part
        fn cast_vote(ref self: ContractState, proposal_id: u256, vote: u64) {
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

        // fn get_vote_state(ref self: ContractState, proposal_id: u256) -> VoteState {
        //     let caller = get_caller_address();
        //     self.vote_by_proposal.read(proposal_id)
        // }

        fn get_proposal(ref self: ContractState, proposal_id: u256) -> Proposal {
            let caller = get_caller_address();
            self.proposals.read(proposal_id)
        }

        fn get_user_vote(
            ref self: ContractState, proposal_id: u256, user: ContractAddress
        ) -> UserVote {
            let caller = get_caller_address();
            self.vote_by_proposal.read(proposal_id)
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
            self: @ContractState, hash: felt252, signature: Array<felt252>
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
            self: @ContractState, hash: felt252, signature: Span<felt252>
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
    }
}
