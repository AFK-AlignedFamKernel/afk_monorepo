// use afk::launchpad::errors;
// use afk::launchpad::math::{ max_u256};
use afk::types::launchpad_types::{
    TokenLaunch, 
    // BondingType, TokenQuoteBuyCoin,
    // SetJediswapNFTRouterV2, SetJediswapV2Factory,
    // SupportedExchanges, LaunchParameters, EkuboLP, LiquidityType, CallbackData,
    // EkuboLaunchParameters, 
    // LaunchCallback
};
use alexandria_math::fast_root::{fast_sqrt};
use ekubo::types::{i129::i129};
// use starknet::ContractAddress;

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
const SQRT_ITER: u256 = 1000_u256; // Divid by 5 the total supply.

// pub fn get_meme_amount(pool_coin: TokenLaunch, amount_in: u256) -> u256 {
//     let total_supply = pool_coin.total_supply.clone();
//     let current_supply = pool_coin.available_supply.clone();
//     let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
//     let threshold_liquidity = pool_coin.threshold_liquidity.clone();
//     let amount_sold = sellable_supply.clone() - current_supply.clone();
//     assert(sellable_supply.clone() > 0, 'Sellable supply == 0 ');

//     let slope = threshold_liquidity / (sellable_supply * sellable_supply);
//     let intercept = threshold_liquidity / (2 * sellable_supply);

//     let i_cast = (slope * amount_sold + intercept) * (slope * amount_sold + intercept)
//         + 2 * slope * amount_in;
//     let i = fast_sqrt(i_cast.try_into().unwrap(), SQRT_ITER.try_into().unwrap());
//     let amount_out = (i - (slope * amount_sold + intercept).try_into().unwrap())
//         / slope.try_into().unwrap();
//     amount_out.try_into().unwrap()
// }

pub fn get_meme_amount(pool_coin: TokenLaunch, amount_in: u256) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
    let threshold_liquidity = pool_coin.threshold_liquidity.clone();
    let amount_sold = sellable_supply.clone() - current_supply.clone();

    assert!(sellable_supply > 0, "Sellable supply == 0");
    assert!(threshold_liquidity > 0, "Threshold liquidity == 0");

    // Calculate slope with scale factor
    let slope = (threshold_liquidity * SCALE_FACTOR) / (sellable_supply * sellable_supply);
    assert!(slope > 0, "Slope calculation resulted in zero");

    // Calculate intercept with scale factor
    let intercept = (threshold_liquidity * SCALE_FACTOR) / (2 * sellable_supply);
    assert!(intercept > 0, "Intercept calculation resulted in zero");

    // Compute the intermediate value for `i_cast` with scale adjustments
    let term1 = (slope * amount_sold + intercept) * (slope * amount_sold + intercept);
    let term2 = (2 * slope * amount_in) / SCALE_FACTOR;
    let i_cast = term1 + term2;

    // Compute the square root (use a safe implementation of fast_sqrt)
    let i = fast_sqrt(i_cast.try_into().unwrap(), SQRT_ITER.try_into().unwrap());

    // Calculate amount out
    let numerator = i - ((slope * amount_sold + intercept) / SCALE_FACTOR).try_into().unwrap();
    let amount_out = numerator / slope.try_into().unwrap();
    amount_out.try_into().unwrap()
}


pub fn get_coin_amount(pool_coin: TokenLaunch, amount_in: u256) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
    let threshold_liquidity = pool_coin.threshold_liquidity.clone();
    let amount_sold = sellable_supply.clone() - current_supply.clone();
    assert(sellable_supply.clone() > 0, 'Sellable supply == 0 ');

    let slope = (threshold_liquidity * SCALE_FACTOR) / (sellable_supply * sellable_supply);
    let intercept = (threshold_liquidity*SCALE_FACTOR) / (2 * sellable_supply);
    // let amount_out = slope * amount_sold * amount_in
    //     + slope / 2 * amount_in * amount_in
    //     + intercept * amount_in;
    // amount_out

     // Calculate amount out
     let term1 = (slope * amount_sold * amount_in) / SCALE_FACTOR;
     let term2 = (slope / 2 * amount_in * amount_in) / SCALE_FACTOR;
     let term3 = (intercept * amount_in) / SCALE_FACTOR;
 
     let amount_out = term1 + term2 + term3;
     amount_out
}
// TODO fix starting price launch
pub fn calculate_starting_price_launch(
    initial_pool_supply: u256, threshold_liquidity: u256,
) -> i129 {
    // TODO calculate price

    // let launch_price = initial_pool_supply.clone() / threshold_liquidity.clone();
    let launch_price = threshold_liquidity.clone() / threshold_liquidity.clone();
    // println!("launch_price {:?}", launch_price);
    let price_u128: u128 = launch_price.try_into().unwrap();
    // println!("price_u128 {:?}", price_u128);
    let starting_price = i129 { sign: true, mag: price_u128 };

    starting_price
}

// TODO verify price bonding curve
// current sellable supply beofre launch
pub fn calculate_pricing(threshold_liquidity: u256, sellable_supply: u256) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must sup 0');
    // let scaling_factor = 10;
    // let starting_price = (threshold_liquidity.clone() * scaling_factor) /
    // sellable_supply.clone();
    // TODO check new formula
    let starting_price = (threshold_liquidity.clone() * SCALE_FACTOR) / sellable_supply.clone();
    // let starting_price = (threshold_liquidity.clone() * SCALE_FACTOR) /
    // (sellable_supply.clone()*2);
    starting_price
}

// TODO check new formula
pub fn calculate_init_pricing(threshold_liquidity: u256, sellable_supply: u256) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must sup 0');
    // let scaling_factor = 10;
    // let starting_price = (threshold_liquidity.clone() * scaling_factor) /
    // sellable_supply.clone();
    // TODO check new formula init pricing with linear curve?
    let starting_price = (threshold_liquidity.clone() * SCALE_FACTOR)
        / (sellable_supply.clone() * 2);
    starting_price
}

pub fn calculate_slope(
    threshold_liquidity: u256, starting_price: u256, sellable_supply: u256
) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must != 0');
    let slope_numerator = (threshold_liquidity * SCALE_FACTOR)
        - (starting_price * sellable_supply.clone());
    let slope_denominator = (sellable_supply.clone() * sellable_supply.clone()) / 2_u256;
    // println!("slope_denominator {:?}", slope_denominator.clone());
    assert(slope_denominator.clone() > 0, 'Slope denominator must != 0');
    let slope = slope_numerator / (slope_denominator * SCALE_FACTOR);
    slope / SCALE_FACTOR
}

pub fn get_coin_amount_by_quote_amount(
    pool_coin: TokenLaunch, quote_amount: u256, is_decreased: bool
) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
    assert(sellable_supply.clone() > 0, 'Sellable supply == 0 ');

    let starting_price = pool_coin.starting_price.clone();
    let slope = calculate_slope(
        pool_coin.threshold_liquidity.clone(), starting_price.clone(), sellable_supply.clone(),
    );

    let tokens_sold = sellable_supply.clone() - current_supply.clone();
    let price = slope * tokens_sold.clone() + starting_price.clone();
    // println!("price {:?}", price.clone());
    // println!("SCALE_FACTOR {:?}", SCALE_FACTOR.clone());

    // let price_scale_factor_test = price.clone() * SCALE_FACTOR;
    // println!("price_scale_factor_test {:?}", price_scale_factor_test.clone());

    // TODO fix this
    // Max_u256 can't broke the price.
    // When we multiply it's never appear above 0 even if big scale factor

    let price_scale_factor = price.clone() * SCALE_FACTOR;
    // let price_scale_factor = max_u256(price.clone() * SCALE_FACTOR, 1_u256);
    // println!("price_scale_factor {:?}", price_scale_factor.clone());

    let mut q_out: u256 = 0;
    if is_decreased {
        q_out = quote_amount / price_scale_factor;
    } else {
        q_out = quote_amount / price_scale_factor;
    }

    q_out / SCALE_FACTOR
}
