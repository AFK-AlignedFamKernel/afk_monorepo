use afk_launchpad::types::launchpad_types::{TokenLaunch,};
use starknet::ContractAddress;
const BPS: u256 = 10_000;
const DECIMAL_FACTOR: u256 = 1_000_000_000_000_000_000_u256;
const MIN_PRICE: u256 = 1_u256;
const LIQUIDITY_RATIO: u256 = 5;
const TAYLOR_TERMS: u256 = 100;
const LN_10: u256 = 2_302_585_092_994_045_684_u256;
const LN_2: u256 = 693_147_180_559_945_309_u256;

// Exponential approximation
// TODO Audit HIGH SECURITY
// Rounding and approximation issue to check
pub fn exponential_approximation(x: u256, y: u256, terms: u256) -> u256 {
    if x == 0 {
        return DECIMAL_FACTOR;
    }

    let fraction_scaled = x * DECIMAL_FACTOR / y;
    let x_scaled = LN_10 * fraction_scaled / DECIMAL_FACTOR;
    let mut result = DECIMAL_FACTOR.clone();
    let mut term = DECIMAL_FACTOR.clone();
    let mut i = 1_u256;

    while i < terms {
        if term == 0 {
            break;
        }
        term = term * x_scaled / (i * DECIMAL_FACTOR);
        result += term;
        i += 1_u256;
    };

    result
}


// Logarithm approximation with a LOG_TERMS
// TODO Audit HIGH SECURITY
// Rounding and approximation issue to check
pub fn logarithm_approximation(x: u256, y: u256, terms: u256) -> u256 {
    if x == 0 {
        return 0_u256;
    }

    let mut result = 0_u256;
    let mut negative_result = 0_u256;
    let mut positive_result = 0_u256;
    let mut numerator = x;
    let mut denominator = y;
    let mut k = 0_u256;

    while numerator > denominator {
        numerator /= 2;
        k += 1;
    };

    result += k * LN_2;

    let mut term = DECIMAL_FACTOR - numerator * DECIMAL_FACTOR / denominator;
    let mut i = 1_u256;

    while i <= terms {
        let scaled_term = term / i;
        if scaled_term == 0 {
            break;
        }
        negative_result += scaled_term;
        term = term * (DECIMAL_FACTOR - numerator * DECIMAL_FACTOR / denominator) / DECIMAL_FACTOR;
        i += 1_u256;
    };
    result -= negative_result;
    result
}


// Logarithm approximation with a LOG_TERMS
// TODO Audit HIGH SECURITY
// Rounding and approximation issue to check
pub fn logarithm_approximation_1px(x: u256, y: u256, terms: u256) -> u256 {
    if x == 0 {
        return 0_u256;
    }

    let mut result = 0_u256;
    let mut numerator = x;
    let mut denominator = y;
    let mut k = 0_u256;
    let mut changed = false;
    let mut top = numerator;
    let mut bottom = denominator;

    if numerator > denominator {
        top = denominator;
        bottom = numerator;
        changed = true;
    };

    let mut term = top * DECIMAL_FACTOR / bottom;
    let mut i = 1_u256;

    while i <= terms {
        let scaled_term = term / i;
        if scaled_term == 0 {
            break;
        }
        if i % 2 == 0 {
            result -= scaled_term;
        } else {
            result += scaled_term;
        }
        term = term * top / bottom;
        i += 1_u256;
    };

    if changed {
        let natural_log = logarithm_approximation(x, y, TAYLOR_TERMS);
        result = natural_log + result;
    };

    result
}

pub fn get_meme_amount_exponential(pool_coin: TokenLaunch, amount_in: u256) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply - (total_supply / LIQUIDITY_RATIO);
    let amount_sold = sellable_supply - current_supply;

    let threshold_liquidity = pool_coin.threshold_liquidity.clone();
    assert!(sellable_supply > 0, "Sellable supply == 0");
    assert!(amount_in > 0, "Amount in == 0");
    assert!(amount_in <= threshold_liquidity, "Amount in > threshold liquidity");

    let exp_term = exponential_approximation(amount_sold, sellable_supply, TAYLOR_TERMS);

    let term0 = sellable_supply * DECIMAL_FACTOR / LN_10;
    let term1 = 9 * amount_in;
    let term2 = threshold_liquidity * exp_term / DECIMAL_FACTOR;

    let log_term = logarithm_approximation_1px(term1, term2, TAYLOR_TERMS);

    let mut amount_out = term0 * log_term / DECIMAL_FACTOR;

    if amount_out > current_supply {
        amount_out = current_supply;
    };
    amount_out
}

pub fn get_coin_amount_exponential(pool_coin: TokenLaunch, amount_in: u256) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply - (total_supply / LIQUIDITY_RATIO);
    let amount_sold = sellable_supply - current_supply;
    let liquidity_raised = pool_coin.liquidity_raised.clone();

    let threshold_liquidity = pool_coin.threshold_liquidity.clone();
    assert!(sellable_supply > 0, "Sellable supply == 0");
    assert!(amount_in > 0, "Amount in == 0");
    assert!(amount_in <= amount_sold, "Amount to sell > amount sold");

    let exp_term_0 = exponential_approximation(amount_sold, sellable_supply, TAYLOR_TERMS);
    let exp_term_1 = exponential_approximation(amount_in, sellable_supply, TAYLOR_TERMS);

    let term0 = threshold_liquidity * exp_term_0 / DECIMAL_FACTOR;
    let term1 = DECIMAL_FACTOR * DECIMAL_FACTOR / exp_term_1;

    let mut amount_out = term0 / 9 * (DECIMAL_FACTOR - term1) / DECIMAL_FACTOR;

    if amount_out > liquidity_raised {
        amount_out = liquidity_raised;
    };
    amount_out
}

pub fn get_coin_amount_by_quote_amount_exponential(
    pool_coin: TokenLaunch, amount_in: u256
) -> u256 {
    let amount_out = 0_u256;
    amount_out
}
// pub fn natural_log(x: u256, scale_factor: u256, terms: u256) -> u256 {
//     assert!(x > 0, "Input must be greater than zero");

//     // Constants
//     let mut result = 0_u256;

//     // Scale x down to the range [1, 2)
//     let mut scaled_x = x.clone();
//     let mut k = 0_u256;
//     while scaled_x > scale_factor {
//         scaled_x /= 2_u256;
//         k += 1_u256;
//     };

//     // Add k * ln(2) to the result
//     result += k * LN2.clone();

//     // Compute ln(scaled_x) using Taylor series around 1 + z
//     let z = scaled_x.clone() - scale_factor.clone(); // z = x - 1
//     let mut term = z.clone(); // First term is z
//     let mut i = 1_u256;

//     while i < terms {
//         // Add or subtract the term
//         if i % 2 == 1 {
//             result += (term.clone() * scale_factor.clone())
//                 / (i * scale_factor.clone()); // Add for odd terms
//         } else {
//             result -= (term.clone() * scale_factor.clone())
//                 / (i * scale_factor.clone()); // Subtract for even terms
//         }

//         // Compute next term
//         term = (term.clone() * z.clone()) / scale_factor.clone();
//         i += 1_u256;
//     };

//     result
// }

// pub fn dynamic_scale_factor(
//     base_scale_factor: u256, sellable_supply: u256, threshold_liquidity: u256
// ) -> u256 {
//     // Ensure sellable supply and threshold liquidity are non-zero
//     assert(sellable_supply > 0, 'Sellable supply not above 0');
//     assert(threshold_liquidity > 0, 'Threshold liquidity below 0');

//     // Calculate ratio: max(S_sellable / Q_thresh, Q_thresh / S_sellable)
//     let ratio = if sellable_supply > threshold_liquidity {
//         sellable_supply / threshold_liquidity
//     } else {
//         threshold_liquidity / sellable_supply
//     };

//     // Scale the base factor by the ratio
//     let dynamic_factor = base_scale_factor * max_u256(1, ratio);

//     return dynamic_factor;
// }


// pub fn cumulative_cost(initial_price: u256, growth_factor: u256, tokens_to_buy: u256,) -> u256 {
//     // Total cost for n tokens: (a / b) * (e^(b * n) - 1)
//     // let exponent = math::exp(growth_factor * tokens_to_buy / SCALE_FACTOR);
//     let value = growth_factor * tokens_to_buy / SCALE_FACTOR;
//     let exponent = exponential_approximation(value, SCALE_FACTOR, TAYLOR_TERMS);

//     let cost = (initial_price * (exponent - SCALE_FACTOR)) / growth_factor;
//     cost
// }

// pub fn tokens_for_quote(initial_price: u256, growth_factor: u256, quote_amount: u256,) -> u256 {
//     // Solve for n: n = (1 / b) * ln((quote_amount * b / a) + 1)
//     let log_input = (quote_amount * growth_factor) / initial_price + SCALE_FACTOR;
//     let tokens = natural_log(log_input, SCALE_FACTOR, LN_TERMS) * SCALE_FACTOR / growth_factor;
//     tokens
// }

// pub fn get_coin_amount_by_quote_amount_exponential(
//     pool_coin: TokenLaunch, quote_amount: u256, is_decreased: bool, dynamic_scale_factor: u256
// ) -> u256 {
//     // Total supply and current available supply
//     let total_supply = pool_coin.total_supply.clone();
//     let current_supply = pool_coin.available_supply.clone();
//     let threshold_liquidity = pool_coin.threshold_liquidity.clone();
//     let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
//     assert!(sellable_supply > 0, "Sellable supply must not be zero");
//     let growth_factor = 100_000_u256;

//     let adjusted_scale_factor = dynamic_scale_factor
//         * max_u256(1_u256, sellable_supply / threshold_liquidity);
//     // let adjusted_scale_factor = dynamic_scale_factor * max(1, quote_amount / growth_factor);

//     // Starting price and growth factor
//     let starting_price = pool_coin.starting_price.clone();
//     // let growth_factor = pool_coin
//     //     .growth_factor
//     //     .clone(); // Represents `b` in the exponential formula

//     // let growth_factor = GROWTH_FACTOR.clone();
//     // Tokens sold so far
//     let tokens_sold = sellable_supply.clone() - current_supply.clone();

//     // Calculate the scaled price for the current state

//     let exponent = growth_factor * tokens_sold / adjusted_scale_factor;
//     let exp_value = exponential_approximation(exponent, adjusted_scale_factor, TAYLOR_TERMS);

//     let price = starting_price.clone() * exp_value / adjusted_scale_factor;
//     let scaled_price = max_u256(price, MIN_PRICE); // Ensure price is never below the minimum
//     // };
//     let mut q_out: u256 = 0;
//     if is_decreased {
//         // Sell path: Calculate how many tokens to return for a given quote amount
//         // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
//         // let log_input = (quote_amount.clone() * growth_factor.clone()) / scaled_price.clone()
//         //     + dynamic_scale_factor;

//         let log_input = max_u256(
//             (quote_amount.clone() * growth_factor.clone()) / scaled_price.clone()
//                 + adjusted_scale_factor,
//             1
//         );

//         // let ln_value = natural_log(log_input, adjusted_scale_factor, LN_TERMS);
//         let ln_value = max_u256(natural_log(log_input, adjusted_scale_factor, LN_TERMS), 1);

//         let tokens = ln_value.clone() * adjusted_scale_factor / growth_factor.clone();

//         q_out = min_u256(tokens, current_supply); // Clamp to available supply
//         q_out = tokens;
//     } else {
//         // Buy path: Calculate tokens received for a given quote amount
//         // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
//         let log_input = max_u256(
//             (quote_amount.clone() * growth_factor.clone()) / scaled_price.clone()
//                 + adjusted_scale_factor,
//             1
//         );

//         // let log_input = (quote_amount.clone() * growth_factor.clone()) / scaled_price.clone()
//         //     + dynamic_scale_factor;
//         // let ln_value = natural_log(log_input, adjusted_scale_factor, LN_TERMS);
//         let ln_value = max_u256(natural_log(log_input, adjusted_scale_factor, LN_TERMS), 1);

//         // let tokens = math::ln(log_input) * SCALE_FACTOR / growth_factor;
//         let tokens = ln_value.clone() * adjusted_scale_factor / growth_factor.clone();
//         q_out = min_u256(tokens, current_supply); // Clamp to available supply
//         // q_out = tokens;
//     }

//     q_out
// }
// pub fn get_coin_amount_by_quote_amount_exponential(
//     pool_coin: TokenLaunch, quote_amount: u256, is_decreased: bool,

// ) -> u256 {
//     // Total supply and current available supply
//     let total_supply = pool_coin.total_supply.clone();
//     let current_supply = pool_coin.available_supply.clone();
//     let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
//     assert!(sellable_supply > 0, "Sellable supply must not be zero");

//     // Starting price and growth factor
//     let starting_price = pool_coin.starting_price.clone();
//     // let growth_factor = pool_coin
//     //     .growth_factor
//     //     .clone(); // Represents `b` in the exponential formula

//     let growth_factor = 100_000_u256;
//     // let growth_factor = GROWTH_FACTOR.clone();
//     // Tokens sold so far
//     let tokens_sold = sellable_supply.clone() - current_supply.clone();

//     // Calculate the scaled price for the current state

//     let exponent = growth_factor * tokens_sold / SCALE_FACTOR;
//     let exp_value = exponential_approximation(exponent, SCALE_FACTOR, TAYLOR_TERMS);

//     let price = starting_price.clone() * exp_value / SCALE_FACTOR;
//     let scaled_price = max_u256(price, MIN_PRICE); // Ensure price is never below the minimum
//     // };
//     let mut q_out: u256 = 0;
//     if is_decreased {
//         // Sell path: Calculate how many tokens to return for a given quote amount
//         // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
//         let log_input = (quote_amount.clone() * growth_factor.clone()) / scaled_price.clone()
//             + SCALE_FACTOR;
//         let ln_value = natural_log(log_input, SCALE_FACTOR, LN_TERMS);
//         let tokens = ln_value.clone() * SCALE_FACTOR / growth_factor.clone();

//         q_out = tokens;
//     } else {
//         // Buy path: Calculate tokens received for a given quote amount
//         // Solve for tokens: n = (1 / b) * ln((quote_amount * b / a) + 1)
//         let log_input = (quote_amount.clone() * growth_factor.clone()) / scaled_price.clone()
//             + SCALE_FACTOR;
//         let ln_value = natural_log(log_input, SCALE_FACTOR, LN_TERMS);
//         // let tokens = math::ln(log_input) * SCALE_FACTOR / growth_factor;
//         let tokens = ln_value.clone() * SCALE_FACTOR / growth_factor.clone();
//         q_out = tokens;
//     }

//     q_out
// }


