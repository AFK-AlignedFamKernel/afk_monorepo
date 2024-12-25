use starknet::ContractAddress;


#[derive(Drop, Copy, Serde, Hash, starknet::Store)]
pub enum PixelShieldType {
    BlockedTime,
    Auction,
    AuctionReset,
    // Starkdefi,
}


#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct AdminsFeesParams {
    pub is_shield_pixel_activated: bool,
    pub price_by_time_seconds: u256,
    //    pub price_by_time_minute: u256,
    pub shield_type: PixelShieldType,
    pub token_address: ContractAddress,
    pub auction_time_reset_price: u64,
    pub is_auction_time_reset: bool
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct Pixel {
    pub pos: u128,
    // Color index in the palette
    pub color: u8,
    // The person that placed the pixel
    pub owner: starknet::ContractAddress,
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct PixelState {
    pub pos: u128,
    // Color index in the palette
    pub color: u8,
    // The person that placed the pixel
    pub owner: starknet::ContractAddress,
    pub created_at: u64
}

#[derive(Drop, Serde, starknet::Store)]
pub struct MetadataPixel {
    pub pos: u128,
    // Color index in the palette
    pub ipfs: ByteArray,
    pub nostr_event_id: u256,
    pub owner: starknet::ContractAddress,
    pub contract: starknet::ContractAddress,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct PixelShield {
    pub pos: u128,
    // Color index in the palette
    pub ipfs: ByteArray,
    pub nostr_event_id: u256,
    pub owner: starknet::ContractAddress,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct Faction {
    pub name: felt252,
    pub leader: starknet::ContractAddress,
    pub joinable: bool,
    pub allocation: u32,
    pub is_admin: bool,
}


#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct FactionMetadata {
    pub nostr_id_group: u256,
    pub nostr_event_id: u256,
    pub twitter_id: u256,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct ChainFaction {
    pub name: felt252,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct MemberMetadata {
    pub member_placed_time: u64,
    pub member_pixels: u32
}

// TODO: Tests for all
// TODO: Split into components : existing w/ canvas and user info, quests, stats, etc.
#[starknet::interface]
pub trait IArtPeace<TContractState> {
    // Get canvas info
    // fn get_pixel(self: @TContractState, pos: u128) -> Pixel;
    // fn get_pixel_color(self: @TContractState, pos: u128) -> u8;
    // fn get_pixel_owner(self: @TContractState, pos: u128) -> starknet::ContractAddress;
    // fn get_pixel_xy(self: @TContractState, x: u128, y: u128) -> Pixel;
    fn get_width(self: @TContractState) -> u128;
    fn get_height(self: @TContractState) -> u128;
    fn get_total_pixels(self: @TContractState) -> u128;

    // Assertion helpers
    fn check_game_running(self: @TContractState);
    fn check_valid_pixel(self: @TContractState, pos: u128, color: u8);
    fn check_timing(self: @TContractState, now: u64);

    // Place pixels on the canvas
    fn place_pixel(ref self: TContractState, pos: u128, color: u8, now: u64);
    fn place_pixel_metadata(
        ref self: TContractState, pos: u128, color: u8, now: u64, metadata: MetadataPixel
    );
    fn add_pixel_metadata(
        ref self: TContractState, pos: u128, color: u8, now: u64, metadata: MetadataPixel
    );
    fn place_pixel_xy(ref self: TContractState, x: u128, y: u128, color: u8, now: u64);
    fn place_pixel_blocktime(ref self: TContractState, pos: u128, color: u8);
    fn place_extra_pixels(
        ref self: TContractState, positions: Span<u128>, colors: Span<u8>, now: u64
    );

    // Get placement info
    fn get_last_placed_time(self: @TContractState) -> u64;
    fn get_user_last_placed_time(self: @TContractState, user: starknet::ContractAddress) -> u64;
    fn get_time_between_pixels(self: @TContractState) -> u64;
    fn get_extra_pixels_count(self: @TContractState) -> u32;
    fn get_user_extra_pixels_count(self: @TContractState, user: starknet::ContractAddress) -> u32;

    // Faction stuff
    fn get_factions_count(self: @TContractState) -> u32;
    fn get_faction(self: @TContractState, faction_id: u32) -> Faction;
    fn get_faction_leader(self: @TContractState, faction_id: u32) -> starknet::ContractAddress;
    fn init_faction(
        ref self: TContractState,
        name: felt252,
        leader: starknet::ContractAddress,
        joinable: bool,
        allocation: u32
    );
    fn change_faction_leader(
        ref self: TContractState, faction_id: u32, new_leader: starknet::ContractAddress
    );
    fn init_chain_faction(ref self: TContractState, name: felt252);
    fn join_faction(ref self: TContractState, faction_id: u32);
    // TODO: fn leave_faction(ref self: TContractState);
    fn join_chain_faction(ref self: TContractState, faction_id: u32);
    fn get_user_faction(self: @TContractState, user: starknet::ContractAddress) -> u32;
    fn get_user_chain_faction(self: @TContractState, user: starknet::ContractAddress) -> u32;
    fn get_user_faction_members_pixels(
        self: @TContractState, user: starknet::ContractAddress, now: u64
    ) -> u32;
    fn get_chain_faction_members_pixels(
        self: @TContractState, user: starknet::ContractAddress, now: u64
    ) -> u32;

    // Get color info
    fn get_color_count(self: @TContractState) -> u8;
    fn get_colors(self: @TContractState) -> Array<u32>;

    // Color voting
    fn vote_color(ref self: TContractState, color: u8);
    fn get_color_votes(self: @TContractState, color: u8) -> u32;
    fn get_user_vote(self: @TContractState, user: starknet::ContractAddress, day: u32) -> u8;
    fn get_votable_colors(self: @TContractState) -> Array<u32>;

    // Get timing info
    fn get_creation_time(self: @TContractState) -> u64;
    fn get_end_time(self: @TContractState) -> u64;
    fn get_day(self: @TContractState) -> u32;

    // Start a new day
    fn increase_day_index(ref self: TContractState);

    // Get quest info
    fn get_daily_quests_count(self: @TContractState) -> u32;
    fn get_daily_quest(
        self: @TContractState, day_index: u32, quest_id: u32
    ) -> starknet::ContractAddress;
    fn get_days_quests(self: @TContractState, day_index: u32) -> Span<starknet::ContractAddress>;
    fn get_today_quests(self: @TContractState) -> Span<starknet::ContractAddress>;

    fn get_main_quest_count(self: @TContractState) -> u32;
    fn get_main_quest(self: @TContractState, quest_id: u32) -> starknet::ContractAddress;
    fn get_main_quests(self: @TContractState) -> Span<starknet::ContractAddress>;

    // Quests
    fn add_daily_quests(
        ref self: TContractState, day_index: u32, quests: Span<starknet::ContractAddress>
    );
    fn add_main_quests(ref self: TContractState, quests: Span<starknet::ContractAddress>);
    fn claim_today_quest(ref self: TContractState, quest_id: u32, calldata: Span<felt252>);
    fn claim_main_quest(ref self: TContractState, quest_id: u32, calldata: Span<felt252>);

    // NFT info
    fn get_nft_contract(self: @TContractState) -> starknet::ContractAddress;

    // Templates
    fn add_faction_template(
        ref self: TContractState,
        template_metadata: afk_games::interfaces::pixel_template::FactionTemplateMetadata
    );
    // fn add_faction_template(
    //     ref self: TContractState,
    //     template_metadata: afk_games::pixel::templates::interfaces::FactionTemplateMetadata
    // );
    fn remove_faction_template(ref self: TContractState, template_id: u32);
    // fn add_chain_faction_template(
    //     ref self: TContractState,
    //     template_metadata: afk_games::pixel::templates::interfaces::FactionTemplateMetadata
    // );
    fn add_chain_faction_template(
        ref self: TContractState,
        template_metadata: afk_games::interfaces::pixel_template::FactionTemplateMetadata
    );
    fn remove_chain_faction_template(ref self: TContractState, template_id: u32);

    // Stats
    fn get_user_pixels_placed(self: @TContractState, user: starknet::ContractAddress) -> u32;
    fn get_user_pixels_placed_day(
        self: @TContractState, user: starknet::ContractAddress, day: u32
    ) -> u32;
    fn get_user_pixels_placed_color(
        self: @TContractState, user: starknet::ContractAddress, color: u8
    ) -> u32;
    fn get_user_pixels_placed_day_color(
        self: @TContractState, user: starknet::ContractAddress, day: u32, color: u8
    ) -> u32;
}


#[derive(Drop, starknet::Event)]
pub struct ColorAdded {
    #[key]
    pub color_key: u8,
    pub color: u32,
}

#[derive(Drop, starknet::Event)]
pub struct NewDay {
    #[key]
    pub day_index: u32,
    pub start_time: u64,
}

#[derive(Drop, starknet::Event)]
pub struct CanvasScaled {
    pub old_width: u128,
    pub new_width: u128,
    pub old_height: u128,
    pub new_height: u128
}

#[derive(Drop, starknet::Event)]
pub struct PixelPlaced {
    #[key]
    pub placed_by: ContractAddress,
    #[key]
    pub pos: u128,
    #[key]
    pub day: u32,
    pub color: u8,
}

#[derive(Drop, starknet::Event)]
pub struct PixelMetadataPlaced {
    #[key]
    pub placed_by: ContractAddress,
    #[key]
    pub pos: u128,
    #[key]
    pub day: u32,
    pub color: u8,
    pub metadata: MetadataPixel,
}

#[derive(Drop, starknet::Event)]
pub struct BasicPixelPlaced {
    #[key]
    pub placed_by: ContractAddress,
    pub timestamp: u64,
}

#[derive(Drop, starknet::Event)]
pub struct FactionPixelsPlaced {
    #[key]
    pub user: ContractAddress,
    pub placed_time: u64,
    pub member_pixels: u32,
}

#[derive(Drop, starknet::Event)]
pub struct ChainFactionPixelsPlaced {
    #[key]
    pub user: ContractAddress,
    pub placed_time: u64,
    pub member_pixels: u32,
}

#[derive(Drop, starknet::Event)]
pub struct ExtraPixelsPlaced {
    #[key]
    pub placed_by: ContractAddress,
    pub extra_pixels: u32,
}

#[derive(Drop, starknet::Event)]
pub struct DailyQuestClaimed {
    #[key]
    pub day_index: u32,
    #[key]
    pub quest_id: u32,
    #[key]
    pub user: ContractAddress,
    pub reward: u32,
    pub calldata: Span<felt252>,
}

#[derive(Drop, starknet::Event)]
pub struct MainQuestClaimed {
    #[key]
    pub quest_id: u32,
    #[key]
    pub user: ContractAddress,
    pub reward: u32,
    pub calldata: Span<felt252>,
}

#[derive(Drop, starknet::Event)]
pub struct VoteColor {
    #[key]
    pub voted_by: ContractAddress,
    #[key]
    pub day: u32,
    #[key]
    pub color: u8,
}

#[derive(Drop, starknet::Event)]
pub struct VotableColorAdded {
    #[key]
    pub day: u32,
    #[key]
    pub color_key: u8,
    pub color: u32,
}

#[derive(Drop, starknet::Event)]
pub struct FactionCreated {
    #[key]
    pub faction_id: u32,
    pub name: felt252,
    pub leader: ContractAddress,
    pub joinable: bool,
    pub allocation: u32,
    pub is_admin: bool,
}

#[derive(Drop, starknet::Event)]
pub struct FactionUserFCreated {
    #[key]
    pub faction_id: u32,
    pub name: felt252,
    pub leader: ContractAddress,
    pub joinable: bool,
    pub allocation: u32,
}


#[derive(Drop, starknet::Event)]
pub struct FactionLeaderChanged {
    #[key]
    pub faction_id: u32,
    pub new_leader: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct ChainFactionCreated {
    #[key]
    pub faction_id: u32,
    pub name: felt252,
}

#[derive(Drop, starknet::Event)]
pub struct FactionJoined {
    #[key]
    pub faction_id: u32,
    #[key]
    pub user: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct FactionLeft {
    #[key]
    pub faction_id: u32,
    #[key]
    pub user: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct ChainFactionJoined {
    #[key]
    pub faction_id: u32,
    #[key]
    pub user: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct FactionTemplateAdded {
    #[key]
    pub template_id: u32,
    pub template_metadata: afk_games::interfaces::pixel_template::FactionTemplateMetadata,
}

#[derive(Drop, starknet::Event)]
pub struct FactionTemplateRemoved {
    #[key]
    pub template_id: u32,
}

#[derive(Drop, starknet::Event)]
pub struct ChainFactionTemplateAdded {
    #[key]
    pub template_id: u32,
    pub template_metadata: afk_games::interfaces::pixel_template::FactionTemplateMetadata,
}

#[derive(Drop, starknet::Event)]
pub struct ChainFactionTemplateRemoved {
    #[key]
    pub template_id: u32,
}

#[derive(Drop, Serde)]
pub struct InitParams {
    pub host: ContractAddress,
    pub canvas_width: u128,
    pub canvas_height: u128,
    pub time_between_pixels: u64,
    pub color_palette: Array<u32>,
    pub votable_colors: Array<u32>,
    pub daily_new_colors_count: u32,
    pub start_time: u64,
    pub end_time: u64,
    pub daily_quests_count: u32,
    pub devmode: bool,
}
