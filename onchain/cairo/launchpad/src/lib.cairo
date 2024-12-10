pub mod bip340;

pub mod errors;

pub mod math;
pub mod sha256;

pub mod utils;

pub mod launchpad {
    // pub mod calcul;
    // pub mod exponential;
    // pub mod linear;
    // pub mod launch;

    pub mod errors;
    pub mod helpers;
    pub mod launchpad;
    pub mod math;
    pub mod unrug;
    pub mod utils;
    pub mod locker {
        pub mod errors;
        pub mod interface;
        pub mod lock_manager;
        pub mod lock_position;
    }
    pub mod calcul {
        pub mod exponential;
        pub mod launch;
        pub mod linear;
    }
}


pub mod interfaces {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod factory;
    pub mod jediswap;
}

pub mod types {
    pub mod constants;
    pub mod jediswap_types;
    pub mod keys_types;
    pub mod launchpad_types;
}

pub mod tokens {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod memecoin;
    pub mod memecoin_v2;
}

#[cfg(test)]
pub mod tests {
    pub mod exponential_tests;
    pub mod launchpad_tests;
    pub mod linear_tests;
    pub mod liquidity_tests;
    pub mod unrug_tests;
}
