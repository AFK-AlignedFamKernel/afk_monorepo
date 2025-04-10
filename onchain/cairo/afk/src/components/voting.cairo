#[starknet::component]
pub mod VotingComponent {
    use afk::interfaces::voting::{
        Calldata, ConfigParams, ConfigResponse, IVoteProposal, MetadataDAO, Proposal,
        ProposalCanceled, ProposalCreated, ProposalParams, ProposalResolved, ProposalResult,
        ProposalType, ProposalVoted, SET_PROPOSAL_DURATION_IN_SECONDS, TOKEN_DECIMALS, UserVote,
        VoteState,
    };
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::utils::execute_calls;
    use core::hash::{HashStateExTrait, HashStateTrait};
    use core::poseidon::{PoseidonTrait, poseidon_hash_span};
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

    #[storage]
    pub struct Storage {
        is_admin_bypass_available: bool,
        is_only_dao_execution: bool,
        // Voting storage
        token_contract_address: ContractAddress,
        minimal_balance_voting: u256,
        max_balance_per_vote: u256,
        minimal_balance_create_proposal: u256,
        is_multi_vote_available_per_token_balance: bool,
        minimum_threshold_percentage: u64,
        proposals: Map<u256, Option<Proposal>>, // Map ProposalID => Proposal
        proposals_calldata: Map<u256, Vec<Calldata>>, // Map ProposalID => calldata
        proposal_by_user: Map<ContractAddress, u256>,
        total_proposal: u256,
        // Map (Hashed Call, executable_count) => executable, for extra security.
        executable_tx: Map<(felt252, u64), bool>,
        // Map Proposal ID => Hashed Call (for one call, multicall excluded)
        proposal_tx: Map<u256, Vec<felt252>>,
        // Map ProposalID => VoteState
        vote_state_by_proposal: Map<u256, VoteState>,
        // vote_by_proposal: Map<u256, Proposal>,
        tx_data_per_proposal: Map<u256, Span<felt252>>, // 
        executables_count: u64,
        executed_count: u64, // for __execute__ security.
        // variable for optimized iteration. stores the highest
        max_executable_clone: Map<felt252, u64>,
        current_max_tx_count: u64, // optimized for get iteration
        total_voters: u128,
        deployer: ContractAddress,
        owner: ContractAddress,
        metadata_dao: MetadataDAO,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ProposalCreated: ProposalCreated,
        ProposalVoted: ProposalVoted,
        ProposalCanceled: ProposalCanceled,
        ProposalResolved: ProposalResolved,
    }

    #[embeddable_as(VotingImpl)]
    pub impl Vote<
        TContractState, +HasComponent<TContractState>,
    > of IVoteProposal<ComponentState<TContractState>> {
        // TODO
        // Check if ERC20 minimal balance to create a proposal is needed, if yes check the  balance
        // Add TX Calldata for this proposal
        fn create_proposal(
            ref self: ComponentState<TContractState>,
            proposal_params: ProposalParams,
            calldata: Array<Call>,
        ) -> u256 {
            let owner = get_caller_address();
            let minimal_balance = self.minimal_balance_create_proposal.read();

            // for now, proposals cannot be created without a calldata
            assert(calldata.len() > 0, 'NO CALLDATA PRESENT');

            if minimal_balance > 0 {
                let vote_token_dispatcher = IERC20Dispatcher {
                    contract_address: self.token_contract_address.read(),
                };
                assert(
                    vote_token_dispatcher.balance_of(owner) > minimal_balance,
                    'INSUFFICIENT CREATION FUNDS',
                );
            }

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
            };

            // check
            self.proposals.entry(id).write(Option::Some(proposal));

            self._resolve_proposal_calldata(id, calldata);
            self.total_proposal.write(id);
            self.emit(ProposalCreated { id, owner, created_at, end_at });

            id
        }

        fn cast_vote(
            ref self: ComponentState<TContractState>,
            proposal_id: u256,
            opt_vote_type: Option<UserVote>,
        ) {
            // TODO
            // Check if ERC20 minimal balance is needed
            // Check if ERC20 max balance is needed
            // Check is_multi_vote_available_per_token_balance

            // Finish the voting part
            // done
            let voted_at = starknet::get_block_timestamp();
            let caller = get_caller_address();
            let proposal = self._get_proposal(proposal_id);
            assert(proposal.proposal_result == Default::default(), 'CANNOT VOTE ON PROPOSAL');
            assert(voted_at < proposal.end_at, 'PROPOSAL HAS ENDED');
            let mut vote_state = self.vote_state_by_proposal.entry(proposal_id);
            assert(
                !vote_state.user_has_voted.entry(caller).read()
                    && !self.is_multi_vote_available_per_token_balance.read(),
                'CALLER HAS VOTED',
            );

            // Use balance for vote power
            let vote_token_dispatcher = IERC20Dispatcher {
                contract_address: self.token_contract_address.read(),
            };
            let caller_balance = vote_token_dispatcher
                .balance_of(caller); // this is without its decimals
            // let number_of_votes: u64 = (caller_balance /
            // TOKEN_DECIMALS.into()).try_into().unwrap();

            let max_votes = self.max_balance_per_vote.read();
            assert(
                caller_balance > 0 && caller_balance >= self.minimal_balance_voting.read(),
                'INSUFFICIENT VOTING FUNDS',
            );

            let mut caller_votes = if caller_balance > max_votes && max_votes > 0 {
                max_votes
            } else {
                caller_balance
            };

            let previous_voter_count = vote_state.voter_count.read();
            vote_state.voter_count.write(previous_voter_count + 1);

            let vote_type: UserVote = match opt_vote_type {
                Option::Some(vote_type) => vote_type,
                _ => Default::default(),
            };

            vote_state.user_votes.entry(caller).write((vote_type, caller_votes));
            vote_state.user_has_voted.entry(caller).write(true);
            vote_state.voters_list.append().write(caller);
            self.total_voters.write(self.total_voters.read() + 1);

            // NOTE: Config for abstention currently does nothing in this function
            if vote_type == UserVote::Yes {
                let (mut yes_votes, mut vote_point) = vote_state.yes_votes.read();
                vote_state.yes_votes.write((yes_votes + 1, vote_point + caller_votes));
            } else if vote_type == UserVote::No {
                let (mut no_votes, mut vote_point) = vote_state.no_votes.read();
                vote_state.no_votes.write((no_votes + 1, vote_point + caller_votes));
            } else {
                caller_votes = 0;
            }

            let previous_vote_count = vote_state.no_of_votes.read();
            vote_state.no_of_votes.write(previous_vote_count + caller_votes);

            self
                .emit(
                    ProposalVoted {
                        id: proposal_id,
                        voter: caller,
                        vote: vote_type,
                        votes: caller_votes,
                        total_votes: previous_vote_count + caller_votes,
                        voted_at,
                    },
                );
        }

        fn get_proposal(self: @ComponentState<TContractState>, proposal_id: u256) -> Proposal {
            self._get_proposal(proposal_id)
        }

        fn get_user_vote(
            self: @ComponentState<TContractState>, proposal_id: u256, user: ContractAddress,
        ) -> UserVote {
            let caller = get_caller_address();
            let _ = self._get_proposal(proposal_id); // assert
            let mut vote_state = self.vote_state_by_proposal.entry(proposal_id);
            assert(vote_state.user_has_voted.entry(caller).read(), 'CALLER HAS NO VOTES');

            let (user_vote, _) = vote_state.user_votes.entry(caller).read();
            user_vote
        }

        fn cancel_proposal(ref self: ComponentState<TContractState>, proposal_id: u256) {
            let mut proposal = self._get_proposal(proposal_id);
            assert(get_caller_address() == proposal.owner, 'UNAUTHORIZED CALLER');
            assert(proposal.proposal_result == Default::default(), 'CANNOT CANCEL PROPOSAL');
            proposal.proposal_result = ProposalResult::Canceled;
            self.proposals.entry(proposal_id).write(Option::Some(proposal));

            self
                .emit(
                    ProposalCanceled {
                        id: proposal_id, owner: get_caller_address(), is_canceled: true,
                    },
                );
        }

        fn process_result(ref self: ComponentState<TContractState>, proposal_id: u256) {
            let mut proposal = self._get_proposal(proposal_id);
            assert(
                proposal.proposal_result == Default::default()
                    && starknet::get_block_timestamp() > proposal.end_at,
                'CANNOT PROCESS PROPOSAL',
            );

            // Implement result logic
            // Implement logic, brings us back to the execute
            // TODO: Implement execute in the future if Proposal is validated
            // for now, we just process the yes and no votes, update proposal state and emit an
            // event.
            let mut vote_state = self.vote_state_by_proposal.entry(proposal_id);

            let (yes_votes, _) = vote_state.yes_votes.read();
            let (no_votes, _) = vote_state.no_votes.read();

            // NOTE: The abstention votes are not used in this calculation
            // do well to reconfirm. For now, we use total_votes as:
            let total_votes = yes_votes + no_votes;
            let valid_threshold_percentage = yes_votes * 100 / total_votes;

            if valid_threshold_percentage >= self.minimum_threshold_percentage.read() {
                let mut executables_count = self.executables_count.read() + 1;
                proposal.proposal_result = ProposalResult::Passed;

                let proposal_txs = self.proposal_tx.entry(proposal_id);

                // extract list of txs for the given proposal
                for i in 0..proposal_txs.len() {
                    let proposal_tx = proposal_txs.at(i).read();
                    // further optimized.
                    // situation where different proposals have the same calldata to
                    // execute.
                    let mut tx_count = self.max_executable_clone.entry(proposal_tx).read() + 1;

                    self.executable_tx.entry((proposal_tx, tx_count)).write(true);
                    let mut current_max_tx_count = self.current_max_tx_count.read();
                    // update the current max if the new tx_count is > current_max_tx_count
                    if tx_count > current_max_tx_count {
                        self.current_max_tx_count.write(tx_count);
                    }
                    self.max_executable_clone.entry(proposal_tx).write(tx_count);
                    executables_count += 1;
                }

                // update the number of executables adequately
                self.executables_count.write(executables_count);
            } else {
                proposal.proposal_result = ProposalResult::Failed;
            }

            self
                .emit(
                    ProposalResolved {
                        id: proposal_id, owner: proposal.owner, result: proposal.proposal_result,
                    },
                );
            self.proposals.entry(proposal_id).write(Option::Some(proposal));
        }

        fn is_executable(ref self: ComponentState<TContractState>, calldata: Call) -> bool {
            let mut is_executable = false;
            let calldata_hash = calldata.hash_struct();
            let max_executable_clone = self.max_executable_clone.entry(calldata_hash).read() + 1;
            for i in 0..max_executable_clone {
                if self.executable_tx.entry((calldata_hash, i)).read() {
                    is_executable = true;
                    break;
                }
            }
            is_executable
        }

        fn add_metadata_dao(ref self: ComponentState<TContractState>, metadata: MetadataDAO) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'UNAUTHORIZED CALLER');
            self.metadata_dao.write(metadata);
        }
    }

    #[generate_trait]
    pub impl VotingInternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of VoteInternalTrait<TContractState> {
        fn _init(
            ref self: ComponentState<TContractState>,
            token_contract_address: ContractAddress,
            deployer: ContractAddress,
            owner: ContractAddress,
        ) {
            self.token_contract_address.write(token_contract_address);
            self.is_only_dao_execution.write(true);
            self.minimum_threshold_percentage.write(60);
            self.deployer.write(deployer);
            self.owner.write(owner);
        }
        fn _get_proposal(self: @ComponentState<TContractState>, proposal_id: u256) -> Proposal {
            let opt_proposal = self.proposals.entry(proposal_id).read();
            assert(opt_proposal.is_some(), 'INVALID PROPOSAL ID');

            opt_proposal.unwrap()
        }

        fn _update_config(ref self: ComponentState<TContractState>, config_params: ConfigParams) {
            // Updates all possible proposal configuration for
            if let Option::Some(var) = config_params.is_admin_bypass_available {
                self.is_admin_bypass_available.write(var);
            }
            if let Option::Some(var) = config_params.is_only_dao_execution {
                self.is_only_dao_execution.write(var);
            }
            if let Option::Some(var) = config_params.token_contract_address {
                self.token_contract_address.write(var);
            }
            if let Option::Some(var) = config_params.minimal_balance_voting {
                self.minimal_balance_voting.write(var);
            }
            if let Option::Some(var) = config_params.max_balance_per_vote {
                self.max_balance_per_vote.write(var);
            }
            if let Option::Some(var) = config_params.minimal_balance_create_proposal {
                self.minimal_balance_create_proposal.write(var);
            }
            if let Option::Some(var) = config_params.minimum_threshold_percentage {
                self.minimum_threshold_percentage.write(var);
            }
        }

        fn _get_config(self: @ComponentState<TContractState>) -> ConfigResponse {
            ConfigResponse {
                is_admin_bypass_available: self.is_admin_bypass_available.read(),
                is_only_dao_execution: self.is_only_dao_execution.read(),
                token_contract_address: self.token_contract_address.read(),
                minimal_balance_voting: self.minimal_balance_voting.read(),
                max_balance_per_vote: self.max_balance_per_vote.read(),
                minimal_balance_create_proposal: self.minimal_balance_create_proposal.read(),
                minimum_threshold_percentage: self.minimum_threshold_percentage.read(),
            }
        }

        fn _resolve_proposal_calldata(
            ref self: ComponentState<TContractState>, id: u256, calldata: Array<Call>,
        ) {
            let proposal_calldata = self.proposals_calldata.entry(id);

            for data in calldata {
                proposal_calldata.append().to.write(data.to);
                proposal_calldata.append().selector.write(data.selector);
                proposal_calldata.append().is_executed.write(false);

                for call in data.calldata {
                    proposal_calldata.append().calldata.append().write(*call);
                }

                self.proposal_tx.entry(id).append().write(data.hash_struct());
            };
        }

        fn _execute(
            ref self: ComponentState<TContractState>, calls: Array<Call>,
        ) -> Array<Span<felt252>> {
            let mut verified_calls: Array<(felt252, u64)> = array![];
            // Verify calls before executing
            for i in 0..calls.len() {
                // iterate through the max_executable_clone for each tx.
                let current_call = *calls.at(i);
                let current_call_hash = current_call.hash_struct();
                let max_tx_count = self.max_executable_clone.entry(current_call_hash).read();
                let mut tx_count = 1;
                let mut is_executable = false;
                while tx_count <= max_tx_count {
                    is_executable = self.executable_tx.entry((current_call_hash, tx_count)).read();
                    if is_executable {
                        // mark the call as executed (now as a non-executable)
                        // not yet, add to list of verified calls
                        // self
                        //     .executable_tx
                        //     .entry((current_call_hash, tx_count))
                        //     .write(false);
                        verified_calls.append((current_call_hash, tx_count));
                        break;
                    }
                    tx_count += 1;
                }
                assert(is_executable, 'CALL VALIDATION ERROR');
                // TODO
            // currently there's no way to set a Proposal as executed because this task
            // will require the proposals id. In that case, it must be done manually.
            }

            let executed_calls = execute_calls(calls);

            // mark all as executed.
            for verified_call in verified_calls {
                self.executable_tx.entry(verified_call).write(false);
                self.executed_count.write(self.executed_count.read() + 1);
            }

            executed_calls
        }
    }

    pub impl CallStructHash of StructHash<Call> {
        fn hash_struct(self: @Call) -> felt252 {
            let hash_state = PoseidonTrait::new();
            hash_state
                .update_with('AFK_DAO')
                .update_with(*self.to)
                .update_with(*self.selector)
                .update_with(poseidon_hash_span(*self.calldata))
                .finalize()
        }
    }
}
