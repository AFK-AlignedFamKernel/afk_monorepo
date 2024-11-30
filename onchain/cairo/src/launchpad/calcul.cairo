use afk::launchpad::errors;
use afk::launchpad::math::{PercentageMath, pow_256, max_u256};
use afk::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyCoin, TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch,
    SetJediswapNFTRouterV2, SetJediswapV2Factory, SupportedExchanges, LiquidityCreated,
    LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters,
    LaunchParameters, EkuboLP, LiquidityType, CallbackData, EkuboLaunchParameters, LaunchCallback
};
use ekubo::types::{i129::i129};
use starknet::ContractAddress;


const BPS: u256 = 10_000; // 100% = 10_000 bps
// const SCALE_FACTOR: u256  = 100_000_000_000_000_000_u256; // Scale factor decimals place for
// price division and others stuff
// const SCALE_FACTOR: u256 =
//     100_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff
const SCALE_FACTOR: u256 =
    100_000_000_000_000_000_u256; // Scale factor decimals place for price division and others stuff
// const SCALE_FACTOR: u256 =100_000_000_000_000_000; // Scale factor decimals place for price
// division and others stuff Total supply / LIQUIDITY_RATIO
// Get the 20% of Bonding curve going to Liquidity
// Liquidity can be lock to Unrug
const LIQUIDITY_RATIO: u256 = 5; // Divid by 5 the total supply.

// TODO fix starting price launch
pub fn calculate_starting_price_launch(
    initial_pool_supply: u256, threshold_liquidity: u256,
) -> i129 {
    // TODO calculate price

    // let launch_price = initial_pool_supply.clone() / threshold_liquidity.clone();
    let launch_price = threshold_liquidity.clone() / threshold_liquidity.clone();
    // println!("launch_price {:?}", launch_price);
    let price_u128: u128 = launch_price.try_into().unwrap();
    // println!("price_u128 {:?}", price_u128);
    let starting_price = i129 { sign: true, mag: price_u128 };

    starting_price
}

// TODO verify price bonding curve 
// current sellable supply beofre launch
pub fn calculate_pricing(threshold_liquidity: u256, sellable_supply: u256) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must sup 0');
    // let scaling_factor = 10;
    // let starting_price = (threshold_liquidity.clone() * scaling_factor) /
    // sellable_supply.clone();
    // TODO check new formula
    let starting_price = (threshold_liquidity.clone() * SCALE_FACTOR) / sellable_supply.clone();
    // let starting_price = (threshold_liquidity.clone() * SCALE_FACTOR) / (sellable_supply.clone()*2);
    starting_price
}

// TODO check new formula
pub fn calculate_init_pricing(threshold_liquidity: u256, sellable_supply: u256) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must sup 0');
    // let scaling_factor = 10;
    // let starting_price = (threshold_liquidity.clone() * scaling_factor) /
    // sellable_supply.clone();
    // TODO check new formula init pricing with linear curve?
    let starting_price = (threshold_liquidity.clone() * SCALE_FACTOR) / (sellable_supply.clone()*2);
    starting_price
}

pub fn calculate_slope(
    threshold_liquidity: u256, starting_price: u256, sellable_supply: u256
) -> u256 {
    assert(sellable_supply.clone() > 0, 'Sellable supply must != 0');
    let slope_numerator = (threshold_liquidity * SCALE_FACTOR)
        - (starting_price * sellable_supply.clone());
    let slope_denominator = (sellable_supply.clone() * sellable_supply.clone()) / 2_u256;
    // println!("slope_denominator {:?}", slope_denominator.clone());
    assert(slope_denominator.clone() > 0, 'Slope denominator must != 0');
    let slope = slope_numerator / (slope_denominator * SCALE_FACTOR);
    slope / SCALE_FACTOR
}

pub fn get_coin_amount_by_quote_amount(
    pool_coin: TokenLaunch, quote_amount: u256, is_decreased: bool
) -> u256 {
    let total_supply = pool_coin.total_supply.clone();
    let current_supply = pool_coin.available_supply.clone();
    let sellable_supply = total_supply.clone() - (total_supply.clone() / LIQUIDITY_RATIO);
    assert(sellable_supply.clone() > 0, 'Sellable supply == 0 ');

    let starting_price = pool_coin.starting_price.clone();
    let slope = calculate_slope(
        pool_coin.threshold_liquidity.clone(), starting_price.clone(), sellable_supply.clone(),
    );

    let tokens_sold = sellable_supply.clone() - current_supply.clone();
    let price = slope * tokens_sold.clone() + starting_price.clone();
    // println!("price {:?}", price.clone());
    // println!("SCALE_FACTOR {:?}", SCALE_FACTOR.clone());

    let price_scale_factor_test = price.clone() * SCALE_FACTOR;
    // println!("price_scale_factor_test {:?}", price_scale_factor_test.clone());

    // TODO fix this
    // Max_u256 can't broke the price.
    // When we multiply it's never appear above 0 even if big scale factor

    let price_scale_factor = price.clone() * SCALE_FACTOR;
    // let price_scale_factor = max_u256(price.clone() * SCALE_FACTOR, 1_u256);
    // println!("price_scale_factor {:?}", price_scale_factor.clone());

    let mut q_out: u256 = 0;
    if is_decreased {
        q_out = quote_amount / price_scale_factor;
    } else {
        q_out = quote_amount / price_scale_factor;
    }

    q_out / SCALE_FACTOR
}


pub fn get_amount_by_type_of_coin_or_quote(
    pool: TokenLaunch,
    coin_address: ContractAddress,
    amount: u256,
    is_decreased: bool,
    is_quote_amount: bool,
) -> u256 {
    let mut total_supply = pool.total_token_holded.clone();
    let mut final_supply = total_supply + amount;

    if is_decreased {
        final_supply = total_supply - amount;
    }

    let mut actual_supply = total_supply;
    let mut starting_price = pool.starting_price.clone();
    let step_increase_linear = pool.slope.clone();
    let bonding_type = pool.bonding_curve_type.clone();
    match bonding_type {
        Option::Some(x) => {
            match x {
                BondingType::Linear => {
                    if is_quote_amount == true {
                        get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                    } else {
                        get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                    }
                },
                BondingType::Trapezoidal => {
                    get_coin_amount_by_quote_amount(pool, amount, is_decreased)
                },
                _ => { get_coin_amount_by_quote_amount(pool, amount, is_decreased) },
            }
        },
        Option::None => { get_coin_amount_by_quote_amount(pool, amount, is_decreased) }
    }
}
// pub fn calculate_pricing(threshold_liquidity: u256, sellable_supply: u256) -> u256 {
//     let scaling_factor = 10;
//     // let scaling_factor = 10;
//     // Starting price is proportional to the threshold liquidity divided by sellable supply
//     let starting_price = (threshold_liquidity.clone() * scaling_factor) /
//     sellable_supply.clone();
//     return starting_price;
//     // let threshold_liquidity = self.threshold_liquidity.read();
// // let slope = (2 * threshold_liquidity)
// //     / (liquidity_available * (liquidity_available - 1));
// // let initial_price = (2 * threshold_liquidity / liquidity_available)
// //     - slope * (liquidity_available - 1) / 2;
// // (slope, initial_price)
// }
// pub fn calculate_slope(
//     threshold_liquidity: u256, starting_price: u256, sellable_supply: u256
// ) -> u256 {
//     // println!("calculate slope");
//     // Calculate slope
//     // let slope_numerator = (threshold_liquidity * SCALE_FACTOR)
//     //     - (starting_price * sellable_supply);
//     let slope_numerator = (threshold_liquidity * SCALE_FACTOR) - (starting_price *
//     sellable_supply);
//     let slope_denominator = (sellable_supply * sellable_supply) / 2_u256;

//     // let slope_numerator = threshold_liquidity - (starting_price * sellable_supply);
//     // let slope_denominator = (sellable_supply * sellable_supply) / 2;
//     // let slope = slope_numerator / slope_denominator;
//     // println!("slope_denominator {:?}", slope_denominator);

//     // let slope = (threshold_liquidity - (starting_price * sellable_supply))
//     //     / ((sellable_supply * sellable_supply) / 2_u256);
//     // let slope = slope_numerator / (slope_denominator * SCALE_FACTOR);
//     // let slope = slope_numerator / (slope_denominator);
//     let slope = slope_numerator / (slope_denominator * SCALE_FACTOR);

//     // println!("slope");
//     slope / SCALE_FACTOR
//     // slope
// // // Calculate slope dynamically
// // let m = (threshold_liquidity - (starting_price * sellable_supply))
// //     / ((sellable_supply * sellable_supply) / 2_u256);

//     // m
// }

// // Get amount of token received by token quote IN
// // Params
// // Quote amount
// // Is decreased for sell, !is_decrease for buy
// pub fn get_coin_amount_by_quote_amount(
//     pool_coin: TokenLaunch, quote_amount: u256, is_decreased: bool
//     // total_supply: u256,
// // current_supply: u256, // available supply
// // liquidity_raised: u256,
// // threshold_liquidity: u256,
// ) -> u256 {
//     // Load state variables
//     let total_supply = pool_coin.total_supply.clone(); // Total memecoins minted by user
//     let current_supply = pool_coin.available_supply.clone(); // Remaining tokens to sell
//     // let current_supply = pool_coin.total_token_holded.clone(); // Remaining tokens to
//     let liquidity_raised = pool_coin.liquidity_raised.clone(); // Quote tokens raised so far
//     let threshold_liquidity = pool_coin.threshold_liquidity.clone(); // Threshold in quote tokens

//     // Dynamically calculate sellable supply
//     let sellable_supply = total_supply - (total_supply / LIQUIDITY_RATIO);

//     // User-defined starting price
//     let starting_price = pool_coin.starting_price; // e.g., 0.01

//     // Calculate slope dynamically
//     let slope = calculate_slope(
//         threshold_liquidity.clone(), starting_price.clone(), sellable_supply.clone()
//     );

//     // let m = (threshold_liquidity - (starting_price * sellable_supply))
//     //     / ((sellable_supply * sellable_supply) / 2_u256);

//     // Calculate price (P) of the next token
//     let tokens_sold = sellable_supply - current_supply;
//     // let price = m * tokens_sold + starting_price;
//     // println!("tokens_sold {:?}", tokens_sold);

//     // Calculate price
//     // let price = slope * tokens_sold + starting_price;

//     let price = slope * tokens_sold + starting_price;
//     // println!("price {:?}", price);

//     // let safe_price = max(price, MIN_PRICE);

//     let price_scale_factor = price * SCALE_FACTOR;
//     let quote_amount_factor = quote_amount * SCALE_FACTOR;
//     // println!("price_scale_factor {:?}", price_scale_factor);

//     // Ensure price is positive
//     // assert(price_scale_factor >= 0_u256, 'Price must remain positive');
//     // assert(price >= 0_u256, 'Price must remain positive');

//     // Determine tokens received based on quote amount
//     let mut q_out: u256 = 0;
//     if is_decreased {
//         // Sell path: calculate how many tokens are returned for a given quote amount
//         // q_out = (quote_amount) / (price);
//         q_out = (quote_amount) / (price_scale_factor);
//         // q_out = (quote_amount_factor) / (price_scale_factor);
//     // q_out = (quote_amount_factor) / (price);
//     } else {
//         // Buy path: calculate how many tokens are purchased for a given quote amount
//         // q_out = quote_amount / (price);
//         // q_out = quote_amount / (price * SCALE_FACTOR);
//         q_out = (quote_amount) / (price_scale_factor);
//         // q_out = (quote_amount_factor) / (price_scale_factor);
//     // q_out = (quote_amount_factor) / (price_scale_factor);
//     // q_out = (quote_amount_factor) / (price);
//     }

//     // println!("q_out {:?}", q_out);
//     return q_out / SCALE_FACTOR;
//     // return q_out;
// // OLD not working

//     // let pool_coin = self.launched_coins.read(coin_address);

// }

// fn _trapezoidal_rule(
//     self: @ContractState, coin_address: ContractAddress,
//     total_supply:u256,
//     step_increase_linear:u256,
//     initial_key_price:u256,
//     amount: u256, is_decreased: bool
// ) -> u256 {
//     let mut final_supply = total_supply + amount;

//     if is_decreased {
//         final_supply = total_supply - amount;
//     }

//     let mut actual_supply = total_supply;
//     if !is_decreased {
//         let start_price = initial_key_price + (step_increase_linear * actual_supply);
//         let end_price = initial_key_price + (step_increase_linear * final_supply);
//         let total_price = (final_supply - actual_supply) * (start_price + end_price) / 2;
//         total_price
//     } else {
//         let start_price = initial_key_price + (step_increase_linear * final_supply);
//         let end_price = initial_key_price + (step_increase_linear * actual_supply);
//         let total_price = (actual_supply - final_supply) * (start_price + end_price) / 2;
//         total_price
//     }
// }

// fn _calculate_pricing(ref self: ContractState,
//     threshold_liquidity:u256,
//     liquidity_available: u256) -> (u256, u256) {
//     let slope = (2 * threshold_liquidity) / (liquidity_available * (liquidity_available - 1));
//     let initial_price = (2 * threshold_liquidity / liquidity_available)
//         - slope * (liquidity_available - 1) / 2;
//     (slope, initial_price)
// }

// // Check type, amount and return coin_amount or quote_amount
// // Params
// // coin_address: Coin address to check
// // Amount: quote amount to paid or amount of coin to buy and receive
// // is_drecreased: false if buy, true if sell
// // is_quote_amount: true if quote amount and get token receive | false if ift's amount to
// // get and calculate quote amount to buy fn _get_price_of_supply_key(
// fn _get_amount_by_type_of_coin_or_quote(
//     self: @ContractState,
//     coin_address: ContractAddress,
//     amount: u256,
//     is_decreased: bool,
//     is_quote_amount: bool,
// ) -> u256 {
//     let pool = self.launched_coins.read(coin_address);
//     let mut total_supply = pool.total_token_holded.clone();
//     let mut final_supply = total_supply + amount;

//     if is_decreased {
//         final_supply = total_supply - amount;
//     }

//     let mut actual_supply = total_supply;
//     let mut initial_key_price = pool.initial_key_price.clone();
//     let step_increase_linear = pool.slope.clone();
//     let bonding_type = pool.bonding_curve_type.clone();
//     match bonding_type {
//         Option::Some(x) => {
//             match x {
//                 BondingType::Linear => {
//                     if is_quote_amount == true {
//                         self._get_coin_amount_by_quote_amount(coin_address, amount, is_decreased)
//                     } else {
//                         self._get_coin_amount_by_quote_amount(coin_address, amount, is_decreased)
//                     }
//                 },
//                 BondingType::Trapezoidal => {
//                     self._trapezoidal_rule(coin_address, amount, is_decreased)
//                 },
//                 _ => {
//                     let start_price = initial_key_price + (step_increase_linear * actual_supply);
//                     let end_price = initial_key_price + (step_increase_linear * final_supply);
//                     let total_price = amount * (start_price + end_price) / 2;
//                     total_price
//                 },
//             }
//         },
//         Option::None => {
//             let start_price = initial_key_price + (step_increase_linear * actual_supply);
//             let end_price = initial_key_price + (step_increase_linear * final_supply);
//             let total_price = amount * (start_price + end_price) / 2;
//             total_price
//         }
//     }
// }


