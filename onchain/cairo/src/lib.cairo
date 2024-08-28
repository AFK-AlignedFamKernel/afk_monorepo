pub mod bip340;
// pub mod interfaces;
pub mod keys;
pub mod launchpad;
pub mod sha256;
pub mod social;
pub mod utils;
pub mod quests {
    pub mod tap;
}

pub mod interfaces {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod jediswap;
    pub mod vault;
}

pub mod afk_id {
    pub mod afk_identity;
    pub mod id_factory;
}

pub mod defi {
    pub mod vault;
}

pub mod types {
    pub mod constants;
    pub mod defi_types;
    pub mod identity_types;
    pub mod jediswap_types;
    pub mod keys_types;
    pub mod launchpad_types;
    pub mod tap_types;
}


pub mod examples {
    pub mod counter;
}

pub mod tokens {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod token;
}

#[cfg(test)]
pub mod tests {
    pub mod identity_tests;
    pub mod keys_tests;
    pub mod launchpad_tests;
    pub mod tap_tests;
    pub mod vault_tests;
}

