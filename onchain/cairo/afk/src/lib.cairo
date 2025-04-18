pub mod bip340;

pub mod errors;
pub mod math;
pub mod pedersen;
pub mod sha256;
pub mod social;
pub mod staking;
pub mod utils;


pub mod interfaces {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod nameservice;
    pub mod nfts;
    pub mod nostrfi_scoring_interfaces;
    pub mod username_store;
    pub mod vault;
    pub mod voting;
}

pub mod afk_id {
    // pub mod afk_identity;
    // pub mod id_factory;
    pub mod nameservice;
    pub mod username_store;
}

pub mod dao {
    pub mod dao_aa;
    pub mod dao_factory;
}
pub mod defi {
    pub mod vault;
}

pub mod types {
    pub mod constants;
    pub mod defi_types;
    pub mod identity_types;
    pub mod jediswap_types;
    pub mod tap_types;
}

pub mod components {
    // pub mod voting_proposal;
    pub mod nostr_namespace;

    pub mod voting;
}

pub mod account {
    pub mod nostr_account;
}

pub mod tokens {
    pub mod erc20;
    pub mod erc20_intern;
    pub mod erc20_mintable;
    // pub mod token;
// pub mod dn404 {
//     pub mod dn404;
//     pub mod dn404_component;
//     pub mod dn404_mirror;
//     pub mod dn404_mirror_component;
//     pub mod dn404_mirror_preset;
//     pub mod dn404_preset;
// }
}

pub mod infofi {
    pub mod errors;
    pub mod nostrfi_scoring;
}

#[cfg(test)]
pub mod tests {
    // pub mod dn404_presets_test;
    // pub mod dn404_tests;
    // pub mod nameservice_tests;
    pub mod nostrfi_scoring_tests;
    pub mod utils;
    // pub mod staking_tests;

    // pub mod vault_tests;
}
