pub trait IDelegationPool<TContractState> {
    fn enter_delegation_pool(ref self: TContractState, amount: u256);
    fn add_to_delegation_pool(ref self: TContractState, amount: u256);
    fn exit_delegation_pool_intent(ref self: TContractState);
    fn exit_delegation_pool_action(ref self: TContractState);
    fn switch_delegation_pool(ref self: TContractState);
    fn claim_rewards(ref self: TContractState);
}

pub struct PoolMemberInfo {

}

#[starknet::contract]
mod DelegationPool {
    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    impl DelegationPoolImpl of super::IDelegationPool<ContractState> {
        fn enter_delegation_pool(ref self: ContractState, amount: u256) {

        }

        fn add_to_delegation_pool(ref self: ContractState, amount: u256) {

        }

        fn exit_delegation_pool_intent(ref self: ContractState) {

        }

        fn exit_delegation_pool_action(ref self: ContractState) {

        }

        fn switch_delegation_pool(ref self: ContractState) {

        }

        fn claim_rewards(ref self: ContractState) {

        }
    }
}