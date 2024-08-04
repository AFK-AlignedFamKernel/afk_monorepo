use afk::types::launchpad_types::{
    KeysBonding, KeysBondingImpl, MINTER_ROLE, ADMIN_ROLE, StoredName, BuyToken, SellToken,
    CreateToken, LaunchUpdated, TokenQuoteBuyKeys, TokenLaunch, SharesKeys, BondingType, get_linear_price,
    Token, CreateLaunch
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait ILaunchpadMarketplace<TContractState> {
    fn set_token(ref self: TContractState, token_quote: TokenQuoteBuyKeys);
    fn set_protocol_fee_percent(ref self: TContractState, protocol_fee_percent: u256);
    fn set_creator_fee_percent(ref self: TContractState, creator_fee_percent: u256);
    fn set_protocol_fee_destination(
        ref self: TContractState, protocol_fee_destination: ContractAddress
    );
    fn instantiate_keys(
        ref self: TContractState, // token_quote: TokenQuoteBuyKeys, // bonding_type: LaunchpadMarketplace::BondingType,
    );
    fn create_token(
        ref self: TContractState, 
        symbol:felt252,
        ticker:felt252,
        initial_supply:u256
        // token_quote: TokenQuoteBuyKeys, 
        // bonding_type: LaunchpadMarketplace::BondingType,
    );
    fn launch_token(
        ref self: TContractState, 
        symbol:felt252,
        ticker:felt252,
        // token_quote: TokenQuoteBuyKeys, 
        // bonding_type: LaunchpadMarketplace::BondingType,
    );
    fn buy_keys(ref self: TContractState, address_user: ContractAddress, amount: u256);
    fn sell_keys(ref self: TContractState, address_user: ContractAddress, amount: u256);
    fn get_default_token(self: @TContractState,) -> TokenQuoteBuyKeys;
    fn get_price_of_supply_key(
        self: @TContractState, address_user: ContractAddress, amount: u256, is_decreased: bool
    ) -> u256;
    fn get_key_of_user(self: @TContractState, key_user: ContractAddress,) -> TokenLaunch;
    fn get_share_key_of_user(
        self: @TContractState, owner: ContractAddress, key_user: ContractAddress,
    ) -> SharesKeys;
    fn get_all_keys(self: @TContractState) -> Span<TokenLaunch>;
}

#[starknet::contract]
mod LaunchpadMarketplace {
    use core::num::traits::Zero;
    use afk::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};


    use openzeppelin::access::accesscontrol::{AccessControlComponent};
    use openzeppelin::introspection::src5::SRC5Component;
    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address,
    };
    use super::{
        StoredName, BuyToken, SellToken, CreateToken, LaunchUpdated, TokenQuoteBuyKeys, TokenLaunch, SharesKeys,
        KeysBonding, KeysBondingImpl, MINTER_ROLE, ADMIN_ROLE, BondingType,
        Token,
        CreateLaunch
    };
    const MAX_STEPS_LOOP: u256 = 100;

    const MIN_FEE: u256 = 10; //0.1%
    const MAX_FEE: u256 = 1000; //10%
    const MID_FEE: u256 = 100; //1%

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
        names: LegacyMap::<ContractAddress, felt252>,
        keys_of_users: LegacyMap::<ContractAddress, TokenLaunch>,
        shares_by_users: LegacyMap::<(ContractAddress, ContractAddress), SharesKeys>,
        bonding_type: LegacyMap::<ContractAddress, BondingType>,
        array_keys_of_users: LegacyMap::<u64, TokenLaunch>,
        tokens_created: LegacyMap::<u64, Token>,
        launch_created: LegacyMap::<u64, TokenLaunch>,
        is_tokens_buy_enable: LegacyMap::<ContractAddress, TokenQuoteBuyKeys>,
        default_token: TokenQuoteBuyKeys,
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
        // init_token: TokenQuoteBuyKeys,
        initial_key_price: u256,
        token_address: ContractAddress,
        step_increase_linear: u256
    ) {
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
        // self.protocol_fee_percent.write(MAX_FEE);
        // self.creator_fee_percent.write(MAX_FEE_CREATOR);
        self.step_increase_linear.write(step_increase_linear);
        self.total_keys.write(0);
        self.protocol_fee_percent.write(MID_FEE);
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
            assert(protocol_fee_percent < MAX_FEE, 'protocol_fee_too_high');
            assert(protocol_fee_percent > MIN_FEE, 'protocol_fee_too_low');

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

        // User

        // Create keys for an user
        fn instantiate_keys(ref self: ContractState, // token_quote: TokenQuoteBuyKeys,
        // bonding_type: BondingType, 
        ) {
            let caller = get_caller_address();
            let keys = self.keys_of_users.read(caller);
            assert!(keys.owner.is_zero(), "key already created");
            let initial_key_price = self.initial_key_price.read();

            let mut token_to_use = self.default_token.read();
            // Todo function with custom init token
            // if self.is_custom_token_enable.read() {
            //     token_to_use = token_quote;
            // }
            // let bond_type = BondingType::Degens(10);
            let bond_type = BondingType::Linear;

            // @TODO Deploy an ERC404
            // Option for liquidity providing and Trading
            let key = TokenLaunch {
                owner: caller,
                token_address: caller, // CREATE 404
                price: initial_key_price,
                total_supply: 1,
                // Todo price by pricetype after fix Enum instantiate
                bonding_curve_type: Option::Some(bond_type),
                // bonding_curve_type: BondingType,
                created_at: get_block_timestamp(),
                token_quote: token_to_use.clone(),
                initial_key_price: token_to_use.initial_key_price,
            };

            let share_user = SharesKeys {
                owner: get_caller_address(),
                key_address: get_caller_address(),
                amount_owned: 1,
                amount_buy: 1,
                amount_sell: 0,
                created_at: get_block_timestamp(),
                total_paid: 0
            };
            self.shares_by_users.write((get_caller_address(), get_caller_address()), share_user);
            self.keys_of_users.write(get_caller_address(), key.clone());

            let total_key = self.total_keys.read();
            if total_key == 0 {
                self.total_keys.write(1);
                self.array_keys_of_users.write(0, key);
            } else {
                self.total_keys.write(total_key + 1);
                self.array_keys_of_users.write(total_key, key);
            }

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
        fn create_token(ref self: ContractState,
            symbol:felt252,
            ticker:felt252,
            initial_supply:u256,
             // token_quote: TokenQuoteBuyKeys,
        // bonding_type: BondingType, 
        ) {
            let caller = get_caller_address();
            let keys = self.keys_of_users.read(caller);
            assert!(keys.owner.is_zero(), "key already created");
            let initial_key_price = self.initial_key_price.read();

            let mut token_to_use = self.default_token.read();
            // Todo function with custom init token
            // if self.is_custom_token_enable.read() {
            //     token_to_use = token_quote;
            // }
            // let bond_type = BondingType::Degens(10);
            let bond_type = BondingType::Linear;

            // @TODO Deploy an ERC404
            // Option for liquidity providing and Trading
            let key = TokenLaunch {
                owner: caller,
                token_address: caller, // CREATE 404
                price: initial_key_price,
                total_supply: 1,
                // Todo price by pricetype after fix Enum instantiate
                bonding_curve_type: Option::Some(bond_type),
                // bonding_curve_type: BondingType,
                created_at: get_block_timestamp(),
                token_quote: token_to_use.clone(),
                initial_key_price: token_to_use.initial_key_price,
            };

            let share_user = SharesKeys {
                owner: get_caller_address(),
                key_address: get_caller_address(),
                amount_owned: 1,
                amount_buy: 1,
                amount_sell: 0,
                created_at: get_block_timestamp(),
                total_paid: 0
            };
            self.shares_by_users.write((get_caller_address(), get_caller_address()), share_user);
            self.keys_of_users.write(get_caller_address(), key.clone());

            let total_key = self.total_keys.read();
            if total_key == 0 {
                self.total_keys.write(1);
                self.array_keys_of_users.write(0, key);
            } else {
                self.total_keys.write(total_key + 1);
                self.array_keys_of_users.write(total_key, key);
            }

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
        fn launch_token(ref self: ContractState,
            symbol:felt252,
            ticker:felt252,
             // token_quote: TokenQuoteBuyKeys,
        // bonding_type: BondingType, 
        ) {
            let caller = get_caller_address();
            let keys = self.keys_of_users.read(caller);
            assert!(keys.owner.is_zero(), "key already created");
            let initial_key_price = self.initial_key_price.read();

            let mut token_to_use = self.default_token.read();
            // Todo function with custom init token
            // if self.is_custom_token_enable.read() {
            //     token_to_use = token_quote;
            // }
            // let bond_type = BondingType::Degens(10);
            let bond_type = BondingType::Linear;

            // @TODO Deploy an ERC404
            // Option for liquidity providing and Trading
            let key = TokenLaunch {
                owner: caller,
                token_address: caller, // CREATE 404
                price: initial_key_price,
                total_supply: 1,
                // Todo price by pricetype after fix Enum instantiate
                bonding_curve_type: Option::Some(bond_type),
                // bonding_curve_type: BondingType,
                created_at: get_block_timestamp(),
                token_quote: token_to_use.clone(),
                initial_key_price: token_to_use.initial_key_price,
            };

            let share_user = SharesKeys {
                owner: get_caller_address(),
                key_address: get_caller_address(),
                amount_owned: 1,
                amount_buy: 1,
                amount_sell: 0,
                created_at: get_block_timestamp(),
                total_paid: 0
            };
            self.shares_by_users.write((get_caller_address(), get_caller_address()), share_user);
            self.keys_of_users.write(get_caller_address(), key.clone());

            let total_key = self.total_keys.read();
            if total_key == 0 {
                self.total_keys.write(1);
                self.array_keys_of_users.write(0, key);
            } else {
                self.total_keys.write(total_key + 1);
                self.array_keys_of_users.write(total_key, key);
            }

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

        // fn liquidity_token() {

        // }

        fn buy_keys(ref self: ContractState, address_user: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            let old_keys = self.keys_of_users.read(address_user);
            assert!(!old_keys.owner.is_zero(), "key not found");
            let initial_key_price = self.initial_key_price.read();
            assert!(amount <= MAX_STEPS_LOOP, "max step loop");

            // TODO erc20 token transfer
            let key_token_address = old_keys.token_address;
            let total_supply = old_keys.total_supply;
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
            let total_price = self.get_price_of_supply_key(address_user, amount, false);
            // println!("total price {}", total_price);

            let amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let amount_creator_fee = total_price * creator_fee_percent / BPS;

            let remain_liquidity = total_price - amount_creator_fee - amount_protocol_fee;

            let mut old_share = self.shares_by_users.read((get_caller_address(), address_user));

            let mut share_user = old_share.clone();
            if old_share.owner.is_zero() {
                share_user =
                    SharesKeys {
                        owner: get_caller_address(),
                        key_address: address_user,
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
            self.shares_by_users.write((get_caller_address(), address_user), share_user.clone());

            self.keys_of_users.write(address_user, key.clone());

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
                        key_user: address_user,
                        amount: amount,
                        price: total_price,
                        protocol_fee: amount_protocol_fee,
                        creator_fee: amount_creator_fee
                    }
                );
        }

        fn sell_keys(ref self: ContractState, address_user: ContractAddress, amount: u256) {
            let old_keys = self.keys_of_users.read(address_user);
            assert!(!old_keys.owner.is_zero(), "key not found");
            let initial_key_price = self.initial_key_price.read();
            assert!(amount <= MAX_STEPS_LOOP, "max step loop");

            // let caller = get_caller_address();
            let mut old_share = self.shares_by_users.read((get_caller_address(), address_user));

            let mut share_user = old_share.clone();
            // Verify Amount owned
            assert!(old_share.amount_owned >= amount, "share too low");
            assert!(old_keys.total_supply >= amount, "above supply");

            // assert!(old_keys.total_supply == 1 && old_keys.owner == caller, "cant sell owner key");
            // assert!(old_keys.total_supply - amount == 0 && old_keys.owner == caller, "cant sell owner key");

            // TODO erc20 token transfer
            let token = old_keys.token_quote.clone();
            let key_token_address = old_keys.token_address;
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
            // Todo price by pricetype after fix Enum instantiate
            // Refactorize and opti

            // FIX SELL amount to receive
            let mut total_price = self.get_price_of_supply_key(address_user, amount, true);
            // println!("total price {}", total_price);

            total_price-=key.initial_key_price.clone();

            let amount_protocol_fee: u256 = total_price * protocol_fee_percent / BPS;
            let amount_creator_fee = total_price * creator_fee_percent / BPS;
            let remain_liquidity = total_price - amount_creator_fee - amount_protocol_fee;

            if old_share.owner.is_zero() {
                share_user =
                    SharesKeys {
                        owner: get_caller_address(),
                        key_address: address_user,
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
            key.total_supply=key.total_supply-amount;
            self.shares_by_users.write((get_caller_address(), address_user.clone()), share_user.clone());
            self.keys_of_users.write(address_user.clone(), key.clone());

            let contract_balance= erc20.balance_of(get_contract_address());

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
                        key_user: address_user,
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
            self: @ContractState, address_user: ContractAddress, amount: u256, is_decreased: bool
        ) -> u256 {
            assert!(amount <= MAX_STEPS_LOOP, "max step loop");
            let key = self.keys_of_users.read(address_user);
            let mut total_supply = key.total_supply.clone();
            let mut actual_supply = total_supply;
            // let mut final_supply = total_supply;
            let mut final_supply = total_supply + amount;
            // if is_decreased {
            //     final_supply = total_supply - amount;
            // } else {
            //     final_supply = total_supply + amount;
            // }

            let mut actual_supply = total_supply;
            let final_supply = total_supply + amount;
            let mut price = key.price.clone();
            let mut total_price = price.clone();
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

                            // println!("start_price {}", start_price.clone());
                            // println!("end_price {}", end_price.clone());
                            // println!("total_price {}", total_price.clone());
                            total_price
                        },
                    }
                },
                Option::None => {
                    let start_price = initial_key_price + (step_increase_linear * actual_supply);
                    let end_price = initial_key_price + (step_increase_linear * final_supply);
                    // println!("start_price {}", start_price.clone());
                    // println!("end_price {}", end_price.clone());
                    let total_price = amount * (start_price + end_price) / 2;
                    // println!("total_price {}", total_price.clone());
                    total_price
                }
            }
        }

        fn get_key_of_user(self: @ContractState, key_user: ContractAddress,) -> TokenLaunch {
            self.keys_of_users.read(key_user)
        }

        fn get_share_key_of_user(
            self: @ContractState, owner: ContractAddress, key_user: ContractAddress,
        ) -> SharesKeys {
            self.shares_by_users.read((owner, key_user))
        }

        fn get_all_keys(self: @ContractState) -> Span<TokenLaunch> {
            let max_key_id = self.total_keys.read() + 1;
            let mut keys: Array<TokenLaunch> = ArrayTrait::new();
            let mut i = 0; //Since the stream id starts from 0
            loop {
                if i >= max_key_id {}
                let key = self.array_keys_of_users.read(i);
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
