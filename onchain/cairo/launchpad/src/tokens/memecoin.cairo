// use afk_launchpad::tokens::erc20::{IERC20};
// use afk_launchpad::tokens::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
use afk_launchpad::types::launchpad_types::{
    LiquidityType, LiquidityParameters // SupportedExchanges, JediswapLiquidityParameters,
    // EkuboLiquidityParameters, EkuboPoolParameters
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn totalSupply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn balanceOf(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn transferFrom(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn increase_allowance(ref self: TContractState, spender: ContractAddress, added_value: u256);
    fn decrease_allowance(
        ref self: TContractState, spender: ContractAddress, subtracted_value: u256,
    );
}

#[starknet::interface]
pub trait IMemecoin<TContractState> {
    /// Returns whether the memecoin has been launched.
    ///
    /// # Returns
    ///
    /// * `bool` - True if the memecoin has been launched, false otherwise.
    fn is_launched(self: @TContractState) -> bool;

    /// Returns the number of the block during which the token has been launched,
    /// or 0 if not launched yet.
    fn launched_at_block_number(self: @TContractState) -> u64;

    /// Returns the liquidity parameters used to launch the memecoin.
    fn launched_with_liquidity_parameters(self: @TContractState) -> Option<LiquidityParameters>;

    /// Returns the type of liquidity the memecoin was launched with,
    /// along with either the LP tokens addresses or the NFT ID.
    fn liquidity_type(self: @TContractState) -> Option<LiquidityType>;

    /// Returns the team allocation.
    fn get_team_allocation(self: @TContractState) -> u256;

    /// Returns the memecoin factory address.
    fn memecoin_factory_address(self: @TContractState) -> ContractAddress;

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
        ref self: TContractState,
        liquidity_type: LiquidityType,
        liquidity_params: LiquidityParameters,
        transfer_restriction_delay: u64,
        max_percentage_buy_launch: u16,
        team_allocation: u256,
    );
    // // Ownable API
//   // IOwnable
// fn owner(self: @TContractState) -> ContractAddress;
// fn transfer_ownership(new_owner: ContractAddress);
// fn renounce_ownership();

    // // IOwnableCamelOnly
// fn transferOwnership(newOwner: ContractAddress);
// fn renounceOwnership();
}


#[starknet::contract]
pub mod Memecoin {
    use afk_launchpad::errors;
    use afk_launchpad::interfaces::factory::{IFactory, IFactoryDispatcher, IFactoryDispatcherTrait};
    use afk_launchpad::math::PercentageMath;
    use core::num::traits::Zero;
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::account::interface;
    use openzeppelin::governance::timelock::TimelockControllerComponent;
    use openzeppelin::governance::votes::VotesComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    // use openzeppelin::token::erc20::ERC20Component;
    use openzeppelin::utils::cryptography::nonces::NoncesComponent;
    use openzeppelin::utils::cryptography::snip12::SNIP12Metadata;
    // use core::OptionTrait;
    // use core::Option;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, // get_tx_info,
        get_block_timestamp, get_block_info,
    };
    use super::{
        LiquidityType, LiquidityParameters // SupportedExchanges, JediswapLiquidityParameters,
        // EkuboLiquidityParameters, EkuboPoolParameters
    };
    // use super::{IERC20Dispatcher, IERC20DispatcherTrait, IERC20};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: AccessControlComponent, storage: access_control, event: AccessControlEvent);

    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    // component!(path: TimelockControllerComponent, storage: timelock, event: TimelockEvent);
    // component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    // component!(path: VotesComponent, storage: erc20_votes, event: ERC20VotesEvent);
    // component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // // Timelock Mixin
    // #[abi(embed_v0)]
    // impl TimelockMixinImpl =
    //     TimelockControllerComponent::TimelockMixinImpl<ContractState>;
    // impl TimelockInternalImpl = TimelockControllerComponent::InternalImpl<ContractState>;

    // // Nonces
    // #[abi(embed_v0)]
    // impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    // // ERC20
    // #[abi(embed_v0)]
    // impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    // impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // // // // Votes
    // #[abi(embed_v0)]
    // impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    // impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // Constants.
    /// The minimum maximum percentage of the supply that can be bought at once.
    const MIN_MAX_PERCENTAGE_BUY_LAUNCH: u16 = 50; // 0.5%

    #[storage]
    struct Storage {
        name: ByteArray,
        symbol: ByteArray,
        decimals: u8,
        total_supply: u256,
        creator: ContractAddress,
        owner: ContractAddress,
        factory_contract: ContractAddress,
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        //memecoin
        team_allocation: u256,
        tx_hash_tracker: Map<ContractAddress, felt252>,
        transfer_restriction_delay: u64,
        launch_time: u64,
        launch_block_number: u64,
        launch_liquidity_parameters: Option<LiquidityParameters>,
        liquidity_type: Option<LiquidityType>,
        max_percentage_buy_launch: u16,
        capped_total_supply: u256,
        is_mint_paused: bool,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        // #[substorage(v0)]
        // timelock: TimelockControllerComponent::Storage,

        // #[substorage(v0)]
        // nonces: NoncesComponent::Storage,

        #[substorage(v0)]
        access_control: AccessControlComponent::Storage,
        // #[substorage(v0)]
    // erc20_votes: VotesComponent::Storage,

        // #[substorage(v0)]
    // pub erc20: ERC20Component::Storage,

    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        Approval: Approval,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        // #[flat]
    // TimelockEvent: TimelockControllerComponent::Event,
    // #[flat]
    // NoncesEvent: NoncesComponent::Event,

        // #[flat]
    // ERC20VotesEvent: VotesComponent::Event,

        // #[flat]
    // ERC20Event: ERC20Component::Event,
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

    // Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `after_update` hook of the `ERC20Component::ERC20HooksTrait`.
    // impl ERC20VotesHooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
    //     fn after_update(
    //         ref self: ERC20Component::ComponentState<ContractState>,
    //         from: ContractAddress,
    //         recipient: ContractAddress,
    //         amount: u256
    //     ) {
    //         // let mut contract_state = ERC20Component::HasComponent::get_contract_mut(ref self);
    //         // contract_state.erc20_votes.transfer_voting_units(from, recipient, amount);
    //         self.erc20_votes.transfer_voting_units(from, recipient, amount)
    //     }
    // }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        decimals: u8,
        recipient: ContractAddress,
        owner: ContractAddress,
        factory: ContractAddress,
    ) {
        // let caller = get_caller_address();
        self.name.write(name);
        self.symbol.write(symbol);
        self.decimals.write(decimals);
        assert(!recipient.is_zero(), 'ERC20: mint to the 0 address');
        self.total_supply.write(initial_supply);
        self.balances.entry(recipient).write(initial_supply);

        self.liquidity_type.write(Option::None);

        // Initialize the token / internal logic
        // self.initializer(factory_address: get_caller_address(), :initial_supply,);
        self.initializer(factory_address: factory, :initial_supply);

        // Init Timelock Gov
        // proposers
        // Add params
        // let mut proposers = ArrayTrait::new();
        // let mut executors = ArrayTrait::new();
        // proposers.append(caller);
        // executors.append(caller);
        // let min_delay=100_000;
        // self.timelock.initializer(min_delay, proposers.span(), executors.span(), caller);

        let caller = get_caller_address();
        self.creator.write(caller.clone());
        self.owner.write(owner.clone());
        self.factory_contract.write(factory.clone());
        // self.ownable.initializer(caller);
        self.ownable.initializer(caller);

        // Register the contract's support for the ISRC6 interface
        self.src5.register_interface(interface::ISRC6_ID);

        self
            .emit(
                Event::Transfer(
                    Transfer {
                        from: contract_address_const::<0>(), to: recipient, value: initial_supply,
                    },
                ),
            );
    }

    #[abi(embed_v0)]
    impl IERC20Impl of super::IERC20<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
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
            self: @ContractState, owner: ContractAddress, spender: ContractAddress,
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
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();
            self.spend_allowance(sender, caller, amount);
            self.transfer_helper(sender, recipient, amount);
            true
        }

        fn transferFrom(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            self.transfer_from(sender, recipient, amount)
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            self.approve_helper(caller, spender, amount);
            true
        }

        fn increase_allowance(
            ref self: ContractState, spender: ContractAddress, added_value: u256,
        ) {
            let caller = get_caller_address();
            self
                .approve_helper(
                    caller, spender, self.allowances.read((caller, spender)) + added_value,
                );
        }

        fn decrease_allowance(
            ref self: ContractState, spender: ContractAddress, subtracted_value: u256,
        ) {
            let caller = get_caller_address();
            self
                .approve_helper(
                    caller, spender, self.allowances.read((caller, spender)) - subtracted_value,
                );
        }
    }

    #[abi(embed_v0)]
    impl MemecoinEntrypoints of super::IMemecoin<ContractState> {
        // fn owner(self: @ContractState) -> ContractAddress {
        //     self.ownable.owner()
        // }
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
                errors::MAX_PERCENTAGE_BUY_LAUNCH_TOO_LOW,
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
            amount: u256,
        ) {
            assert(!sender.is_zero(), 'ERC20: transfer from 0');
            assert(!recipient.is_zero(), 'ERC20: transfer to 0');
            self.balances.entry(sender).write(self.balances.read(sender) - amount);
            self.balances.entry(recipient).write(self.balances.read(recipient) + amount);
            self.emit(Transfer { from: sender, to: recipient, value: amount });
        }
        fn spend_allowance(
            ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256,
        ) {
            let current_allowance = self.allowances.read((owner, spender));
            assert(current_allowance >= amount, 'not enough allowance');
            self.allowances.entry((owner, spender)).write(current_allowance - amount);
        }

        fn approve_helper(
            ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256,
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

        #[external(v0)]
        fn only_owner_allowed(ref self: ContractState) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();
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
            amount: u256,
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
            amount: u256,
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
                        contract_address: self.factory_contract.read(),
                    };
                    let ekubo_core_address = factory.ekubo_core_address();
                    if (get_caller_address() != ekubo_core_address) {
                        // When buying from Ekubo, the token is transferred from Ekubo Core
                        // to the recipient, so we return early if the caller is not Ekubo Core.
                        return;
                    }
                },
            }

            assert(
                amount <= self
                    .total_supply()
                    .percent_mul(self.max_percentage_buy_launch.read().into()),
                'Max buy cap reached',
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

