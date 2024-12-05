use core::num::traits::Zero;

const BPS: u256 = 10_000; // 100% = 10_000 bps

pub trait PercentageMath {
    fn percent_mul(self: u256, other: u256) -> u256;
}

pub impl PercentageMathImpl of PercentageMath {
    fn percent_mul(self: u256, other: u256) -> u256 {
        self * other / BPS
    }
}
pub fn max_u256(a: u256, b: u256) -> u256 {
    if a > b {
        a
    } else {
        b
    }
}
pub fn max(a: u64, b: u64) -> u64 {
    if a > b {
        a
    } else {
        b
    }
}
// Math
pub fn pow_256(self: u256, mut exponent: u8) -> u256 {
    if self.is_zero() {
        return 0;
    }
    let mut result = 1;
    let mut base = self;

    loop {
        if exponent & 1 == 1 {
            result = result * base;
        }

        exponent = exponent / 2;
        if exponent == 0 {
            break result;
        }

        base = base * base;
    }
}

pub fn dynamic_reduce_u256_to_u128(value: u256) -> (u128, u8) {
    let result = if value >= pow_256(2, 192) {
        let x = value / pow_256(2, 128); // Divide by 2^128
        (x, 128)
    } else if value >= pow_256(2, 160) {
        let x = value / pow_256(2, 96); // Divide by 2^96
        (x, 96)
    } else if value >= pow_256(2, 128) {
        let x = value / pow_256(2, 64); // Divide by 2^64
        (x, 64)
    } else {
        (value, 0)
    };

    let (val, exponent) = result;
    (val.try_into().unwrap(), exponent)
}

pub fn dynamic_scale_u128_to_u256(value: u128, e: u8) -> u256 {
    let val = if e == 128 {
        value.into() * pow_256(2, 128) // Multiply by 2^128
    } else if e == 96 {
        value.into() * pow_256(2, 96) // Multiply by 2^96
    } else if e == 64 {
        value.into() * pow_256(2, 96) // Multiply by 2^64
    } else {
        value.into()
    };

    val
}
