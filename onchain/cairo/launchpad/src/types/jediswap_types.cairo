use starknet::ContractAddress;

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct MintParams {
    pub token0: ContractAddress,
    pub token1: ContractAddress,
    pub fee: u32,
    pub tick_lower: i32,
    pub tick_upper: i32,
    pub amount0_desired: u256,
    pub amount1_desired: u256,
    pub amount0_min: u256,
    pub amount1_min: u256,
    pub recipient: ContractAddress,
    pub deadline: u64,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct IncreaseLiquidityParams {
    pub token_id: u256,
    pub amount0_desired: u256,
    pub amount1_desired: u256,
    pub amount0_min: u256,
    pub amount1_min: u256,
    pub deadline: u64,
}

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct DecreaseLiquidityParams {
    pub token_id: u256,
    pub liquidity: u128,
    pub amount0_min: u256,
    pub amount1_min: u256,
    pub deadline: u64,
}
