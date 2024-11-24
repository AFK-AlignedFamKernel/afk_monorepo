use core::starknet::ContractAddress;

#[starknet::interface]
trait IStaking<TContractState> {
    fn set_rewards_duration(ref self: TContractState, duration: u256);
    fn notify_reward_amount(ref self: TContractState, amount: u256);
    fn stake(ref self: TContractState, amount: u256);
    fn withdraw(ref self: TContractState, amount: u256);
    fn get_reward(ref self: TContractState);

    fn last_time_reward_applicable(self: @TContractState) -> u256;
    fn reward_per_token(self: @TContractState) -> u256;
    fn rewards_earned(self: @TContractState, account: ContractAddress) -> u256;

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

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;

    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;

    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;

    fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
}

#[starknet::component]
pub mod StakingComponent {
    use core::num::traits::Zero;
    use core::starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, Map, StoragePathEntry
    };
    use core::starknet::{
        ContractAddress, get_block_timestamp, contract_address_const, get_caller_address,
        get_contract_address
    };
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    const ONE_E18: u256 = 1000000000000000000_u256;

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

    pub mod Errors {
        pub const NOT_AUTHORIZED: felt252 = 'Not authorized owner';
        pub const REWARD_DURATION_NOT_FINISHED: felt252 = 'Reward duration not finished';
        pub const REWARD_RATE_IS_ZERO: felt252 = 'Reward rate = 0';
        pub const REWARD_AMOUNT_GREATER_THAN_CONTRACT_BALANCE: felt252 = 'Reward amount > balance';
        pub const AMOUNT_IS_ZERO: felt252 = 'Amount = 0';
        pub const INSUFFICIENT_STAKE_BALANCE: felt252 = 'Insufficient stake balance';
        pub const TRANSFER_FAILED: felt252 = 'Transfer failed';
    }

    #[embeddable_as(StakingImpl)]
    impl Staking<
        TContractState, +HasComponent<TContractState>
    > of super::IStaking<ComponentState<TContractState>> {
        fn set_rewards_duration(ref self: ComponentState<TContractState>, duration: u256) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), Errors::NOT_AUTHORIZED);

            let block_timestamp: u256 = get_block_timestamp().try_into().unwrap();
            assert(self.finish_at.read() < block_timestamp, Errors::REWARD_DURATION_NOT_FINISHED);

            self.duration.write(duration);
        }

        fn notify_reward_amount(ref self: ComponentState<TContractState>, amount: u256) {
            let caller = get_caller_address();
            let this_contract = get_contract_address();

            assert(caller == self.owner.read(), Errors::NOT_AUTHORIZED);

            let zero_address = self.zero_address();

            self.update_reward(zero_address);

            let block_timestamp: u256 = get_block_timestamp().try_into().unwrap();

            if block_timestamp >= self.finish_at.read() {
                self.reward_rate.write(amount / self.duration.read())
            } else {
                let remaining_rewards = (self.finish_at.read() - block_timestamp)
                    * self.reward_rate.read();

                self.reward_rate.write((amount + remaining_rewards) / self.duration.read());
            }

            let rewards_token = IERC20Dispatcher { contract_address: self.rewards_token.read() };

            assert(self.reward_rate.read() > 0, Errors::REWARD_RATE_IS_ZERO);
            assert(
                self.reward_rate.read()
                    * self.duration.read() <= rewards_token.balance_of(this_contract),
                Errors::REWARD_AMOUNT_GREATER_THAN_CONTRACT_BALANCE
            );

            self.finish_at.write(get_block_timestamp().try_into().unwrap() + self.duration.read());
            self.updated_at.write(get_block_timestamp().try_into().unwrap());
        }

        fn stake(ref self: ComponentState<TContractState>, amount: u256) {
            let caller = get_caller_address();
            let this_contract = get_contract_address();

            self.update_reward(caller);

            assert(amount > 0, Errors::AMOUNT_IS_ZERO);
            let staking_token = IERC20Dispatcher { contract_address: self.staking_token.read() };
            let transfer = staking_token.transfer_from(caller, this_contract, amount);

            assert(transfer, Errors::TRANSFER_FAILED);

            let prev_stake = self.balance_of.entry(caller).read();
            self.balance_of.entry(caller).write(prev_stake + amount);

            let prev_supply = self.total_supply.read();
            self.total_supply.write(prev_supply + amount);

            self.emit(StakedSuccessful {
                user: caller,
                amount
            });
        }

        fn withdraw(ref self: ComponentState<TContractState>, amount: u256) {
            let caller = get_caller_address();

            self.update_reward(caller);

            assert(amount > 0, Errors::AMOUNT_IS_ZERO);

            let prev_stake = self.balance_of.entry(caller).read();
            assert(prev_stake >= amount, Errors::INSUFFICIENT_STAKE_BALANCE);
            self.balance_of.entry(caller).write(prev_stake - amount);

            let prev_supply = self.total_supply.read();
            self.total_supply.write(prev_supply - amount);

            let staking_token = IERC20Dispatcher { contract_address: self.staking_token.read() };
            let transfer = staking_token.transfer(caller, amount);

            assert(transfer, Errors::TRANSFER_FAILED);

            self.emit(WithdrawalSuccessful {
                user: caller,
                amount
            });
        }

        fn get_reward(ref self: ComponentState<TContractState>) {
            let caller = get_caller_address();
            let reward = self.rewards.entry(caller).read();

            if reward > 0 {
                self.rewards.entry(caller).write(0);
                IERC20Dispatcher { contract_address: self.rewards_token.read() }
                    .transfer(caller, reward);
            }

            self.emit(RewardsWithdrawn {
                user: caller,
                amount: reward
            });
        }


        //////////////////// Read Functions ////////////////////
        fn last_time_reward_applicable(self: @ComponentState<TContractState>) -> u256 {
            let block_timestamp: u256 = get_block_timestamp().try_into().unwrap();
            self.min(self.finish_at.read(), block_timestamp)
        }

        fn reward_per_token(self: @ComponentState<TContractState>) -> u256 {
            if self.total_supply.read() == 0 {
                self.reward_per_token_stored.read()
            } else {
                self.reward_per_token_stored.read()
                    + (self.reward_rate.read()
                        * (self.last_time_reward_applicable() - self.updated_at.read())
                        * ONE_E18)
                        / self.total_supply.read()
            }
        }

        fn rewards_earned(self: @ComponentState<TContractState>, account: ContractAddress) -> u256 {
            ((self.balance_of.entry(account).read()
                * (self.reward_per_token() - self.user_reward_per_token_paid.entry(account).read()))
                / ONE_E18)
                + self.rewards.entry(account).read()
        }

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

        fn user_reward_per_token_paid(
            self: @ComponentState<TContractState>, user: ContractAddress
        ) -> u256 {
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
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        /// Initializes the contract by setting the owner, staking_token and reward_token.
        /// To prevent reinitialization, this should only be used inside of a contract's
        /// constructor.
        fn initializer(
            ref self: ComponentState<TContractState>,
            owner: ContractAddress,
            staking_token: ContractAddress,
            reward_token: ContractAddress
        ) {
            self.owner.write(owner);
            self.staking_token.write(staking_token);
            self.rewards_token.write(reward_token);
        }

        fn update_reward(ref self: ComponentState<TContractState>, account: ContractAddress) {
            self.reward_per_token_stored.write(self.reward_per_token());
            self.updated_at.write(self.last_time_reward_applicable());

            if account.is_non_zero() {
                self.rewards.entry(account).write(self.rewards_earned(account));
                self
                    .user_reward_per_token_paid
                    .entry(account)
                    .write(self.reward_per_token_stored.read());
            }
        }

        fn min(self: @ComponentState<TContractState>, x: u256, y: u256) -> u256 {
            if x <= y {
                x
            } else {
                y
            }
        }

        fn zero_address(self: @ComponentState<TContractState>) -> ContractAddress {
            contract_address_const::<0>()
        }
    }
}
