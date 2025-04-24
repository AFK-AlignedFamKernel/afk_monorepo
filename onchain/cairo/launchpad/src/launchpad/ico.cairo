#[starknet::contract]
pub mod ICO {
    use core::num::traits::Zero;
    use ekubo::types::bounds::Bounds;
    use ekubo::types::i129::i129;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use starknet::storage::{Map, Mutable, MutableVecTrait, StoragePath, StoragePathEntry, Vec};
    use starknet::syscalls::{deploy_syscall, library_call_syscall};
    use starknet::{
        ClassHash, ContractAddress, SyscallResultTrait, get_block_timestamp, get_caller_address,
        get_contract_address,
    };
    use crate::interfaces::ico::{
        BuyCanceled, ContractConfig, IICO, IICOConfig, Launch, LaunchConfig, LaunchParams,
        PresaleDetails, PresaleFinalized, PresaleLaunched, Token, TokenBought, TokenClaimed,
        TokenCreated, TokenDetails, TokenInitParams, TokenStatus, default_presale_details,
    };
    use crate::interfaces::unrug::{IUnrugLiquidityDispatcher, IUnrugLiquidityDispatcherTrait};
    use crate::launchpad::utils::{
        MAX_TICK_U128, MIN_TICK_U128, align_tick_with_max_tick_and_min_tick, calculate_bound_mag,
        calculate_sqrt_ratio, sort_tokens,
    };
    use crate::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::types::launchpad_types::{
        BondingType, EkuboLP, EkuboPoolParameters, EkuboUnrugLaunchParameters, LiquidityCreated,
        SupportedExchanges, TokenQuoteBuyCoin,
    };

    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[storage]
    pub struct Storage {
        tokens: Map<ContractAddress, Token>,
        buyers: Map<ContractAddress, Vec<ContractAddress>>,
        token_list: Vec<ContractAddress>,
        launch: Launch,
        token_init: TokenInitParams,
        presale_count: u256,
        token_class_hash: ClassHash,
        exchange_address: ContractAddress,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        TokenCreated: TokenCreated,
        TokenBought: TokenBought,
        PresaleLaunched: PresaleLaunched,
        PresaleFinalized: PresaleFinalized,
        BuyCanceled: BuyCanceled,
        TokenClaimed: TokenClaimed,
        LiquidityCreated: LiquidityCreated,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        token_class_hash: ClassHash,
        fee_amount: u256,
        fee_to: ContractAddress,
        max_token_supply: u256,
        paid_in: ContractAddress,
        exchange_address: ContractAddress,
    ) {
        assert_non_zero(array![owner, fee_to, paid_in, exchange_address]);
        self.ownable.initializer(owner);
        self.token_class_hash.write(token_class_hash);
        self.token_init.fee_amount.write(fee_amount);
        self.token_init.fee_to.write(fee_to);
        self.token_init.max_token_supply.write(max_token_supply);
        self.token_init.paid_in.write(paid_in);
        self.exchange_address.write(exchange_address);
    }

    #[abi(embed_v0)]
    pub impl ICOImpl of IICO<ContractState> {
        fn create_token(ref self: ContractState, token_details: TokenDetails) -> ContractAddress {
            let caller: ContractAddress = get_caller_address();
            assert(caller.is_non_zero(), 'ZERO CALLER');

            let TokenDetails { name, symbol, initial_supply, decimals, salt } = token_details;

            assert(initial_supply > 0, 'INITIAL SUPPLY IS ZERO');
            assert(decimals > 0 && decimals <= 18, 'INVALID DECIMALS');

            // for max token supply, if zero, allow
            let max_token_supply = self.token_init.max_token_supply.read();
            assert(
                max_token_supply == 0
                    || (max_token_supply > 0 && max_token_supply >= initial_supply),
                'INVALID INITIAL SUPPLY',
            );

            let fee_amount = self.token_init.fee_amount.read();
            if fee_amount > 0 {
                let dispatcher = IERC20Dispatcher {
                    contract_address: self.token_init.paid_in.read(),
                };
                assert(dispatcher.balance_of(caller) > fee_amount, 'INSUFFICIENT CREATION BALANCE');
                dispatcher.transfer_from(caller, self.token_init.fee_to.read(), fee_amount);
            }

            // NOTE: The caller is the recipient
            let mut calldata = array![];
            (name, symbol, initial_supply, caller, decimals).serialize(ref calldata);
            let (token_address, _) = deploy_syscall(
                self.token_class_hash.read(), salt, calldata.span(), false,
            )
                .unwrap();

            self.tokens.entry(token_address).owner_access.write(Option::Some(caller));
            let event = TokenCreated {
                token_address,
                owner: caller,
                name,
                symbol,
                decimals,
                initial_supply,
                created_at: get_block_timestamp(),
            };
            self.emit(event);

            token_address
        }

        fn launch_presale(
            ref self: ContractState,
            token_address: ContractAddress,
            presale_details: Option<PresaleDetails>,
        ) {
            let caller = get_caller_address();
            self._verify_token(token_address, caller);
            let details = match presale_details {
                Option::Some(details) => details,
                _ => default_presale_details(),
            };

            assert(details.buy_token.is_non_zero(), 'BUY TOKEN IS ZERO');
            assert(
                self.token_init.accepted_buy_tokens.entry(details.buy_token).read(),
                'BUY TOKEN NOT SUPPORTED',
            );
            let soft_cap_threshold: u256 = (25 * details.hard_cap) / 100;
            assert!(
                details.soft_cap >= soft_cap_threshold,
                "SOFT CAP IS LESS THAN THRESHOLD {}",
                soft_cap_threshold,
            );

            assert(details.start_time < details.end_time, 'INVALID START AND END TIME');
            assert(
                details.liquidity_percentage >= 51 && details.liquidity_percentage <= 100,
                'INVALID LIQUIDITY RANGE',
            );
            let token = self.tokens.entry(token_address);

            // fund contract and store data.
            let dispatcher = IERC20Dispatcher { contract_address: token_address };
            let current_supply = verify_balance(dispatcher, caller);

            // Not all should be sold, say around 20% should remain
            // if rate = 1000 tokens to 1 base, then the current supply check math should be --
            // the current supply should be greater than 80% of 1000 * hard_cap

            let (threshold, min_supply) = get_trade_threshold(details, current_supply);
            assert!(threshold >= min_supply, "CONFIG REQUIRES 20 PERCENT OF SUPPLY TO NOT BE SOLD");
            dispatcher.transfer_from(caller, get_contract_address(), current_supply);

            token.current_supply.write(current_supply);
            token.presale_details.write(details);
            token.status.write(TokenStatus::Presale);
            self.presale_count.write(self.presale_count.read() + 1);

            self.token_list.push(token_address);

            let event = PresaleLaunched {
                buy_token: details.buy_token,
                presale_rate: details.presale_rate,
                soft_cap: details.soft_cap,
                hard_cap: details.hard_cap,
                liquidity_percentage: details.liquidity_percentage,
                listing_rate: details.listing_rate,
                start_time: details.start_time,
                end_time: details.end_time,
                liquidity_lockup: details.liquidity_lockup,
            };

            self.emit(event);
        }

        fn launch_dutch_auction(ref self: ContractState, token_address: ContractAddress) {}

        fn launch_liquidity(
            ref self: ContractState,
            token_address: ContractAddress,
            bonding_type: Option<BondingType>,
        ) -> u64 {
            let token = self.tokens.entry(token_address);
            assert(token.status.read() != Default::default(), 'INVALID LAUNCH');
            let owner = token.owner_access.read();

            // finalize, if applicable
            self.update_status(token_address, token);

            assert(token.successful.read(), 'PRESALE FAILED');
            assert(
                owner.is_some() && token.status.read() == TokenStatus::Finalized,
                'LAUNCHING FAILED',
            );

            let exchange_address = self.exchange_address.read();
            assert(exchange_address.is_non_zero(), 'EXCHANGE ADDRESS IS ZERO');
            let b = match bonding_type {
                Option::Some(val) => val,
                _ => BondingType::Exponential,
            };
            let id = self._launch_liquidity(token_address, b);
            token.status.write(TokenStatus::Active);
            id
        }

        fn buy_token(ref self: ContractState, token_address: ContractAddress, mut amount: u256) {
            let caller = get_caller_address();
            let token = self.tokens.entry(token_address);
            let details = token.presale_details.read();

            self.update_status(token_address, token);
            let mut status = token.status.read();
            assert(status != TokenStatus::Finalized, 'PRESALE HAS BEEN FINALIZED');
            assert(status == TokenStatus::Presale, 'PRESALE STATUS ERROR');

            if details.whitelist {
                assert(token.whitelist.entry(caller).read(), 'CALLER NOT WHITELISTED');
            }

            let dispatcher = IERC20Dispatcher { contract_address: details.buy_token };
            assert(dispatcher.balance_of(caller) >= amount, 'INSUFFICIENT FUNDS');

            let funds_raised = token.funds_raised.read();
            // Stops buyer from buying all available tokens, at any instance.
            let (threshold, _) = get_trade_threshold(details, token.current_supply.read());
            let current_funds = funds_raised + amount;
            let current_funds_token = current_funds * details.presale_rate;
            assert(current_funds_token <= threshold, 'AMOUNT TOO HIGH');

            // Peg amount to match hard cap when hard cap is exceeded
            // Test for this.
            if current_funds > details.hard_cap {
                amount = details.hard_cap - current_funds;
            }

            dispatcher.transfer_from(caller, get_contract_address(), amount);
            token.funds_raised.write(current_funds);

            // update transaction data for good tracking
            let token_amount = details.presale_rate * amount;
            token.current_supply.write(token.current_supply.read() - token_amount);
            let bought = token.buyers.entry(caller).read();
            token.buyers.entry(caller).write(bought + amount);
            token.holders.entry(caller).write(token.holders.entry(caller).read() + token_amount);
            self.buyers.entry(caller).push(token_address);

            // check cap value, and resolve presale
            if current_funds >= details.soft_cap {
                token.successful.write(true);
                if current_funds == details.hard_cap {
                    token.status.write(TokenStatus::Finalized);
                }
            }

            let event = TokenBought {
                token_address,
                amount: token_amount,
                buyer: caller,
                bought_at: get_block_timestamp(),
            };
            self.emit(event);
        }

        fn cancel_buy(ref self: ContractState, token_address: ContractAddress) {
            // There's no timer set on this. The caller can cancel a buy as far as the token's
            // presale is not finalized.
            let caller = get_caller_address();
            let token = self.tokens.entry(token_address);
            assert(token.status.read() == TokenStatus::Presale, 'ACTION NOT ALLOWED');
            let token = self.tokens.entry(token_address);
            let token_amount = token.holders.entry(caller).read();
            assert(token_amount > 0, 'INSUFFICIENT AMOUNT'); // change error message

            let amount = token.buyers.entry(caller).read();
            let dispatcher = IERC20Dispatcher {
                contract_address: token.presale_details.read().buy_token,
            };
            dispatcher.transfer(caller, amount);
            token.buyers.entry(caller).write(0);

            let funds_raised = token.funds_raised.read();
            token.funds_raised.write(funds_raised - amount);
            token.holders.entry(caller).write(0);
            token.current_supply.write(token.current_supply.read() - token_amount);

            let event = BuyCanceled {
                token_address, buyer: caller, amount, canceled_at: get_block_timestamp(),
            };
            self.emit(event);
        }

        fn claim(ref self: ContractState, token_address: ContractAddress) {
            // investors cannot claim token until liquidity has been added
            let caller = get_caller_address();
            let token = self.tokens.entry(token_address);
            self.update_status(token_address, token);
            let status: u8 = token.status.read().into();
            assert(status >= TokenStatus::Active.into(), 'PRESALE NOT ACTIVE');
            let mut amount = token.buyers.entry(caller).read();
            assert(amount > 0, 'NOTHING TO CLAIM');

            self._claim(token_address, caller, token);
        }

        fn claim_all(ref self: ContractState) {
            // investors cannot claim token until liquidity has been added
            let caller = get_caller_address();
            let tokens = self.buyers.entry(caller);

            assert(tokens.len() > 0, 'NOTHING TO CLAIM');
            while let Option::Some(token_address) = tokens.pop() {
                let token = self.tokens.entry(token_address);
                self.update_status(token_address, token);
                let status: u8 = token.status.read().into();
                let amount = token.buyers.entry(caller).read();
                if status >= TokenStatus::Active.into() && amount > 0 {
                    self._claim(token_address, caller, token);
                }
            }
            // debugging
            assert(self.buyers.entry(caller).len() == 0, 'POP FAILED');
        }

        fn whitelist(
            ref self: ContractState, token_address: ContractAddress, target: Array<ContractAddress>,
        ) {
            assert(target.len() > 0, 'TARGET IS EMPTY');
            let token = self.tokens.entry(token_address);
            assert(token.owner_access.read().is_some(), 'INVALID TOKEN ADDRESS');
            assert(token.owner_access.read().unwrap() == get_caller_address(), 'ACCESS DENIED');
            assert(token.presale_details.read().whitelist, 'ERROR WHITELISTING TARGET');
            for address in target {
                token.whitelist.entry(address).write(true);
            };
        }
    }

    #[abi(embed_v0)]
    pub impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable.upgrade(new_class_hash);
        }
    }

    #[abi(embed_v0)]
    pub impl ICOConfigImpl of IICOConfig<ContractState> {
        fn set_config(ref self: ContractState, config: ContractConfig) {
            self.ownable.assert_only_owner();

            if let Option::Some(val) = config.exchange_address {
                assert(val.is_non_zero(), 'EXCHANGE ADDRESS IS ZERO');
                self.exchange_address.write(val);
            }
            if let Option::Some((fee_amount, fee_to)) = config.fee {
                assert(fee_amount != 0 && fee_to.is_non_zero(), 'INVALID FEE PARAMS');
                assert(config.paid_in.is_some(), 'INCORRECT CONFIG -- PAID IN');
                self.token_init.fee_to.write(fee_to);
                self.token_init.fee_amount.write(fee_amount);
            }
            if let Option::Some(val) = config.max_token_supply {
                self.token_init.max_token_supply.write(val);
            }
            if let Option::Some(val) = config.paid_in {
                assert(config.fee.is_some(), 'INCORRECT CONFIG -- FEE');
                self.token_init.paid_in.write(val);
            }
            if let Option::Some(val) = config.token_class_hash {
                self.token_class_hash.write(val);
            }
            for token in config.accepted_buy_tokens {
                self.token_init.accepted_buy_tokens.entry(token).write(true);
            }
        }

        fn set_liquidity_config(ref self: ContractState, config: LaunchConfig) {
            if let Option::Some(val) = config.unrug_address {
                assert(val.is_non_zero(), 'ZERO UNRUG ADDRESS');
                self.launch.unrug_address.write(val);
            }
            if let Option::Some((fee_amount, fee_to, paid_in)) = config.fee {
                assert(
                    fee_amount > 0 && fee_to.is_non_zero() && paid_in.is_non_zero(),
                    'INCORRECT LAUNCH -- FEE',
                );
                self.launch.fee_amount.write(fee_amount);
                self.launch.fee_to.write(fee_to);
                self.launch.paid_in.write(paid_in);
            }
            if let Option::Some(val) = config.quote_token {
                assert(val.is_non_zero(), 'QUOTE TOKEN IS ZERO');
                self.launch.quote_token.write(val);
            }
        }
    }

    #[generate_trait]
    pub impl ICOInternalImpl of ICOInternalTrait {
        /// TODO: Verifies that the given token meets the ICO standard.
        fn _verify_token(
            ref self: ContractState, token_address: ContractAddress, caller: ContractAddress,
        ) {
            let token = self.tokens.entry(token_address);
            assert(token.status.read() == Default::default(), 'PRESALE ALREADY LAUNCHED');
            if let Option::Some(owner) = token.owner_access.read() {
                assert(owner == caller, 'VERIFICATION FAILED');
                return;
            }
            let dispatcher = IERC20Dispatcher { contract_address: token_address };
            verify_balance(dispatcher, caller);
            // TODO: Other checks to meet ICO standard, if any
            self.tokens.entry(token_address).owner_access.write(Option::Some(caller));
        }

        fn update_status(
            ref self: ContractState,
            token_address: ContractAddress,
            token: StoragePath<Mutable<Token>>,
        ) {
            let details = token.presale_details.read();
            if token.status.read() == TokenStatus::Presale
                && get_block_timestamp() > details.end_time {
                let mut successful = false;
                if token.funds_raised.read() > details.soft_cap {
                    successful = true;
                }
                token.successful.write(successful);
                token.status.write(TokenStatus::Finalized);
                let event = PresaleFinalized {
                    presale_token_address: token_address,
                    buy_token_address: details.buy_token,
                    successful,
                };

                self.emit(event);
            }
        }

        fn _claim(
            ref self: ContractState,
            token_address: ContractAddress,
            caller: ContractAddress,
            token: StoragePath<Mutable<Token>>,
        ) {
            // NOTE: The `funds_raised` and `current_supply` is not altered, for record purposes.
            let mut amount = token.buyers.entry(caller).read();
            let mut claimed_token_address = token_address;
            let mut claimed_amount = amount;
            if token.successful.read() {
                let dispatcher = IERC20Dispatcher { contract_address: token_address };
                let token_amount = token.holders.entry(caller).read();
                dispatcher.transfer(caller, token_amount);
                claimed_amount = token_amount;
            } else {
                // refund
                claimed_token_address = token.presale_details.read().buy_token;
                let dispatcher = IERC20Dispatcher { contract_address: claimed_token_address };
                dispatcher.transfer(caller, amount);
            }

            token.holders.entry(caller).write(0);
            token.buyers.entry(caller).write(0);

            let event = TokenClaimed {
                presale_token_address: token_address,
                claimed_token_address,
                recipient: caller,
                amount: claimed_amount,
                claimed_at: get_block_timestamp(),
            };
            self.emit(event);
        }

        fn _launch_liquidity(
            ref self: ContractState, token_address: ContractAddress, bonding_type: BondingType,
        ) -> u64 {
            let caller = get_caller_address();
            let token = self.tokens.entry(token_address);
            let details = token.presale_details.read();

            // Resolve payment if payment is required for launch
            let fee = self.launch.fee_amount.read();
            if fee > 0 {
                let address = self.launch.paid_in.read();
                let dispatcher = IERC20Dispatcher { contract_address: address };
                dispatcher.transfer_from(caller, self.launch.fee_to.read(), fee);
            }

            // Check
            let token_quote = TokenQuoteBuyCoin {
                token_address: details.buy_token, price: details.presale_rate, is_enable: true,
            };

            let mut launch_params = LaunchParams {
                bonding_type,
                token_quote,
                liquidity_type: Option::None,
                starting_price: details.listing_rate,
                launched_at: 0,
            };

            let (id, _) = self._add_liquidity_ekubo(token_address, launch_params, details);
            launch_params.launched_at = get_block_timestamp();
            self.launch.launched_tokens.entry(token_address).write(launch_params);
            self.launch.total_launched.write(self.launch.total_launched.read() + 1);
            id
        }

        fn _add_liquidity_ekubo(
            ref self: ContractState,
            token_address: ContractAddress,
            launch: LaunchParams,
            details: PresaleDetails,
        ) -> (u64, EkuboLP) {
            // Get unrug liquidity contract
            let unrug_address = self.launch.unrug_address.read();
            let unrug_dispatcher = IUnrugLiquidityDispatcher { contract_address: unrug_address };

            // Calculate thresholds
            // let threshold_liquidity = launch.threshold_liquidity.clone();
            // let slippage_threshold: u256 = threshold_liquidity * SLIPPAGE_THRESHOLD / BPS;

            // We use fee and tick size from the Unruguable as it seems as working POC
            let fee_percent = 0xc49ba5e353f7d00000000000000000; // This is recommended value 0.3%
            let tick_spacing =
                5982_u128; // log(1 + 0.6%) / log(1.000001) => 0.6% is the tick spacing percentage

            // Calculate initial tick price
            // Compute sqrt root with the correct placed of token0 and token1

            // Sorting of tokens
            let (_, token1) = sort_tokens(token_address, launch.token_quote.token_address.clone());

            let is_token1_quote = launch.token_quote.token_address == token1;

            // The calculation works with assumption that initial_pool_supply is always higher than
            // threshold_liquidity which should be true Calculate the sqrt ratio

            // CHECK
            let token = self.tokens.entry(token_address);
            let mut sqrt_ratio = calculate_sqrt_ratio(
                token.funds_raised.read(), token.current_supply.read(),
            );

            // println!("sqrt_ratio after assert {}", sqrt_ratio.clone());
            // Define the minimum and maximum sqrt ratios
            // Convert to a tick value
            let mut call_data: Array<felt252> = array![];
            Serde::serialize(@sqrt_ratio, ref call_data);

            let class_hash: ClassHash =
                0x037d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3
                .try_into()
                .unwrap();

            let mut res = library_call_syscall(
                class_hash, selector!("sqrt_ratio_to_tick"), call_data.span(),
            )
                .unwrap_syscall();

            let mut initial_tick = Serde::<i129>::deserialize(ref res).unwrap();

            // To always handle the same price as if default token is token1
            // The quote token is our default token, leads that we want to price
            // The memcoin in the value of the quote token, the price ratio is <0,1
            // Also this is not ideal way but will works as memecoin supply > default token supply
            // Therefore we know that memecoin is less valued than default token
            if (is_token1_quote) {
                initial_tick.mag = initial_tick.mag + 1; // We should keep complementary code 
                initial_tick.sign = true;
            }

            // let bound_spacing = 887272;
            // TODO check how used the correct tick spacing
            // bound spacing calculation
            let bound_spacing: u128 = calculate_bound_mag(
                fee_percent.clone(), tick_spacing.clone().try_into().unwrap(), initial_tick.clone(),
            );

            // Align the min and max ticks with the spacing
            let min_tick = MIN_TICK_U128.try_into().unwrap();
            let max_tick = MAX_TICK_U128.try_into().unwrap();

            let aligned_min_tick = align_tick_with_max_tick_and_min_tick(min_tick, tick_spacing);
            let aligned_max_tick = align_tick_with_max_tick_and_min_tick(max_tick, tick_spacing);
            // Full range bounds for liquidity providing
            // Uniswap V2 model as full range is used
            let mut full_range_bounds = Bounds {
                lower: i129 { mag: aligned_min_tick, sign: true },
                upper: i129 { mag: aligned_max_tick, sign: false },
            };

            let pool_params = EkuboPoolParameters {
                fee: fee_percent,
                tick_spacing: tick_spacing,
                starting_price: initial_tick,
                bound: bound_spacing,
                bounds: full_range_bounds,
                bound_spacing: bound_spacing,
            };

            // Calculate liquidity amounts

            // NOTE
            // Random math when launching token,,,
            // let liquidity_supply = total_supply / LIQUIDITY_RATIO;
            // let supply_distribution = total_supply - liquidity_supply;
            // initial_pool_supply = liquidity_supply
            let lp_supply = token.current_supply.read(); // perhaps divide by LIQUIDITY_RATIO (5)
            let mut lp_quote_supply = token.funds_raised.read();

            // Handle edge case where contract balance is insufficient
            let quote_token = IERC20Dispatcher {
                contract_address: launch.token_quote.token_address.clone(),
            };
            // let contract_quote_balance = quote_token.balance_of(get_contract_address());

            // TODO audit
            // HIGH SECURITY RISK
            // TODO fix this
            // We do something wrong if we enter this case
            // Can be caused a rounding and approximation error, fees and others stuff

            // TODO: Check the threshold_liquidity

            // if contract_quote_balance < lp_quote_supply
            //     && contract_quote_balance < launch.threshold_liquidity {
            //     lp_quote_supply = contract_quote_balance.clone();
            // }

            // Prepare launch parameters
            let params = EkuboUnrugLaunchParameters {
                owner: get_contract_address(),
                token_address,
                quote_address: launch.token_quote.token_address.clone(),
                lp_supply: lp_supply.clone(),
                lp_quote_supply: lp_quote_supply.clone(),
                pool_params: pool_params,
                caller: get_caller_address(),
            };

            // Approve tokens
            quote_token.approve(unrug_address, lp_quote_supply);
            let token_dispatcher = IERC20Dispatcher { contract_address: token_address };
            token_dispatcher.approve(unrug_address, lp_supply);

            // Launch on Ekubo
            // TODO Audit unrug.cairo
            // Bounds calculated from unrug using the sign
            let (id, position) = unrug_dispatcher.launch_on_ekubo(token_address, params);

            // Emit event
            self
                .emit(
                    LiquidityCreated {
                        id: id.try_into().unwrap(),
                        pool: token_address,
                        asset: token_address,
                        quote_token_address: launch.token_quote.token_address,
                        owner: token.owner_access.read().unwrap(),
                        exchange: SupportedExchanges::Ekubo,
                        is_unruggable: false,
                    },
                );

            (id, position)
        }
    }

    fn verify_balance(dispatcher: IERC20Dispatcher, caller: ContractAddress) -> u256 {
        let total_supply = dispatcher.total_supply();
        let balance = dispatcher.balance_of(caller);
        let threshold: u256 = 90 * total_supply / 100;
        assert(balance >= threshold, 'VERIFICATION FAILED');
        balance
    }

    /// check
    fn get_trade_threshold(details: PresaleDetails, current_supply: u256) -> (u256, u256) {
        let min_supply = 20 * details.presale_rate * details.hard_cap / 100;
        let max_supply = 80 * details.presale_rate * details.hard_cap / 100;

        assert(current_supply > max_supply, 'MAX SUPPLY < CURRENT SUPPLY');
        (current_supply - max_supply, min_supply)
    }

    fn assert_non_zero(addresses: Array<ContractAddress>) {
        for address in addresses {
            assert(address.is_non_zero(), 'INIT PARAM ERROR');
        };
    }

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;
}
