pub mod bip340;

pub mod errors;
// pub mod interfaces;
pub mod keys;

pub mod math;
pub mod sha256;
pub mod social;
pub mod utils;
// pub mod calcul {
//     pub mod exponential;
//     // pub mod linear;
//     // pub mod launch;
// }
// pub mod calcul;
pub mod launchpad {
    // pub mod calcul;
    // pub mod calcul;
    pub mod calcul {
        // pub mod exponential;
        pub mod linear;
        pub mod launch;
    }
    // pub mod exponential;
    // pub mod linear;
    // pub mod launch;

    pub mod errors;
    pub mod helpers;
    pub mod launchpad;
    pub mod math;
    pub mod utils;
}
pub mod quests {
    pub mod authority_quest;
    pub mod chain_faction_quest;
    pub mod faction_quest;
    pub mod factory;
    pub mod hodl_quest;
    pub mod nft_quest;
    pub mod pixel_quest;
    pub mod rainbow_quest;
    pub mod tap;
    pub mod template_quest;
    pub mod unruggable_quest;
    pub mod username_quest;
    pub mod vote_quest;
}

pub mod interfaces {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod factory;
    pub mod jediswap;
    pub mod nameservice;
    pub mod nfts;
    pub mod pixel;
    pub mod pixel_template;
    pub mod quest;
    pub mod quests;
    pub mod username_store;
    pub mod vault;
}

pub mod afk_id {
    // pub mod afk_identity;
    // pub mod id_factory;
    pub mod nameservice;
    pub mod username_store;
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
    pub mod pump_types;
    pub mod quest;
    pub mod tap_types;
}


pub mod examples {
    pub mod counter;
}

pub mod tokens {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod memecoin;
    pub mod memecoin_v2;
    pub mod quest_nft;
    pub mod token;
}

// TODO upgrade to correct OZ version
pub mod nfts {
    pub mod canvas_nft;
    pub mod component;
}


pub mod templates {
    pub mod template;
}
pub mod pixel {
    pub mod art_peace;
    // pub mod templates;
// use art_peace::ArtPeace;

}

#[cfg(test)]
pub mod tests {
    pub mod art_peace_tests;
    // pub mod identity_tests;
    pub mod keys_tests;
    pub mod launchpad_tests;
    pub mod liquidity_tests;
    pub mod nameservice_tests;
    pub mod quest_factory_test;
    pub mod tap_tests;
    pub mod utils;
    pub mod vault_tests;
}

