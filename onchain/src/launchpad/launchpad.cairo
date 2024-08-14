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
    );

    fn create_and_launch_token(
        ref self: TContractState,
        symbol: felt252,
        name: felt252,
        initial_supply: u256,
        contract_address_salt: felt252,
    );
    fn launch_token(
        ref self: TContractState,
        coin_address: ContractAddress 
    );
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
        liquidity_raised_amount: u256,
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
        ) {
            let caller = get_caller_address();
            println!("create token");
            let initial_key_price = self.initial_key_price.read();
            let mut token_to_use = self.default_token.read();
            let bond_type = BondingType::Linear;
            // @TODO Deploy an ERC404 or ERC20
            let token_address = self
                ._create_token(caller, symbol, name, initial_supply, contract_address_salt);

            self
                .emit(
                    CreateToken {
                        caller: get_caller_address(),
                        key_user: get_caller_address(),
                        amount: 1,
                        price: 1,
                    }
                );
        }

        // Create keys for an user
        fn create_and_launch_token(
            ref self: ContractState,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252
        ) {
            let caller = get_caller_address();
            println!("create token");
            let initial_key_price = self.initial_key_price.read();

            let mut token_to_use = self.default_token.read();
            let bond_type = BondingType::Linear;

            // @TODO Deploy an ERC404 or ERC20
            let token_address = self
                ._create_token(caller, symbol, name, initial_supply, contract_address_salt);

            self
                .emit(
                    CreateToken {
                        caller: get_caller_address(),
                        key_user: get_caller_address(),
                        amount: 1,
                        price: 1,
                    }
                );
        }

        // Create keys for an user
        fn launch_token(
            ref self: ContractState, coin_address: ContractAddress
        ) { // Todo function with custom init token
        // if self.is_custom_token_enable.read() {
        //     token_to_use = token_quote;
        // }
        // // let bond_type = BondingType::Degens(10);
        // let bond_type = BondingType::Linear;

        // // @TODO Deploy an ERC404
        // // Option for liquidity providing and Trading
        // let key = TokenLaunch {
        //     owner: caller,
        //     token_address: caller, // CREATE 404
        //     price: initial_key_price,
        //     total_supply: 1,
        //     // Todo price by pricetype after fix Enum instantiate
        //     bonding_curve_type: Option::Some(bond_type),
        //     // bonding_curve_type: BondingType,
        //     created_at: get_block_timestamp(),
        //     token_quote: token_to_use.clone(),
        //     initial_key_price: token_to_use.initial_key_price,
        // };

        // let share_user = SharesKeys {
        //     owner: get_caller_address(),
        //     key_address: get_caller_address(),
        //     amount_owned: 1,
        //     amount_buy: 1,
        //     amount_sell: 0,
        //     created_at: get_block_timestamp(),
        //     total_paid: 0
        // };
        // self.shares_by_users.write((get_caller_address(), get_caller_address()), share_user);
        // self.launched_coins.write(get_caller_address(), key.clone());

        // let total_key = self.total_keys.read();
        // if total_key == 0 {
        //     self.total_keys.write(1);
        //     self.array_launched_coins.write(0, key);
        // } else {
        //     self.total_keys.write(total_key + 1);
        //     self.array_launched_coins.write(total_key, key);
        // }

        // self
        //     .emit(
        //         CreateToken {
        //             caller: get_caller_address(),
        //             key_user: get_caller_address(),
        //             amount: 1,
        //             price: 1,
        //         }
        //     );
        }

        // fn liquidity_token() {

        // }

        fn buy_coin(ref self: ContractState, coin_address: ContractAddress, amount: u256) {
            let old_keys = self.launched_coins.read(coin_address);
            assert!(!old_keys.owner.is_zero(), "key not found");

            // TODO erc20 token transfer
            let token_quote = old_keys.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();
            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };
            let protocol_fee_percent = self.protocol_fee_percent.read();
            let creator_fee_percent = self.creator_fee_percent.read();
            // Update keys with new values
            let mut key = TokenLaunch {
                owner: old_keys.owner,
                token_address: old_keys.token_address, // CREATE 404
                created_at: old_keys.created_at,
                token_quote: token_quote,
                price: old_keys.price,
                initial_key_price: token_quote.initial_key_price,
                total_supply: old_keys.total_supply,
                bonding_curve_type: old_keys.bonding_curve_type,
            };
            // Todo price by pricetype after fix Enum instantiate
            // Refactorize and opti
            let total_price = self.get_price_of_supply_key(coin_address, amount, false);
            // println!("total price {}", total_price);

            let amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let amount_creator_fee = total_price * creator_fee_percent / BPS;

            let remain_liquidity = total_price - amount_creator_fee - amount_protocol_fee;

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
            key.price = total_price;
            key.total_supply += amount;
            self.shares_by_users.write((get_caller_address(), coin_address), share_user.clone());

            self.launched_coins.write(coin_address, key.clone());

            // println!("caller {:?}", get_caller_address());

            // // Transfer to Liquidity, Creator and Protocol

            // println!("transfer protocol fee {}", amount_protocol_fee.clone());

            // // TODO uncomment after allowance check script
            erc20
                .transfer_from(
                    get_caller_address(), self.protocol_fee_destination.read(), amount_protocol_fee
                );

            // println!("transfer liquidity {}", remain_liquidity.clone());
            // println!("transfer total price {}", total_price.clone());
            erc20.transfer_from(get_caller_address(), get_contract_address(), remain_liquidity);

            // println!("amount_creator_fee fee {}", amount_creator_fee.clone());
            erc20.transfer_from(get_caller_address(), key.owner, amount_creator_fee);

            self
                .emit(
                    BuyToken {
                        caller: get_caller_address(),
                        key_user: coin_address,
                        amount: amount,
                        price: total_price,
                        protocol_fee: amount_protocol_fee,
                        creator_fee: amount_creator_fee
                    }
                );
        }

        fn sell_coin(ref self: ContractState, coin_address: ContractAddress, amount: u256) {
            let old_keys = self.launched_coins.read(coin_address);
            assert!(!old_keys.owner.is_zero(), "key not found");
            assert!(amount <= MAX_STEPS_LOOP, "max step loop");

            // let caller = get_caller_address();
            let mut old_share = self.shares_by_users.read((get_caller_address(), coin_address));

            let mut share_user = old_share.clone();
            // Verify Amount owned
            assert!(old_share.amount_owned >= amount, "share too low");
            assert!(old_keys.total_supply >= amount, "above supply");

            // assert!(old_keys.total_supply == 1 && old_keys.owner == caller, "cant sell owner key");
            // assert!(old_keys.total_supply - amount == 0 && old_keys.owner == caller, "cant sell owner key");

            // TODO erc20 token transfer
            let token = old_keys.token_quote.clone();
            let total_supply = old_keys.total_supply;
            let token_quote = old_keys.token_quote.clone();
            let quote_token_address = token_quote.token_address.clone();

            let erc20 = IERC20Dispatcher { contract_address: quote_token_address };
            let protocol_fee_percent = self.protocol_fee_percent.read();
            let creator_fee_percent = self.creator_fee_percent.read();

            assert!(total_supply >= amount, "share > supply");

            // Update keys with new values
            let mut key = TokenLaunch {
                owner: old_keys.owner,
                token_address: old_keys.token_address, // CREATE 404
                created_at: old_keys.created_at,
                token_quote: token,
                price: old_keys.price,
                initial_key_price: token_quote.initial_key_price,
                total_supply: old_keys.total_supply,
                bonding_curve_type: old_keys.bonding_curve_type,
            };
            let mut total_price = self.get_price_of_supply_key(coin_address, amount, true);

            total_price -= key.initial_key_price.clone();

            let amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let amount_creator_fee = total_price * creator_fee_percent / BPS;
            let remain_liquidity = total_price - amount_creator_fee - amount_protocol_fee;

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
            key.price = total_price;
            // key.total_supply -= amount;
            key.total_supply = key.total_supply - amount;
            self
                .shares_by_users
                .write((get_caller_address(), coin_address.clone()), share_user.clone());
            self.launched_coins.write(coin_address.clone(), key.clone());

            // Transfer to Liquidity, Creator and Protocol
            // println!("contract_balance {}", contract_balance);
            // println!("transfer creator fee {}", amount_creator_fee.clone());
            // println!("transfer liquidity {}", remain_liquidity.clone());

            erc20.transfer(key.owner, amount_creator_fee);

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
            let key = self.launched_coins.read(coin_address);
            let mut total_supply = key.total_supply.clone();
            // if is_decreased {
            //     final_supply = total_supply - amount;
            // } else {
            //     final_supply = total_supply + amount;
            // }

            let mut actual_supply = total_supply;
            let final_supply = total_supply + amount;
            let mut price = key.price.clone();
            let mut initial_key_price = key.initial_key_price.clone();
            let step_increase_linear = key.token_quote.step_increase_linear.clone();
            let bonding_type = key.bonding_curve_type.clone();
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
                        // BondingType::Scoring => { 0 },
                        // BondingType::Exponential => { 0 },
                        // BondingType::Limited => { 0 },

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
            caller: ContractAddress,
            symbol: felt252,
            name: felt252,
            initial_supply: u256,
            contract_address_salt: felt252
        ) -> ContractAddress {
            // @TODO Deploy an ERC404
            // let mut calldata = array![caller.into(), name.into(), symbol.into()];
            let mut calldata = array![name.into(), symbol.into()];
            Serde::serialize(@initial_supply, ref calldata);
            Serde::serialize(@caller, ref calldata);
            Serde::serialize(@18, ref calldata);

            let (token_address, _) = deploy_syscall(
                self.coin_class_hash.read(), contract_address_salt, calldata.span(), false
            )
                .unwrap();
            // .unwrap_syscall();
            println!("token address {:?}", token_address);

            let token = Token {
                token_address: token_address,
                owner: caller,
                name,
                symbol,
                total_supply: initial_supply,
                created_at: get_block_timestamp(),
                token_type: Option::None,
            };

            self.token_created.write(token_address, token);

            token_address
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
            erc20_class.class_hash
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
    ) -> ILaunchpadMarketplaceDispatcher {
        // println!("deploy marketplace");
        let mut calldata = array![admin.into()];
        calldata.append_serde(initial_key_price);
        calldata.append_serde(token_address);
        calldata.append_serde(step_increase_linear);
        calldata.append_serde(coin_class_hash);
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
        erc20.approve(launchpad.contract_address, amount_key_buy);
        // Call a view function of the contract
        // Check default token used
        let default_token = launchpad.get_default_token();
        assert(default_token.token_address == erc20.contract_address, 'no default token');
        assert(default_token.initial_key_price == INITIAL_KEY_PRICE, 'no init price');

        // Instantiate keys
        // start_cheat_caller_address(key_address, sender_address);
        stop_cheat_caller_address(erc20.contract_address);

        // println!("instantiate keys");
        start_cheat_caller_address(launchpad.contract_address, sender_address);

        launchpad
            .create_token(
                // owner: OWNER(),
                symbol: SYMBOL(),
                name: NAME(),
                initial_supply: DEFAULT_INITIAL_SUPPLY(),
                contract_address_salt: SALT(),
            );
    // launchpad.instantiate_keys();
    // println!("get all_keys");

    // let mut all_keys = keys.get_all_launch();
    // let mut key_user = launchpad.get_key_of_user(sender_address);
    // println!("test key_user.owner {:?}", key_user.owner);
    // println!("test sender_address {:?}", sender_address);
    // assert(key_user.owner == sender_address, 'not same owner');
    // // println!("all_keys {:?}", all_keys);
    // // println!("all_keys {:?}", all_keys);
    // let amount_to_paid = launchpad
    //     .get_price_of_supply_key(sender_address, amount_key_buy, false, //    1,
    //     // BondingType::Basic, default_token.clone()
    //     );
    // println!("test amount_to_paid {:?}", amount_to_paid);

    // // erc20.approve(keys.contract_address, amount_to_paid*2);

    // start_cheat_caller_address(erc20.contract_address, sender_address);
    // // erc20.approve(keys.contract_address, amount_approve);
    // erc20.approve(launchpad.contract_address, amount_to_paid);

    // let allowance = erc20.allowance(sender_address, launchpad.contract_address);
    // println!("test allowance {}", allowance);
    // stop_cheat_caller_address(erc20.contract_address);

    // start_cheat_caller_address(launchpad.contract_address, sender_address);
    // launchpad.buy_coin(sender_address, amount_key_buy);

    // let mut key_user = launchpad.get_key_of_user(sender_address);
    // println!("test key_user total supply {:?}", key_user.total_supply);

    // // Buy others key
    // stop_cheat_caller_address(launchpad.contract_address);

    // let amount_key_buy = 3_u256;

    // // println!("all_keys {:?}", all_keys);
    // let amount_to_paid = launchpad
    //     .get_price_of_supply_key(sender_address, amount_key_buy, false, //    1,
    //     // BondingType::Basic, default_token.clone()
    //     );
    // start_cheat_caller_address(erc20.contract_address, sender_address);

    // erc20.approve(launchpad.contract_address, amount_to_paid);

    // let allowance = erc20.allowance(sender_address, launchpad.contract_address);
    // println!("test allowance {}", allowance);
    // stop_cheat_caller_address(erc20.contract_address);

    // start_cheat_caller_address(launchpad.contract_address, sender_address);
    // launchpad.buy_coin(sender_address, amount_key_buy);
    // let mut key_user = launchpad.get_key_of_user(sender_address);

    // println!("test key_user total supply {:?}", key_user.total_supply);
    }
}
