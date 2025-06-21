pub mod errors;

pub mod math;

pub mod interfaces {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod nameservice;
    pub mod nfts;
    pub mod pixel;
    pub mod pixel_template;
    pub mod quest;
    pub mod quests;
    pub mod username_store;
    pub mod vault;
    // pub mod multi_canvas_interface;
}


pub mod afk_id {
    // pub mod afk_identity;
    // pub mod id_factory;
    pub mod nameservice;
}

// TODO upgrade to correct OZ version
pub mod nfts {
    pub mod canvas_nft;
    pub mod component;
}

// pub mod defi {
//     // pub mod vault;
// }

pub mod templates {
    pub mod template;
}
pub mod pixel {
    pub mod art_peace;
    pub mod canvas;
    pub mod canvas_factory;
    pub mod multi_canvas;
    // pub mod templates;
// use art_peace::ArtPeace;

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


pub mod types {
    pub mod constants;
    pub mod quest;
    pub mod tap_types;
}

pub mod tokens {
    pub mod erc20;
    pub mod erc20_mintable;
    pub mod quest_nft;
    pub mod token;
    // pub mod dn404 {
    //     pub mod dn404;
    //     pub mod dn404_component;
    //     pub mod dn404_mirror;
    //     pub mod dn404_mirror_component;
    //     pub mod dn404_mirror_preset;
    //     pub mod dn404_preset;
    // }
}


#[cfg(test)]
pub mod tests {
    pub mod art_peace_tests;
    // pub mod nameservice_tests;
    // pub mod quest_factory_test;
    // pub mod tap_tests;
    pub mod utils;
}
