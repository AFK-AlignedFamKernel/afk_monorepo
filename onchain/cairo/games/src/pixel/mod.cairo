pub mod templates;
pub mod username_store;
pub use art_peace::ArtPeace;

pub mod pixel {
    pub mod art_peace;
    // pub mod templates;
    pub use art_peace::ArtPeace;


    pub mod templates {
        pub mod component;
    }

    pub mod username_store {
        pub mod interfaces;
        pub mod username_store;
    }
}
