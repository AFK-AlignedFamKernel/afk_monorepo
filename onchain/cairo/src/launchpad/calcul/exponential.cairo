use afk::launchpad::errors;
use afk::launchpad::math::{PercentageMath, pow_256, max_u256};
use afk::types::launchpad_types::{
    TokenLaunch, BondingType, EkuboPoolParameters, LaunchParameters, EkuboLP, LiquidityType,
    CallbackData, EkuboLaunchParameters, LaunchCallback
};
use ekubo::types::{i129::i129};
use starknet::ContractAddress;

const BPS: u256 = 10_000; // 100% = 10_000 bps
const SCALE_FACTOR: u256 =
    100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others 
// const SCALE_FACTOR: u256 = 1_000_000_000_000_u256; // 1e12 for precision
// Get the 20% of Bonding curve going to Liquidity
// Liquidity can be lock to Unrug
const LIQUIDITY_RATIO: u256 = 5; // Divid by 5 the total supply.
const TAYLOR_TERMS: u256 = 10; // Number of terms in the Taylor series
const LN_TERMS: u256 = 10; // Number of terms in the Taylor series

const GROWTH_FACTOR: u256 = 100_000_u256; // b = 0.0001, scaled by 1e12
const LN2: u256 = 693_147_000_000; // ln(2) scaled by 1e6 for precision
const MIN_PRICE: u256 = 1_u256; //

pub fn natural_log(x: u256, scale_factor: u256, terms: u256) -> u256 {
    assert!(x > 0, "Input must be greater than zero");

    // Constants
    let mut result = 0_u256;

    // Scale x down to the range [1, 2)
    let mut scaled_x = x.clone();
    let mut k = 0_u256;
    while scaled_x > scale_factor {
        scaled_x /= 2_u256;
        k += 1_u256;
    };

    // Add k * ln(2) to the result
    result += k * LN2.clone();

    // Compute ln(scaled_x) using Taylor series around 1 + z
    let z = scaled_x.clone() - scale_factor.clone(); // z = x - 1
    let mut term = z.clone(); // First term is z
    let mut i = 1_u256;

    while i < terms {
        // Add or subtract the term
        if i % 2 == 1 {
            result += (term.clone() * scale_factor.clone())
                / (i * scale_factor.clone()); // Add for odd terms
        } else {
            result -= (term.clone() * scale_factor.clone())
                / (i * scale_factor.clone()); // Subtract for even terms
        }

        // Compute next term
        term = (term.clone() * z.clone()) / scale_factor.clone();
        i += 1_u256;
    };

    result
}

pub fn exponential_approximation(x: u256, scale_factor: u256, terms: u256) -> u256 {
    let mut result = scale_factor.clone(); // Start with 1 (scaled by SCALE_FACTOR)
    let mut term = scale_factor.clone(); // First term in the series is 1 (scaled)

    // Loop through the Taylor series terms
    let mut i = 1_u256;
    while i < terms {
        term = (term.clone() * x.clone())
            / (i.clone() * scale_factor.clone()); // Calculate the next term: x^i / i!
        result += term; // Add the term to the result
        i += 1_u256;
    };

    result
}

pub fn calculate_initial_price(
    threshold_liquidity: u256, sellable_supply: u256, growth_factor: u256, // b
) -> u256 {
    // Constants

    // Compute the exponential term: e^(b * sellable_supply)
    let exponent = growth_factor * sellable_supply / SCALE_FACTOR;
    // let exp_value = e*exponent;
    // let exp_value = e*exponent;
    // Approximate e^(b * sellable_supply)
    let exp_value = exponential_approximation(exponent, SCALE_FACTOR, TAYLOR_TERMS);

    // math::exp(exponent); // Use Cairo's math library for exponentiation

    // Calculate initial price: a = (threshold_liquidity * b) / (e^(b * sellable_supply) - 1)
    let denominator = exp_value - SCALE_FACTOR;
    assert!(denominator > 0, "Exponential denominator must not be zero");

    let initial_price = (threshold_liquidity * growth_factor) / denominator;
    initial_price
}


pub fn exponential_price(initial_price: u256, growth_factor: u256, tokens_sold: u256,) -> u256 {
    // Calculate the price: P(x) = a * e^(b * x)
    // let exponent = math::exp(growth_factor * tokens_sold / SCALE_FACTOR);
    let value = growth_factor * tokens_sold / SCALE_FACTOR;
    let exponent = exponential_approximation(value, SCALE_FACTOR, TAYLOR_TERMS);
    let price = initial_price * exponent / SCALE_FACTOR;
    price
}

pub fn cumulative_cost(initial_price: u256, growth_factor: u256, tokens_to_buy: u256,) -> u256 {
    // Total cost for n tokens: (a / b) * (e^(b * n) - 1)
    // let exponent = math::exp(growth_factor * tokens_to_buy / SCALE_FACTOR);
    let value = growth_factor * tokens_to_buy / SCALE_FACTOR;
    let exponent = exponential_approximation(value, SCALE_FACTOR, TAYLOR_TERMS);

    let cost = (initial_price * (exponent - SCALE_FACTOR)) / growth_factor;
    cost
}

pub fn tokens_for_quote(initial_price: u256, growth_factor: u256, quote_amount: u256,) -> u256 {
    // Solve for n: n = (1 / b) * ln((quote_amount * b / a) + 1)
    let log_input = (quote_amount * growth_factor) / initial_price + SCALE_FACTOR;
    let tokens = natural_log(log_input, SCALE_FACTOR, LN_TERMS) * SCALE_FACTOR / growth_factor;
    tokens
}

pub fn get_coin_amount_by_quote_amount_exponential(
    pool_coin: TokenLaunch, quote_amount: u256, is_decreased: bool,
) -> u256 {
    // Total supply and current available supply
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
    assert!(sellable_supply > 0, "Sellable supply must not be zero");

    // Starting price and growth factor
    let starting_price = pool_coin.starting_price.clone();
    // let growth_factor = pool_coin
    //     .growth_factor
    //     .clone(); // Represents `b` in the exponential formula

    let growth_factor = 100_000_u256;
    // let growth_factor = GROWTH_FACTOR.clone();
    // Tokens sold so far
    let tokens_sold = sellable_supply.clone() - current_supply.clone();

    // Calculate the scaled price for the current state

    let exponent = growth_factor * tokens_sold / SCALE_FACTOR;
    let exp_value = exponential_approximation(exponent, SCALE_FACTOR, TAYLOR_TERMS);

    let price = starting_price.clone() * exp_value / SCALE_FACTOR;
    let scaled_price = max_u256(price, MIN_PRICE); // Ensure price is never below the minimum
    // };
    let mut q_out: u256 = 0;
    if is_decreased {
        // Sell path: Calculate how many tokens to return for a given quote amount
        // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
        let log_input = (quote_amount.clone() * growth_factor.clone()) / starting_price.clone()
            + SCALE_FACTOR;
        let ln_value = natural_log(log_input, SCALE_FACTOR, LN_TERMS);
        let tokens = ln_value.clone() * SCALE_FACTOR / growth_factor.clone();

        q_out = tokens;
    } else {
        // Buy path: Calculate tokens received for a given quote amount
        // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
        let log_input = (quote_amount.clone() * growth_factor.clone()) / starting_price.clone()
            + SCALE_FACTOR;
        let ln_value = natural_log(log_input, SCALE_FACTOR, LN_TERMS);
        // let tokens = math::ln(log_input) * SCALE_FACTOR / growth_factor;
        let tokens = ln_value.clone() * SCALE_FACTOR / growth_factor.clone();
        q_out = tokens;
    }

    q_out
}
