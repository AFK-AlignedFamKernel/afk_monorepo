use core::num::traits::{Zero, One};
use ekubo::types::bounds::Bounds;
use ekubo::types::i129::i129;

use starknet::ContractAddress;
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

const MAX_TICK: u128 = 887272;

pub fn calculate_aligned_bound_mag(
    starting_price: i129, multiplier: u128, tick_spacing: u128
) -> u128 {
    // assert!(starting_price.sign, "Starting price negative");
    // assert!(tick_spacing > 0, "Invalid tick spacing");

    // Calculate initial bound_mag proportional to starting_price
    let mut init_bound = starting_price.mag * multiplier;

    // Ensure bound doesn't exceed max tick
    if init_bound > MAX_TICK {
        init_bound = MAX_TICK;
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

