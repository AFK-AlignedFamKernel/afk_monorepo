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
    use core::starknet::{ContractAddress};
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Map, StoragePathEntry};


    #[storage]
    struct Storage {
        staking_token: ContractAddress, 
        rewards_token: ContractAddress,
        owner: ContractAddress,
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
    }

    #[generate_trait]
    pub impl InternalImpl<TContractState, +HasComponent<TContractState>> of InternalTrait<TContractState> {
        
    }
}
