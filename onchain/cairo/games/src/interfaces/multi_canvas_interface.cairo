
use core::starknet::{ContractAddress};

#[derive(Drop, Serde)]
pub struct GameBounds {
    min_color_count: u32,
    max_color_count: u32,
    min_size: u128,
    max_size: u128,
    min_stencil_size: u128,
    max_stencil_size: u128,
}

#[derive(Drop, Serde)]
pub struct CanvasInitParams {
    pub host: ContractAddress,
    pub name: felt252,
    pub unique_name: felt252,
    pub width: u128,
    pub height: u128,
    pub pixels_per_time: u32,
    pub time_between_pixels: u64,
    pub color_palette: Span<u32>,
    pub start_time: u64,
    pub end_time: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct CanvasMetadata {
    name: felt252,
    unique_name: felt252,
    width: u128,
    height: u128,
    start_time: u64,
    end_time: u64,
}

#[derive(Drop, Clone, Serde, starknet::Store)]
pub struct StencilMetadata {
    hash: felt252,
    width: u128,
    height: u128,
    position: u128
}

#[starknet::interface]
pub trait IMultiCanvas<TContractState> {
    // Game Configuration
    fn get_game_master(self: @TContractState) -> ContractAddress;
    fn set_game_master(ref self: TContractState, game_master: ContractAddress);

    fn get_awards_enabled(self: @TContractState) -> bool;
    fn enable_awards(ref self: TContractState);
    fn disable_awards(ref self: TContractState);

    fn get_world_creation_enabled(self: @TContractState) -> bool;
    fn enable_world_creation(ref self: TContractState);
    fn disable_world_creation(ref self: TContractState);

    fn get_stencil_creation_enabled(self: @TContractState) -> bool;
    fn enable_stencil_creation(ref self: TContractState);
    fn disable_stencil_creation(ref self: TContractState);

    fn get_game_bounds(self: @TContractState) -> GameBounds;
    fn set_game_bounds(ref self: TContractState, game_bounds: GameBounds);

    // Canvas/Worlds Data
    fn get_canvas_count(self: @TContractState) -> u32;
    fn get_canvas(self: @TContractState, canvas_id: u32) -> CanvasMetadata;
    fn get_name(self: @TContractState, canvas_id: u32) -> felt252;
    fn get_width(self: @TContractState, canvas_id: u32) -> u128;
    fn get_height(self: @TContractState, canvas_id: u32) -> u128;
    fn create_canvas(ref self: TContractState, init_params: CanvasInitParams) -> u32;

    fn get_host(self: @TContractState, canvas_id: u32) -> ContractAddress;
    fn set_host(ref self: TContractState, canvas_id: u32, host: ContractAddress);
    fn get_pixels_per_time(self: @TContractState, canvas_id: u32) -> u32;
    fn set_pixels_per_time(ref self: TContractState, canvas_id: u32, pixels_per_time: u32);
    fn get_time_between_pixels(self: @TContractState, canvas_id: u32) -> u64;
    fn set_time_between_pixels(ref self: TContractState, canvas_id: u32, time_between_pixels: u64);
    fn is_name_taken(self: @TContractState, unique_name: felt252) -> bool;
    fn get_start_time(self: @TContractState, canvas_id: u32) -> u64;
    fn set_start_time(ref self: TContractState, canvas_id: u32, start_time: u64);
    fn get_end_time(self: @TContractState, canvas_id: u32) -> u64;
    fn set_end_time(ref self: TContractState, canvas_id: u32, end_time: u64);

    // Colors Data
    fn get_color_count(self: @TContractState, canvas_id: u32) -> u8;
    fn get_colors(self: @TContractState, canvas_id: u32) -> Span<u32>;
    fn add_color(ref self: TContractState, canvas_id: u32, color: u32);

    // Stencils Data
    fn get_stencil_count(self: @TContractState, canvas_id: u32) -> u32;
    fn get_stencil(
        self: @TContractState, canvas_id: u32, stencil_id: u32
    ) -> StencilMetadata;
    fn add_stencil(
        ref self: TContractState, canvas_id: u32, stencil: StencilMetadata
    ) -> u32;
    fn remove_stencil(ref self: TContractState, canvas_id: u32, stencil_id: u32);

    // User Data
    fn get_last_placed_time(self: @TContractState, canvas_id: u32, user: ContractAddress) -> u64;
    fn award_user(ref self: TContractState, canvas_id: u32, user: ContractAddress, amount: u32);
    fn favorite_canvas(ref self: TContractState, canvas_id: u32);
    fn unfavorite_canvas(ref self: TContractState, canvas_id: u32);
    fn favorite_stencil(ref self: TContractState, canvas_id: u32, stencil_id: u32);
    fn unfavorite_stencil(ref self: TContractState, canvas_id: u32, stencil_id: u32);

    // Game utils
    fn check_game_running(self: @TContractState, canvas_id: u32);
    fn check_valid_pixel(self: @TContractState, canvas_id: u32, pos: u128, color: u8);
    fn check_timing(self: @TContractState, now: u64);

    // Main interaction: placing pixels
    fn place_pixels(
        ref self: TContractState, canvas_id: u32, positions: Span<u128>, colors: Span<u8>, now: u64
    );
    fn place_pixel(ref self: TContractState, canvas_id: u32, pos: u128, color: u8, now: u64);
    fn place_pixel_xy(
        ref self: TContractState, canvas_id: u32, x: u128, y: u128, color: u8, now: u64
    );
}
