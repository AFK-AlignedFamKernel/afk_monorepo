#[starknet::contract]
pub mod ICO {
    use core::num::traits::Zero;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use starknet::storage::{Map, Mutable, MutableVecTrait, StoragePath, StoragePathEntry, Vec};
    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ClassHash, ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
    };
    use crate::interfaces::ico::{
        IICO, IICOConfig, PresaleDetails, PresaleLaunched, PresaleStatus, Token, TokenBought,
        TokenClaimed, TokenConfig, TokenCreated, TokenDetails, TokenInitParams,
        default_presale_details,
    };
    use crate::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[storage]
    pub struct Storage {
        tokens: Map<ContractAddress, Token>,
        buyers: Map<ContractAddress, Vec<ContractAddress>>,
        token_list: Vec<ContractAddress>,
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
        PresaleLauched: PresaleLaunched,
        TokenClaimed: TokenClaimed,
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
            assert(name.len() > 0, 'INVALID TOKEN NAME');
            assert(symbol.len() > 0, 'INVALID TOKEN SYMBOL');
            assert(initial_supply > 0, 'INITIAL SUPPLY IS ZERO');
            assert(decimals > 0 && decimals <= 18, 'INVALID DECIMALS');

            // for max token supply, if zero, allow
            let max_token_supply = self.token_init.max_token_supply.read();
            assert(
                max_token_supply == 0
                    || (max_token_supply > 0 && max_token_supply > initial_supply),
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
            let mut calldata: Array<felt252> = array![];
            (name.clone(), symbol.clone(), initial_supply, decimals, caller, caller)
                .serialize(ref calldata);
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
                created_at: starknet::get_block_timestamp(),
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

            let soft_cap_threshold: u256 = (25 * details.hard_cap) / 100;
            assert!(
                details.soft_cap >= soft_cap_threshold,
                "SOFT CAP IS LESS THAN THRESHOLD {}",
                soft_cap_threshold,
            );

            assert(details.start_time < details.end_time, 'INVALID START AND END TIME');
            assert(
                details.liquidity_percentage > 51 && details.liquidity_percentage <= 100,
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
            token.status.write(PresaleStatus::Launched);
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

        fn launch_liquidity_providing(ref self: ContractState, token_address: ContractAddress) {
            let token = self.tokens.entry(token_address);
            assert(token.status.read() != Default::default(), 'INVALID LAUNCH');
            let owner = token.owner_access.read();

            // finalize, if applicable
            update_status(token);

            assert(token.successful.read(), 'PRESALE FAILED');
            assert(
                owner.is_some() && token.status.read() == PresaleStatus::Finalized,
                'LAUNCHING FAILED',
            );

            // Launch the liquidity here
            // TODO: Keep track of tokens whose liquidity providing has been launched.
            // Incomplete yet

            // TODO
            // Then change to active.
            token.status.write(PresaleStatus::Active);
            // emit LiquidityLaunched
        }

        fn buy_token(ref self: ContractState, token_address: ContractAddress, mut amount: u256) {
            let caller = get_caller_address();
            let token = self.tokens.entry(token_address);
            let details = token.presale_details.read();

            update_status(token);
            let mut status = token.status.read();
            assert(status != PresaleStatus::Finalized, 'PRESALE HAS BEEN FINALIZED');
            assert(status == PresaleStatus::Launched, 'PRESALE STATUS ERROR');

            if details.whitelist {
                assert(token.whitelist.entry(caller).read(), 'CALLER NOT WHITELISTED');
            }

            let dispatcher = IERC20Dispatcher { contract_address: details.buy_token };
            assert(dispatcher.balance_of(caller) > amount, 'INSUFFICIENT FUNDS');

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
                    token.status.write(PresaleStatus::Finalized);
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
            assert(token.status.read() == PresaleStatus::Launched, 'ACTION NOT ALLOWED');
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
            // emit event
        }

        fn claim(ref self: ContractState, token_address: ContractAddress) {
            // investors cannot claim token until liquidity has been added
            let caller = get_caller_address();
            let token = self.tokens.entry(token_address);
            let status: u8 = token.status.read().into();
            assert(status >= PresaleStatus::Active.into(), 'PRESALE NOT ACTIVE');
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
                let status: u8 = token.status.read().into();
                let amount = token.buyers.entry(caller).read();
                if status >= PresaleStatus::Active.into() && amount > 0 {
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
        fn set_token_config(ref self: ContractState, config: TokenConfig) {}
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
    }

    fn verify_balance(dispatcher: IERC20Dispatcher, caller: ContractAddress) -> u256 {
        let total_supply = dispatcher.total_supply();
        let balance = dispatcher.balance_of(caller);
        let threshold: u256 = 80 * total_supply / 100;
        assert(balance >= threshold, 'VERIFICATION FAILED');
        balance
    }

    /// check
    fn get_trade_threshold(details: PresaleDetails, current_supply: u256) -> (u256, u256) {
        let min_supply = 20 * details.presale_rate * details.hard_cap / 100;
        let max_supply = 80 * details.presale_rate * details.hard_cap / 100;

        (current_supply - max_supply, min_supply)
    }

    fn update_status(token: StoragePath<Mutable<Token>>) {
        let details = token.presale_details.read();
        if token.status.read() == PresaleStatus::Launched
            && details.end_time > get_block_timestamp() {
            if token.funds_raised.read() > details.soft_cap {
                token.successful.write(true);
            }
            token.status.write(PresaleStatus::Finalized);
        }
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

#[cfg(test)]
mod tests {
    use core::num::traits::Zero;
    use starknet::{ClassHash, ContractAddress};
    use crate::interfaces::ico::{IICODispatcher, IICODispatcherTrait};
    // Remember the storage mutable issh, with update status -- doesn't take in a ref of token.
    // TODO: Don't forget to test this state.

    fn deploy(
        token_class_hash: ClassHash,
        fee_amount: u256,
        fee_to: ContractAddress,
        max_token_supply: u256,
        paid_in: ContractAddress,
        exchange_address: ContractAddress,
    ) -> ContractAddress {
        Zero::zero()
    }

    fn deploy_default_contract() -> ContractAddress {
        Zero::zero()
    }
}
