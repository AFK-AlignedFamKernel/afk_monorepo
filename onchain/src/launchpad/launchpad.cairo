use afk::types::launchpad_types::{
    MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated,
    TokenQuoteBuyKeys, TokenLaunch, SharesKeys, BondingType, Token, CreateLaunch
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait ILaunchpadMarketplace<TContractState> {
    fn set_token(ref self: TContractState, token_quote: TokenQuoteBuyKeys);
    fn set_protocol_fee_percent(ref self: TContractState, protocol_fee_percent: u256);
    fn set_creator_fee_percent(ref self: TContractState, creator_fee_percent: u256);
    fn set_dollar_paid_coin_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_launch_creation(ref self: TContractState, dollar_price: u256);
    fn set_dollar_paid_finish_percentage(ref self: TContractState, bps: u256);
    fn set_protocol_fee_destination(
        ref self: TContractState, protocol_fee_destination: ContractAddress
    );

    fn create_token(
        ref self: TContractState,
        symbol: felt252,
        name: felt252,
        initial_supply: u256,
        contract_address_salt: felt252
    ) -> ContractAddress;

    fn create_and_launch_token(
        ref self: TContractState,
        symbol: felt252,
        name: felt252,
        initial_supply: u256,
        contract_address_salt: felt252,
    ) -> ContractAddress;
    fn launch_token(ref self: TContractState, coin_address: ContractAddress);
    fn buy_coin(ref self: TContractState, coin_address: ContractAddress, amount: u256);
    fn sell_coin(ref self: TContractState, coin_address: ContractAddress, amount: u256);
    fn get_default_token(self: @TContractState,) -> TokenQuoteBuyKeys;
    fn get_price_of_supply_key(
        self: @TContractState, coin_address: ContractAddress, amount: u256, is_decreased: bool
    ) -> u256;
    fn get_key_of_user(self: @TContractState, key_user: ContractAddress,) -> TokenLaunch;
    fn get_share_key_of_user(
        self: @TContractState, owner: ContractAddress, key_user: ContractAddress,
    ) -> SharesKeys;
    fn get_all_launch(self: @TContractState) -> Span<TokenLaunch>;
}

#[starknet::contract]
mod LaunchpadMarketplace {
    use afk::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use core::num::traits::Zero;
    use openzeppelin::access::accesscontrol::{AccessControlComponent};
    use openzeppelin::introspection::src5::SRC5Component;
    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use super::{
        StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated, SharesKeys, MINTER_ROLE,
        ADMIN_ROLE, BondingType, Token, TokenLaunch, TokenQuoteBuyKeys, CreateLaunch
    };

    const MAX_SUPPLY: u256 = 100_000_000;
    const INITIAL_SUPPLY: u256 = MAX_SUPPLY / 4;
    const MAX_STEPS_LOOP: u256 = 100;
    const PAY_TO_LAUNCH: u256 = 1;

    const MIN_FEE_PROTOCOL: u256 = 10; //0.1%
    const MAX_FEE_PROTOCOL: u256 = 1000; //10%
    const MID_FEE_PROTOCOL: u256 = 100; //1%

    const MIN_FEE_CREATOR: u256 = 100; //1%
    const MID_FEE_CREATOR: u256 = 1000; //10%
    const MAX_FEE_CREATOR: u256 = 5000; //50%

    const BPS: u256 = 10_000; // 100% = 10_000 bps

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        coin_class_hash: ClassHash,
        quote_tokens: LegacyMap::<ContractAddress, bool>,
        quote_token: ContractAddress,
        threshold_liquidity_raised_amount: u256,
        liquidity_raised_amount_in_dollar: u256,
        names: LegacyMap::<ContractAddress, felt252>,
        token_created: LegacyMap::<ContractAddress, Token>,
        launched_coins: LegacyMap::<ContractAddress, TokenLaunch>,
        pumped_coins: LegacyMap::<ContractAddress, TokenLaunch>,
        shares_by_users: LegacyMap::<(ContractAddress, ContractAddress), SharesKeys>,
        bonding_type: LegacyMap::<ContractAddress, BondingType>,
        array_launched_coins: LegacyMap::<u64, TokenLaunch>,
        tokens_created: LegacyMap::<u64, Token>,
        launch_created: LegacyMap::<u64, TokenLaunch>,
        is_tokens_buy_enable: LegacyMap::<ContractAddress, TokenQuoteBuyKeys>,
        default_token: TokenQuoteBuyKeys,
        dollar_price_launch_pool: u256,
        dollar_price_create_token: u256,
        dollar_price_percentage: u256,
        initial_key_price: u256,
        protocol_fee_percent: u256,
        creator_fee_percent: u256,
        is_fees_protocol: bool,
        step_increase_linear: u256,
        is_custom_key_enable: bool,
        is_custom_token_enable: bool,
        protocol_fee_destination: ContractAddress,
        total_keys: u64,
        total_token: u64,
        total_launch: u64,
        total_shares_keys: u64,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        StoredName: StoredName,
        BuyToken: BuyToken,
        SellToken: SellToken,
        CreateToken: CreateToken,
        LaunchUpdated: LaunchUpdated,
        CreateLaunch: CreateLaunch,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        initial_key_price: u256,
        token_address: ContractAddress,
        step_increase_linear: u256,
        coin_class_hash: ClassHash,
        threshold_liquidity_raised_amount: u256,
    ) {
        self.coin_class_hash.write(coin_class_hash);
        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, admin);
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);

        let init_token = TokenQuoteBuyKeys {
            token_address: token_address,
            initial_key_price,
            price: initial_key_price,
            is_enable: true,
            step_increase_linear
        };
        self.is_custom_key_enable.write(false);
        self.is_custom_token_enable.write(false);
        self.default_token.write(init_token.clone());
        self.initial_key_price.write(init_token.initial_key_price);

        self.threshold_liquidity_raised_amount.write(threshold_liquidity_raised_amount);
        self.protocol_fee_destination.write(admin);
        self.step_increase_linear.write(step_increase_linear);
        self.total_keys.write(0);
        self.protocol_fee_percent.write(MID_FEE_PROTOCOL);
        self.creator_fee_percent.write(MIN_FEE_CREATOR);
    }

    // Public functions inside an impl block
    #[abi(embed_v0)]
    impl LaunchpadMarketplace of super::ILaunchpadMarketplace<ContractState> {
        // ADMIN

        fn set_token(ref self: ContractState, token_quote: TokenQuoteBuyKeys) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_tokens_buy_enable.write(token_quote.token_address, token_quote);
        }

        fn set_protocol_fee_percent(ref self: ContractState, protocol_fee_percent: u256) {
            assert(protocol_fee_percent < MAX_FEE_PROTOCOL, 'protocol_fee_too_high');
            assert(protocol_fee_percent > MIN_FEE_PROTOCOL, 'protocol_fee_too_low');

            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.protocol_fee_percent.write(protocol_fee_percent);
        }

        fn set_protocol_fee_destination(
            ref self: ContractState, protocol_fee_destination: ContractAddress
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.protocol_fee_destination.write(protocol_fee_destination);
        }

        fn set_creator_fee_percent(ref self: ContractState, creator_fee_percent: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert(creator_fee_percent < MAX_FEE_CREATOR, 'creator_fee_too_high');
            assert(creator_fee_percent > MIN_FEE_CREATOR, 'creator_fee_too_low');
            self.creator_fee_percent.write(creator_fee_percent);
        }

        fn set_dollar_paid_coin_creation(ref self: ContractState, dollar_price: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.dollar_price_create_token.write(dollar_price);
        }

        fn set_dollar_paid_launch_creation(ref self: ContractState, dollar_price: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.dollar_price_launch_pool.write(dollar_price);
        }

        fn set_dollar_paid_finish_percentage(ref self: ContractState, bps: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.dollar_price_percentage.write(bps);
        }

        // Create keys for an user
        fn create_token(
            ref self: ContractState,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252
        ) -> ContractAddress {
            let caller = get_caller_address();
            let token_address = self
                ._create_token(caller, symbol, name, initial_supply, contract_address_salt);

            self
                .emit(
                    CreateToken {
                        caller: get_caller_address(),
                        token_address: token_address,
                        total_supply: initial_supply.clone(),
                        initial_supply
                    }
                );

            token_address
        }

        // Create keys for an user
        fn create_and_launch_token(
            ref self: ContractState,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252
        ) -> ContractAddress {
            let caller = get_caller_address();
            let token_address = self
                ._create_token(caller, symbol, name, initial_supply, contract_address_salt);


            self
                .emit(
                    CreateToken {
                        caller: get_caller_address(),
                        token_address: token_address,
                        total_supply: initial_supply.clone(),
                        initial_supply
                    }
                );


            self._launch_token(token_address);

            token_address
        }

        // Create keys for an user
        fn launch_token(
            ref self: ContractState, 
            coin_address: ContractAddress
        ) { // Todo function with custom init token


            self._launch_token(coin_address);
            
        }


        fn buy_coin(ref self: ContractState, coin_address: ContractAddress, amount: u256) {
            let old_launch = self.launched_coins.read(coin_address);
            assert!(!old_launch.owner.is_zero(), "coin not found");

            // TODO erc20 token transfer
            let token_quote = old_launch.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();
            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };
            let protocol_fee_percent = self.protocol_fee_percent.read();
            let creator_fee_percent = self.creator_fee_percent.read();
            // Update Launch pool with new values
            let mut pool_coin = TokenLaunch {
                owner: old_launch.owner,
                token_address: old_launch.token_address, // CREATE 404
                created_at: old_launch.created_at,
                token_quote: token_quote,
                initial_key_price: token_quote.initial_key_price,
                bonding_curve_type: old_launch.bonding_curve_type,
                total_supply: old_launch.total_supply,
                available_supply: old_launch.available_supply,
                price: old_launch.price,
                liquidity_raised: old_launch.liquidity_raised,
                token_holded:old_launch.token_holded,
                is_liquidity_launch:old_launch.is_liquidity_launch,


            };
            let total_price = self.get_price_of_supply_key(coin_address, amount, false);
            println!("total price cal {:?}", total_price);
            let amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            // let amount_creator_fee = total_price * creator_fee_percent / BPS;
            let remain_liquidity = total_price - amount_protocol_fee;
            let mut old_share = self.shares_by_users.read((get_caller_address(), coin_address));

            let mut share_user = old_share.clone();
            if old_share.owner.is_zero() {
                share_user =
                    SharesKeys {
                        owner: get_caller_address(),
                        key_address: coin_address,
                        amount_owned: amount,
                        amount_buy: amount,
                        amount_sell: 0,
                        created_at: get_block_timestamp(),
                        total_paid: total_price,
                    };
                let total_key_share = self.total_shares_keys.read();
                self.total_shares_keys.write(total_key_share + 1);
            } else {
                share_user.total_paid += total_price;
                share_user.amount_owned += amount;
                share_user.amount_buy += amount;
            }
            pool_coin.price = total_price;
            pool_coin.total_supply += amount;
            self.shares_by_users.write((get_caller_address(), coin_address), share_user.clone());
            self.launched_coins.write(coin_address, pool_coin.clone());


            println!("amount_protocol_fee {:?}", amount_protocol_fee);
            println!("remain_liquidity {:?}", remain_liquidity);
            erc20
                .transfer_from(
                    get_caller_address(), self.protocol_fee_destination.read(), amount_protocol_fee
                );

            erc20.transfer_from(get_caller_address(), get_contract_address(), remain_liquidity);

            self
                .emit(
                    BuyToken {
                        caller: get_caller_address(),
                        key_user: coin_address,
                        amount: amount,
                        price: total_price,
                        protocol_fee: amount_protocol_fee,
                        creator_fee: 0
                    }
                );
        }

        fn sell_coin(ref self: ContractState, coin_address: ContractAddress, amount: u256) {
            let old_pool = self.launched_coins.read(coin_address);
            assert(!old_pool.owner.is_zero(), 'coin not found');
            assert!(amount <= MAX_STEPS_LOOP, "max step loop");

            // let caller = get_caller_address();
            let mut old_share = self.shares_by_users.read((get_caller_address(), coin_address));

            let mut share_user = old_share.clone();
            // Verify Amount owned
            assert!(old_share.amount_owned >= amount, "share too low");
            assert!(old_pool.total_supply >= amount, "above supply");

            // TODO erc20 token transfer
            let token = old_pool.token_quote.clone();
            let total_supply = old_pool.total_supply;
            let token_quote = old_pool.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();

            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };
            let protocol_fee_percent = self.protocol_fee_percent.read();
            let creator_fee_percent = self.creator_fee_percent.read();

            assert!(total_supply >= amount, "share > supply");

            // Update keys with new values
            let mut pool_update = TokenLaunch {
                owner: old_pool.owner,
                token_address: old_pool.token_address, // CREATE 404
                created_at: old_pool.created_at,
                token_quote: token_quote,
                initial_key_price: token_quote.initial_key_price,
                bonding_curve_type: old_pool.bonding_curve_type,
                total_supply: old_pool.total_supply,
                available_supply: old_pool.available_supply,
                price: old_pool.price,
                liquidity_raised: old_pool.liquidity_raised,
                token_holded:old_pool.token_holded,
                is_liquidity_launch:old_launch.is_liquidity_launch,
            };
            let mut total_price = self.get_price_of_supply_key(coin_address, amount, true);

            total_price -= pool_update.initial_key_price.clone();

            let amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let amount_creator_fee = total_price * creator_fee_percent / BPS;
            // let remain_liquidity = total_price - amount_creator_fee - amount_protocol_fee;
            let remain_liquidity = total_price - amount_protocol_fee;

            if old_share.owner.is_zero() {
                share_user =
                    SharesKeys {
                        owner: get_caller_address(),
                        key_address: coin_address,
                        amount_owned: amount,
                        amount_buy: amount,
                        amount_sell: amount,
                        created_at: get_block_timestamp(),
                        total_paid: total_price,
                    };
            } else {
                share_user.total_paid += total_price;
                share_user.amount_owned -= amount;
                share_user.amount_sell += amount;
            }
            pool_update.price = total_price;
            // key.total_supply -= amount;
            pool_update.total_supply = pool_update.total_supply - amount;
            pool_update.liquidity_raised = pool_update.liquidity_raised + remain_liquidity;
            self
                .shares_by_users
                .write((get_caller_address(), coin_address.clone()), share_user.clone());
            self.launched_coins.write(coin_address.clone(), pool_update.clone());

            // Transfer to Liquidity, Creator and Protocol
            // println!("contract_balance {}", contract_balance);
            // println!("transfer creator fee {}", amount_creator_fee.clone());
            // println!("transfer liquidity {}", remain_liquidity.clone());
            erc20.transfer(get_caller_address(), remain_liquidity);
            // println!("transfer protocol fee {}", amount_protocol_fee.clone());
            // erc20.transfer(self.protocol_fee_destination.read(), amount_protocol_fee);

            self
                .emit(
                    SellToken {
                        caller: get_caller_address(),
                        key_user: coin_address,
                        amount: amount,
                        price: total_price,
                        protocol_fee: amount_protocol_fee,
                        creator_fee: amount_creator_fee
                    }
                );
        }

        fn get_default_token(self: @ContractState) -> TokenQuoteBuyKeys {
            self.default_token.read()
        }

        fn get_price_of_supply_key(
            self: @ContractState, coin_address: ContractAddress, amount: u256, is_decreased: bool
        ) -> u256 {
            assert!(amount <= MAX_STEPS_LOOP, "max step loop");
            let pool = self.launched_coins.read(coin_address);
            let mut total_supply = pool.token_holded.clone();
            let mut final_supply = total_supply + amount;

            if is_decreased {
                final_supply = total_supply - amount;
            } else {
                final_supply = total_supply + amount;
            }

            let mut actual_supply = total_supply;
            let mut price = pool.price.clone();
            let mut initial_key_price = pool.initial_key_price.clone();
            let step_increase_linear = pool.token_quote.step_increase_linear.clone();
            let bonding_type = pool.bonding_curve_type.clone();
            match bonding_type {
                Option::Some(x) => {
                    match x {
                        BondingType::Linear => {
                            // println!("Linear curve {:?}", x);
                            let start_price = initial_key_price
                                + (step_increase_linear * actual_supply);
                            let end_price = initial_key_price
                                + (step_increase_linear * final_supply);
                            let total_price = amount * (start_price + end_price) / 2;
                            // println!("start_price {}", start_price.clone());
                            // println!("end_price {}", end_price.clone());
                            // println!("total_price {}", total_price.clone());
                            total_price
                        },
                        _ => {
                            let start_price = initial_key_price
                                + (step_increase_linear * actual_supply);
                            let end_price = initial_key_price
                                + (step_increase_linear * final_supply);
                            let total_price = amount * (start_price + end_price) / 2;
                            total_price
                        },
                    }
                },
                Option::None => {
                    let start_price = initial_key_price + (step_increase_linear * actual_supply);
                    let end_price = initial_key_price + (step_increase_linear * final_supply);
                    let total_price = amount * (start_price + end_price) / 2;
                    total_price
                }
            }
        }

        fn get_key_of_user(self: @ContractState, key_user: ContractAddress,) -> TokenLaunch {
            self.launched_coins.read(key_user)
        }

        fn get_share_key_of_user(
            self: @ContractState, owner: ContractAddress, key_user: ContractAddress,
        ) -> SharesKeys {
            self.shares_by_users.read((owner, key_user))
        }

        fn get_all_launch(self: @ContractState) -> Span<TokenLaunch> {
            let max_key_id = self.total_keys.read() + 1;
            let mut keys: Array<TokenLaunch> = ArrayTrait::new();
            let mut i = 0; //Since the stream id starts from 0
            loop {
                if i >= max_key_id {}
                let key = self.array_launched_coins.read(i);
                if key.owner.is_zero() {
                    break keys.span();
                }
                keys.append(key);
                i += 1;
            }
        }
    }

    // // Could be a group of functions about a same topic
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        // Function to calculate the price for the next token to be minted
        fn _get_linear_price(initial_price: u256, slope: u256, supply: u256) -> u256 {
            return initial_price + (slope * supply);
        }

        fn _create_token(
            ref self: ContractState,
            recipient: ContractAddress,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252
        ) -> ContractAddress {
            let mut calldata = array![name.into(), symbol.into()];
            Serde::serialize(@initial_supply, ref calldata);
            Serde::serialize(@recipient, ref calldata);
            Serde::serialize(@18, ref calldata);

            let (token_address, _) = deploy_syscall(
                self.coin_class_hash.read(), contract_address_salt, calldata.span(), false
            )
                .unwrap();
            // .unwrap_syscall();
            println!("token address {:?}", token_address);

            let token = Token {
                token_address: token_address,
                owner: recipient,
                name,
                symbol,
                total_supply: initial_supply,
                initial_supply: initial_supply,
                created_at: get_block_timestamp(),
                token_type: Option::None,
            };

            self.token_created.write(token_address, token);

            token_address
        }


        fn _launch_token(ref self: ContractState, coin_address:ContractAddress) {
            let caller = get_caller_address();
            let token = self.token_created.read(coin_address);
            assert!(!token.owner.is_zero(), "not launch");
            let mut token_to_use = self.default_token.read();
            let mut quote_token_address = token_to_use.token_address.clone();

            let bond_type = BondingType::Linear;
            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };

            let total_supply = erc20.total_supply();
            // // @TODO Deploy an ERC404
            // // Option for liquidity providing and Trading
            let launch_token_pump = TokenLaunch {
                owner: caller,
                token_address: caller, // CREATE 404
                total_supply: total_supply,
                available_supply: total_supply,
                // Todo price by pricetype after fix Enum instantiate
                bonding_curve_type: Option::Some(bond_type),
                // bonding_curve_type: BondingType,
                created_at: get_block_timestamp(),
                token_quote: token_to_use.clone(),
                initial_key_price: token_to_use.initial_key_price,
                price: 0,
                liquidity_raised: 0,
                token_holded:0,
                is_liquidity_launch:false,

                // token_holded:1
            };

            // Send supply need to launch your coin

            let amount_needed = total_supply.clone();

            // erc20.transfer_from(get_caller_address(), get_contract_address(), amount_needed);
            self.launched_coins.write(coin_address, launch_token_pump.clone());

            self
                .emit(
                    CreateLaunch {
                        caller: get_caller_address(),
                        token_address: quote_token_address,
                        amount: 1,
                        price: 1,
                    }
                );
        }

        fn _calculate_total_cost(
            price: u256,
            actual_supply: u256,
            amount: u256,
            initial_key_price: u256,
            step_increase_linear: u256
        ) -> u256 {
            let mut total_supply = actual_supply.clone();
            let mut actual_supply = total_supply;
            let final_supply = total_supply + amount;
            let start_price = initial_key_price + (step_increase_linear * actual_supply);
            let end_price = initial_key_price + (step_increase_linear * final_supply);
            let total_price = amount * (start_price + end_price) / 2;
            total_price
        }
    }
}


#[cfg(test)]
mod tests {
    use afk::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::types::launchpad_types::{MINTER_ROLE, ADMIN_ROLE, TokenQuoteBuyKeys, BondingType};
    use core::array::SpanTrait;
    use core::num::traits::Zero;
    use core::traits::Into;
    use openzeppelin::account::interface::{ISRC6Dispatcher, ISRC6DispatcherTrait};
    use openzeppelin::utils::serde::SerializedAppend;

    use snforge_std::{
        declare, ContractClass, ContractClassTrait, spy_events, SpyOn, EventSpy, EventFetcher,
        Event, EventAssertions, start_cheat_caller_address, cheat_caller_address_global,
        stop_cheat_caller_address, stop_cheat_caller_address_global, start_cheat_block_timestamp
    };
    use starknet::syscalls::deploy_syscall;

    // const INITIAL_KEY_PRICE:u256=1/100;

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        get_block_timestamp, get_contract_address, ClassHash
    };
    // use afk::keys::{IKeysMarketplaceDispatcher, IKeysMarketplaceDispatcherTrait};
    use super::{ILaunchpadMarketplaceDispatcher, ILaunchpadMarketplaceDispatcherTrait};

    // const INITIAL_KEY_PRICE:u256=1/100;
    const INITIAL_KEY_PRICE: u256 = 1;
    const STEP_LINEAR_INCREASE: u256 = 1;
    const THRESHOLD_LIQUIDITY: u256 = 10;

    fn request_fixture() -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher) {
        // println!("request_fixture");
        let erc20_class = declare_erc20();
        let launch_class = declare_launchpad();
        request_fixture_custom_classes(erc20_class, launch_class)
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass, launch_class: ContractClass
    ) -> (ContractAddress, IERC20Dispatcher, ILaunchpadMarketplaceDispatcher) {
        let sender_address: ContractAddress = 123.try_into().unwrap();
        let erc20 = deploy_erc20(erc20_class, 'USDC token', 'USDC', 1_000_000, sender_address);
        let token_address = erc20.contract_address.clone();
        let keys = deploy_launchpad(
            launch_class,
            sender_address,
            token_address.clone(),
            INITIAL_KEY_PRICE,
            STEP_LINEAR_INCREASE,
            erc20_class.class_hash,
            THRESHOLD_LIQUIDITY
        );
        (sender_address, erc20, keys)
    }

    fn declare_launchpad() -> ContractClass {
        declare("LaunchpadMarketplace").unwrap()
    }

    fn declare_erc20() -> ContractClass {
        declare("ERC20").unwrap()
    }

    fn deploy_launchpad(
        class: ContractClass,
        admin: ContractAddress,
        token_address: ContractAddress,
        initial_key_price: u256,
        step_increase_linear: u256,
        coin_class_hash: ClassHash,
        threshold_liquidity: u256
    ) -> ILaunchpadMarketplaceDispatcher {
        // println!("deploy marketplace");
        let mut calldata = array![admin.into()];
        calldata.append_serde(initial_key_price);
        calldata.append_serde(token_address);
        calldata.append_serde(step_increase_linear);
        calldata.append_serde(coin_class_hash);
        calldata.append_serde(threshold_liquidity);
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        ILaunchpadMarketplaceDispatcher { contract_address }
    }

    fn deploy_erc20(
        class: ContractClass,
        name: felt252,
        symbol: felt252,
        initial_supply: u256,
        recipient: ContractAddress
    ) -> IERC20Dispatcher {
        let mut calldata = array![];

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        (2 * initial_supply).serialize(ref calldata);
        recipient.serialize(ref calldata);
        18_u8.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IERC20Dispatcher { contract_address }
    }

    fn SALT() -> felt252 {
        'salty'.try_into().unwrap()
    }


    // Constants
    fn OWNER() -> ContractAddress {
        'owner'.try_into().unwrap()
    }

    fn RECIPIENT() -> ContractAddress {
        'recipient'.try_into().unwrap()
    }

    fn SPENDER() -> ContractAddress {
        'spender'.try_into().unwrap()
    }

    fn ALICE() -> ContractAddress {
        'alice'.try_into().unwrap()
    }

    fn BOB() -> ContractAddress {
        'bob'.try_into().unwrap()
    }

    fn NAME() -> felt252 {
        'name'.try_into().unwrap()
    }

    fn SYMBOL() -> felt252 {
        'symbol'.try_into().unwrap()
    }

    // Math
    fn pow_256(self: u256, mut exponent: u8) -> u256 {
        if self.is_zero() {
            return 0;
        }
        let mut result = 1;
        let mut base = self;

        loop {
            if exponent & 1 == 1 {
                result = result * base;
            }

            exponent = exponent / 2;
            if exponent == 0 {
                break result;
            }

            base = base * base;
        }
    }


    fn DEFAULT_INITIAL_SUPPLY() -> u256 {
        21_000_000 * pow_256(10, 18)
    }

    #[test]
    fn launchpad_end_to_end() {
        let (sender_address, erc20, launchpad) = request_fixture();
        let amount_key_buy = 1_u256;
        cheat_caller_address_global(sender_address);
        start_cheat_caller_address(erc20.contract_address, sender_address);
        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');

        start_cheat_caller_address(launchpad.contract_address, sender_address);

        let token_address = launchpad
            .create_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
        println!("test token_address {:?}", token_address);

        // Launch coin pool
        // Send total supply
        println!("launch token");

        let total_supply=erc20.total_supply();
        println!("total_supply {:?}",  total_supply);
        erc20.approve(launchpad.contract_address, total_supply);


        let allowance = erc20.allowance(sender_address, launchpad.contract_address);
        println!("test allowance {}", allowance);

        let pool = launchpad.launch_token(token_address);
        // Test buy coin

        println!("amount_to_paid", );

        // println!("all_keys {:?}", all_keys);
        let amount_to_paid = launchpad
            .get_price_of_supply_key(token_address, amount_key_buy+1, false, //    1,
            // BondingType::Basic, default_token.clone()
            );
        println!("test amount_to_paid {:?}", amount_to_paid);

        start_cheat_caller_address(erc20.contract_address, sender_address);

        erc20.approve(launchpad.contract_address, amount_to_paid);

        let allowance = erc20.allowance(sender_address, launchpad.contract_address);
        println!("test allowance {}", allowance);
        stop_cheat_caller_address(erc20.contract_address);

        start_cheat_caller_address(launchpad.contract_address, sender_address);
        println!("buy coin", );
      
        launchpad.buy_coin(token_address, amount_key_buy);
    }
}
