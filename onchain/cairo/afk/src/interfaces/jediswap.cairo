use afk::types::jediswap_types::{MintParams // IncreaseLiquidityParams
};
use starknet::{ClassHash, ContractAddress, contract_address_const, get_caller_address};


#[starknet::interface]
pub trait IJediswapV1<TState> { // ************************************
// * snake_case
// ************************************

}


#[starknet::interface]
pub trait IJediswapFactoryV2<TState> {
    // ************************************
    // * snake_case
    // ************************************

    fn get_pair(self: @TState, token0: ContractAddress, token1: ContractAddress) -> ContractAddress;
    fn create_pair(
        ref self: TState, tokenA: ContractAddress, tokenB: ContractAddress,
    ) -> ContractAddress;

    // Views
    fn get_pool(
        self: @TState, token_a: ContractAddress, token_b: ContractAddress, fee: u32,
    ) -> ContractAddress;
    fn fee_amount_tick_spacing(self: @TState, fee: u32) -> u32;
    fn get_fee_protocol(self: @TState) -> u8;

    // Write
    fn create_pool(
        ref self: TState, token_a: ContractAddress, token_b: ContractAddress, fee: u32,
    ) -> ContractAddress;
}

#[starknet::interface]
pub trait IJediswapRouterV2<TState> {
    // ************************************
    // * snake_case
    // ************************************
    fn factory(self: @TState) -> ContractAddress;
    fn sort_tokens(
        self: @TState, tokenA: ContractAddress, tokenB: ContractAddress,
    ) -> (ContractAddress, ContractAddress);
    fn add_liquidity(
        ref self: TState,
        tokenA: ContractAddress,
        tokenB: ContractAddress,
        amountADesired: u256,
        amountBDesired: u256,
        amountAMin: u256,
        amountBMin: u256,
        to: ContractAddress,
        deadline: u64,
    ) -> (u256, u256, u256);
    fn swap_exact_tokens_for_tokens(
        ref self: TState,
        amountIn: u256,
        amountOutMin: u256,
        path: Array<ContractAddress>,
        to: ContractAddress,
        deadline: u64,
    ) -> Array<u256>;
}

#[starknet::interface]
pub trait IJediswapNFTRouterV2<TState> {
    // ************************************
    // * snake_case
    // ************************************

    // Write
    fn mint(ref self: TState, mint: MintParams) -> (u256, u128, u256, u256);
    fn create_and_initialize_pool(
        ref self: TState,
        token0: ContractAddress,
        token1: ContractAddress,
        fee: u32,
        sqrt_price_X96: u256,
    ) -> ContractAddress;
    // fn mint(ref self:TState, token_id:u256, token_b:ContractAddress, fee:u32)-> (u256, u128,
    // u256, u256);

    // Views
    fn get_position(
        self: @TState, token_id: u256, token_b: ContractAddress, fee: u32,
    ) -> ContractAddress;
    fn factory(self: @TState) -> ContractAddress;
}


// TODO verify docs
#[starknet::interface]
pub trait IJediswapFactoryV1<TState> {
    // ************************************
    // * snake_case
    // ************************************

    // Views
    fn get_pair(
        self: @TState, token_a: ContractAddress, token_b: ContractAddress,
    ) -> ContractAddress;
    // Views
    fn get_pool(
        self: @TState, token_a: ContractAddress, token_b: ContractAddress, fee: u32,
    ) -> ContractAddress;
    fn fee_amount_tick_spacing(self: @TState, fee: u32) -> u32;
    fn get_fee_protocol(self: @TState) -> u8;

    // Write
    fn create_pool(
        ref self: TState, token_a: ContractAddress, token_b: ContractAddress, fee: u32,
    ) -> ContractAddress;
}

