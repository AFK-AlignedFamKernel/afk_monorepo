// TODO add liquidity or increase
// Better params of Mint
pub fn add_liquidity_jediswap(
    address_jediswap_factory_v2: ContractAddress,
    address_jediswap_nft_router_v2: ContractAddress,
    launch: TokenLaunch,
    coin_address: ContractAddress
) -> u256 {
    let mut factory_address = address_jediswap_factory_v2.clone();
    let nft_router_address = address_jediswap_nft_router_v2.clone();

    if nft_router_address.is_zero() {
        return;
    }
    let nft_router = IJediswapNFTRouterV2Dispatcher { contract_address: nft_router_address };

    let facto_address = nft_router.factory();

    if !facto_address.is_zero() {
        factory_address = facto_address.clone();
    }

    if factory_address.is_zero() {
        return;
    }
    // let jediswap_address = self.exchange_configs.read(SupportedExchanges::Jediswap);
    //
    let fee: u32 = 10_000;
    let factory = IJediswapFactoryV2Dispatcher { contract_address: factory_address };
    let token_a = launch.token_address.clone();
    let asset_token_address = launch.token_address.clone();
    let quote_token_address = launch.token_quote.token_address.clone();
    let token_b = launch.token_quote.token_address.clone();
    // TODO tokens check
    // assert!(token_a != token_b, "same token");
    // Look if pool already exist
    // Init and Create pool if not exist
    let mut pool: ContractAddress = factory.get_pool(token_a, token_b, fee);
    let sqrt_price_X96 = 0; // TODO change sqrt_price_X96

    // TODO check if pool exist
    // Pool need to be create
    // Better params for Liquidity launching
    // let token_asset = IERC20Dispatcher { contract_address: token_a };

    // TODO
    // Used total supply if coin is minted
    // let total_supply_now = token_asset.total_supply().clone();
    let total_supply = launch.total_supply.clone();
    let liquidity_raised = launch.liquidity_raised.clone();
    // let total_supply = launch.total_supply.clone();

    let amount_coin_liq = total_supply / LIQUIDITY_RATIO;
    let amount0_desired = 0;
    let amount1_desired = 0;
    let amount0_min = amount_coin_liq;
    let amount1_min = liquidity_raised;
    let tick_lower: i32 = 0;
    let tick_upper: i32 = 0;
    let deadline: u64 = get_block_timestamp();

    // @TODO check mint params

    if pool.into() == 0_felt252 {
        pool = factory.create_pool(token_a, token_b, fee);
        pool = nft_router.create_and_initialize_pool(token_a, token_b, fee, sqrt_price_X96);
        // TODO Increase liquidity with router if exist
        // Approve token asset and quote to be transferred
        let token_asset = IERC20Dispatcher { contract_address: token_a };
        let token_quote = IERC20Dispatcher { contract_address: token_b };
        token_asset.approve(nft_router_address, amount_coin_liq);
        token_quote.approve(nft_router_address, launch.liquidity_raised);
        // TODO verify Mint params
        // Test snforge in Sepolia
        let mint_params = MintParams {
            token0: token_a,
            token1: token_b,
            fee: fee,
            tick_lower: tick_lower,
            tick_upper: tick_upper,
            amount0_desired: amount0_desired,
            amount1_desired: amount1_desired,
            amount0_min: amount0_min,
            amount1_min: amount1_min,
            recipient: launch.owner, // TODO add 
            deadline: deadline,
        };

        let (token_id, _, _, _) = nft_router.mint(mint_params);

        token_id
        // TODO Locked LP token
    // self
    //     .emit(
    //         LiquidityCreated {
    //             id: token_id,
    //             pool: pool,
    //             quote_token_address: quote_token_address,
    //             // token_id:token_id,
    //             owner: launch.owner,
    //             asset: asset_token_address,
    //             exchange: SupportedExchanges::Jediswap,
    //             is_unruggable: false
    //         }
    //     );
    } else { // TODO 
    // Increase liquidity of this pool.
    }
}
