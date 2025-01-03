// pub fn _supply_liquidity_jediswap_nft_mint(
//     ref self: ContractState,
//     pool_key: PoolKey,
//     token_address: ContractAddress,
//     quote_token_address: ContractAddress,
//     lp_supply: u256,
//     quote_amount: u256,
//     fee: u32,
//     bounds: Bounds,
//     owner: ContractAddress,
// ) -> u256 {
//     let mut factory_address = self.address_jediswap_factory_v2.read();
//     let nft_router_address = self.address_jediswap_nft_router_v2.read();

//     if nft_router_address.is_zero() {
//         return 0_u256;
//     }
//     let nft_router = IJediswapNFTRouterV2Dispatcher {
//         contract_address: nft_router_address
//     };

//     let factory = IJediswapFactoryV2Dispatcher { contract_address: factory_address };

//     // TODO
//     // Default params to verify
//     // Security check
//     // Verify all params pool sqrt etc
//     let sqrt_price_X96 = 0; // TODO change sqrt_price_X96

//     let amount_coin_liq = lp_supply.clone();
//     let total_supply = lp_supply.clone();
//     let liquidity_raised = quote_amount.clone();
//     let amount0_desired = 0;
//     let amount1_desired = 0;
//     let amount0_min = amount_coin_liq;
//     let amount1_min = liquidity_raised;
//     let tick_lower: i32 = 0;
//     let tick_upper: i32 = 0;
//     let deadline: u64 = get_block_timestamp();

//     let recipient_lp = get_contract_address();
//     println!("create pool");

//     let mut pool = factory.create_pool(token_address, quote_token_address, fee);
//     pool = nft_router
//         .create_and_initialize_pool(
//             token_address, quote_token_address, fee, sqrt_price_X96
//         );
//     // TODO Increase liquidity with router if exist
//     // Approve token asset and quote to be transferred
//     let token_asset = IERC20Dispatcher { contract_address: token_address };
//     let token_quote = IERC20Dispatcher { contract_address: quote_token_address };
//     token_asset.approve(nft_router_address, amount_coin_liq);
//     token_quote.approve(nft_router_address, liquidity_raised);
//     // TODO verify Mint params
//     // Test snforge in Sepolia
//     let mint_params = MintParams {
//         token0: token_address,
//         token1: quote_token_address,
//         fee: fee,
//         tick_lower: tick_lower,
//         tick_upper: tick_upper,
//         amount0_desired: amount0_desired,
//         amount1_desired: amount1_desired,
//         amount0_min: amount0_min,
//         amount1_min: amount1_min,
//         // recipient: launch.owner, // TODO add
//         recipient: recipient_lp, // TODO add
//         // deadline: deadline,
//         deadline: get_block_timestamp()
//     };

//     println!("mint and deposit");
//     let (token_id, _, _, _) = nft_router.mint(mint_params);
//     let mut id_token_lp = token_id.try_into().unwrap();
//     id_token_lp
// }

//         // Jediswap V1 router same as Unrug contract
//         // V1 function
//         pub fn _supply_liquidity_jediswap_router(
//             ref self: ContractState,
//             pool_key: PoolKey,
//             token_address: ContractAddress,
//             quote_address: ContractAddress,
//             lp_supply: u256,
//             quote_amount: u256,
//             owner: ContractAddress,
//         ) -> u256 {
//             let asset_token = ERC20ABIDispatcher { contract_address: token_address, };
//             let quote_token = ERC20ABIDispatcher { contract_address: quote_address, };
//             let caller_address = starknet::get_caller_address();

//             let this = get_contract_address();
//             let address_jediswap_router = self.address_jediswap_router_v2.read().clone();

//             // Create liquidity pool
//             let mut jedi_router = IJediswapRouterV2Dispatcher {
//                 contract_address: address_jediswap_router
//             };
//             assert(jedi_router.contract_address.is_non_zero(), errors::EXCHANGE_ADDRESS_ZERO);
//             let jedi_factory = IJediswapFactoryV2Dispatcher {
//                 // contract_address: jedi_router.factory().clone(),
//                 contract_address: jedi_router.factory(),
//             };

//             asset_token.approve(jedi_router.contract_address, lp_supply);
//             quote_token.approve(jedi_router.contract_address, quote_amount);

//             let (amount_memecoin, amount_eth, liquidity_received) = jedi_router
//                 .add_liquidity(
//                     token_address,
//                     quote_address,
//                     lp_supply,
//                     quote_amount,
//                     lp_supply,
//                     quote_amount,
//                     this, // receiver of LP tokens is the factory, that instantly locks them
//                     deadline: get_block_timestamp()
//                 );
//             let pair_address = jedi_factory.get_pair(token_address, quote_address);
//             let pair = ERC20ABIDispatcher { contract_address: pair_address, };

//             // Check if pair not created

//             // TODO add locked here or above
//             // let id_cast = pair.contract_address.try_into().unwrap();
//             // let id_cast = pair.contract_address;
//             let id_cast = 0_u256;
//             // let id_cast = pair.contract_address.into().unwrap();
//             id_cast
//         }

// /// TODO fix change
// pub fn _check_common_launch_parameters(
//     ref self: ContractState, launch_parameters: LaunchParameters
// ) -> (u256, u8) {
//     let LaunchParameters { memecoin_address,
//     transfer_restriction_delay,
//     max_percentage_buy_launch,
//     quote_address,
//     initial_holders,
//     initial_holders_amounts } =
//         launch_parameters;
//     let memecoin = IMemecoinDispatcher { contract_address: memecoin_address };
//     let erc20 = IERC20Dispatcher { contract_address: memecoin_address };

//     // TODO fix assert
//     // assert(self.is_memecoin(memecoin_address), errors::NOT_UNRUGGABLE);
//     // assert(!self.is_memecoin(quote_address), errors::QUOTE_TOKEN_IS_MEMECOIN);
//     assert(!memecoin.is_launched(), errors::ALREADY_LAUNCHED);
//     // assert(get_caller_address() == memecoin.owner(), errors::CALLER_NOT_OWNER);
//     assert(initial_holders.len() == initial_holders_amounts.len(), errors::ARRAYS_LEN_DIF);
//     assert(initial_holders.len() <= MAX_HOLDERS_LAUNCH.into(), errors::MAX_HOLDERS_REACHED);

//     let initial_supply = erc20.total_supply();

//     // Check that the sum of the amounts of initial holders does not exceed the max
//     // allocatable supply for a team.

//     // Needs to be an adjustable parameters described by the team
//     let max_team_allocation = initial_supply
//         .percent_mul(MAX_SUPPLY_PERCENTAGE_TEAM_ALLOCATION.into());
//     let mut team_allocation: u256 = 0;
//     let mut i: usize = 0;
//     loop {
//         if i == initial_holders.len() {
//             break;
//         }

//         let address = *initial_holders.at(i);
//         let amount = *initial_holders_amounts.at(i);

//         team_allocation += amount;
//         assert(team_allocation <= max_team_allocation, errors::MAX_TEAM_ALLOCATION_REACHED);
//         i += 1;
//     };

//     (team_allocation, unique_count(initial_holders).try_into().unwrap())
// }
