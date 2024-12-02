#[starknet::contract]
mod StakingRewards {
    use crate::staking::staking::StakingComponent;
    use starknet::ContractAddress;

    component!(path: StakingComponent, storage: staking, event: StakingEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        staking: StakingComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        StakingEvent: StakingComponent::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        staking_token: ContractAddress,
        reward_token: ContractAddress
    ) {
        self.staking._initializer(owner, staking_token, reward_token);
    }

    #[abi(embed_v0)]
    impl StakingImpl = StakingComponent::StakingImpl<ContractState>;
    impl StakingInternalImpl = StakingComponent::InternalImpl<ContractState>;
}