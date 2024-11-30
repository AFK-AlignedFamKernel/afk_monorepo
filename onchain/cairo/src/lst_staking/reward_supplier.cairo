pub trait IRewardSupplier<TContractState> {
    fn calculate_staking_rewards(ref self: TContractState);
    fn claim_rewards(ref self: TContractState);
}

mod RewardSupplier {
    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    impl RewardSupplierImpl of super::IRewardSupplier<ContractState> {
        fn calculate_staking_rewards(ref self: ContractState) {
            5
        }

        fn claim_rewards(ref self: ContractState) {

        }
    }
}