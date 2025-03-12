use afk_launchpad::types::launchpad_types::{
    SupportedExchanges, LaunchParameters, EkuboLP, EkuboPoolParameters, LiquidityType
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IFactory<TContractState> {
    /// Deploys a new memecoin, using the class hash that was registered in the factory upon
    /// initialization.
    ///
    /// This function deploys a new memecoin contract with the given parameters,
    /// and emits a `MemecoinCreated` event.
    ///
    /// * `owner` - The address of the Memecoin contract owner.
    /// * `name` - The name of the Memecoin.
    /// * `symbol` - The symbol of the Memecoin.
    /// * `initial_supply` - The initial supply of the Memecoin.
    /// * `initial_holders` - An array containing the initial holders' addresses.
    /// * `initial_holders_amounts` - An array containing the initial amounts held by each
    /// corresponding initial holder.
    /// * `quote_token` - The address of the quote token
    /// * `contract_address_salt` - A unique salt value for contract deployment
    ///
    /// # Returns
    ///
    /// The address of the newly created Memecoin smart contract.
    fn create_memecoin(
        ref self: TContractState,
        owner: ContractAddress,
        name: felt252,
        symbol: felt252,
        initial_supply: u256,
        contract_address_salt: felt252
    ) -> ContractAddress;

    /// Launches the memecoin on Jediswap by creating a liquidity pair and adding liquidity to it.
    ///
    /// This function can only be called by the owner of the memecoin and only if the memecoin has
    /// not been launched yet.
    /// Launching on jediswap requires `quote_amount` quote tokens to be approved for transfer to
    /// the factory.
    /// It creates a liquidity pair for the memecoin and the quote token on Jediswap, adds liquidity
    /// to it, and sets the memecoin as launched.
    ///
    /// # Arguments
    /// * launch_parameters - The parameters for the launch, including:
    ///     * `memecoin_address` - The address of the memecoin contract.
    ///     * `transfer_restriction_delay` - The delay in seconds during which transfers will be
    ///     limited to a % of max supply after launch.
    ///     * `max_percentage_buy_launch` - The max buyable amount in % of the max supply after
    ///     launch and during the transfer restriction delay.
    ///     * `quote_address` - The address of the quote token contract.
    /// * `quote_amount` - The amount of quote tokens to add as liquidity.
    /// * `unlock_time` - The timestamp when the liquidity can be unlocked.
    ///
    /// # Returns
    ///
    /// * `ContractAddress` - The address of the created liquidity pair.
    ///
    /// # Panics
    ///
    /// This function will panic if:
    ///
    /// * The caller's address is not the same as the `owner` of the memecoin (error code:
    /// `errors::CALLER_NOT_OWNER`).
    /// * The memecoin has already been launched (error code: `errors::ALREADY_LAUNCHED`).
    ///
    fn launch_on_jediswap(
        ref self: TContractState,
        launch_parameters: LaunchParameters,
        quote_amount: u256,
        unlock_time: u64,
    ) -> ContractAddress;

    /// Launches the memecoin on Ekubo by creating a pool with a set price and adding the memetoken
    /// to it.
    ///
    /// This function can only be called by the owner of the memecoin and only if the memecoin has
    /// not been launched yet.
    /// It creates a liquidity pair for the memecoin and a quote token on Ekubo, adds liquidity to
    /// it, and sets the memecoin as launched.
    ///
    /// # Arguments
    ///
    /// * launch_parameters - The parameters for the launch, including:
    ///     * `memecoin_address` - The address of the memecoin contract.
    ///     * `transfer_restriction_delay` - The delay in seconds during which transfers will be
    ///     limited to a % of max supply after launch.
    ///     * `max_percentage_buy_launch` - The max buyable amount in % of the max supply after
    ///     launch and during the transfer restriction delay.
    ///     * `quote_address` - The address of the quote token contract.
    /// * `ekubo_parameters` - The parameters for the ekubo liquidity pool, including:
    ///     - `fee` - The fee for the liquidity pair.
    ///     - `tick_spacing` - The spacing between ticks for the liquidity pool.
    ///     - `starting_price` - The starting tick for the liquidity pool.
    ///     - `bound` - The bound for the liquidity pool - should be set to the max tick for this
    ///     pool (the sign is determined in the contract).
    ///
    /// # Returns
    ///
    /// * `u64` - The ID of the created liquidity position.
    /// * `EkuboLP` - The details of the liquidity position.
    ///
    /// # Panics
    ///
    /// This function will panic if:
    ///
    /// * The caller's address is not the same as the `owner` of the memecoin (error code:
    /// `errors::CALLER_NOT_OWNER`).
    /// * The memecoin has already been launched (error message: 'memecoin already launched').
    ///
    fn launch_on_ekubo(
        ref self: TContractState,
        launch_parameters: LaunchParameters,
        ekubo_parameters: EkuboPoolParameters,
    ) -> (u64, EkuboLP);

    /// Launches the memecoin on StarkDeFi by creating a liquidity pool and adding liquidity to it.
    ///
    /// This function can only be called by the owner of the memecoin and only if the memecoin has
    /// not been launched yet.
    /// The launch is set to be a volatile pool with a 1% fee.
    /// Launching on StarkDeFi requires `quote_amount` quote tokens to be approved for transfer to
    /// the factory.
    /// It creates a liquidity pair for the memecoin and the quote token on StarkDeFi, adds
    /// liquidity to it, and sets the memecoin as launched.
    ///
    /// # Arguments
    /// same as launch_on_jediswap
    ///
    /// # Returns
    /// same as launch_on_jediswap
    ///
    /// # Panics
    ///
    /// same as launch_on_jediswap
    ///
    fn launch_on_starkdefi(
        ref self: TContractState,
        launch_parameters: LaunchParameters,
        quote_amount: u256,
        unlock_time: u64,
    ) -> ContractAddress;

    /// Returns the address for a given Exchange, provided that this Exchange
    /// was registered in the factory upon initialization.
    ///
    /// # Arguments
    ///
    /// * `exchange` - The exchange for which to retrieve the contract address.
    ///
    /// # Returns
    ///
    /// * `ContractAddress` - The contract address associated with the given Exchange name.
    fn exchange_address(self: @TContractState, exchange: SupportedExchanges) -> ContractAddress;

    /// Returns the address of the Lock manager, provided at factory deployment.
    fn lock_manager_address(self: @TContractState) -> ContractAddress;

    /// Returns information about the locked liquidity of a token launched with unruggable.
    ///
    /// # Arguments
    ///
    /// * `token` - The address of the token to fetch info for.
    ///
    /// # Returns
    ///
    /// * `ContractAddress` - The address where the liquidity is locked.
    /// * `LiquidityType` - The type of liquidity pair (ERC20 address of NFT id)
    fn locked_liquidity(
        self: @TContractState, token: ContractAddress
    ) -> Option<(ContractAddress, LiquidityType)>;

    /// Checks if a given address is a memecoin.
    ///
    /// This function will only return true if the memecoin was created by this factory.
    ///
    /// # Arguments
    ///
    /// * `address` - The address to check.
    ///
    /// # Returns
    ///
    /// * `bool` - Returns true if the address is a memecoin, false otherwise.
    fn is_memecoin(self: @TContractState, address: ContractAddress) -> bool;

    /// Returns the address of Ekubo Core, registered inside the EkuboLauncher contract.
    fn ekubo_core_address(self: @TContractState) -> ContractAddress;
}
