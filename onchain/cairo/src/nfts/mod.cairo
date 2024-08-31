pub mod nfts {
    mod canvas_nft;
    pub mod component;
    // pub mod canvas_nft;
    // pub mod component;
    // pub mod interfaces;
    pub mod interfaces;

    use interfaces::{
        NFTMintParams, NFTMetadata, IArtPeaceNFTMinter, ICanvasNFTStoreDispatcher,
        ICanvasNFTStoreDispatcherTrait, IArtPeaceNFTMinterDispatcher,
        IArtPeaceNFTMinterDispatcherTrait, ICanvasNFTAdditional, ICanvasNFTLikeAndUnlike,
        ICanvasNFTAdditionalDispatcher, ICanvasNFTAdditionalDispatcherTrait
    };
}
