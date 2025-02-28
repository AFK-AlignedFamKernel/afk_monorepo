
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


#[starknet::contract]
pub mod MultiCanvas {

    // use afk_games::interfaces::multi_canvas_interface::{IMultiCanvas, GameBounds CanvasMetadata, StencilMetadata, CanvasInitParams};
    use super::{CanvasMetadata, StencilMetadata, CanvasInitParams, GameBounds, IMultiCanvas};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, // Stor
         StoragePointerReadAccess,
        StoragePointerWriteAccess, StoragePathEntry,
        // MutableEntryStoragePathEntry, StorableEntryReadAccess, StorageAsPathReadForward,
    // MutableStorableEntryReadAccess, MutableStorableEntryWriteAccess,
    // StorageAsPathWriteForward,PathableStorageEntryImpl
    };

    use core::starknet::{get_caller_address, ContractAddress};

    const DEFAULT_MIN_COLOR_COUNT: u32 = 2;
    const DEFAULT_MAX_COLOR_COUNT: u32 = 25;
    const DEFAULT_MIN_SIZE: u128 = 16;
    const DEFAULT_MAX_SIZE: u128 = 1024;
    const DEFAULT_MIN_STENCIL_SIZE: u128 = 5;
    const DEFAULT_MAX_STENCIL_SIZE: u128 = 256;


    #[storage]
    struct Storage {
        // Game Configuration
        game_master: ContractAddress,
        awards_enabled: bool,
        world_creation_enabled: bool,
        stencil_creation_enabled: bool,
        min_color_count: u32,
        max_color_count: u32,
        min_size: u128,
        max_size: u128,
        min_stencil_size: u128,
        max_stencil_size: u128,
        // Canvas/Worlds Data
        canvas_count: u32,
        // Map: canvas_id -> canvas metadata
        // canvases: LegacyMap::<u32, CanvasMetadata>,
        canvases: Map::<u32, CanvasMetadata>,

        // Map: canvas_id -> host address
        // hosts: LegacyMap::<u32, ContractAddress>,
        hosts: Map::<u32, ContractAddress>,

        // Map: canvas_id -> number of pixels per time window
        // pixels_per_time: LegacyMap::<u32, u32>,
        pixels_per_time: Map::<u32, u32>,
        // Map: canvas_id -> time between pixels
        // time_between_pixels: LegacyMap::<u32, u64>,
        time_between_pixels: Map::<u32, u64>,
        // Maps: unique_name -> is taken
        // unique_names: LegacyMap::<felt252, bool>,
        unique_names: Map::<felt252, bool>,
        // Colors Data
        // Map: canvas_id -> color count
        // color_counts: LegacyMap::<u32, u8>,
        color_counts: Map::<u32, u8>,
        // Map: (canvas_id, color_id) -> color value in RGBA
        // color_palettes: LegacyMap::<(u32, u8), u32>,
        // color_palettes: Map::<(u32, u8), u32>,
        color_palettes: Map::<u32, Map::<u8, u32>>,
        // Stencils Data
        // Map: canvas_id -> stencil count
        // stencil_counts: LegacyMap::<u32, u32>,
        stencil_counts: Map::<u32, u32>,
        // Map: (canvas_id, stencil_id) -> stencil metadata
        // stencils: LegacyMap::<(u32, u32), StencilMetadata>,
        stencils: Map::<(u32, u32), StencilMetadata>,
        // User Data
        // Map: (canvas_id, user's address) -> last time they placed a pixel
        // last_placed_times: LegacyMap::<(u32, ContractAddress), u64>,
        last_placed_times: Map::<(u32, ContractAddress), u64>,
        // Map: (canvas_id, user's address) -> amount of extra pixels they have
        // extra_pixels: LegacyMap::<(u32, ContractAddress), u32>,
        extra_pixels: Map::<(u32, ContractAddress), u32>,
        // Maps: (canvas_id, user addr) -> if favorited
        // canvas_favorites: LegacyMap::<(u32, ContractAddress), bool>,
        canvas_favorites: Map::<(u32, ContractAddress), bool>,
        // Maps: (canvas_id, stencil_id, user addr) -> if favorited
        // stencil_favorites: LegacyMap::<(u32, u32, ContractAddress), bool>,
        stencil_favorites: Map::<(u32, u32, ContractAddress), bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CanvasCreated: CanvasCreated,
        CanvasHostChanged: CanvasHostChanged,
        CanvasPixelsPerTimeChanged: CanvasPixelsPerTimeChanged,
        CanvasTimeBetweenPixelsChanged: CanvasTimeBetweenPixelsChanged,
        CanvasStartTimeChanged: CanvasStartTimeChanged,
        CanvasEndTimeChanged: CanvasEndTimeChanged,
        CanvasColorAdded: CanvasColorAdded,
        CanvasPixelPlaced: CanvasPixelPlaced,
        CanvasBasicPixelPlaced: CanvasBasicPixelPlaced,
        CanvasExtraPixelsPlaced: CanvasExtraPixelsPlaced,
        CanvasHostAwardedUser: CanvasHostAwardedUser,
        CanvasFavorited: CanvasFavorited,
        CanvasUnfavorited: CanvasUnfavorited,
        StencilAdded: StencilAdded,
        StencilRemoved: StencilRemoved,
        StencilFavorited: StencilFavorited,
        StencilUnfavorited: StencilUnfavorited,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasCreated {
        #[key]
        canvas_id: u32,
        init_params: CanvasInitParams,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasHostChanged {
        #[key]
        canvas_id: u32,
        old_host: ContractAddress,
        new_host: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasPixelsPerTimeChanged {
        #[key]
        canvas_id: u32,
        old_pixels: u32,
        new_pixels: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasTimeBetweenPixelsChanged {
        #[key]
        canvas_id: u32,
        old_time: u64,
        new_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasStartTimeChanged {
        #[key]
        canvas_id: u32,
        old_start: u64,
        start_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasEndTimeChanged {
        #[key]
        canvas_id: u32,
        old_end: u64,
        end_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasColorAdded {
        #[key]
        canvas_id: u32,
        #[key]
        color_key: u8,
        color: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasPixelPlaced {
        #[key]
        canvas_id: u32,
        #[key]
        placed_by: ContractAddress,
        #[key]
        pos: u128,
        color: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasBasicPixelPlaced {
        #[key]
        canvas_id: u32,
        #[key]
        placed_by: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasExtraPixelsPlaced {
        #[key]
        canvas_id: u32,
        #[key]
        placed_by: ContractAddress,
        extra_pixels: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct CanvasHostAwardedUser {
        #[key]
        canvas_id: u32,
        #[key]
        user: ContractAddress,
        amount: u32,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CanvasFavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CanvasUnfavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilAdded {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        pub stencil: StencilMetadata,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilRemoved {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        pub stencil: StencilMetadata,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilFavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        #[key]
        pub user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StencilUnfavorited {
        #[key]
        pub canvas_id: u32,
        #[key]
        pub stencil_id: u32,
        #[key]
        pub user: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, game_master: ContractAddress) {
        self.game_master.write(game_master);
        self.canvas_count.write(0);
        self.awards_enabled.write(false);
        self.world_creation_enabled.write(false);
        self.stencil_creation_enabled.write(true);
        self.min_color_count.write(DEFAULT_MIN_COLOR_COUNT);
        self.max_color_count.write(DEFAULT_MAX_COLOR_COUNT);
        self.min_size.write(DEFAULT_MIN_SIZE);
        self.max_size.write(DEFAULT_MAX_SIZE);
        self.min_stencil_size.write(DEFAULT_MIN_STENCIL_SIZE);
        self.max_stencil_size.write(DEFAULT_MAX_STENCIL_SIZE);
    }

    #[abi(embed_v0)]
    impl MultiCanvasImpl of IMultiCanvas<ContractState> {
        fn get_game_master(self: @ContractState) -> ContractAddress {
            self.game_master.read()
        }

        fn set_game_master(ref self: ContractState, game_master: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can change');
            self.game_master.write(game_master);
        }

        fn get_canvas_count(self: @ContractState) -> u32 {
            self.canvas_count.read()
        }

        fn get_canvas(self: @ContractState, canvas_id: u32) -> CanvasMetadata {
            // self.canvases.read(canvas_id)
            self.canvases.entry(canvas_id).read()
        }

        fn create_canvas(ref self: ContractState, init_params: CanvasInitParams) -> u32 {
            assert(
                self.world_creation_enabled.read()
                    || get_caller_address() == self.game_master.read(),
                'World creation disabled'
            );
            assert(init_params.width >= self.min_size.read(), 'Width too small');
            assert(init_params.height >= self.min_size.read(), 'Height too small');
            assert(init_params.width <= self.max_size.read(), 'Width too large');
            assert(init_params.height <= self.max_size.read(), 'Height too large');
            assert(
                init_params.color_palette.len() >= self.min_color_count.read().try_into().unwrap(),
                'Not enough colors'
            );
            assert(
                init_params.color_palette.len() <= self.max_color_count.read().try_into().unwrap(),
                'Too many colors'
            );
            assert(init_params.start_time < init_params.end_time, 'Invalid time range');
            // assert(!self.unique_names.read(init_params.unique_name), 'Unique name already taken');
            assert(!self.unique_names.entry(init_params.unique_name).read(), 'Unique name already taken');
            assert(validate_unique_name(init_params.unique_name), 'Invalid unique name');
            let canvas_id = self.canvas_count.read();
            // self
            //     .canvases
            //     .write(
            //         canvas_id,
            //         CanvasMetadata {
            //             name: init_params.name,
            //             unique_name: init_params.unique_name,
            //             width: init_params.width,
            //             height: init_params.height,
            //             start_time: init_params.start_time,
            //             end_time: init_params.end_time,
            //         }
            //     );
            self
                .canvases
                .entry(canvas_id)
                .write(
                    CanvasMetadata {
                        name: init_params.name,
                    unique_name: init_params.unique_name,
                    width: init_params.width,
                    height: init_params.height,
                    start_time: init_params.start_time,
                    end_time: init_params.end_time,
                }
            );
            // self.hosts.write(canvas_id, init_params.host);
            self.hosts.entry(canvas_id).write(init_params.host);
            // self.pixels_per_time.write(canvas_id, init_params.pixels_per_time);
            self.pixels_per_time.entry(canvas_id).write(init_params.pixels_per_time);
            // self.time_between_pixels.write(canvas_id, init_params.time_between_pixels);
            self.time_between_pixels.entry(canvas_id).write(init_params.time_between_pixels);
            let color_count = init_params.color_palette.len().try_into().unwrap();
            // self.color_counts.write(canvas_id, color_count);
            self.color_counts.entry(canvas_id).write(color_count);
            let mut i: u8 = 0;
            while i < color_count {
                // self.color_palettes.write((canvas_id, i), *init_params.color_palette.at(i.into()));
                self.color_palettes.entry(canvas_id).entry(i).write(*init_params.color_palette.at(i.into()));
                self
                    .emit(
                        CanvasColorAdded {
                            canvas_id, color_key: i, color: *init_params.color_palette.at(i.into())
                        }
                    );
                i += 1;
            };
            self.canvas_count.write(canvas_id + 1);
            // self.unique_names.write(init_params.unique_name, true);
            self.unique_names.entry(init_params.unique_name).write(true);
            self.emit(CanvasCreated { canvas_id, init_params });

            // Auto-favorite the canvas for the creator
            let caller = get_caller_address();
            // self.canvas_favorites.write((canvas_id, caller), true);
            self.canvas_favorites.entry((canvas_id, caller)).write(true);
            self.emit(Event::CanvasFavorited(CanvasFavorited { canvas_id, user: caller }));
            canvas_id
        }

        fn get_host(self: @ContractState, canvas_id: u32) -> ContractAddress {
            // self.hosts.read(canvas_id)
            self.hosts.entry(canvas_id).read()
        }

        fn set_host(ref self: ContractState, canvas_id: u32, host: ContractAddress) {
            let caller = get_caller_address();
            // assert(
            //     caller == self.game_master.read() || caller == self.hosts.read(canvas_id),
            //     'Only host can change host'
            // );
            assert(
                caller == self.game_master.read() || caller == self.hosts.entry(canvas_id).read(),
                'Only host can change host'
            );
            self.hosts.entry(canvas_id).write(host);
            self.emit(CanvasHostChanged { canvas_id, old_host: caller, new_host: host });
        }

        fn get_name(self: @ContractState, canvas_id: u32) -> felt252 {
            // self.canvases.read(canvas_id).name
            self.canvases.entry(canvas_id).read().name
        }

        fn get_width(self: @ContractState, canvas_id: u32) -> u128 {
            // self.canvases.read(canvas_id).width
            self.canvases.entry(canvas_id).read().width
        }

        fn get_height(self: @ContractState, canvas_id: u32) -> u128 {
            // self.canvases.read(canvas_id).height
            self.canvases.entry(canvas_id).read().height
        }

        fn get_last_placed_time(
            self: @ContractState, canvas_id: u32, user: ContractAddress
        ) -> u64 {
            // self.last_placed_times.read((canvas_id, user))
            self.last_placed_times.entry((canvas_id, user)).read()
        }

        fn get_pixels_per_time(self: @ContractState, canvas_id: u32) -> u32 {
            // self.pixels_per_time.read(canvas_id)
            self.pixels_per_time.entry(canvas_id).read()
        }

        fn set_pixels_per_time(ref self: ContractState, canvas_id: u32, pixels_per_time: u32) {
            let caller = get_caller_address();
            // assert(caller == self.hosts.read(canvas_id), 'Only host can change pixels');
            assert(caller == self.hosts.entry(canvas_id).read(), 'Only host can change pixels');
            // self.pixels_per_time.write(canvas_id, pixels_per_time);
            self.pixels_per_time.entry(canvas_id).write(pixels_per_time);
            self
                .emit(
                    CanvasPixelsPerTimeChanged {
                        canvas_id,
                        // old_pixels: self.pixels_per_time.read(canvas_id),s
                        old_pixels: self.pixels_per_time.entry(canvas_id).read(),
                        new_pixels: pixels_per_time
                    }
                );
        }

        fn get_time_between_pixels(self: @ContractState, canvas_id: u32) -> u64 {
            // self.time_between_pixels.read(canvas_id)
            self.time_between_pixels.entry(canvas_id).read()
        }

        fn set_time_between_pixels(
            ref self: ContractState, canvas_id: u32, time_between_pixels: u64
        ) {
            let caller = get_caller_address();
            // assert(caller == self.hosts.read(canvas_id), 'Only host can change timer');
            assert(caller == self.hosts.entry(canvas_id).read(), 'Only host can change timer');
            let old_time = self.time_between_pixels.read(canvas_id);
            // self.time_between_pixels.write(canvas_id, time_between_pixels);
            self.time_between_pixels.entry(canvas_id).write(time_between_pixels);
            self
                .emit(
                    CanvasTimeBetweenPixelsChanged {
                        canvas_id, old_time, new_time: time_between_pixels
                    }
                );
        }

        fn get_awards_enabled(self: @ContractState) -> bool {
            self.awards_enabled.read()
        }

        fn enable_awards(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can enable');
            self.awards_enabled.write(true);
        }

        fn disable_awards(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can disable');
            self.awards_enabled.write(false);
        }

        fn get_world_creation_enabled(self: @ContractState) -> bool {
            self.world_creation_enabled.read()
        }

        fn enable_world_creation(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can enable');
            self.world_creation_enabled.write(true);
        }

        fn disable_world_creation(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can disable');
            self.world_creation_enabled.write(false);
        }

        fn get_stencil_creation_enabled(self: @ContractState) -> bool {
            self.stencil_creation_enabled.read()
        }

        fn enable_stencil_creation(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can enable');
            self.stencil_creation_enabled.write(true);
        }

        fn disable_stencil_creation(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can disable');
            self.stencil_creation_enabled.write(false);
        }

        fn award_user(ref self: ContractState, canvas_id: u32, user: ContractAddress, amount: u32) {
            assert(
                self.awards_enabled.read() || get_caller_address() == self.game_master.read(),
                'Awards disabled'
            );
            let caller = get_caller_address();
            // assert(
            //     caller == self.hosts.read(canvas_id) || caller == self.game_master.read(),
            //     'Only hosts can award'
            // );
            assert(
                caller == self.hosts.entry(canvas_id).read() || caller == self.game_master.read(),
                'Only hosts can award'
            );
            // self
            //     .extra_pixels
            //     .write((canvas_id, user), self.extra_pixels.read((canvas_id, user)) + amount);
            self
                .extra_pixels
                .entry((canvas_id, user))
                .write(self.extra_pixels.entry((canvas_id, user)).read() + amount);
            self.emit(CanvasHostAwardedUser { canvas_id, user, amount });
        }

        fn get_color_count(self: @ContractState, canvas_id: u32) -> u8 {
            self.color_counts.entry(canvas_id).read()
        }

        fn get_colors(self: @ContractState, canvas_id: u32) -> Span<u32> {
            let color_count = self.color_counts.read(canvas_id);
            let mut colors = array![];
            let mut i = 0;
            while i < color_count {
                colors.append(self.color_palettes.entry(canvas_id).entry(i).read());
                i += 1;
            };
            colors.span()
        }

        fn is_name_taken(self: @ContractState, unique_name: felt252) -> bool {
            // self.unique_names.read(unique_name)
            self.unique_names.entry(unique_name).read()
        }

        fn get_start_time(self: @ContractState, canvas_id: u32) -> u64 {
            // self.canvases.read(canvas_id).start_time
            self.canvases.entry(canvas_id).read().start_time
        }

        fn set_start_time(ref self: ContractState, canvas_id: u32, start_time: u64) {
            let caller = get_caller_address();
            // assert(caller == self.hosts.read(canvas_id), 'Only host can change start time');
            assert(caller == self.hosts.entry(canvas_id).read(), 'Only host can change start time');
            // let mut canvas_metadata = self.canvases.read(canvas_id);
            let mut canvas_metadata = self.canvases.entry(canvas_id).read();
            assert(start_time < canvas_metadata.end_time, 'Invalid time range');
            self
                .emit(
                    CanvasStartTimeChanged {
                        canvas_id, old_start: canvas_metadata.start_time, start_time
                    }
                );
            canvas_metadata.start_time = start_time;
            // self.canvases.write(canvas_id, canvas_metadata);
            self.canvases.entry(canvas_id).write(canvas_metadata);
        }

        fn get_end_time(self: @ContractState, canvas_id: u32) -> u64 {
            // self.canvases.read(canvas_id).end_time
            self.canvases.entry(canvas_id).read().end_time
        }

        fn set_end_time(ref self: ContractState, canvas_id: u32, end_time: u64) {
            let caller = get_caller_address();
            // assert(caller == self.hosts.read(canvas_id), 'Only host can change end time');
            assert(caller == self.hosts.entry(canvas_id).read(), 'Only host can change end time');
            // let mut canvas_metadata = self.canvases.read(canvas_id);
            let mut canvas_metadata = self.canvases.entry(canvas_id).read();
            assert(end_time > canvas_metadata.start_time, 'Invalid time range');
            self
                .emit(
                    CanvasEndTimeChanged { canvas_id, old_end: canvas_metadata.end_time, end_time }
                );
            canvas_metadata.end_time = end_time;
            // self.canvases.write(canvas_id, canvas_metadata);
            self.canvases.entry(canvas_id).write(canvas_metadata);
        }

        fn add_color(ref self: ContractState, canvas_id: u32, color: u32) {
            let caller = get_caller_address();
            // assert(caller == self.hosts.read(canvas_id), 'Only host can add colors');
            assert(caller == self.hosts.entry(canvas_id).read(), 'Only host can add colors');
            // let color_count = self.color_counts.read(canvas_id);
            let color_count = self.color_counts.entry(canvas_id).read();
            assert(color_count.into() < self.max_color_count.read(), 'Too many colors');
            // self.color_palettes.write((canvas_id, color_count), color);
            self.color_palettes.entry(canvas_id).entry(color_count).write(color);
            // self.color_counts.write(canvas_id, color_count + 1);
            self.color_counts.entry(canvas_id).write(color_count + 1);
            self.emit(CanvasColorAdded { canvas_id, color_key: color_count, color });
        }

        fn check_game_running(self: @ContractState, canvas_id: u32) {
            let block_timestamp = starknet::get_block_timestamp();
            assert(
                block_timestamp >= self.canvases.entry(canvas_id).read().start_time,
                'This world has not started.'
            );
            assert(block_timestamp <= self.canvases.entry(canvas_id).read().end_time, 'This world ended.')
            // assert(
            //     block_timestamp >= self.canvases.read(canvas_id).start_time,
            //     'This world has not started.'
            // );
            // assert(block_timestamp <= self.canvases.read(canvas_id).end_time, 'This world ended.')
        }

        fn check_valid_pixel(self: @ContractState, canvas_id: u32, pos: u128, color: u8) {
            // let canvas = self.canvases.read(canvas_id);
            let canvas = self.canvases.entry(canvas_id).read();
            let total_pixels = canvas.width * canvas.height;
            assert(canvas_id < self.canvas_count.read(), 'Invalid canvas');
            assert(pos < total_pixels, 'Position out of bounds');
            // assert(color < self.color_counts.read(canvas_id), 'Invalid color');
            let color_count = self.color_counts.entry(canvas_id).read();
            assert(color < color_count, 'Invalid color');
        }

        fn check_timing(self: @ContractState, now: u64) {
            let block_timestamp = starknet::get_block_timestamp();
            let leanience_margin = 120; // 120 seconds
            let expected_block_time = 30; // 30 seconds
            assert(now >= block_timestamp - leanience_margin, 'Timestamp too far behind');
            assert(now <= block_timestamp + 4 * expected_block_time, 'Timestamp too far ahead');
        }

        fn place_pixels(
            ref self: ContractState,
            canvas_id: u32,
            positions: Span<u128>,
            colors: Span<u8>,
            now: u64
        ) {
            self.check_game_running(canvas_id);
            self.check_timing(now);
            let caller = starknet::get_caller_address();
            assert(
                now
                    - self
                        .last_placed_times
                        .entry((canvas_id, caller))
                        .read() >= self
                        .time_between_pixels
                        .entry(canvas_id)
                        .read(),
                'Pixels not available'
            );
            assert(positions.len() == colors.len(), 'Invalid pos & color lengths');
            // let available_pixels = self.pixels_per_time.read(canvas_id)
            //     + self.extra_pixels.read((canvas_id, caller));
            let available_pixels = self.pixels_per_time.entry(canvas_id).read()
                + self.extra_pixels.entry((canvas_id, caller)).read();  
            assert(positions.len() <= available_pixels, 'Too many pixels');
            place_basic_pixels_inner(ref self, canvas_id, positions, colors, now);
        }

        fn place_pixel(ref self: ContractState, canvas_id: u32, pos: u128, color: u8, now: u64) {
            self.place_pixels(canvas_id, array![pos].span(), array![color].span(), now);
        }

        fn place_pixel_xy(
            ref self: ContractState, canvas_id: u32, x: u128, y: u128, color: u8, now: u64
        ) {
            let pos = x + y * self.canvases.entry(canvas_id).read().width;
            // let pos = x + y * self.canvases.read(canvas_id).width;
            self.place_pixel(canvas_id, pos, color, now);
        }

        fn favorite_canvas(ref self: ContractState, canvas_id: u32) {
            let caller = get_caller_address();
            if self.canvas_favorites.entry((canvas_id, caller)).read() {
                return;
            }
            self.canvas_favorites.entry((canvas_id, caller)).write(true);
            self.emit(Event::CanvasFavorited(CanvasFavorited { canvas_id, user: caller, }));
        }

        fn get_game_bounds(self: @ContractState) -> GameBounds {
            GameBounds {
                min_color_count: self.min_color_count.read(),
                max_color_count: self.max_color_count.read(),
                min_size: self.min_size.read(),
                max_size: self.max_size.read(),
                min_stencil_size: self.min_stencil_size.read(),
                max_stencil_size: self.max_stencil_size.read(),
            }
        }

        fn set_game_bounds(ref self: ContractState, game_bounds: GameBounds) {
            let caller = get_caller_address();
            assert(caller == self.game_master.read(), 'Only game master can change');
            self.min_color_count.write(game_bounds.min_color_count);
            self.max_color_count.write(game_bounds.max_color_count);
            self.min_size.write(game_bounds.min_size);
            self.max_size.write(game_bounds.max_size);
            self.min_stencil_size.write(game_bounds.min_stencil_size);
            self.max_stencil_size.write(game_bounds.max_stencil_size);
        }

        fn unfavorite_canvas(ref self: ContractState, canvas_id: u32) {
            let caller = get_caller_address();
            if !self.canvas_favorites.entry((canvas_id, caller)).read() {
                return;
            }
            self.canvas_favorites.entry((canvas_id, caller)).write(false);
            self.emit(Event::CanvasUnfavorited(CanvasUnfavorited { canvas_id, user: caller, }));
        }

        fn get_stencil_count(self: @ContractState, canvas_id: u32) -> u32 {
            self.stencil_counts.read(canvas_id)
        }

        fn get_stencil(self: @ContractState, canvas_id: u32, stencil_id: u32) -> StencilMetadata {
            self.stencils.read((canvas_id, stencil_id))
        }

        fn add_stencil(ref self: ContractState, canvas_id: u32, stencil: StencilMetadata) -> u32 {
            assert(
                self.stencil_creation_enabled.read()
                    || get_caller_address() == self.game_master.read(),
                'Stencil creation disabled'
            );
            let stencil_id = self.stencil_counts.read(canvas_id);
            assert(stencil.width >= self.min_stencil_size.read(), 'Stencil too small');
            assert(stencil.height >= self.min_stencil_size.read(), 'Stencil too small');
            assert(stencil.width <= self.max_stencil_size.read(), 'Stencil too large');
            assert(stencil.height <= self.max_stencil_size.read(), 'Stencil too large');
            // legacy
            // self.stencils.write((canvas_id, stencil_id), stencil.clone());
            self.stencils.entry((canvas_id, stencil_id)).write(stencil.clone());
            // self.stencil_counts.write(canvas_id, stencil_id + 1);
            self.stencil_counts.entry(canvas_id).write(stencil_id + 1);
            self.emit(StencilAdded { canvas_id, stencil_id, stencil });

            // Auto-favorite the stencil for the creator
            let caller = get_caller_address();
            self.stencil_favorites.entry((canvas_id, stencil_id, caller)).write(true);
            self.emit(StencilFavorited { canvas_id, stencil_id, user: caller });

            stencil_id
        }

        fn remove_stencil(ref self: ContractState, canvas_id: u32, stencil_id: u32) {
            let caller = get_caller_address();
            // assert(
            //     caller == self.hosts.read(canvas_id) || caller == self.game_master.read(),
            //     'Only host can remove'
            // );
            assert(
                caller == self.hosts.entry(canvas_id).read() || caller == self.game_master.read(),
                'Only host can remove'
            );
            let stencil = self.stencils.read((canvas_id, stencil_id));
            self.emit(StencilRemoved { canvas_id, stencil_id, stencil });
        }

        fn favorite_stencil(ref self: ContractState, canvas_id: u32, stencil_id: u32) {
            let caller = get_caller_address();
            if self.stencil_favorites.entry((canvas_id, stencil_id, caller)).read() {
                return;
            }
            self.stencil_favorites.entry((canvas_id, stencil_id, caller)).write(true);
            self.emit(StencilFavorited { canvas_id, stencil_id, user: caller });
        }

        fn unfavorite_stencil(ref self: ContractState, canvas_id: u32, stencil_id: u32) {
            let caller = get_caller_address();
            if !self.stencil_favorites.entry((canvas_id, stencil_id, caller)).read() {
                return;
            }
            self.stencil_favorites.entry((canvas_id, stencil_id, caller)).write(false);
            self.emit(StencilUnfavorited { canvas_id, stencil_id, user: caller });
        }
    }

    fn place_pixel_inner(ref self: ContractState, canvas_id: u32, pos: u128, color: u8) {
        self.check_valid_pixel(canvas_id, pos, color);

        let caller = starknet::get_caller_address();
        self.emit(CanvasPixelPlaced { canvas_id, placed_by: caller, pos, color });
    }

    fn place_basic_pixels_inner(
        ref self: ContractState, canvas_id: u32, positions: Span<u128>, colors: Span<u8>, now: u64
    ) {
        let mut i = 0;
        while i < positions
            .len() {
                place_pixel_inner(ref self, canvas_id, *positions.at(i), *colors.at(i));
                i += 1;
            };
        let caller = starknet::get_caller_address();
        self.last_placed_times.entry((canvas_id, caller)).write(now);
        self.emit(CanvasBasicPixelPlaced { canvas_id, placed_by: caller, timestamp: now });
        // if positions.len() > self.pixels_per_time.read(canvas_id) {
        if positions.len() > self.pixels_per_time.entry(canvas_id).read() {
            let extra_pixels_used = positions.len() - self.pixels_per_time.entry(canvas_id).read();
            self
                .extra_pixels
                .entry((canvas_id, caller))
                .write(self.extra_pixels.entry((canvas_id, caller)).read() - extra_pixels_used);
            self
                .emit(
                    CanvasExtraPixelsPlaced {
                        canvas_id, placed_by: caller, extra_pixels: extra_pixels_used
                    }
                );
        }
    }

    fn char_is_number(char: u256) -> bool {
        char >= '0' && char <= '9'
    }

    fn char_is_lowercase_letter(char: u256) -> bool {
        char >= 'a' && char <= 'z'
    }

    fn char_is_valid(char: u256) -> bool {
        // Check unique_name only contains: a-z, 0-9, -, _
        char_is_number(char) || char_is_lowercase_letter(char) || char == '-' || char == '_'
    }

    fn validate_unique_name(unique_name: felt252) -> bool {
        let mut temp: u256 = unique_name.into();
        let mut result = true;
        while temp > 0 {
            let char = temp % 256;
            if !char_is_valid(char) {
                result = false;
                break;
            }
            temp /= 256;
        };
        result
    }
}
