pub use interfaces::{
    IQuest, IAuthorityQuest, IPixelQuest, IRainbowQuest, IUnruggableQuest, IQuestDispatcher,
    IQuestDispatcherTrait, IUnruggableMemecoin, IUnruggableMemecoinDispatcher,
    IUnruggableMemecoinDispatcherTrait
};

pub mod quests {
    pub mod authority_quest;
    pub mod chain_faction_quest;
    pub mod faction_quest;
    pub mod hodl_quest;
    pub mod interfaces;
    pub mod nft_quest;
    pub mod pixel_quest;
    pub mod rainbow_quest;
    pub mod tap;
    pub mod template_quest;
    pub mod unruggable_quest;
    pub mod username_quest;
    pub mod vote_quest;
    // pub use interfaces::{
//     IQuest, IAuthorityQuest, IPixelQuest, IRainbowQuest, IUnruggableQuest, IQuestDispatcher,
//     IQuestDispatcherTrait, IUnruggableMemecoin, IUnruggableMemecoinDispatcher,
//     IUnruggableMemecoinDispatcherTrait
// };
// #[cfg(test)]
// mod tests {
//     pub(crate) mod art_peace;
//     pub(crate) mod username_store;
//     pub(crate) mod authority_quest;
//     pub(crate) mod username_quest;
//     pub(crate) mod color_voting;
//     pub(crate) mod nft_quest;
//     pub(crate) mod hodl_quest;
//     pub(crate) mod pixel_quest;
//     pub(crate) mod faction_quest;
//     pub(crate) mod chain_faction_quest;
//     pub(crate) mod rainbow_quest;
//     pub(crate) mod template_quest;
//     pub(crate) mod unruggable_quest;
//     pub(crate) mod vote_quest;
//     pub(crate) mod utils;
// }

}
