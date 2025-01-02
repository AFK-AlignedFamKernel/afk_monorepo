use afk_launchpad::types::jediswap_types::{MintParams, // IncreaseLiquidityParams
};
use starknet::{ContractAddress, get_caller_address, contract_address_const, ClassHash};


#[starknet::interface]
pub trait IJediswapFactoryV2<TContractState> {
    // ************************************
    // * snake_case
    // ************************************

    // Views
    fn get_pair(
        self: @TContractState, token0: ContractAddress, token1: ContractAddress
    ) -> ContractAddress;
    fn get_pool(
        self: @TContractState, token_a: ContractAddress, token_b: ContractAddress, fee: u32
    ) -> ContractAddress;
    fn fee_amount_tick_spacing(self: @TContractState, fee: u32) -> u32;
    fn get_fee_protocol(self: @TContractState) -> u8;

    // Write
    fn create_pool(
        ref self: TContractState, token_a: ContractAddress, token_b: ContractAddress, fee: u32
    ) -> ContractAddress;
}

#[starknet::interface]
pub trait IJediswapRouterV2<TContractState> { // ************************************
    // * snake_case
    // ************************************
    fn factory(self: @TContractState) -> ContractAddress;
    fn sort_tokens(
        self: @TContractState, tokenA: ContractAddress, tokenB: ContractAddress
    ) -> (ContractAddress, ContractAddress);
    fn add_liquidity(
        ref self: TContractState,
        tokenA: ContractAddress,
        tokenB: ContractAddress,
        amountADesired: u256,
        amountBDesired: u256,
        amountAMin: u256,
        amountBMin: u256,
        to: ContractAddress,
        deadline: u64
    ) -> (u256, u256, u256);
    fn swap_exact_tokens_for_tokens(
        ref self: TContractState,
        amountIn: u256,
        amountOutMin: u256,
        path: Array::<ContractAddress>,
        to: ContractAddress,
        deadline: u64
    ) -> Array<u256>;
}

#[starknet::interface]
pub trait IJediswapNFTRouterV2<TContractState> {
    // ************************************
    // * snake_case
    // ************************************

    // Write
    fn mint(ref self: TContractState, mint: MintParams) -> (u256, u128, u256, u256);
    fn create_and_initialize_pool(
        ref self: TContractState,
        token0: ContractAddress,
        token1: ContractAddress,
        fee: u32,
        sqrt_price_X96: u256
    ) -> ContractAddress;
    // fn mint(ref self:TState, token_id:u256, token_b:ContractAddress, fee:u32)-> (u256, u128,
    // u256, u256);

    // Views
    fn get_position(
        self: @TContractState, token_id: u256, token_b: ContractAddress, fee: u32
    ) -> ContractAddress;
    fn factory(self: @TContractState) -> ContractAddress;
}

#[starknet::interface]
pub trait IJediswapRouter<TContractState> {
    fn factory(self: @TContractState) -> ContractAddress;
    fn sort_tokens(
        self: @TContractState, tokenA: ContractAddress, tokenB: ContractAddress
    ) -> (ContractAddress, ContractAddress);
    fn add_liquidity(
        ref self: TContractState,
        tokenA: ContractAddress,
        tokenB: ContractAddress,
        amountADesired: u256,
        amountBDesired: u256,
        amountAMin: u256,
        amountBMin: u256,
        to: ContractAddress,
        deadline: u64
    ) -> (u256, u256, u256);
    fn swap_exact_tokens_for_tokens(
        ref self: TContractState,
        amountIn: u256,
        amountOutMin: u256,
        path: Array::<ContractAddress>,
        to: ContractAddress,
        deadline: u64
    ) -> Array<u256>;
}

#[starknet::interface]
pub trait IJediswapFactory<TContractState> {
    fn get_pair(
        self: @TContractState, token0: ContractAddress, token1: ContractAddress
    ) -> ContractAddress;
    fn create_pair(
        ref self: TContractState, tokenA: ContractAddress, tokenB: ContractAddress
    ) -> ContractAddress;
}
// #[starknet::interface]
// pub trait IJediswapV1<TState> { // ************************************
// // * snake_case
// // ************************************

// }

