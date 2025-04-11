#[starknet::contract]
pub mod ICO {
    use core::num::traits::Zero;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePathEntry};
    use starknet::syscalls::deploy_syscall;
    use starknet::{ClassHash, ContractAddress, get_caller_address};
    use crate::interfaces::ico::{
        IICO, IICOConfig, PresaleDetails, Token, TokenConfig, TokenCreated, TokenDetails,
        TokenInitParams, default_presale_details, PresaleStatus
    };
    use crate::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

    const PRECISION: u256 = 1_000;

    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[storage]
    pub struct Storage {
        tokens: Map<ContractAddress, Token>,
        token_init: TokenInitParams,
        presale_count: u256,
        token_class_hash: ClassHash,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        TokenCreated: TokenCreated,
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
    ) {
        self.ownable.initializer(owner);
        self.token_class_hash.write(token_class_hash);
        self.token_init.fee_amount.write(fee_amount);
        self.token_init.fee_to.write(fee_to);
        self.token_init.max_token_supply.write(max_token_supply);
        self.token_init.paid_in.write(paid_in);
    }

    #[abi(embed_v0)]
    pub impl ICOImpl of IICO<ContractState> {
        fn create_token(ref self: ContractState, token_details: TokenDetails) -> ContractAddress {
            let caller: ContractAddress = get_caller_address();

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
            let token_created = TokenCreated {
                token_address,
                owner: caller,
                name,
                symbol,
                decimals,
                initial_supply,
                created_at: starknet::get_block_timestamp(),
            };
            self.emit(token_created);

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

            let soft_cap_threshold: u256 = (25 * PRECISION * details.hard_cap) / 100;
            assert!(
                details.soft_cap * PRECISION >= details.hard_cap,
                "SOFT CAP IS LESS THAN THRESHOLD {} WITH PRECISION {}",
                soft_cap_threshold, PRECISION
            );
            assert(details.start_time < details.end_time, 'INVALID START AND END TIME');
            assert(details.liquidity_percentage > 51 && details.liquidity_percentage <= 100, 'INVALID LIQUIDITY RANGE');
            let token = self.tokens.entry(token_address);

            token.presale_details.write(Option::Some(details));
            token.status.write(PresaleStatus::Pending);

            // Emit a Presale launched event here.
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
                assert(owner == caller, 'NOT VERIFIED');
            }
            // Check balance... and token params
            // and set the owner as Option::Some
        }
    }

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;
}
