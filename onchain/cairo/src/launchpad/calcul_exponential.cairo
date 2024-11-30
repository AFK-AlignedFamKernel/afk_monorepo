use afk::launchpad::errors;
use afk::launchpad::math::{PercentageMath, pow_256, max_u256};
use afk::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyCoin, TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch,
    SetJediswapNFTRouterV2, SetJediswapV2Factory, SupportedExchanges, LiquidityCreated,
    LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters,
    LaunchParameters, EkuboLP, LiquidityType, CallbackData, EkuboLaunchParameters, LaunchCallback
};
use ekubo::types::{i129::i129};
use starknet::ContractAddress;


const BPS: u256 = 10_000; // 100% = 10_000 bps
// const SCALE_FACTOR: u256  = 100_000_000_000_000_000_u256; // Scale factor decimals place for
// price division and others stuff
// const SCALE_FACTOR: u256 =
//     100_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff
const SCALE_FACTOR: u256 =
    100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others 

// const SCALE_FACTOR: u256 = 1_000_000_000_000_u256; // 1e12 for precision

// const SCALE_FACTOR: u256 =100_000_000_000_000_000; // Scale factor decimals place for price
// division and others stuff Total supply / LIQUIDITY_RATIO
// Get the 20% of Bonding curve going to Liquidity
// Liquidity can be lock to Unrug
const LIQUIDITY_RATIO: u256 = 5; // Divid by 5 the total supply.
const TAYLOR_TERMS: u256 = 10; // Number of terms in the Taylor series

pub fn exponential_approximation(x: u256, scale_factor: u256, terms: u256) -> u256 {
    let mut result = scale_factor; // Start with 1 (scaled by SCALE_FACTOR)
    let mut term = scale_factor; // First term in the series is 1 (scaled)

    // Loop through the Taylor series terms
    let mut i = 1_u256;
    while i < terms {
        term = (term * x) / (i * scale_factor); // Calculate the next term: x^i / i!
        result += term; // Add the term to the result
        i += 1_u256;
    }

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
    let value = growth_factor * tokens_to_buy / SCALE_FACTOR;
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
    let tokens = math::ln(log_input) * SCALE_FACTOR / growth_factor;
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
    let growth_factor = pool_coin
        .growth_factor
        .clone(); // Represents `b` in the exponential formula

    // Tokens sold so far
    let tokens_sold = sellable_supply.clone() - current_supply.clone();

    // Calculate the scaled price for the current state
    let scaled_price = {
        let exponent = growth_factor * tokens_sold / SCALE_FACTOR;
        let exp_value = math::exp(exponent); // Use Cairo's math library for exponentiation
        let price = starting_price * exp_value / SCALE_FACTOR;
        max(price, MIN_PRICE) // Ensure price is never below the minimum
    };

    let mut q_out: u256 = 0;
    if is_decreased {
        // Sell path: Calculate how many tokens to return for a given quote amount
        // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
        let log_input = (quote_amount * growth_factor) / starting_price + SCALE_FACTOR;
        let ln_value = natural_log(log_input, SCALE_FACTOR, LN_TERMS);
        let tokens = ln_value * SCALE_FACTOR / growth_factor;

        q_out = tokens;
    } else {
        // Buy path: Calculate tokens received for a given quote amount
        // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
        let log_input = (quote_amount * growth_factor) / starting_price + SCALE_FACTOR;
        let ln_value = natural_log(log_input, SCALE_FACTOR, LN_TERMS);
        // let tokens = math::ln(log_input) * SCALE_FACTOR / growth_factor;
        let tokens = ln_value * SCALE_FACTOR / growth_factor;
        q_out = tokens;
    }

    q_out
}
