use afk_launchpad::types::jediswap_types::{MintParams};
use afk_launchpad::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyCoin, TokenLaunch, SharesTokenUser, BondingType, Token, CreateLaunch,
    SetJediswapNFTRouterV2, SetJediswapV2Factory, SupportedExchanges, LiquidityCreated,
    LiquidityCanBeAdded, MetadataLaunch, TokenClaimed, MetadataCoinAdded, EkuboPoolParameters,
    LaunchParameters, EkuboLP, CallbackData, EkuboLaunchParameters, LaunchCallback, LiquidityType,
    EkuboLiquidityParameters, LiquidityParameters, EkuboUnrugLaunchParameters, UnrugCallbackData,
    UnrugLaunchCallback
    // MemecoinCreated, MemecoinLaunched
};
use starknet::ClassHash;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IUnrugLiquidity<TContractState> {
    // User call
    fn create_token(
        ref self: TContractState,
        symbol: felt252,
        name: felt252,
        initial_supply: u256,
        contract_address_salt: felt252
    ) -> ContractAddress;

    //TODO
    // Create function with Unruggable Params
    // Create Liquidity simple with Lock
    // More personalized Params like:
    // Supply in LP
    // Mint token available
    // erc20 VOTE
    // Byte Array for Memecoin
    fn launch_on_ekubo(
        ref self: TContractState,
        coin_address: ContractAddress,
        unrug_params: EkuboUnrugLaunchParameters
    ) -> (u64, EkuboLP);
    fn launch_on_starkdefi(
        ref self: TContractState, coin_address: ContractAddress, params: EkuboLaunchParameters
    );
    // ) -> Span<felt252>;
    fn launch_on_jediswap(ref self: TContractState, coin_address: ContractAddress,);
    fn add_liquidity_unrug(
        ref self: TContractState,
        coin_address: ContractAddress,
        quote_address: ContractAddress,
        lp_meme_supply: u256,
        lp_quote_amount: u256,
        launch_params: LaunchParameters,
        ekubo_pool_params: EkuboPoolParameters
    ) -> (u64, EkuboLP);

    fn add_liquidity_unrug_lp(
        ref self: TContractState,
        coin_address: ContractAddress,
        quote_address: ContractAddress,
        lp_supply: u256,
        launch_params: LaunchParameters,
        ekubo_pool_params: EkuboPoolParameters
    ) -> (u64, EkuboLP);


    fn launch_liquidity(ref self: TContractState, coin_address: ContractAddress);

    // fn claim_coin_buy(ref self: TContractState, coin_address: ContractAddress, amount: u256);
    fn add_metadata(
        ref self: TContractState, coin_address: ContractAddress, metadata: MetadataLaunch
    );

    // Views
    fn get_default_token(self: @TContractState,) -> TokenQuoteBuyCoin;

    // Admins
    fn set_token(ref self: TContractState, token_quote: TokenQuoteBuyCoin);
    fn set_protocol_fee_percent(ref self: TContractState, protocol_fee_percent: u256);
    fn set_creator_fee_percent(ref self: TContractState, creator_fee_percent: u256);
    fn set_dollar_paid_coin_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_launch_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_finish_percentage(ref self: TContractState, bps: u256);
    fn set_class_hash(ref self: TContractState, class_hash: ClassHash);
    fn set_protocol_fee_destination(
        ref self: TContractState, protocol_fee_destination: ContractAddress
    );
    fn set_threshold_liquidity(ref self: TContractState, threshold_liquidity: u256);
    fn set_address_jediswap_factory_v2(
        ref self: TContractState, address_jediswap_factory_v2: ContractAddress
    );
    fn set_address_jediswap_nft_router_v2(
        ref self: TContractState, address_jediswap_nft_router_v2: ContractAddress
    );
    fn set_address_ekubo_factory(ref self: TContractState, address_ekubo_factory: ContractAddress);
    fn set_address_ekubo_router(ref self: TContractState, address_ekubo_router: ContractAddress);
    fn set_exchanges_address(
        ref self: TContractState, exchanges: Span<(SupportedExchanges, ContractAddress)>
    );
}