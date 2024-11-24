use core::starknet::ContractAddress;

#[starknet::interface]
trait IStaking<TContractState> {
    fn set_rewards_duration(ref self: TContractState, duration: u256);
    fn notify_reward_amount(ref self: TContractState, amount: u256);
    fn stake(ref self: TContractState, amount: u256);
    fn withdraw(ref self: TContractState, amount: u256);

    fn last_time_reward_applicable(self: @TContractState) -> u256;
    fn reward_per_token(self: @TContractState) -> u256;
    fn earned(self: @TContractState, account: ContractAddress) -> u256;
    fn get_reward(ref self: TContractState);

    fn staking_token(self: @TContractState) -> ContractAddress;
    fn rewards_token(self: @TContractState) -> ContractAddress;
    fn duration(self: @TContractState) -> u256;
    fn finish_at(self: @TContractState) -> u256;
    fn updated_at(self: @TContractState) -> u256;
    fn reward_rate(self: @TContractState) -> u256;
    fn reward_per_token_stored(self: @TContractState) -> u256;
    fn user_reward_per_token_paid(self: @TContractState, user: ContractAddress) -> u256;
    fn rewards(self: @TContractState, user: ContractAddress) -> u256;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, user: ContractAddress) -> u256;
    fn owner(self: @TContractState) -> ContractAddress;

    fn return_block_timestamp(self: @TContractState) -> u256;
}

#[starknet::component]
pub mod StakingComponent {
    use core::starknet::{ContractAddress, get_block_timestamp};
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Map, StoragePathEntry};


    #[storage]
    struct Storage {
        owner: ContractAddress,
        staking_token: ContractAddress, 
        rewards_token: ContractAddress,
        duration: u256,
        finish_at: u256,
        updated_at: u256,
        reward_rate: u256,
        reward_per_token_stored: u256,
        user_reward_per_token_paid: Map<ContractAddress, u256>,
        rewards: Map<ContractAddress, u256>,
        total_supply: u256,
        balance_of: Map<ContractAddress, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        StakedSuccessful: StakedSuccessful,
        WithdrawalSuccessful: WithdrawalSuccessful,
        RewardsWithdrawn: RewardsWithdrawn
    }

    #[derive(Drop, starknet::Event)]
    struct StakedSuccessful {
        user: ContractAddress,
        amount: u256
    }

    #[derive(Drop, starknet::Event)]
    struct WithdrawalSuccessful {
        user: ContractAddress,
        amount: u256
    }

    #[derive(Drop, starknet::Event)]
    struct RewardsWithdrawn {
        user: ContractAddress,
        amount: u256
    }

    #[embeddable_as(StakingImpl)]
    impl Staking<TContractState, +HasComponent<TContractState>> of super::IStaking<ComponentState<TContractState>> {

        fn set_rewards_duration(ref self: ComponentState<TContractState>, duration: u256) {

        }

        fn notify_reward_amount(ref self: ComponentState<TContractState>, amount: u256) {

        }

        fn stake(ref self: ComponentState<TContractState>, amount: u256) {

        }

        fn withdraw(ref self: ComponentState<TContractState>, amount: u256) {

        }

        fn get_reward(ref self: ComponentState<TContractState>) {
            
        }

        fn last_time_reward_applicable(self: @ComponentState<TContractState>) -> u256 {

            9
        }

        fn reward_per_token(self: @ComponentState<TContractState>) -> u256 {

            8
        }

        fn earned(self: @ComponentState<TContractState>, account: ContractAddress) -> u256 {

            9
        }

        //////// Read Functions //////////////////

        fn staking_token(self: @ComponentState<TContractState>) -> ContractAddress {
            self.staking_token.read()
        }

        fn rewards_token(self: @ComponentState<TContractState>) -> ContractAddress {
            self.rewards_token.read()
        }

        fn duration(self: @ComponentState<TContractState>) -> u256 {
            self.duration.read()
        }

        fn finish_at(self: @ComponentState<TContractState>) -> u256 {
            self.finish_at.read()
        }

        fn updated_at(self: @ComponentState<TContractState>) -> u256 {
            self.updated_at.read()
        }

        fn reward_rate(self: @ComponentState<TContractState>) -> u256 {
            self.reward_rate.read()
        }

        fn reward_per_token_stored(self: @ComponentState<TContractState>) -> u256 {
            self.reward_per_token_stored.read()
        }

        fn user_reward_per_token_paid(self: @ComponentState<TContractState>, user: ContractAddress) -> u256 {
            self.user_reward_per_token_paid.entry(user).read()
        }

        fn rewards(self: @ComponentState<TContractState>, user: ContractAddress) -> u256 {
            self.rewards.entry(user).read()
        }

        fn total_supply(self: @ComponentState<TContractState>) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ComponentState<TContractState>, user: ContractAddress) -> u256 {
            self.balance_of.entry(user).read()
        }

        fn owner(self: @ComponentState<TContractState>) -> ContractAddress {
            self.owner.read()
        }

        fn return_block_timestamp(self: @ComponentState<TContractState>) -> u256 {
            get_block_timestamp().try_into().unwrap()
        }
    }

    #[generate_trait]
    pub impl InternalImpl<TContractState, +HasComponent<TContractState>> of InternalTrait<TContractState> {
        /// Initializes the contract by setting the owner, staking_token and reward_token.
        /// To prevent reinitialization, this should only be used inside of a contract's constructor.
        fn initializer(ref self: ComponentState<TContractState>, owner: ContractAddress, staking_token: ContractAddress, reward_token: ContractAddress) {
            self.owner.write(owner);
            self.staking_token.write(staking_token);
            self.rewards_token.write(reward_token);
        }
    }
}
