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
