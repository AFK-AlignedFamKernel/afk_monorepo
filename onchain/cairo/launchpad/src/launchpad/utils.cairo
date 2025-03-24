use afk_launchpad::launchpad::math::{dynamic_reduce_u256_to_u128, dynamic_scale_u128_to_u256, pow_256};
use alexandria_math::fast_root::{fast_sqrt};
use core::num::traits::{Zero};
use ekubo::types::bounds::Bounds;
use ekubo::types::i129::i129;


use starknet::ContractAddress;

pub const MIN_TICK: i32 = -88722883;
pub const MAX_TICK: i32 = 88722883;

pub const MIN_TICK_U128: u128 = 88722883;
pub const MAX_TICK_U128: u128 = 88722883;
// Min and max sqrt ratio values from the Rust implementation
// pub const MIN_SQRT_RATIO: u256 = 4295128739; // Simplified from 4363438787445
// pub const MAX_SQRT_RATIO: u256 = 1461446703485210103287273052203988822378723970342;

pub const MIN_SQRT_RATIO: u256 = 18446748437148339061;
pub const MAX_SQRT_RATIO: u256 =  6277100250585753475930931601400621808602321654880405518632;
pub const POW_128: u256 = 340282366920938463463374607431768211455;
pub const POW_64: u256 = 18446744073709551616;
pub const POW_32: u256 = 4294967296;
pub const POW_16: u256 = 65536;
pub const DECIMAL_FACTOR: u256 = 1_000_000_000_000_000_000_u256;
pub const SQRT_ITER: u256 = 1_000_u256;
pub const UINT_128_MAX: u256 = 340282366920938463463374607431768211455;

// use integer::u256_from_felt252;
pub fn sort_tokens(
    tokenA: ContractAddress, tokenB: ContractAddress
) -> (ContractAddress, ContractAddress) {
    if tokenA < tokenB {
        (tokenA, tokenB)
    } else {
        (tokenB, tokenA)
    }
}

pub fn get_initial_tick_from_starting_price(
    starting_price: i129, bound_mag: u128, is_token1_quote: bool
) -> (i129, Bounds) {
    // println!("get_initial_tick_from_starting_price",);
    // println!("is_token1_quote {}", is_token1_quote);
    // println!("starting_price sign {}", starting_price.sign);
    // println!("bound_mag {}", bound_mag);

    let (initial_tick, bounds) = if is_token1_quote {
        // the price is always supplied in quote/meme. if token 1 is quote,
        // then the upper bound expressed in quote/meme is +inf
        // and the lower bound is the starting price.
        (
            i129 { sign: starting_price.sign, mag: starting_price.mag },
            Bounds {
                lower: i129 { sign: starting_price.sign, mag: starting_price.mag },
                upper: i129 { sign: false, mag: bound_mag }
            }
        )
    } else {
        // The initial tick sign is reversed if the quote is token0.
        // as the price provided was expressed in token1/token0.
        (
            i129 { sign: !starting_price.sign, mag: starting_price.mag },
            Bounds {
                lower: i129 { sign: true, mag: bound_mag },
                upper: i129 { sign: !starting_price.sign, mag: starting_price.mag }
            }
        )
    };
    (initial_tick, bounds)
}

pub fn get_initial_tick_from_starting_price_unrug(
    starting_price: i129, bound_mag: u128, is_token1_quote: bool
) -> (i129, Bounds) {
    let (initial_tick, bounds) = if is_token1_quote {
        // the price is always supplied in quote/meme. if token 1 is quote,
        // then the upper bound expressed in quote/meme is +inf
        // and the lower bound is the starting price.
        (
            i129 { sign: starting_price.sign, mag: starting_price.mag },
            Bounds {
                lower: i129 { sign: starting_price.sign, mag: starting_price.mag },
                upper: i129 { sign: false, mag: bound_mag }
            }
        )
    } else {
        // The initial tick sign is reversed if the quote is token0.
        // as the price provided was expressed in token1/token0.
        (
            i129 { sign: !starting_price.sign, mag: starting_price.mag },
            Bounds {
                lower: i129 { sign: true, mag: bound_mag },
                upper: i129 { sign: !starting_price.sign, mag: starting_price.mag }
            }
        )
    };
    (initial_tick, bounds)
}

pub fn get_next_tick_bounds(
    starting_price: i129, tick_spacing: u128, is_token1_quote: bool
) -> Bounds {
    // The sign of the next bound is the same as the sign of the starting tick.
    // If the token1 is the quote token, the price is expressed in the correct token1/token 0 order
    // and the sign of the starting tick is the same as the sign of the price.
    // otherwise, it's flipped.
    let bound_sign = if is_token1_quote {
        starting_price.sign
    } else {
        !starting_price.sign
    };

    // The magnitude of the next bound is the starting tick magnitude plus or minus the tick
    // spacing.
    // If the starting sign is negative, then the next bound is the starting tick minus the tick
    // spacing.
    // If the starting sign is positive, then the next bound is the starting tick plus the tick
    // spacing.
    let bound_mag = if starting_price.sign {
        starting_price.mag - tick_spacing
    } else {
        starting_price.mag + tick_spacing
    };

    let (lower_mag, upper_mag) = if (is_token1_quote) {
        (starting_price.mag, bound_mag)
    } else {
        (bound_mag, starting_price.mag)
    };

    Bounds {
        lower: i129 { sign: bound_sign, mag: lower_mag },
        upper: i129 { sign: bound_sign, mag: upper_mag }
    }
}

pub fn align_tick(tick: i128, tick_spacing: i128) -> i128 {
    // Calculate the remainder of the tick divided by the tick spacing
    let remainder = tick % tick_spacing;

    // If the remainder is zero, the tick is already aligned
    if remainder == 0 {
        return tick;
    }

    // Calculate the aligned tick by subtracting the remainder
    // This aligns the tick to the nearest lower multiple of tick_spacing
    let aligned_tick = tick - remainder;

    // Return the aligned tick
    return aligned_tick;
}

pub fn align_tick_with_max_tick_and_min_tick(tick: u128, tick_spacing: u128) -> u128 {
    // Calculate the remainder of the tick divided by the tick spacing
    let remainder = tick % tick_spacing;

    // If the remainder is zero, the tick is already aligned
    if remainder == 0 {
        return tick;
    }

    // Calculate the aligned tick by subtracting the remainder
    // This aligns the tick to the nearest lower multiple of tick_spacing
    let aligned_tick = tick - remainder;

    // Return the aligned tick
    return aligned_tick;
}

pub fn unique_count<T, +Copy<T>, +Drop<T>, +PartialEq<T>>(mut self: Span<T>) -> u32 {
    let mut counter = 0;
    let mut result: Array<T> = array![];
    loop {
        match self.pop_front() {
            Option::Some(value) => {
                if contains(result.span(), *value) {
                    continue;
                }
                result.append(*value);
                counter += 1;
            },
            Option::None => { break; }
        }
    };
    counter
}

pub fn sum<T, +Copy<T>, +Drop<T>, +PartialEq<T>, +Zero<T>, +AddEq<T>>(mut self: Span<T>) -> T {
    let mut result = Zero::zero();
    loop {
        match self.pop_front() {
            Option::Some(value) => { result += *value; },
            Option::None => { break; }
        }
    };
    result
}

pub fn contains<T, +Copy<T>, +Drop<T>, +PartialEq<T>>(mut self: Span<T>, value: T) -> bool {
    loop {
        match self.pop_front() {
            Option::Some(current) => { if *current == value {
                break true;
            } },
            Option::None => { break false; }
        }
    }
}

pub fn calculate_bound_mag(fee: u128, tick_spacing: u128, initial_tick: i129) -> u128 {
    // First align the bound with tick spacing
    // Instead of using match with non-sequential numbers, use if/else statements
    let aligned_bound = if fee == 1 {
        // 0.01% fee
        tick_spacing * 2000 // Smaller bound for low fee tiers
    } else if fee == 5 {
        // 0.05% fee
        tick_spacing * 4000 // Medium bound for medium fee tiers
    } else if fee == 30 {
        // 0.3% fee
        tick_spacing * 6000 // Larger bound for higher fee tiers
    } else if fee == 100 {
        // 1% fee
        tick_spacing * 8000 // Largest bound for highest fee tiers
    } else {
        // Default to medium bound
        tick_spacing * 4000
    };

    // Ensure the bound doesn't exceed MAX_TICK
    let max_bound: u128 = MAX_TICK.try_into().unwrap() - initial_tick.mag.try_into().unwrap();
    if aligned_bound > max_bound {
        max_bound
    } else {
        aligned_bound
    }
}

// pub fn calculate_bound_mag(fee: u128, tick_spacing: u128, initial_tick: i129) -> u128 {
//     // First align the bound with tick spacing
//     let aligned_bound = match fee {
//         // 0% fee
//         0 => {
//             tick_spacing * 2000  // Smaller bound for low fee tiers
//         },
//         // 0.01% fee
//         1 => {
//             tick_spacing * 2000  // Smaller bound for low fee tiers
//         },
//         // 0.05% fee
//         5 => {
//             tick_spacing * 4000  // Medium bound for medium fee tiers
//         },
//         // 0.3% fee
//         30 => {
//             tick_spacing * 6000  // Larger bound for higher fee tiers
//         },
//         // 1% fee
//         100 => {
//             tick_spacing * 8000  // Largest bound for highest fee tiers
//         },
//         _ => {
//             tick_spacing * 4000  // Default to medium bound
//         }
//     };

//     // Ensure the bound doesn't exceed MAX_TICK
//     let max_bound:u128 = MAX_TICK.try_into().unwrap() - initial_tick.mag.try_into().unwrap();
//     if aligned_bound > max_bound {
//         max_bound
//     } else {
//         aligned_bound
//     }
// }

pub fn calculate_aligned_bound_mag(
    starting_price: i129, multiplier: u128, tick_spacing: u128
) -> u128 {
    // assert!(starting_price.sign, "Starting price negative");
    // assert!(tick_spacing > 0, "Invalid tick spacing");

    // Calculate initial bound_mag proportional to starting_price
    let mut init_bound = starting_price.mag * multiplier;

    // Ensure bound doesn't exceed max tick
    if init_bound > MAX_TICK_U128 {
        init_bound = MAX_TICK_U128;
    }

    // Round down to nearest tick spacing multiple
    let aligned_bound = (init_bound / tick_spacing) * tick_spacing;

    // Ensure we have at least one tick spacing
    if aligned_bound == 0 {
        tick_spacing
    } else {
        aligned_bound
    }
}

// Function to calculate the price ratio from two supplies
pub fn calculate_price_ratio(supply_a: u256, supply_b: u256) -> u256 {
    // Price ratio = (supply_a / supply_b)
    // Adding scaling here that we do not loose precision for ratios like 2.5
    return supply_a  * POW_128 / supply_b;
}

pub fn scaling_factor(decimals: u8) -> u256 {
    // Calculate the scaling factor for the given number of decimals
    if decimals == 0{
        1
    }
    else if decimals == 16 {
        POW_16
    }
    else if decimals == 32 {
        POW_32
    }
    else if decimals == 64 {
        POW_64
    }
    // This should never happen in our context but leave it for sure
    else if decimals == 128 {
        POW_128
    }
    else {
        1
    }
}

// Function to calculate the sqrt ratio from two supplies
pub fn calculate_sqrt_ratio(
    liquidity_raised: u256, initial_pool_supply: u256
) -> u256 {
    
    // y => token1 reserve
    // x => token0 reserve
    // If default token, is token1, then y = liquidity_raised, x = initial_pool_supply
    // but this cannot be applied for our calculations, 
    // we need to handle it in tick as the tick should be just on the other part of the curve (-)
    let (y, x) = (initial_pool_supply, liquidity_raised);

    // Calculate price ratio
    let price_ratio = calculate_price_ratio(y, x);
    if price_ratio == POW_128 {
        // Price ratio is 1, we need to handle this condition outside of the sqrt calculation
        return 1;
    }

    // We are trying to calculate sqrt of 128_FIXED_POINT NUMBER therefore we need to scale it by 2^128
    // But when the sqrt ratio is scaled back to u256 it is not the scaled appropriately so we scaled to 2^32 to get the correct value
    let (reduced_i_cast, exp) = dynamic_reduce_u256_to_u128((price_ratio));
    let res = fast_sqrt(reduced_i_cast, SQRT_ITER.try_into().unwrap());
    let scaling_decimals = (128 - exp) / 2;
    let mut sqrt_ratio = dynamic_scale_u128_to_u256(res, exp) * scaling_factor(scaling_decimals);
    
    // This was my original implementation however I wanted to used the fast_sqrt function from the alexandria_math crate
    // We need to multiply by POW_64 as the number is in the space of <-2^64, 2^64>
    // let mut sqrt_ratio: u256 = sqrt_fixed128(price_ratio) * POW_64;  
   
    let min_sqrt_ratio_limit = MIN_SQRT_RATIO;
    let max_sqrt_ratio_limit = MAX_SQRT_RATIO;

    // Assert if our calculated sqrt_ratio is within the min and max limits
    sqrt_ratio =
        if sqrt_ratio < min_sqrt_ratio_limit {
            println!("sqrt_ratio < min_sqrt_ratio_limit");
            min_sqrt_ratio_limit
        } else if sqrt_ratio > max_sqrt_ratio_limit {
            println!("sqrt_ratio > max_sqrt_ratio_limit");
            // This will resolve in smaller tick than MAX_TICK but as this scenario is obsure, we can make it work like this
            // To minimise need of new code
            max_sqrt_ratio_limit - 1 
        } else {
            println!("sqrt_ratio is between min and max");
            sqrt_ratio
        };

    sqrt_ratio
}
