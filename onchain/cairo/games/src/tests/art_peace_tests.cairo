use afk_games::interfaces::nfts::{
    IArtPeaceNFTMinterDispatcher, IArtPeaceNFTMinterDispatcherTrait, ICanvasNFTStoreDispatcher,
    ICanvasNFTStoreDispatcherTrait, NFTMintParams, NFTMetadata
};
use afk_games::interfaces::pixel::{IArtPeaceDispatcher, IArtPeaceDispatcherTrait};
use afk_games::interfaces::pixel::{InitParams, MetadataPixel, ShieldAdminParams, PixelShieldType};
use afk_games::interfaces::pixel_template::{
    ITemplateStoreDispatcher, ITemplateStoreDispatcherTrait, ITemplateVerifierDispatcher,
    ITemplateVerifierDispatcherTrait, TemplateMetadata
};
use afk_games::tests::utils;
use core::hash::{HashStateTrait, HashStateExTrait};

use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use openzeppelin::token::erc721::interface::{
    IERC721Dispatcher, IERC721DispatcherTrait, IERC721MetadataDispatcher,
    IERC721MetadataDispatcherTrait
};

use snforge_std as snf;
use snforge_std::{
    declare, ContractClass, spy_events, EventSpy, Event, start_cheat_caller_address,
    stop_cheat_caller_address, cheat_block_timestamp, CheatSpan, ContractClassTrait,
    DeclareResultTrait, start_cheat_block_timestamp, stop_cheat_block_timestamp
};
use starknet::{ContractAddress, get_caller_address, get_block_timestamp};

const DAY_IN_SECONDS: u64 = consteval_int!(60 * 60 * 24);
const WIDTH: u128 = 100;
const HEIGHT: u128 = 100;
const TIME_BETWEEN_PIXELS: u64 = 10;
const LEANIENCE_MARGIN: u64 = 20;
// const BASE_URI: ByteArray = "https://api.art-peace.net/nft-meta/nft-";

fn ADMIN() -> ContractAddress {
    'admin'.try_into().unwrap()
}

pub(crate) fn deploy_contract() -> ContractAddress {
    deploy_nft_contract();

    let contract = declare("ArtPeace").unwrap().contract_class();
    let mut calldata = array![];
    InitParams {
        host: utils::HOST(),
        canvas_width: WIDTH,
        canvas_height: HEIGHT,
        time_between_pixels: TIME_BETWEEN_PIXELS,
        color_palette: array![
            0x000000,
            0xFFFFFF,
            0xFF0000,
            0x00FF00,
            0x0000FF,
            0xFFFF00,
            0xFF00FF,
            0x00FFFF,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        votable_colors: array![
            0xDD0000,
            0x00DD00,
            0x0000DD,
            0xDDDD00,
            0xDD00DD,
            0x00DDDD,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        daily_new_colors_count: 3,
        start_time: 0,
        end_time: 1000000,
        daily_quests_count: 3,
        devmode: false
    }
        .serialize(ref calldata);
    ADMIN().serialize(ref calldata);

    start_cheat_caller_address(utils::ART_PEACE_CONTRACT(), utils::HOST());
    let (contract_addr, _) = contract.deploy_at(@calldata, utils::ART_PEACE_CONTRACT()).unwrap();
    stop_cheat_caller_address(utils::ART_PEACE_CONTRACT());

    cheat_block_timestamp(
        contract_addr, TIME_BETWEEN_PIXELS + LEANIENCE_MARGIN, CheatSpan::Indefinite
    );

    contract_addr
}

pub(crate) fn deploy_with_quests_contract(
    daily_quests: Span<ContractAddress>, main_quests: Span<ContractAddress>
) -> ContractAddress {
    deploy_nft_contract();

    let contract = declare("ArtPeace").unwrap().contract_class();
    let daily_quests_count = 3;
    let mut calldata = array![];
    InitParams {
        host: utils::HOST(),
        canvas_width: WIDTH,
        canvas_height: HEIGHT,
        time_between_pixels: TIME_BETWEEN_PIXELS,
        color_palette: array![
            0x000000,
            0xFFFFFF,
            0xFF0000,
            0x00FF00,
            0x0000FF,
            0xFFFF00,
            0xFF00FF,
            0x00FFFF,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        votable_colors: array![
            0xDD0000,
            0x00DD00,
            0x0000DD,
            0xDDDD00,
            0xDD00DD,
            0x00DDDD,
            0x880000,
            0x008800,
            0x000088,
            0x888800
        ],
        daily_new_colors_count: 3,
        start_time: 0,
        end_time: 1000000,
        daily_quests_count: daily_quests_count,
        devmode: false
    }
        .serialize(ref calldata);

    start_cheat_caller_address(utils::ART_PEACE_CONTRACT(), utils::HOST());
    let (contract_addr, _) = contract.deploy_at(@calldata, utils::ART_PEACE_CONTRACT()).unwrap();
    stop_cheat_caller_address(utils::ART_PEACE_CONTRACT());

    start_cheat_caller_address(contract_addr, utils::HOST());

    let art_peace = IArtPeaceDispatcher { contract_address: contract_addr };
    let mut i = 0;
    let mut dayId = 0;
    let mut days_quests: Array<ContractAddress> = array![];
    while i < daily_quests.len() {
        days_quests.append(*daily_quests.at(i));
        i += 1;
        if i % daily_quests_count == 0 {
            art_peace.add_daily_quests(dayId, days_quests.span());
            dayId += 1;
            days_quests = array![];
        }
    };
    if days_quests.len() > 0 {
        art_peace.add_daily_quests(dayId, days_quests.span());
    }

    art_peace.add_main_quests(main_quests);
    stop_cheat_caller_address(contract_addr);

    cheat_block_timestamp(
        contract_addr, TIME_BETWEEN_PIXELS + LEANIENCE_MARGIN, CheatSpan::Indefinite
    );

    contract_addr
}

fn deploy_nft_contract() -> ContractAddress {
    let contract = declare("CanvasNFT").unwrap().contract_class();
    let mut calldata = array![];
    let name: ByteArray = "CanvasNFTs";
    let symbol: ByteArray = "A/P";
    let base_uri: ByteArray = "https://api.art-peace.net/nft-meta/nft-";
    name.serialize(ref calldata);
    symbol.serialize(ref calldata);
    base_uri.serialize(ref calldata);
    let (contract_addr, _) = contract.deploy_at(@calldata, utils::NFT_CONTRACT()).unwrap();
    contract_addr
}

fn deploy_erc20_mock() -> ContractAddress {
    // use DualVmToken erc20 for testing
    let contract = declare("ERC20").unwrap().contract_class();
    let initial_supply: u256 = 10 * utils::pow_256(10, 18);
    let recipient: ContractAddress = utils::HOST();
    let mut calldata = array![];
    Serde::serialize(@initial_supply, ref calldata);
    Serde::serialize(@recipient, ref calldata);

    let (contract_addr, _) = contract.deploy_at(@calldata, utils::ERC20_MOCK_CONTRACT()).unwrap();

    contract_addr
}

pub(crate) fn warp_to_next_available_time(art_peace: IArtPeaceDispatcher) {
    let last_time = art_peace.get_last_placed_time();

    cheat_block_timestamp(
        art_peace.contract_address,
        last_time + TIME_BETWEEN_PIXELS + LEANIENCE_MARGIN,
        CheatSpan::Indefinite
    );
}

#[test]
fn deploy_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    assert!(art_peace.get_width() == WIDTH, "Deployed contract has wrong width");
    assert!(art_peace.get_height() == HEIGHT, "Deployed contract has wrong height");
    assert!(
        art_peace.get_total_pixels() == WIDTH * HEIGHT, "Deployed contract has wrong total pixels"
    );
}

// TODO: event spy?
// TODO: Tests assert in code
// TODO: Check pixel owner

#[test]
fn place_pixel_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel(pos, color, now);
    stop_cheat_caller_address(art_peace.contract_address);
    assert!(art_peace.get_user_pixels_placed(utils::PLAYER1()) == 1, "User pixels placed is not 1");
    assert!(
        art_peace.get_user_pixels_placed_color(utils::PLAYER1(), color) == 1,
        "User pixels placed color is not 1"
    );

    warp_to_next_available_time(art_peace);
    let x = 15;
    let y = 25;
    let color = 0x7;
    let now = 20;
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER2());
    art_peace.place_pixel_xy(x, y, color, now);
    stop_cheat_caller_address(art_peace.contract_address);
    assert!(art_peace.get_user_pixels_placed(utils::PLAYER2()) == 1, "User pixels placed is not 1");
    assert!(
        art_peace.get_user_pixels_placed_color(utils::PLAYER2(), color) == 1,
        "User pixels placed color is not 1"
    );
}

#[ignore]
#[test]
fn template_full_basic_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };
    let template_verifier = ITemplateVerifierDispatcher {
        contract_address: art_peace.contract_address
    };

    assert!(template_store.get_templates_count() == 0, "Templates count is not 0");

    let erc20_mock: ContractAddress = deploy_erc20_mock();

    // 2x2 template image
    let template_image = array![1, 2, 3, 4];
    let template_hash = template_verifier.compute_template_hash(template_image.span());
    let template_metadata = TemplateMetadata {
        name: 'test',
        hash: template_hash,
        position: 0,
        width: 2,
        height: 2,
        reward: 0,
        reward_token: erc20_mock,
        creator: get_caller_address()
    };

    template_store.add_template(template_metadata);

    assert!(template_store.get_templates_count() == 1, "Templates count is not 1");
    assert!(template_store.get_template_hash(0) == template_hash, "Template hash is not correct");
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (base)"
    );

    warp_to_next_available_time(art_peace);
    let x = 0;
    let y = 0;
    let pos = x + y * WIDTH;
    let color = 1;
    art_peace.place_pixel_blocktime(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (1)"
    );

    warp_to_next_available_time(art_peace);
    let x = 1;
    let y = 0;
    let pos = x + y * WIDTH;
    let color = 2;
    art_peace.place_pixel_blocktime(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (2)"
    );

    warp_to_next_available_time(art_peace);
    let x = 0;
    let y = 1;
    let pos = x + y * WIDTH;
    let color = 3;
    art_peace.place_pixel_blocktime(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == false,
        "Template is completed before it should be (3)"
    );

    warp_to_next_available_time(art_peace);
    let x = 1;
    let y = 1;
    let pos = x + y * WIDTH;
    let color = 4;
    art_peace.place_pixel_blocktime(pos, color);
    template_verifier.complete_template(0, template_image.span());
    assert!(
        template_store.is_template_complete(0) == true,
        "Template is not completed after it should be"
    );
}

// TODO: Invalid template completion tests

#[test]
fn increase_day_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };

    let current_day_index = art_peace.get_day();
    assert!(current_day_index == 0, "day index wrongly initialized");

    cheat_block_timestamp(art_peace_address, DAY_IN_SECONDS, CheatSpan::Indefinite);
    art_peace.increase_day_index();
    let current_day_index = art_peace.get_day();
    assert!(current_day_index == 1, "day index not updated");
}

#[test]
#[should_panic(expected: ('day has not passed',))]
fn increase_day_panic_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };

    let current_day_index = art_peace.get_day();
    assert!(current_day_index == 0, "day index wrongly initialized");

    cheat_block_timestamp(art_peace_address, DAY_IN_SECONDS - 1, CheatSpan::Indefinite);

    art_peace.increase_day_index();
}

// TODO: Deploy test for nft that checks name, symbol, uri, etc.

#[test]
fn nft_mint_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    let nft_minter = IArtPeaceNFTMinterDispatcher { contract_address: art_peace.contract_address };
    let nft_store = ICanvasNFTStoreDispatcher { contract_address: utils::NFT_CONTRACT() };
    let nft = IERC721Dispatcher { contract_address: utils::NFT_CONTRACT() };
    start_cheat_caller_address(nft_minter.contract_address, utils::HOST());
    nft_minter.add_nft_contract(utils::NFT_CONTRACT());
    stop_cheat_caller_address(nft_minter.contract_address);

    let mint_params = NFTMintParams { position: 10, width: 16, height: 16, name: 'test' };
    start_cheat_caller_address(nft_minter.contract_address, utils::PLAYER1());
    nft_minter.mint_nft(mint_params);
    stop_cheat_caller_address(nft_minter.contract_address);

    let expected_metadata = NFTMetadata {
        position: 10,
        width: 16,
        height: 16,
        name: 'test',
        image_hash: 0,
        day_index: 0,
        block_number: 2000, // TODO
        minter: utils::PLAYER1(),
    };
    let nft_metadata = nft_store.get_nft_metadata(0);

    assert!(nft_store.get_nfts_count() == 1, "NFTs count is not 1");
    assert!(nft_metadata == expected_metadata, "NFT metadata is not correct");
    assert!(nft.owner_of(0) == utils::PLAYER1(), "NFT owner is not correct");
    assert!(nft.balance_of(utils::PLAYER1()) == 1, "NFT balance is not correct");
    assert!(nft.balance_of(utils::PLAYER2()) == 0, "NFT balance is not correct");

    start_cheat_caller_address(nft.contract_address, utils::PLAYER1());
    nft.transfer_from(utils::PLAYER1(), utils::PLAYER2(), 0);
    stop_cheat_caller_address(nft.contract_address);

    assert!(nft.owner_of(0) == utils::PLAYER2(), "NFT owner is not correct after transfer");
    assert!(nft.balance_of(utils::PLAYER1()) == 0, "NFT balance is not correct after transfer");
    assert!(nft.balance_of(utils::PLAYER2()) == 1, "NFT balance is not correct after transfer");

    let nft_meta = IERC721MetadataDispatcher { contract_address: nft.contract_address };
    let expected_uri = "https://api.art-peace.net/nft-meta/nft-0.json";
    // let expected_uri = BASE_URI + "0.json";
    assert!(nft_meta.token_uri(0) == expected_uri, "NFT URI is not correct");
}

#[test]
fn nft_set_base_uri_test() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };
    let nft_minter = IArtPeaceNFTMinterDispatcher { contract_address: art_peace.contract_address };
    let nft = IERC721Dispatcher { contract_address: utils::NFT_CONTRACT() };
    start_cheat_caller_address(nft_minter.contract_address, utils::HOST());
    nft_minter.add_nft_contract(utils::NFT_CONTRACT());
    stop_cheat_caller_address(nft_minter.contract_address);

    let mint_params = NFTMintParams { position: 10, width: 16, height: 16, name: 'test' };
    start_cheat_caller_address(nft_minter.contract_address, utils::PLAYER1());
    nft_minter.mint_nft(mint_params);
    stop_cheat_caller_address(nft_minter.contract_address);

    let _base_uri: ByteArray = "https://api.art-peace.net/nft-meta/nft-";
    let expected_uri: ByteArray = "https://api.art-peace.net/nft-meta/nft-0.json";
    let nft_meta = IERC721MetadataDispatcher { contract_address: nft.contract_address };
    assert!(nft_meta.token_uri(0) == expected_uri, "NFT URI is not correct before change");

    let new_base_uri: ByteArray = "https://api.art-peace.net/nft-meta/v1/nft-";
    let new_expected_uri: ByteArray = "https://api.art-peace.net/nft-meta/v1/nft-0.json";
    start_cheat_caller_address(nft_minter.contract_address, utils::HOST());
    nft_minter.set_nft_base_uri(new_base_uri);
    stop_cheat_caller_address(nft_minter.contract_address);
    assert!(nft_meta.token_uri(0) == new_expected_uri, "NFT URI is not correct after change");
}

#[test]
fn deposit_reward_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };
    let template_verifier = ITemplateVerifierDispatcher {
        contract_address: art_peace.contract_address
    };

    let erc20_mock: ContractAddress = deploy_erc20_mock();
    let reward_amount: u256 = 1 * utils::pow_256(10, 18);

    // // 2x2 template image
    let template_image = array![1, 2, 3, 4];
    let template_hash = template_verifier.compute_template_hash(template_image.span());
    let template_metadata = TemplateMetadata {
        name: 'test',
        hash: template_hash,
        position: 0,
        width: 2,
        height: 2,
        reward: reward_amount,
        reward_token: erc20_mock,
        creator: get_caller_address(),
    };

    start_cheat_caller_address(erc20_mock, utils::HOST());
    IERC20Dispatcher { contract_address: erc20_mock }.transfer(utils::PLAYER1(), reward_amount);
    stop_cheat_caller_address(erc20_mock);

    start_cheat_caller_address(erc20_mock, utils::PLAYER1());
    IERC20Dispatcher { contract_address: erc20_mock }.approve(art_peace_address, reward_amount);
    stop_cheat_caller_address(erc20_mock);

    start_cheat_caller_address(art_peace_address, utils::PLAYER1());
    template_store.add_template(template_metadata);
    stop_cheat_caller_address(art_peace_address);

    let art_peace_token_balance = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(art_peace_address);

    assert!(
        art_peace_token_balance == reward_amount, "reward wrongly distributed when adding template"
    );
}

#[ignore]
#[test]
fn distribute_rewards_test() {
    let art_peace_address = deploy_contract();
    let art_peace = IArtPeaceDispatcher { contract_address: art_peace_address };
    let template_verifier = ITemplateVerifierDispatcher {
        contract_address: art_peace.contract_address
    };
    let template_store = ITemplateStoreDispatcher { contract_address: art_peace.contract_address };

    let erc20_mock: ContractAddress = deploy_erc20_mock();
    let reward_amount: u256 = 4;

    let template_image = array![1, 2, 3, 4];
    let template_hash = template_verifier.compute_template_hash(template_image.span());
    let template_metadata = TemplateMetadata {
        name: 'test',
        hash: template_hash,
        position: 0,
        width: 2,
        height: 2,
        reward: reward_amount,
        reward_token: erc20_mock,
        creator: get_caller_address(),
    };

    let template_image_span = template_image.span();
    let now = 10;
    let template_id = 0;

    let user = 123.try_into().unwrap();
    let user2 = 1234.try_into().unwrap();
    let user3 = 12345.try_into().unwrap();
    let user4 = 123456.try_into().unwrap();

    IERC20Dispatcher { contract_address: erc20_mock }.approve(art_peace_address, reward_amount);

    template_store.add_template(template_metadata);
    assert!(template_store.get_templates_count() == 1, "Templates count is not 1");

    start_cheat_caller_address(art_peace_address, user);
    art_peace.place_pixel(0, 1, now);
    stop_cheat_caller_address(art_peace_address);

    start_cheat_caller_address(art_peace_address, user2);
    art_peace.place_pixel(1, 2, now);
    stop_cheat_caller_address(art_peace_address);

    start_cheat_caller_address(art_peace_address, user3);
    art_peace.place_pixel(WIDTH, 3, now);
    stop_cheat_caller_address(art_peace_address);

    start_cheat_caller_address(art_peace_address, user4);
    art_peace.place_pixel(WIDTH + 1, 4, now);
    stop_cheat_caller_address(art_peace_address);

    template_verifier.complete_template_with_rewards(template_id, template_image_span);

    let art_token_balance_of_contract = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(art_peace_address);
    let art_token_balance_of_user = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(user);
    let art_token_balance_of_user2 = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(user2);
    let art_token_balance_of_user3 = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(user3);
    let art_token_balance_of_user4 = IERC20Dispatcher { contract_address: erc20_mock }
        .balance_of(user4);

    assert!(art_token_balance_of_user == 1, "User 1 incorrect reward amount");
    assert!(art_token_balance_of_user2 == 1, "User 2 incorrect reward amount");
    assert!(art_token_balance_of_user3 == 1, "User 3 incorrect reward amount");
    assert!(art_token_balance_of_user4 == 1, "User 4 incorrect reward amount");
    assert!(art_token_balance_of_contract == 0, "Contract should not have any remaining balance");
}

#[test]
fn test_place_pixel_with_metadata() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;

    let ipfs: ByteArray = "ipfs";

    let pixel_metadata = MetadataPixel {
        pos, ipfs, nostr_event_id: 1, owner: utils::PLAYER1(), contract: art_peace.contract_address,
    };

    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel_with_metadata(pos, color, now, pixel_metadata.clone());
    stop_cheat_caller_address(art_peace.contract_address);

    assert!(art_peace.get_user_pixels_placed(utils::PLAYER1()) == 1, "User pixels placed is not 1");
    assert!(
        art_peace.get_user_pixels_placed_color(utils::PLAYER1(), color) == 1,
        "User pixels placed color is not 1"
    );

    // get last placed pixel with metadata
    let (pixel_state, res_metadata) = art_peace.get_last_placed_pixel_with_metadata(pos);

    assert(pixel_state.pos == pos, 'wrong position');
    assert(pixel_state.color == color, 'wrong color');
    assert(pixel_state.owner == utils::PLAYER1(), 'wrong owner');

    assert(res_metadata.pos == pixel_metadata.pos, 'wrong meta position');
    assert(res_metadata.ipfs == pixel_metadata.ipfs, 'wrong meta ipfs');
    assert(res_metadata.owner == utils::PLAYER1(), 'wrong meta ipfs');
    assert(res_metadata.contract == art_peace.contract_address, 'wrong meta ipfs');
}

#[test]
#[should_panic(expected: ('not owner',))]
fn test_place_pixel_metadata_non_owner() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;

    let ipfs: ByteArray = "ipfs";

    let pixel_metadata = MetadataPixel {
        pos, ipfs, nostr_event_id: 1, owner: utils::PLAYER1(), contract: art_peace.contract_address,
    };

    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel_metadata(pos, color, now, pixel_metadata.clone());
    stop_cheat_caller_address(art_peace.contract_address);

    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER2());
    art_peace.place_pixel_metadata(pos, color, now, pixel_metadata.clone());
    stop_cheat_caller_address(art_peace.contract_address);
}


#[test]
fn test_set_shield_type_with_shield_params() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let shield_params = ShieldAdminParams {
        timestamp: get_block_timestamp(),
        shield_type: PixelShieldType::BuyTime,
        until: 30,
        amount_to_paid: 0,
        cost_per_second: 0,
        cost_per_minute: 0,
        contract_address: art_peace.contract_address,
    };

    // set shield type and params
    start_cheat_caller_address(art_peace.contract_address, ADMIN());
    art_peace.set_shield_type_with_shield_params(PixelShieldType::BuyTime, shield_params);
    stop_cheat_caller_address(art_peace.contract_address);

    let (shield_type, res_shield_params) = art_peace.get_current_shield_type_and_params();

    assert(shield_type == PixelShieldType::BuyTime, 'wrong shield type');
    assert(res_shield_params.shield_type == shield_params.shield_type, 'wrong shield params type');
    assert(res_shield_params.until == shield_params.until, 'wrong until value');
    assert(
        res_shield_params.amount_to_paid == shield_params.amount_to_paid, 'wrong amount to paid'
    );
}

#[test]
#[should_panic(expected: ('shield not activated',))]
fn test_place_pixel_shield_non_activated() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;

    let ipfs: ByteArray = "ipfs";

    // place pixel shield
    art_peace.place_pixel_shield(pos);
}

#[test]
#[should_panic(expected: ('wrong pixel owner',))]
fn test_place_pixel_shield_wrong_pixel_owner() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;

    let shield_params = ShieldAdminParams {
        timestamp: get_block_timestamp(),
        shield_type: PixelShieldType::BuyTime,
        until: 30,
        amount_to_paid: 0,
        cost_per_second: 0,
        cost_per_minute: 0,
        contract_address: art_peace.contract_address,
    };

    // set shield type and params
    start_cheat_caller_address(art_peace.contract_address, ADMIN());
    art_peace.activate_pixel_shield();
    art_peace.set_shield_type_with_shield_params(PixelShieldType::BuyTime, shield_params);
    stop_cheat_caller_address(art_peace.contract_address);

    // place pixel
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel(pos, color, now);
    stop_cheat_caller_address(art_peace.contract_address);

    // place pixel
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER2());
    art_peace.place_pixel(pos, color, now);
    stop_cheat_caller_address(art_peace.contract_address);

    // place pixel shield
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel_shield(pos);
    stop_cheat_caller_address(art_peace.contract_address);
}

#[test]
#[should_panic(expected: ('pixel under shield',))]
fn test_place_pixel_shield_pixel_under_shield() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;

    let shield_params = ShieldAdminParams {
        timestamp: get_block_timestamp(),
        shield_type: PixelShieldType::BuyTime,
        until: 30,
        amount_to_paid: 0,
        cost_per_second: 0,
        cost_per_minute: 0,
        contract_address: art_peace.contract_address,
    };

    // set shield type and params
    start_cheat_caller_address(art_peace.contract_address, ADMIN());
    art_peace.activate_pixel_shield();
    art_peace.set_shield_type_with_shield_params(PixelShieldType::BuyTime, shield_params);
    stop_cheat_caller_address(art_peace.contract_address);

    // place pixel
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel(pos, color, now);
    stop_cheat_caller_address(art_peace.contract_address);

    // place pixel shield
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel_shield(pos);
    art_peace.place_pixel_shield(pos);
    stop_cheat_caller_address(art_peace.contract_address);
}

#[test]
fn test_place_pixel_shield_ok() {
    let art_peace = IArtPeaceDispatcher { contract_address: deploy_contract() };

    let x = 10;
    let y = 20;
    let pos = x + y * WIDTH;
    let color = 0x5;
    let now = 10;

    let shield_params = ShieldAdminParams {
        timestamp: get_block_timestamp(),
        shield_type: PixelShieldType::BuyTime,
        until: 30,
        amount_to_paid: 0,
        cost_per_second: 0,
        cost_per_minute: 0,
        contract_address: art_peace.contract_address,
    };

    // set shield type and params
    start_cheat_caller_address(art_peace.contract_address, ADMIN());
    art_peace.activate_pixel_shield();
    art_peace.set_shield_type_with_shield_params(PixelShieldType::BuyTime, shield_params);
    stop_cheat_caller_address(art_peace.contract_address);

    // place pixel
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel(pos, color, now);
    stop_cheat_caller_address(art_peace.contract_address);

    // place pixel shield
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel_shield(pos);
    stop_cheat_caller_address(art_peace.contract_address);

    // simulate time passage
    start_cheat_block_timestamp(art_peace.contract_address, get_block_timestamp() + 200);

    // place pixel shield
    start_cheat_caller_address(art_peace.contract_address, utils::PLAYER1());
    art_peace.place_pixel_shield(pos);
    stop_cheat_caller_address(art_peace.contract_address);

    let shield = art_peace.get_last_placed_pixel_shield(pos);

    assert(shield.pos == pos, 'wrong position');
    assert(shield.timestamp == get_block_timestamp() + 200, 'wrong timestamp');
    assert(shield.until == shield_params.until, 'wrong end time');
    assert(shield.amount_paid == shield_params.amount_to_paid, 'wrong amount paid');
    assert(shield.owner == utils::PLAYER1(), 'wrong owner');
}
