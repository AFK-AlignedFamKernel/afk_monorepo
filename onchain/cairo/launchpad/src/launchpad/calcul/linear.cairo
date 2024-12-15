use afk_launchpad::launchpad::math::{
    pow_256, dynamic_reduce_u256_to_u128, dynamic_scale_u128_to_u256
};
use afk_launchpad::launchpad::math::{max_u256, min_u256};
use afk_launchpad::types::launchpad_types::{TokenLaunch,};
use alexandria_math::fast_root::{fast_sqrt};
use ekubo::types::{i129::i129};


const BPS: u256 = 10_000;

const SCALE_FACTOR: u256 = 1_000_000_000_000_000_000_000_000_000_000_u256;
const SCALE_ROOT_FACTOR: u256 = 1_000_000_000_000_000_u256;
const DECIMAL_FACTOR: u256 = 1_000_000_000_000_000_000_u256;
const MIN_PRICE: u256 = 1_u256;
const LIQUIDITY_RATIO: u256 = 5;
const SQRT_ITER: u256 = 1_000_u256;

pub fn get_meme_amount(pool_coin: TokenLaunch, amount_in: u256) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
    let amount_sold = sellable_supply.clone() - current_supply.clone();

    let threshold_liquidity = pool_coin.threshold_liquidity.clone();
    assert!(sellable_supply > 0, "Sellable supply == 0");
    assert!(amount_in > 0, "Amount in == 0");
    assert!(amount_in <= threshold_liquidity, "Amount in > threshold liquidity");

    let scaled_threshold_liquidity = threshold_liquidity * SCALE_FACTOR;
    let sellable_supply_squared = sellable_supply * sellable_supply / DECIMAL_FACTOR;
    let scaled_slope = scaled_threshold_liquidity / sellable_supply_squared;
    let scaled_intercept = scaled_threshold_liquidity / (2 * sellable_supply);

    let term0 = scaled_slope * amount_sold / DECIMAL_FACTOR + scaled_intercept;
    let term1 = (scaled_slope * amount_sold / DECIMAL_FACTOR + scaled_intercept)
        * (scaled_slope * amount_sold / DECIMAL_FACTOR + scaled_intercept)
        / SCALE_FACTOR;
    let term2 = 2 * scaled_slope * amount_in / DECIMAL_FACTOR;
    let i_cast = term1 + term2;

    let (reduced_i_cast, exp) = dynamic_reduce_u256_to_u128(i_cast);
    let res = fast_sqrt(reduced_i_cast, SQRT_ITER.try_into().unwrap());
    let i = dynamic_scale_u128_to_u256(res, exp) * SCALE_ROOT_FACTOR;

    let numerator = i - term0;
    let scaled_numerator = numerator * DECIMAL_FACTOR;
    let calculated_amount_out = scaled_numerator / scaled_slope;

    let amount_out = calculated_amount_out;
    amount_out
}

pub fn get_coin_amount(pool_coin: TokenLaunch, amount_in: u256) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
    let amount_sold = sellable_supply.clone() - current_supply.clone();

    assert!(sellable_supply > 0, "Sellable supply == 0");
    assert!(amount_in > 0, "Amount in == 0");
    assert!(amount_in <= amount_sold, "Amount to sell > amount sold");

    let threshold_liquidity = pool_coin.threshold_liquidity.clone();

    let scaled_threshold_liquidity = threshold_liquidity * SCALE_FACTOR;
    let sellable_supply_squared = sellable_supply * sellable_supply / DECIMAL_FACTOR;
    let scaled_slope = scaled_threshold_liquidity / sellable_supply_squared;
    let scaled_intercept = scaled_threshold_liquidity / (2 * sellable_supply);

    let term0 = scaled_slope * amount_sold / SCALE_FACTOR * amount_in / DECIMAL_FACTOR;
    let term1 = scaled_slope / 2 * amount_in / SCALE_FACTOR * amount_in / DECIMAL_FACTOR;
    let term2 = scaled_intercept * amount_in / SCALE_FACTOR;

    let amount_out = term0 - term1 + term2;
    amount_out
}


pub fn calculate_starting_price_launch(
    initial_pool_supply: u256, threshold_liquidity: u256,
) -> i129 {
    let launch_price = threshold_liquidity.clone() / threshold_liquidity.clone();
    let price_u128: u128 = launch_price.try_into().unwrap();
    let starting_price = i129 { sign: true, mag: price_u128 };

    starting_price
}

pub fn calculate_pricing(threshold_liquidity: u256, sellable_supply: u256) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must sup 0');
    let starting_price = (threshold_liquidity.clone() * SCALE_FACTOR) / sellable_supply.clone();
    starting_price
}

pub fn calculate_init_pricing(threshold_liquidity: u256, sellable_supply: u256) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must sup 0');
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
    let price_scale_factor = price.clone() * SCALE_FACTOR;
    let mut q_out: u256 = 0;
    if is_decreased {
        q_out = quote_amount / price_scale_factor;
    } else {
        q_out = quote_amount / price_scale_factor;
    }
    q_out / SCALE_FACTOR
}
