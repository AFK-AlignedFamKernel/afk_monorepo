// use starknet::{ContractAddress, get_caller_address, get_contract_address,
// contract_address_const};
use afk::interfaces::voting::{ConfigParams, ConfigResponse};
use afk::social::profile::NostrProfile;
use afk::social::request::SocialRequest;
use afk::social::transfer::Transfer;
use starknet::ContractAddress;
use starknet::account::Call;

#[starknet::interface]
pub trait IDaoAA<TContractState> {
    fn get_public_key(self: @TContractState) -> u256;
    fn get_token_contract_address(self: @TContractState) -> ContractAddress;
    fn update_config(ref self: TContractState, config_params: ConfigParams);
    fn get_config(self: @TContractState) -> ConfigResponse;
    fn set_public_key(ref self: TContractState, public_key: u256);
    // fn __execute__(self: @TContractState, calls: Array<Call>) -> Array<Span<felt252>>;
// fn __validate__(self: @TContractState, calls: Array<Call>) -> felt252;
// fn is_valid_signature(self: @TContractState, hash: felt252, signature: Array<felt252>) ->
// felt252;
}

#[starknet::interface]
pub trait ISRC6<TContractState> {
    fn __execute__(ref self: TContractState, calls: Array<Call>) -> Array<Span<felt252>>;
    fn __validate__(self: @TContractState, calls: Array<Call>) -> felt252;
    fn is_valid_signature(
        self: @TContractState, hash: felt252, signature: Array<felt252>,
    ) -> felt252;
}


#[starknet::contract(account)]
pub mod DaoAA {
    use afk::bip340;
    use afk::bip340::{SchnorrSignature, Signature};
    use afk::components::voting::VotingComponent;
    // use afk::interfaces::voting::{
    //     IVoteProposal, Proposal, ProposalParams, ProposalResult, ProposalType, UserVote,
    //     VoteState, ProposalCreated, SET_PROPOSAL_DURATION_IN_SECONDS, TOKEN_DECIMALS,
    //     ProposalVoted, ProposalResolved, ConfigParams, ConfigResponse, ProposalCanceled,
    //     Calldata,
    // };
    use afk::interfaces::voting::{ConfigParams, ConfigResponse};
    use afk::social::request::{Encode, SocialRequest, SocialRequestImpl, SocialRequestTrait};
    use afk::social::transfer::Transfer;
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::utils::{
        MIN_TRANSACTION_VERSION, QUERY_OFFSET, execute_calls // is_valid_stark_signature
    };
    use core::ecdsa::check_ecdsa_signature;
    // use core::hash::{HashStateExTrait, HashStateTrait};
    use core::num::traits::Zero;
    // use core::poseidon::{PoseidonTrait, poseidon_hash_span};
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::governance::timelock::TimelockControllerComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::upgrades::upgradeable::UpgradeableComponent;
    use openzeppelin::utils::cryptography::snip12::StructHash;
    use starknet::account::Call;
    use starknet::storage::{
        Map, MutableVecTrait, StorageMapWriteAccess, StoragePathEntry, StoragePointerReadAccess,
        StoragePointerWriteAccess, Vec,
    };
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, get_contract_address,
        get_tx_info,
    };
    use super::{IDaoAADispatcher, IDaoAADispatcherTrait, ISRC6};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    // component!(path: TimelockControllerComponent, storage: timelock, event: TimelockEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: VotingComponent, storage: voting, event: VotingEvent);

    pub const ISRC6_ID: felt252 = 0x2ceccef7f994940b3962a6c67e0ba4fcd37df7d131417c604f91e03caecc1cd;

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
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    // Voting
    #[abi(embed_v0)]
    impl VotingImpl = VotingComponent::VotingImpl<ContractState>;
    impl VotingInternalImpl = VotingComponent::VotingInternalImpl<ContractState>;

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
        transfers: Map<u256, bool>,
        starknet_address: felt252,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        voting: VotingComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        AccountCreated: AccountCreated,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        #[flat]
        VotingEvent: VotingComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct AccountCreated {
        #[key]
        public_key: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        token_contract_address: ContractAddress,
        public_key: u256,
        starknet_address: felt252,
    ) {
        // init Voting component
        self.src5.register_interface(ISRC6_ID);
        self.starknet_address.write(starknet_address);
        self.owner.write(owner);
        self.voting._init(token_contract_address);
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
            self.voting.token_contract_address.read()
        }

        fn update_config(ref self: ContractState, config_params: ConfigParams) {
            assert(get_caller_address() == self.owner.read(), 'UNAUTHORIZED CALLER');
            self.voting._update_config(config_params);
        }

        fn get_config(self: @ContractState) -> ConfigResponse {
            self.voting._get_config()
        }

        fn set_public_key(ref self: ContractState, public_key: u256) {
            assert(get_caller_address() == self.owner.read(), 'UNAUTHORIZED CALLER');
            self.public_key.write(public_key);
        }
    }

    #[abi(embed_v0)]
    impl ISRC6Impl of ISRC6<ContractState> {
        //  TODO
        // Verify the TX is automated of the proposal is valid for this calldata
        // CENSORED the owner/signature for a real AA Autonomous for DAO and agents

        // TODO, security issue.
        fn __execute__(ref self: ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            assert!(get_caller_address().is_zero(), "invalid caller");

            // // Check tx version
            // let tx_info = get_tx_info().unbox();
            // let tx_version: u256 = tx_info.version.into();
            // // Check if tx is a query
            // if (tx_version >= QUERY_OFFSET) {
            //     assert!(QUERY_OFFSET + MIN_TRANSACTION_VERSION <= tx_version, "invalid tx
            //     version");
            // } else {
            //     assert!(MIN_TRANSACTION_VERSION <= tx_version, "invalid tx version");
            // }

            self.voting._execute(calls)
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

            // is this variable from the storage?
            let account_address: felt252 = self.starknet_address.read().try_into().unwrap();
            let is_valid = check_ecdsa_signature(
                hash, account_address, *signature.at(0_u32), *signature.at(1_u32),
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

#[cfg(test)]
mod tests {
    use afk::components::voting::VotingComponent;
    use afk::interfaces::voting::{
        ConfigParams, ConfigResponse, IVoteProposalDispatcher, IVoteProposalDispatcherTrait,
        ProposalCreated, ProposalParams, ProposalResolved, ProposalResult, ProposalType,
        ProposalVoted, SET_PROPOSAL_DURATION_IN_SECONDS, UserVote,
    };
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::num::traits::Zero;
    use openzeppelin::utils::serde::SerializedAppend;
    use snforge_std::cheatcodes::events::Event;
    use snforge_std::{
        CheatSpan, ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, EventSpyTrait,
        EventsFilterTrait, cheat_block_timestamp, cheat_caller_address, declare, spy_events,
    };
    use starknet::account::Call;
    use starknet::{ContractAddress, contract_address_const};
    use super::{IDaoAADispatcher, IDaoAADispatcherTrait, ISRC6Dispatcher, ISRC6DispatcherTrait};


    /// UTILITY FUNCTIONS

    fn OWNER() -> ContractAddress {
        contract_address_const::<'OWNER'>()
    }

    fn CREATOR() -> ContractAddress {
        contract_address_const::<'CREATOR'>()
    }

    fn deploy_token() -> ContractAddress {
        let mut constructor_calldata = array![];
        let decimals = 10_u8;
        constructor_calldata.append_serde('DaoToken');
        constructor_calldata.append_serde('DAOO');
        constructor_calldata.append_serde(100000_u256);
        constructor_calldata.append_serde(OWNER());
        decimals.serialize(ref constructor_calldata);

        let contract = declare("ERC20").unwrap().contract_class();
        let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
        contract_address
    }

    fn deploy_dao(token_contract_address: ContractAddress) -> ContractAddress {
        let mut constructor_calldata = array![];
        let owner = OWNER();
        let public_key = 55555_u256;
        constructor_calldata.append_serde(owner);
        constructor_calldata.append_serde(token_contract_address);
        constructor_calldata.append_serde(public_key);
        constructor_calldata.append_serde('STARKNET ADDRESS');

        let contract = declare("DaoAA").unwrap().contract_class();
        let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

        contract_address
    }

    fn init_default_proposal(
        proposal_dispatcher: IVoteProposalDispatcher, created_at: u64,
    ) -> u256 {
        cheat_block_timestamp(
            proposal_dispatcher.contract_address, created_at, CheatSpan::TargetCalls(1),
        );
        cheat_caller_address(
            proposal_dispatcher.contract_address, CREATOR(), CheatSpan::TargetCalls(1),
        );
        let proposal_params = ProposalParams {
            content: "My Proposal",
            proposal_type: Default::default(),
            proposal_automated_transaction: Default::default(),
        };
        let calldata_1 = Call {
            to: contract_address_const::<'TO'>(),
            selector: 'selector',
            calldata: array!['data 1', 'data 2'].span(),
        };

        let calldata_2 = Call {
            to: contract_address_const::<'ANOTHER'>(),
            selector: 'another selector',
            calldata: array!['data 3', 'data 4', 'data 5'].span(),
        };
        // created by 'CREATOR'
        let proposal_id = proposal_dispatcher
            .create_proposal(proposal_params, array![calldata_1, calldata_2]);
        assert(!proposal_dispatcher.is_executable(calldata_1), '');
        assert(!proposal_dispatcher.is_executable(calldata_2), '');
        proposal_id
    }

    fn feign_executable_proposal(
        proposal_id: u256,
        proposal_dispatcher: IVoteProposalDispatcher,
        token_dispatcher: IERC20Dispatcher,
        creator: ContractAddress,
    ) {
        let voter_1 = contract_address_const::<'VOTER 1'>();
        let voter_2 = contract_address_const::<'VOTER 2'>();
        let voter_3 = contract_address_const::<'VOTER 3'>();
        let voter_4 = contract_address_const::<'VOTER 4'>();

        let mut spy = spy_events();

        let voters = array![voter_1, voter_2, voter_3, voter_4];
        // cast two yes, one abstention, and one no
        // to prove abstention votes are not used when processing results at the moment,
        // the percentage outcome for validation here should be 66% (2/3) and not 50% (2/4)
        // so the proposal should pass
        let mut votes = array![UserVote::Yes, UserVote::Abstention, UserVote::No, UserVote::Yes];

        let created_at = starknet::get_block_timestamp();
        let mint_amount = 100;
        for voter in voters {
            cheat_caller_address(
                token_dispatcher.contract_address, OWNER(), CheatSpan::TargetCalls(1),
            );
            // mint
            let transferred = token_dispatcher.transfer(voter, mint_amount);
            assert(transferred, 'TOKEN TRANSFER ERROR');
            assert(token_dispatcher.balance_of(voter) == 100, 'BALANCE ERROR');
            // cast vote
            cheat_caller_address(
                proposal_dispatcher.contract_address, voter, CheatSpan::TargetCalls(1),
            );
            proposal_dispatcher.cast_vote(proposal_id, votes.pop_front());
        }

        let current_time = created_at
            + SET_PROPOSAL_DURATION_IN_SECONDS
            + 1; // Proposal duration reached
        cheat_block_timestamp(
            proposal_dispatcher.contract_address, current_time, CheatSpan::TargetCalls(1),
        );
        proposal_dispatcher.process_result(proposal_id);

        let expected_event = VotingComponent::Event::ProposalResolved(
            ProposalResolved { id: proposal_id, owner: creator, result: ProposalResult::Passed },
        );

        spy.assert_emitted(@array![(proposal_dispatcher.contract_address, expected_event)]);
    }

    /// TESTS

    #[test]
    fn test_proposal_creation() {
        // snforge test afk::dao::dao_aa::tests::test_proposal_creation --exact
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let caller = CREATOR();

        let created_at = starknet::get_block_timestamp();
        let end_at = created_at + SET_PROPOSAL_DURATION_IN_SECONDS;

        let mut spy = spy_events();

        let proposal_id = init_default_proposal(proposal_dispatcher, created_at);
        assert(proposal_id > 0, 'No proposal created');

        let creation_event = VotingComponent::Event::ProposalCreated(
            ProposalCreated { id: proposal_id, owner: caller, created_at, end_at },
        );

        spy.assert_emitted(@array![(proposal_contract, creation_event)]);
    }

    #[test]
    fn test_proposal_vote_success() {
        // snforge test afk::dao::dao_aa::tests::test_proposal_vote_success --exact
        let voter = OWNER(); // minted with tokens
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };

        let voter_balance = token_dispatcher.balance_of(voter);
        assert(voter_balance > 0, 'MINT FAILED');

        let proposal_id = init_default_proposal(
            proposal_dispatcher, starknet::get_block_timestamp(),
        );

        let mut spy = spy_events();
        let voted_at = starknet::get_block_timestamp();
        cheat_block_timestamp(proposal_contract, voted_at, CheatSpan::TargetCalls(1));
        cheat_caller_address(proposal_contract, voter, CheatSpan::TargetCalls(1));
        proposal_dispatcher.cast_vote(proposal_id, Option::None); // should use a default then.

        let voted_event = VotingComponent::Event::ProposalVoted(
            ProposalVoted {
                id: proposal_id,
                voter,
                vote: Default::default(),
                votes: voter_balance,
                total_votes: voter_balance,
                voted_at,
            },
        );

        spy.assert_emitted(@array![(proposal_contract, voted_event)]);
    }

    #[test]
    fn test_proposal_cancelation_success() {
        // snforge test afk::dao::dao_aa::tests::test_proposal_cancelation_success --exact
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let creator = CREATOR();

        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let proposal_id = init_default_proposal(
            proposal_dispatcher, starknet::get_block_timestamp(),
        );
        cheat_caller_address(proposal_contract, creator, CheatSpan::TargetCalls(1));
        proposal_dispatcher.cancel_proposal(proposal_id);

        let proposal = proposal_dispatcher.get_proposal(proposal_id);
        assert(proposal.proposal_result == ProposalResult::Canceled, 'CANCEL FAILED');
    }

    #[test]
    fn test_update_config_success() {
        // snforge test afk::dao::dao_aa::tests::test_update_config_success --exact
        let token_contract = contract_address_const::<'init'>();
        let proposal_contract = deploy_dao(token_contract);
        let dao_dispatcher = IDaoAADispatcher { contract_address: proposal_contract };

        let old_token_contract = dao_dispatcher.get_token_contract_address();
        assert(token_contract == old_token_contract, '');
        let new_token_contract = contract_address_const::<'new'>();
        let minimal_balance_voting = 5000;
        // change just two values
        cheat_caller_address(proposal_contract, OWNER(), CheatSpan::TargetCalls(1));
        let config_params = ConfigParams {
            is_admin_bypass_available: Option::None,
            // note: default is true, set in constructor. But we don't wish to change it.
            is_only_dao_execution: Option::None,
            token_contract_address: Option::Some(new_token_contract),
            minimal_balance_voting: Option::Some(minimal_balance_voting),
            max_balance_per_vote: Option::None,
            minimal_balance_create_proposal: Option::None,
            minimum_threshold_percentage: Option::None // 60 init in the contructor
        };

        dao_dispatcher.update_config(config_params);
        let config_response = dao_dispatcher.get_config();
        assert(
            config_response.is_only_dao_execution, 'UPDATE ERROR',
        ); // should return true, unchanged
        assert(config_response.token_contract_address == new_token_contract, 'TOKEN UPDATE ERROR');
        assert(
            config_response.minimal_balance_voting == minimal_balance_voting, 'VOTING UPDATE ERROR',
        );
    }

    #[test]
    #[should_panic(expected: 'PROPOSAL HAS ENDED')]
    fn test_proposal_should_panic_when_voted_on_upon_expiration() {
        // snforge test
        // afk::dao::dao_aa::tests::test_proposal_should_panic_when_voted_on_upon_expiration --exact
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let voter = OWNER();

        let created_at = starknet::get_block_timestamp();
        let vote_at = created_at + SET_PROPOSAL_DURATION_IN_SECONDS + 1; // expiry + 1.
        let proposal_id = init_default_proposal(proposal_dispatcher, created_at);

        cheat_block_timestamp(proposal_contract, vote_at, CheatSpan::TargetCalls(1));
        cheat_caller_address(proposal_contract, voter, CheatSpan::TargetCalls(1));
        proposal_dispatcher.cast_vote(proposal_id, Option::None); // should panic
    }

    #[test]
    #[should_panic(expected: 'CANNOT VOTE ON PROPOSAL')]
    fn test_proposal_should_panic_when_voted_on_upon_cancelation() {
        // snforge test
        // afk::dao::dao_aa::tests::test_proposal_should_panic_when_voted_on_upon_cancelation
        // --exact
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let voter = OWNER();

        let proposal_id = init_default_proposal(
            proposal_dispatcher, starknet::get_block_timestamp(),
        );
        cheat_caller_address(proposal_contract, CREATOR(), CheatSpan::TargetCalls(1));
        proposal_dispatcher.cancel_proposal(proposal_id);

        cheat_caller_address(proposal_contract, voter, CheatSpan::TargetCalls(1));
        proposal_dispatcher.cast_vote(proposal_id, Option::None);
    }

    #[test]
    #[should_panic(expected: 'INVALID PROPOSAL ID')]
    fn test_proposal_should_panic_with_nonexistent_id() {
        // snforge test
        // afk::dao::dao_aa::tests::test_proposal_should_panic_with_nonexistent_id --exact
        let proposal_contract = deploy_dao('token'.try_into().unwrap());
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let _ = proposal_dispatcher.get_proposal(1);
    }

    #[test]
    #[should_panic(expected: 'CANNOT PROCESS PROPOSAL')]
    fn test_proposal_should_panic_when_processed_before_expiration() {
        let proposal_contract = deploy_dao('token'.try_into().unwrap());
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let proposal_id = init_default_proposal(
            proposal_dispatcher, starknet::get_block_timestamp(),
        );
        proposal_dispatcher.process_result(proposal_id);
    }

    #[test]
    fn test_proposal_process_result_success() {
        // snforge test afk::dao::dao_aa::tests::test_proposal_process_result_success --exact
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };

        let created_at = starknet::get_block_timestamp();
        let proposal_id = init_default_proposal(proposal_dispatcher, created_at);

        feign_executable_proposal(proposal_id, proposal_dispatcher, token_dispatcher, CREATOR());

        let calldata_1 = Call {
            to: contract_address_const::<'TO'>(),
            selector: 'selector',
            calldata: array!['data 1', 'data 2'].span(),
        };

        let calldata_2 = Call {
            to: contract_address_const::<'ANOTHER'>(),
            selector: 'another selector',
            calldata: array!['data 3', 'data 4', 'data 5'].span(),
        };

        // non-existent calldata
        let calldata_3 = Call {
            to: contract_address_const::<'TO'>(),
            selector: 'another selector',
            calldata: array!['data 3', 'data 5'].span(),
        };
        // the creating call should be executable
        assert(proposal_dispatcher.is_executable(calldata_1), '1 NOT EXECUTABLE');
        assert(proposal_dispatcher.is_executable(calldata_2), '2 NOT EXECUTABLE');

        // this should not be executable. it doesn't even exist.
        assert(!proposal_dispatcher.is_executable(calldata_3), 'INIT FAILED');
    }
    /// NOTE: WHEN THERE ARE FOUR (FOR EXAMPLE) IDENTICAL CALLDATA, ALL FOUR ARE EXECUTABLE, TRUE;
    /// BUT THE STORAGE HAS BEEN ENHANCED IN THAT IF ONLY THREE IDENTICAL CALLDATA ARE CAPTURED ON
    /// PROCESSING OF RESULTS, THE LAST __execute__ call WITH THE FOURTH IDENTITCAL CALLDATA WILL
    /// FAIL.
    /// ADDITIONAL CHECKS/ENHANCEMENT MAY BE ADDED IN THE FUTURE TO ACCOMMODATE CALLDATA THAT NEEDS
    /// RECURRING __execute__ calls.
    ///

    #[test]
    fn test_proposal_execution_success() {
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let target_contract = contract_address_const::<'TARGET'>();

        assert(token_dispatcher.balance_of(target_contract) == 0, '');

        // initialize an executable proposal
        let created_at = starknet::get_block_timestamp();
        cheat_block_timestamp(
            proposal_dispatcher.contract_address, created_at, CheatSpan::TargetCalls(1),
        );
        cheat_caller_address(
            proposal_dispatcher.contract_address, OWNER(), CheatSpan::TargetCalls(1),
        );

        let proposal_params = ProposalParams {
            content: "My Proposal",
            proposal_type: Default::default(),
            proposal_automated_transaction: Default::default(),
        };

        let mut calldata = array![];
        let transfer_amount = 100_u256;
        target_contract.serialize(ref calldata);
        transfer_amount.serialize(ref calldata);

        let call = Call {
            to: token_contract, selector: selector!("transfer"), calldata: calldata.span(),
        };

        // created by 'OWNER'
        let proposal_id = proposal_dispatcher.create_proposal(proposal_params, array![call]);
        assert(!proposal_dispatcher.is_executable(call), 'NOT EXECUTABLE');

        feign_executable_proposal(proposal_id, proposal_dispatcher, token_dispatcher, OWNER());
        let creator_balance = token_dispatcher.balance_of(OWNER());
        println!("Before call, owner balance: {}", creator_balance);

        let account_dispatcher = ISRC6Dispatcher { contract_address: proposal_contract };

        // __execute__ avoids calls from other contracts.
        cheat_caller_address(proposal_contract, Zero::zero(), CheatSpan::TargetCalls(1));
        cheat_caller_address(token_contract, OWNER(), CheatSpan::Indefinite);
        let return_value = account_dispatcher.__execute__(array![call]);

        assert(token_dispatcher.balance_of(target_contract) == transfer_amount, 'EXECUTION FAILED');
        let current_creator_balance = creator_balance - transfer_amount;

        println!("Expected balance after execution: {}", current_creator_balance);
        assert(
            token_dispatcher.balance_of(OWNER()) == current_creator_balance, 'BALANCE NOT EQUAL',
        );
        let mut call_serialized_retval = *return_value.at(0);
        let call_retval = Serde::<bool>::deserialize(ref call_serialized_retval);
        assert!(call_retval.unwrap());

        // assert the call is no longer executable
        assert(!proposal_dispatcher.is_executable(call), 'STATE CHANGE FAILED');
    }

    #[test]
    #[should_panic(expected: 'CALL VALIDATION ERROR')]
    fn test_proposal_should_panic_on_invalid_call_execution() {
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);

        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let target_contract = contract_address_const::<'TARGET'>();

        // initialize an executable proposal
        let created_at = starknet::get_block_timestamp();
        cheat_block_timestamp(
            proposal_dispatcher.contract_address, created_at, CheatSpan::TargetCalls(1),
        );
        cheat_caller_address(
            proposal_dispatcher.contract_address, OWNER(), CheatSpan::TargetCalls(1),
        );

        let proposal_params = ProposalParams {
            content: "My Proposal",
            proposal_type: Default::default(),
            proposal_automated_transaction: Default::default(),
        };

        let mut calldata = array![];
        let transfer_amount = 100_u256;
        target_contract.serialize(ref calldata);
        transfer_amount.serialize(ref calldata);

        let call = Call {
            to: token_contract, selector: selector!("transfer"), calldata: calldata.span(),
        };

        // created by 'OWNER'
        let proposal_id = proposal_dispatcher.create_proposal(proposal_params, array![call]);

        feign_executable_proposal(proposal_id, proposal_dispatcher, token_dispatcher, OWNER());
        let creator_balance = token_dispatcher.balance_of(OWNER());
        println!("Before call, owner balance: {}", creator_balance);

        let account_dispatcher = ISRC6Dispatcher { contract_address: proposal_contract };

        // __execute__ avoids calls from other contracts.
        cheat_caller_address(proposal_contract, Zero::zero(), CheatSpan::TargetCalls(1));
        cheat_caller_address(token_contract, OWNER(), CheatSpan::Indefinite);
        let _ = account_dispatcher.__execute__(array![call]);

        assert(token_dispatcher.balance_of(target_contract) == transfer_amount, 'EXECUTION FAILED');

        // execute the same call. should panic because the call has already been executed.
        cheat_caller_address(proposal_contract, Zero::zero(), CheatSpan::TargetCalls(1));
        let _ = account_dispatcher.__execute__(array![call]);
    }

    #[test]
    #[should_panic]
    fn test_proposal_call_storage_not_updated_on_execution_failure() {
        let token_contract = deploy_token();
        let proposal_contract = deploy_dao(token_contract);
        let proposal_dispatcher = IVoteProposalDispatcher { contract_address: proposal_contract };
        let token_dispatcher = IERC20Dispatcher { contract_address: token_contract };

        ///
        let created_at = starknet::get_block_timestamp();
        cheat_caller_address(proposal_contract, CREATOR(), CheatSpan::TargetCalls(1));
        let proposal_params = ProposalParams {
            content: "My Proposal",
            proposal_type: Default::default(),
            proposal_automated_transaction: Default::default(),
        };
        let calldata_1 = Call {
            to: token_contract,
            selector: selector!("balance_of"),
            calldata: array!['data 1', 'data 2'].span(),
        };

        let calldata_2 = Call {
            to: token_contract,
            selector: selector!("balance_of"),
            calldata: array!['data 3', 'data 4', 'data 5'].span(),
        };
        // created by 'CREATOR'
        let proposal_id = proposal_dispatcher
            .create_proposal(proposal_params, array![calldata_1, calldata_2]);
        assert(!proposal_dispatcher.is_executable(calldata_1), '');
        assert(!proposal_dispatcher.is_executable(calldata_2), '');
        ///

        feign_executable_proposal(proposal_id, proposal_dispatcher, token_dispatcher, CREATOR());
        let account_dispatcher = ISRC6Dispatcher { contract_address: proposal_contract };
        // assert these two are executable
        assert(proposal_dispatcher.is_executable(calldata_1), 'CALLDATA 1 NOT EXECUTABLE');
        assert(proposal_dispatcher.is_executable(calldata_2), 'CALLDATA 2 NOT EXECUTABLE');

        cheat_caller_address(proposal_contract, Zero::zero(), CheatSpan::TargetCalls(1));
        account_dispatcher.__execute__(array![calldata_1, calldata_2]);

        assert(proposal_dispatcher.is_executable(calldata_1), 'UDATE ERROR')
    }

    #[test]
    #[should_panic(expected: 'UNAUTHORIZED CALLER')]
    fn test_proposal_should_panic_on_config_update_unauthorized_caller() {
        let token_contract = contract_address_const::<'init'>();
        let proposal_contract = deploy_dao(token_contract);
        let dao_dispatcher = IDaoAADispatcher { contract_address: proposal_contract };

        let old_token_contract = dao_dispatcher.get_token_contract_address();
        assert(token_contract == old_token_contract, '');
        let new_token_contract = contract_address_const::<'new'>();
        let minimal_balance_voting = 5000;

        // change just two values. This change will be made by an unauthorized caller
        cheat_caller_address(proposal_contract, CREATOR(), CheatSpan::TargetCalls(1));
        let config_params = ConfigParams {
            is_admin_bypass_available: Option::None,
            // note: default is true, set in constructor. But we don't wish to change it.
            is_only_dao_execution: Option::None,
            token_contract_address: Option::Some(new_token_contract),
            minimal_balance_voting: Option::Some(minimal_balance_voting),
            max_balance_per_vote: Option::None,
            minimal_balance_create_proposal: Option::None,
            minimum_threshold_percentage: Option::None // 60 init in the contructor
        };

        dao_dispatcher.update_config(config_params); // should panic.
    }
}
