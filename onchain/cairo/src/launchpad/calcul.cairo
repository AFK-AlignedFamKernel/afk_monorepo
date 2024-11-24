use afk::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyCoin, TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch,
    SetJediwapNFTRouterV2, SetJediwapV2Factory, SupportedExchanges, LiquidityCreated,
    LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters,
    LaunchParameters, EkuboLP, LiquidityType, CallbackData, EkuboLaunchParameters, LaunchCallback
};
// TODO refacto it to launchpad

// // Get amount of token received by token quote IN
// // Params
// // Quote amount
// // Is decreased for sell, !is_decrease for buy
// fn _get_coin_amount_by_quote_amount(
//     self: @ContractState, coin_address: ContractAddress, quote_amount: u256, is_decreased: bool
// ) -> u256 {
//     let pool_coin = self.launched_coins.read(coin_address);
//     let total_supply = pool_coin.total_supply.clone();
//     let current_supply = pool_coin.total_token_holded.clone();
//     let threshold_liquidity = self.threshold_liquidity.read().clone();

//     let k_max = total_supply * threshold_liquidity;

//     if is_decreased == true {
//         let pool_coin = self.launched_coins.read(coin_address);
//         let qa = pool_coin.liquidity_raised;
//         let qb_init_supply = pool_coin.total_supply / LIQUIDITY_RATIO;
//         // let pool_qty = pool_coin.threshold_liquidity.clone();
//         let pool_qty = pool_coin.threshold_liquidity.clone();
//         let k = pool_qty * qb_init_supply;
//         let qb = pool_coin.total_token_holded.clone();
//         let q_out = qa + pool_qty / LIQUIDITY_RATIO - k / (qb + quote_amount);
//         // let q_out = qa + (pool_qty / LIQUIDITY_RATIO) - k / (qb + quote_amount);
//         return q_out;
//     }

//     let k = current_supply * pool_coin.liquidity_raised;
//     let liquidity_ratio = total_supply / LIQUIDITY_RATIO;
//     let q_out = (total_supply - liquidity_ratio) - (k / (quote_amount));
//     q_out
// }

// // Get amount of quote to IN to buy an amount of coin
// fn _get_quote_paid_by_amount_coin(
//     self: @ContractState, coin_address: ContractAddress, amount_to_buy: u256, is_decreased: bool
// ) -> u256 {
//     let pool_coin = self.launched_coins.read(coin_address);
//     let current_supply = pool_coin.total_token_holded.clone();
//     let total_supply = pool_coin.total_supply.clone();
//     let threshold_liquidity = self.threshold_liquidity.read().clone();
//     let k = current_supply * pool_coin.liquidity_raised;
//     let k_max = total_supply * threshold_liquidity;
//     let q_in = (k / (total_supply - amount_to_buy)) - (k_max / total_supply);
//     q_in
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

