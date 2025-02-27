use core::num::traits::{Zero, One};
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
pub const MAX_SQRT_RATIO: u256 = 6277100250585753475930931601400621808602321654880405518632;

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
// pub fn calculate_aligned_bound_mag(
//     starting_price: i129, multiplier: u128, tick_spacing: u128
// ) -> u128 {
//     assert!(starting_price.sign, "Starting price negative");

//     // Calculate initial bound_mag proportional to starting_price
//     let mut init_bound = starting_price.mag * multiplier;

//     // Adjust bound_mag to align with tick_spacing
//     let rem = init_bound % tick_spacing;
//     if rem == 0 {
//         init_bound
//     } else {
//         init_bound + (tick_spacing - rem)
//     }
// }


