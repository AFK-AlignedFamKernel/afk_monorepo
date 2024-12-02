use afk::launchpad::calcul::exponential::{
    get_coin_amount_by_quote_amount_exponential, calculate_initial_price
};
use afk::launchpad::calcul::linear::{get_coin_amount_by_quote_amount, calculate_pricing};

use afk::launchpad::errors;
use afk::launchpad::math::{PercentageMath, pow_256, max_u256};
use afk::types::launchpad_types::{
    TokenLaunch, BondingType, LaunchParameters, EkuboLP, LiquidityType, CallbackData,
    EkuboLaunchParameters, LaunchCallback
};
use ekubo::types::{i129::i129};
use starknet::ContractAddress;

const BPS: u256 = 10_000; // 100% = 10_000 bps
// const SCALE_FACTOR: u256  = 100_000_000_000_000_000_u256; // Scale factor decimals place for
// price division and others stuff
// const SCALE_FACTOR: u256 =
//     100_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff
const SCALE_FACTOR: u256 =
    100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff

// Define constants
const MIN_PRICE: u256 = 1_u256; // Minimum price to prevent division by zero
// const SCALE_FACTOR: u256 = 1_000_000_000_000_u256; // 1e12 for precision
// const SCALE_FACTOR: u256 =100_000_000_000_000_000; // Scale factor decimals place for price
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
        BondingType::Trapezoidal => { 0 },
        _ => { 0 },
        // BondingType::Linear => { 0_u256 },
    // BondingType::Exponential => { 0_u256 },
    // BondingType::Trapezoidal => { 0_u256 },
    // _ => { 0_u256 },
    }
}

pub fn get_amount_by_type_of_coin_or_quote(
    pool: TokenLaunch,
    coin_address: ContractAddress,
    amount: u256,
    is_decreased: bool,
    is_quote_amount: bool,
) -> u256 {
    let mut total_supply = pool.total_token_holded.clone();
    let mut final_supply = total_supply + amount;

    if is_decreased {
        final_supply = total_supply - amount;
    }

    let mut actual_supply = total_supply;
    let mut starting_price = pool.starting_price.clone();
    let step_increase_linear = pool.slope.clone();
    let bonding_type = pool.bonding_curve_type.clone();
    match bonding_type {
        Option::Some(x) => {
            match x {
                BondingType::Linear => {
                    if is_quote_amount == true {
                        get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                    } else {
                        get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                    }
                },
                BondingType::Exponential => {
                    if is_quote_amount == true {
                        get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                    } else {
                        get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                    }
                    // if is_quote_amount == true {
                //     get_coin_amount_by_quote_amount_exponential(pool, amount, is_decreased)
                // } else {
                //     get_coin_amount_by_quote_amount_exponential(pool, amount, is_decreased)
                // }
                },
                BondingType::Trapezoidal => {
                    get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                },
                _ => { get_coin_amount_by_quote_amount(pool, amount, is_decreased) },
            }
        },
        Option::None => { get_coin_amount_by_quote_amount(pool, amount, is_decreased) }
    }
}
