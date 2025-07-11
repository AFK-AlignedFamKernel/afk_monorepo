use afk_launchpad::types::launchpad_types::{
    BondingType, MetadataLaunch, MetadataLaunchParams, SharesTokenUser, SupportedExchanges,
    TokenLaunch, TokenQuoteBuyCoin,
    // MemecoinCreated, MemecoinLaunched
};
use starknet::{ClassHash, ContractAddress};

#[starknet::interface]
pub trait ILaunchpadMarketplace<TContractState> {
    // User call
    fn create_token(
        ref self: TContractState,
        owner: ContractAddress,
        recipient: ContractAddress,
        symbol: ByteArray,
        name: ByteArray,
        initial_supply: u256,
        contract_address_salt: felt252,
    ) -> ContractAddress;

    fn create_and_launch_token(
        ref self: TContractState,
        owner: ContractAddress,
        symbol: ByteArray,
        name: ByteArray,
        initial_supply: u256,
        contract_address_salt: felt252,
        bonding_type: BondingType,
        creator_fee_percent: u256,
        creator_fee_destination: ContractAddress,
        metadata: Option<MetadataLaunchParams>,
    ) -> ContractAddress;
    // fn create_and_launch_token_with_metadata(
    //     ref self: TContractState,
    //     symbol: ByteArray,
    //     name: ByteArray,
    //     initial_supply: u256,
    //     contract_address_salt: felt252,
    //     is_unruggable: bool,
    //     bonding_type: BondingType,
    //     creator_fee_percent: u256,
    //     creator_fee_destination: ContractAddress,
    //     metadata: MetadataLaunch,
    // ) -> ContractAddress;
    // fn launch_token(ref self: TContractState, coin_address: ContractAddress);
    fn launch_token(
        ref self: TContractState,
        owner: ContractAddress,
        coin_address: ContractAddress,
        bonding_type: BondingType,
        creator_fee_percent: u256,
        creator_fee_destination: ContractAddress,
    );
    fn buy_coin_by_quote_amount(
        ref self: TContractState, coin_address: ContractAddress, quote_amount: u256,
    ) -> u64;
    fn sell_coin(ref self: TContractState, coin_address: ContractAddress, coin_amount: u256);
    // fn claim_coin_buy(ref self: TContractState, coin_address: ContractAddress, amount: u256);
    fn claim_coin_all(ref self: TContractState, coin_address: ContractAddress);
    fn claim_coin_all_for_friend(
        ref self: TContractState, coin_address: ContractAddress, friend: ContractAddress,
    );
    fn add_metadata(
        ref self: TContractState, coin_address: ContractAddress, metadata: MetadataLaunchParams,
    );

    // Views
    fn get_threshold_liquidity(self: @TContractState) -> u256;
    fn get_default_token(self: @TContractState) -> TokenQuoteBuyCoin;

    // Main function to calculate amount
    fn get_amount_by_type_of_coin_or_quote(
        self: @TContractState,
        coin_address: ContractAddress,
        amount: u256,
        is_decreased: bool,
        is_quote_amount: bool,
    ) -> u256;
    fn get_coin_amount_by_quote_amount(
        self: @TContractState,
        coin_address: ContractAddress,
        quote_amount: u256,
        is_decreased: bool,
    ) -> u256;

    fn get_is_paid_launch_enable(self: @TContractState) -> bool;
    fn get_is_paid_create_token_enable(self: @TContractState) -> bool;
    fn get_amount_to_paid_launch(self: @TContractState) -> u256;
    fn get_amount_to_paid_create_token(self: @TContractState) -> u256;

    // Views
    fn get_coin_launch(self: @TContractState, key_user: ContractAddress) -> TokenLaunch;
    fn get_share_of_user_by_contract(
        self: @TContractState, owner: ContractAddress, key_user: ContractAddress,
    ) -> SharesTokenUser;
    // fn get_all_launch(self: @TContractState) -> Span<TokenLaunch>;
    // fn get_all_coins(self: @TContractState) -> Span<Token>;

    // Admins functions
    fn set_token(ref self: TContractState, token_quote: TokenQuoteBuyCoin);
    fn set_default_token(ref self: TContractState, default_token: TokenQuoteBuyCoin);
    fn set_default_init_supply(ref self: TContractState, default_init_supply: u256);
    fn set_force_default_init_supply(ref self: TContractState, is_default_init_supply: bool);
    fn set_protocol_fee_percent(ref self: TContractState, protocol_fee_percent: u256);
    fn set_creator_fee_percent(ref self: TContractState, creator_fee_percent: u256);
    fn set_dollar_paid_coin_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_launch_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_finish_percentage(ref self: TContractState, bps: u256);
    fn set_class_hash(ref self: TContractState, class_hash: ClassHash);
    fn set_protocol_fee_destination(
        ref self: TContractState, protocol_fee_destination: ContractAddress,
    );
    fn set_unrug_liquidity_address(
        ref self: TContractState, unrug_liquidity_address: ContractAddress,
    );
    fn set_threshold_liquidity(ref self: TContractState, threshold_liquidity: u256);
    // fn set_exchanges_address(
    //     ref self: TContractState, exchanges: Span<(SupportedExchanges, ContractAddress)>,
    // );
    fn set_is_fees(ref self: TContractState, is_fees_protocol_enabled: bool);
    fn set_is_fees_protocol_enabled(ref self: TContractState, is_fees_protocol_enabled: bool);
    fn set_is_fees_protocol_buy_enabled(
        ref self: TContractState, is_fees_protocol_buy_enabled: bool,
    );
    fn set_is_fees_protocol_sell_enabled(
        ref self: TContractState, is_fees_protocol_sell_enabled: bool,
    );
    fn set_is_paid_launch_enable(ref self: TContractState, is_paid_launch_enable: bool);
    fn set_is_paid_create_token_enable(ref self: TContractState, is_paid_create_token_enable: bool);
    fn set_amount_to_paid_launch(ref self: TContractState, amount_to_paid_launch: u256);
    fn set_amount_to_paid_create_token(ref self: TContractState, amount_to_paid_create_token: u256);
    fn set_token_address_for_action(ref self: TContractState, token_address: ContractAddress);
    fn set_is_fees_creator_sell_enabled(
        ref self: TContractState, is_fees_creator_sell_enabled: bool,
    );
    fn set_is_fees_creator_buy_enabled(ref self: TContractState, is_fees_creator_buy_enabled: bool);
    fn set_is_fees_creator_enabled(ref self: TContractState, is_fees_creator_enabled: bool);
    fn set_is_creator_fee_sent_before_graduated(
        ref self: TContractState, is_creator_fee_sent_before_graduated: bool,
    );

    fn distribute_creator_fee(ref self: TContractState, coin_address: ContractAddress);


    fn admin_collect_fees(
        ref self: TContractState, coin_address: ContractAddress, recipient: ContractAddress,
    );
    fn collect_fees_owner(ref self: TContractState, coin_address: ContractAddress);
    fn set_admin(ref self: TContractState, admin: ContractAddress);
    fn set_role_address(ref self: TContractState, contract_address: ContractAddress, role: felt252);
    fn set_revoke_address(
        ref self: TContractState, contract_address: ContractAddress, role: felt252,
    );
}
