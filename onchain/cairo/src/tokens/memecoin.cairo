use afk::types::launchpad_types::{
    LiquidityType, LiquidityParameters, SupportedExchanges, JediswapLiquidityParameters,
    EkuboLiquidityParameters, EkuboPoolParameters
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn totalSupply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn balanceOf(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn increase_allowance(ref self: TContractState, spender: ContractAddress, added_value: u256);
    fn decrease_allowance(
        ref self: TContractState, spender: ContractAddress, subtracted_value: u256
    );
}

#[starknet::interface]
pub trait IMemecoin<TState> {
    /// Returns whether the memecoin has been launched.
    ///
    /// # Returns
    ///
    /// * `bool` - True if the memecoin has been launched, false otherwise.
    fn is_launched(self: @TState) -> bool;

    /// Returns the number of the block during which the token has been launched,
    /// or 0 if not launched yet.
    fn launched_at_block_number(self: @TState) -> u64;

    /// Returns the liquidity parameters used to launch the memecoin.
    fn launched_with_liquidity_parameters(self: @TState) -> Option<LiquidityParameters>;

    /// Returns the type of liquidity the memecoin was launched with,
    /// along with either the LP tokens addresses or the NFT ID.
    fn liquidity_type(self: @TState) -> Option<LiquidityType>;

    /// Returns the team allocation.
    fn get_team_allocation(self: @TState) -> u256;

    /// Returns the memecoin factory address.
    fn memecoin_factory_address(self: @TState) -> ContractAddress;

    /// Sets the memecoin as launched and transfers ownership to the zero address.
    ///
    /// This function can only be called by the factory contract. It sets the memecoin as launched,
    /// records the liquidity position and the launch time, and transfers ownership of the memecoin
    /// to the zero address.
    ///
    /// # Arguments
    ///
    /// * `liquidity_type` - The liquidity position at the time of launch.
    /// * `transfer_restriction_delay` - The delay in seconds before transfers are no longer
    /// limited.
    ///
    /// # Panics
    ///
    /// This function will panic if:
    ///
    /// * The caller's address is not the same as the `factory` of the memecoin (error code:
    /// `errors::CALLER_NOT_FACTORY`).
    /// * The memecoin has already been launched (error code: `errors::ALREADY_LAUNCHED`).
    ///
    fn set_launched(
        ref self: TState,
        liquidity_type: LiquidityType,
        liquidity_params: LiquidityParameters,
        transfer_restriction_delay: u64,
        max_percentage_buy_launch: u16,
        team_allocation: u256,
    );
}


#[starknet::contract]
pub mod Memecoin {
    use afk::errors;
    use afk::interfaces::factory::{IFactory, IFactoryDispatcher, IFactoryDispatcherTrait};
    use afk::math::PercentageMath;
    use core::num::traits::Zero;
    // use core::OptionTrait;
    // use core::Option;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, get_tx_info,
        get_block_timestamp, get_block_info
    };
    use super::{
        LiquidityType, LiquidityParameters, SupportedExchanges, JediswapLiquidityParameters,
        EkuboLiquidityParameters, EkuboPoolParameters
    };

    // Constants.
    /// The minimum maximum percentage of the supply that can be bought at once.
    const MIN_MAX_PERCENTAGE_BUY_LAUNCH: u16 = 50; // 0.5%

    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        decimals: u8,
        total_supply: u256,
        balances: Map::<ContractAddress, u256>,
        allowances: Map::<(ContractAddress, ContractAddress), u256>,
        //memecoin
        team_allocation: u256,
        tx_hash_tracker: LegacyMap<ContractAddress, felt252>,
        transfer_restriction_delay: u64,
        launch_time: u64,
        launch_block_number: u64,
        launch_liquidity_parameters: Option<LiquidityParameters>,
        factory_contract: ContractAddress,
        liquidity_type: Option<LiquidityType>,
        max_percentage_buy_launch: u16,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        Approval: Approval,
    }
    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        value: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct Approval {
        owner: ContractAddress,
        spender: ContractAddress,
        value: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: felt252,
        symbol: felt252,
        initial_supply: u256,
        recipient: ContractAddress,
        decimals: u8,
    ) {
        self.name.write(name);
        self.symbol.write(symbol);
        self.decimals.write(decimals);
        assert(!recipient.is_zero(), 'ERC20: mint to the 0 address');
        self.total_supply.write(initial_supply);
        self.balances.entry(recipient).write(initial_supply);

        self.liquidity_type.write(Option::None);

        // Initialize the token / internal logic
        self.initializer(factory_address: get_caller_address(), :initial_supply,);

        self
            .emit(
                Event::Transfer(
                    Transfer {
                        from: contract_address_const::<0>(), to: recipient, value: initial_supply
                    }
                )
            );
    }

    #[abi(embed_v0)]
    impl IERC20Impl of super::IERC20<ContractState> {
        fn name(self: @ContractState) -> felt252 {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> felt252 {
            self.symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn totalSupply(self: @ContractState) -> u256 {
            self.total_supply()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn balanceOf(self: @ContractState, account: ContractAddress) -> u256 {
            self.balance_of(account)
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress
        ) -> u256 {
            self.allowances.read((owner, spender))
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let sender = get_caller_address();
            self.transfer_helper(sender, recipient, amount);
            true
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) -> bool {
            let caller = get_caller_address();
            self.spend_allowance(sender, caller, amount);
            self.transfer_helper(sender, recipient, amount);
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            self.approve_helper(caller, spender, amount);
            true
        }

        fn increase_allowance(
            ref self: ContractState, spender: ContractAddress, added_value: u256
        ) {
            let caller = get_caller_address();
            self
                .approve_helper(
                    caller, spender, self.allowances.read((caller, spender)) + added_value
                );
        }

        fn decrease_allowance(
            ref self: ContractState, spender: ContractAddress, subtracted_value: u256
        ) {
            let caller = get_caller_address();
            self
                .approve_helper(
                    caller, spender, self.allowances.read((caller, spender)) - subtracted_value
                );
        }
    }

    #[abi(embed_v0)]
    impl MemecoinEntrypoints of super::IMemecoin<ContractState> {
        fn is_launched(self: @ContractState) -> bool {
            self.launch_time.read().is_non_zero()
        }

        fn launched_at_block_number(self: @ContractState) -> u64 {
            self.launch_block_number.read()
        }

        fn launched_with_liquidity_parameters(self: @ContractState) -> Option<LiquidityParameters> {
            self.launch_liquidity_parameters.read()
        }

        /// Returns the team allocation in tokens.
        fn get_team_allocation(self: @ContractState) -> u256 {
            self.team_allocation.read()
        }

        fn memecoin_factory_address(self: @ContractState) -> ContractAddress {
            self.factory_contract.read()
        }

        fn liquidity_type(self: @ContractState) -> Option<LiquidityType> {
            self.liquidity_type.read()
        }

        fn set_launched(
            ref self: ContractState,
            liquidity_type: LiquidityType,
            liquidity_params: LiquidityParameters,
            transfer_restriction_delay: u64,
            max_percentage_buy_launch: u16,
            team_allocation: u256,
        ) {
            self.assert_only_factory();
            assert(!self.is_launched(), errors::ALREADY_LAUNCHED);
            assert(
                max_percentage_buy_launch >= MIN_MAX_PERCENTAGE_BUY_LAUNCH,
                errors::MAX_PERCENTAGE_BUY_LAUNCH_TOO_LOW
            );

            // save liquidity params and launch block number
            self.launch_block_number.write(get_block_info().unbox().block_number);
            self.launch_liquidity_parameters.write(Option::Some(liquidity_params));

            self.liquidity_type.write(Option::Some(liquidity_type));
            self.launch_time.write(get_block_timestamp());
            self.team_allocation.write(team_allocation);

            // Enable a transfer limit - until this time has passed,
            // transfers are limited to a certain amount.
            self.max_percentage_buy_launch.write(max_percentage_buy_launch);
            self.transfer_restriction_delay.write(transfer_restriction_delay);
            //TODO renounce ownership
        // self.ownable._transfer_ownership(0.try_into().unwrap());
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn transfer_helper(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            assert(!sender.is_zero(), 'ERC20: transfer from 0');
            assert(!recipient.is_zero(), 'ERC20: transfer to 0');
            self.balances.entry(sender).write(self.balances.read(sender) - amount);
            self.balances.entry(recipient).write(self.balances.read(recipient) + amount);
            self.emit(Transfer { from: sender, to: recipient, value: amount });
        }
        fn spend_allowance(
            ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256
        ) {
            let current_allowance = self.allowances.read((owner, spender));
            assert(current_allowance >= amount, 'not enough allowance');
            self.allowances.entry((owner, spender)).write(current_allowance - amount);
        }

        fn approve_helper(
            ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256
        ) {
            assert(!spender.is_zero(), 'ERC20: approve from 0');
            self.allowances.entry((owner, spender)).write(amount);
            self.emit(Approval { owner, spender, value: amount });
        }
    }

    #[generate_trait]
    impl MemecoinInternalImpl of MemecoinInternalTrait {
        fn assert_only_factory(self: @ContractState) {
            assert(get_caller_address() == self.factory_contract.read(), errors::NOT_FACTORY);
        }

        /// Initializes the state of the memecoin contract.
        ///
        /// This function sets the factory contract address, enables a transfer limit delay,
        /// checks and allocates the team supply of the memecoin, and mints the remaining supply to
        /// the factory.
        ///
        /// # Arguments
        ///
        /// * `factory_address` - The address of the factory contract.
        /// * `initial_supply` - The initial supply of the memecoin.
        /// * `initial_holders` - A span of addresses that will hold the memecoin initially.
        /// * `initial_holders_amounts` - A span of amounts corresponding to the initial holders.
        ///
        /// # Returns
        /// * `u256` - The total amount of memecoin allocated to the team.
        fn initializer(
            ref self: ContractState, factory_address: ContractAddress, initial_supply: u256,
        ) {
            // Internal Registry
            self.factory_contract.write(factory_address);
            // Mint remaining supply to the contract
        // self.erc20._mint(recipient: factory_address, amount: initial_supply);
        }

        /// Transfers tokens from the sender to the recipient, by applying relevant restrictions.
        fn _transfer(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            // When we launch on jediswap on the factory, we invoke the add_liquidity() of the
            // router, which performs a transferFrom() to send the tokens to the pool.
            // Therefore, we need to bypass this validation if the sender is the factory contract.
            if sender != self.factory_contract.read() {
                self.apply_transfer_restrictions(sender, recipient, amount)
            }
            self.transfer_helper(sender, recipient, amount);
        }

        /// Applies the relevant transfer restrictions, if the timing for restrictions has not
        /// elapsed yet.
        /// - Before launch, the number of holders and their allocation does not exceed the maximum
        /// allowed.
        /// - After launch, the transfer amount does not exceed a certain percentage of the total
        /// supply.
        /// and the recipient has not already received tokens in the current transaction.
        ///
        /// By returning early if the transaction performed is not a direct buy from the pair /
        /// ekubo core, we ensure that the restrictions only trigger once, when the coin is moved
        /// from pools.
        /// As such, this keeps compatibility with aggregators and routers that perform multiple
        /// transfers when swapping tokens.
        ///
        /// # Arguments
        ///
        /// * `sender` - The address of the sender.
        /// * `recipient` - The address of the recipient.
        /// * `amount` - The amount of tokens to transfer.
        fn apply_transfer_restrictions(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            if self.is_after_time_restrictions() {
                return;
            }

            //TODO(audit): shouldnt ever happen since factory has all the supply
            if !self.is_launched() {
                return;
            }
            // Safe unwrap as we already checked that the coin is launched,
            // thus the liquidity type is not none.
            match self.liquidity_type.read().unwrap() {
                LiquidityType::JediERC20(pair) => {
                    if (get_caller_address() != pair) {
                        // When buying from jediswap, the caller_address is the pair,
                        // so we return early if the caller is not the pair to not apply
                        // restrictions.
                        return;
                    }
                },
                LiquidityType::StarkDeFiERC20(pair) => {
                    if (get_caller_address() != pair) {
                        // same as above
                        return;
                    }
                },
                LiquidityType::EkuboNFT(_) => {
                    let factory = IFactoryDispatcher {
                        contract_address: self.factory_contract.read()
                    };
                    let ekubo_core_address = factory.ekubo_core_address();
                    if (get_caller_address() != ekubo_core_address) {
                        // When buying from Ekubo, the token is transferred from Ekubo Core
                        // to the recipient, so we return early if the caller is not Ekubo Core.
                        return;
                    }
                }
            }

            assert(
                amount <= self
                    .total_supply()
                    .percent_mul(self.max_percentage_buy_launch.read().into()),
                'Max buy cap reached'
            );
        }

        /// Checks if the current time is after the launch period.
        ///
        /// # Returns
        ///
        /// * `bool` - True if the current time is after the launch period, false otherwise.
        ///
        fn is_after_time_restrictions(self: @ContractState) -> bool {
            let current_time = get_block_timestamp();
            self.is_launched()
                && current_time >= (self.launch_time.read()
                    + self.transfer_restriction_delay.read())
        }
    }
}

