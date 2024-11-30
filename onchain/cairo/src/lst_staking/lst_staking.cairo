pub struct StakerInfo {}

#[starknet::interface]
pub trait ILST_Staking<TContractState> {
    fn stake(ref self: TContractState, amount: u256);
    fn increase_stake(ref self: TContractState, amount: u256);
    fn unstake_intent(ref self: TContractState);
    fn unstake_action(ref self: TContractState);
    fn claim_rewards(ref self: TContractState);
}

#[starknet::contract]
mod LSTStaking {
    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    impl LSTStakingImpl of super::ILST_Staking<ContractState> {
        fn stake(ref self: ContractState, amount: u256) {

        }

        fn increase_stake(ref self: ContractState, amount: u256) {

        }

        fn unstake_intent(ref self: ContractState) {

        }

        fn unstake_action(ref self: ContractState) {

        }

        fn claim_rewards(ref self: ContractState) {

        }
    }
}