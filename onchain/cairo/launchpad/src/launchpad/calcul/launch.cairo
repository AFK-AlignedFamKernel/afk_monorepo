use afk_launchpad::launchpad::calcul::exponential::{
    get_coin_amount_by_quote_amount_exponential, // calculate_initial_price
    get_coin_amount_exponential, get_meme_amount_exponential
};
use afk_launchpad::launchpad::calcul::linear::{
    // get_coin_amount_by_quote_amount, // calculate_pricing,
     get_coin_amount, get_meme_amount
};
use afk_launchpad::types::launchpad_types::{
    TokenLaunch, BondingType, //  LaunchParameters, EkuboLP, LiquidityType, CallbackData,
};
use starknet::ContractAddress;
const BPS: u256 = 10_000; // 100% = 10_000 bps
const SCALE_FACTOR: u256 =
    100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff
// Define constants
const MIN_PRICE: u256 = 1_u256; // Minimum price to prevent division by zero
// TODO add Percentage to be more precise
// Be able to change the Liq Ratio for user
// division and others stuff Total supply / LIQUIDITY_RATIO
// Get the 20% of Bonding curve going to Liquidity
// Liquidity can be lock to Unrug
const LIQUIDITY_RATIO: u256 = 5; // Divid by 5 the total supply.

pub fn get_initial_price(
    threshold_liquidity: u256, sellable_supply: u256, bonding_curve_type: BondingType
) -> u256 {
    match bonding_curve_type {
        BondingType::Linear => { 0 },
        BondingType::Exponential => { 0 },
        _ => { 0 },
    }
}

pub fn get_amount_by_type_of_coin_or_quote(
    pool: TokenLaunch,
    coin_address: ContractAddress,
    amount: u256,
    is_decreased: bool,
    is_quote_amount: bool,
) -> u256 {
    let bonding_type = pool.bonding_curve_type.clone();
    match bonding_type {
        BondingType::Linear => {
            if is_quote_amount == true {
                get_meme_amount(pool, amount)
            } else {
                get_coin_amount(pool, amount)
            }
        },
        BondingType::Exponential => {
            if is_quote_amount == true {
                get_meme_amount_exponential(pool, amount)
            } else {
                get_coin_amount_exponential(pool, amount)
            }
        },
        _ => {
            if is_quote_amount == true {
                get_meme_amount(pool, amount)
            } else {
                get_coin_amount(pool, amount)
            }
        },
    }
}
