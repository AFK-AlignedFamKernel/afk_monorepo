#[cfg(test)]
mod vault_test {
    use afk::defi::vault::Vault::Event;
    use afk::interfaces::erc20_mintable::{IERC20MintableDispatcher, IERC20MintableDispatcherTrait};
    use afk::interfaces::vault::{IERCVault, IERCVaultDispatcher, IERCVaultDispatcherTrait};
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::types::defi_types::{
        TokenPermitted, DepositUser, MintDepositEvent, WithdrawDepositEvent
    };

    use snforge_std::{
        declare, ContractClass, ContractClassTrait, start_cheat_caller_address,
        stop_cheat_caller_address, spy_events, EventSpy, SpyOn, EventAssertions
    };
    use starknet::ContractAddress;

    fn ADMIN() -> ContractAddress {
        123.try_into().unwrap()
    }

    fn CALLER() -> ContractAddress {
        5.try_into().unwrap()
    }

    fn NAME(name: felt252) -> felt252 {
        'name'.try_into().unwrap()
    }

    fn SYMBOL(symbol: felt252) -> felt252 {
        'symbol'.try_into().unwrap()
    }

    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

    fn setup() -> (IERCVaultDispatcher, IERC20Dispatcher, IERC20Dispatcher,) {
        let erc20_mintable_class = declare("ERC20Mintable").unwrap();
        let erc20_class = declare("ERC20").unwrap();

        let wbtc_dispathcer = deploy_erc20(
            erc20_class, 'wBTC token', 'wBTC', 100_000_000_u256, ADMIN(),
        );
        let abtc_dispathcer = deploy_erc20_mint(
            erc20_mintable_class, "aBTC token", "aBTC", ADMIN(), 100_000_000_u256,
        );

        let vault_class = declare("Vault").unwrap();

        let mut calldata = array![abtc_dispathcer.contract_address.into()];
        ADMIN().serialize(ref calldata);
        let (vault_address, _) = vault_class.deploy(@calldata).unwrap();

        let vaultDispatcher = IERCVaultDispatcher { contract_address: vault_address };

        // set minter role in erc20 mintable token
        let abtc_mintable_dispathcer = IERC20MintableDispatcher {
            contract_address: abtc_dispathcer.contract_address
        };

        start_cheat_caller_address(abtc_dispathcer.contract_address, ADMIN());
        abtc_mintable_dispathcer.set_role(vaultDispatcher.contract_address, MINTER_ROLE, true);
        stop_cheat_caller_address(abtc_dispathcer.contract_address);

        (vaultDispatcher, wbtc_dispathcer, abtc_dispathcer,)
    }

    fn deploy_erc20_mint(
        class: ContractClass,
        name: ByteArray,
        symbol: ByteArray,
        owner: ContractAddress,
        initial_supply: u256,
    ) -> IERC20Dispatcher {
        let mut calldata: Array<felt252> = ArrayTrait::new();

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        owner.serialize(ref calldata);
        initial_supply.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IERC20Dispatcher { contract_address }
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
        initial_supply.serialize(ref calldata);
        recipient.serialize(ref calldata);
        18_u8.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IERC20Dispatcher { contract_address }
    }

    #[test]
    fn test_mint_by_token() {
        let (vault_dispatcher, wbtc_dispatcher, abtc_dispatcher) = setup();
        let mut spy = spy_events(SpyOn::One(vault_dispatcher.contract_address));
        let amount = 200;

        // set permited token
        start_cheat_caller_address(vault_dispatcher.contract_address, ADMIN());
        vault_dispatcher.set_token_permitted(wbtc_dispatcher.contract_address, 2_u256, true, 1_64);

        // transfer tokens to caller
        start_cheat_caller_address(wbtc_dispatcher.contract_address, ADMIN());
        wbtc_dispatcher.transfer(CALLER(), 400);
        stop_cheat_caller_address(wbtc_dispatcher.contract_address);

        let _caller_initial_balance = wbtc_dispatcher.balance_of(CALLER());

        // get allowance
        start_cheat_caller_address(wbtc_dispatcher.contract_address, CALLER());
        wbtc_dispatcher.approve(vault_dispatcher.contract_address, amount);
        stop_cheat_caller_address(wbtc_dispatcher.contract_address);

        start_cheat_caller_address(vault_dispatcher.contract_address, CALLER());
        vault_dispatcher.mint_by_token(wbtc_dispatcher.contract_address, amount);
        stop_cheat_caller_address(vault_dispatcher.contract_address);

        assert(
            wbtc_dispatcher.balance_of(vault_dispatcher.contract_address) == amount, 'wrong balance'
        );
        // assert(
        //     wbtc_dispatcher.balance_of(CALLER()) == caller_initial_balance - amount, 'wrong balance'
        // );

        let _ratio = vault_dispatcher.get_token_ratio(wbtc_dispatcher.contract_address);
        assert(abtc_dispatcher.balance_of(CALLER()) == amount, 'wrong balance');

        // withdraw coin by token
        let caller_init_aBTC_balance = abtc_dispatcher.balance_of(CALLER());
        let caller_init_wBTC_balance = wbtc_dispatcher.balance_of(CALLER());

        start_cheat_caller_address(vault_dispatcher.contract_address, CALLER());
        vault_dispatcher.withdraw_coin_by_token(wbtc_dispatcher.contract_address, amount);
        stop_cheat_caller_address(vault_dispatcher.contract_address);

        assert(
            abtc_dispatcher.balance_of(CALLER()) == caller_init_aBTC_balance - amount,
            'wrong balance'
        );
        assert(
            wbtc_dispatcher.balance_of(CALLER()) == caller_init_wBTC_balance + amount,
            'wrong balance'
        );

        let expected_deposit_event = Event::MintDepositEvent(
            MintDepositEvent {
                caller: CALLER(),
                token_deposited: wbtc_dispatcher.contract_address,
                amount_deposit: amount,
                mint_receive: amount,
            }
        );

        let expected_withdraw_event = Event::WithdrawDepositEvent(
            WithdrawDepositEvent {
                caller: CALLER(),
                token_deposited: abtc_dispatcher.contract_address,
                amount_deposit: amount,
                mint_receive: amount,
                mint_to_get_after_poolin: 0,
                pooling_interval: 1_64
            }
        );

        spy
            .assert_emitted(
                @array![
                    (vault_dispatcher.contract_address, expected_deposit_event),
                    (vault_dispatcher.contract_address, expected_withdraw_event)
                ]
            );
    }

    #[test]
    #[should_panic(expected: ('Non permited token',))]
    fn test_mint_by_token_with_non_permitted_token() {
        let (vault_dispatcher, wbtc_dispatcher, _,) = setup();

        start_cheat_caller_address(vault_dispatcher.contract_address, CALLER());
        vault_dispatcher.mint_by_token(wbtc_dispatcher.contract_address, 200);
    }

    #[test]
    #[should_panic(expected: ('Non permited token',))]
    fn test_withdraw_coin_by_token_with_non_permitted_token() {
        let (vault_dispatcher, wbtc_dispatcher, _,) = setup();

        start_cheat_caller_address(vault_dispatcher.contract_address, CALLER());
        vault_dispatcher.withdraw_coin_by_token(wbtc_dispatcher.contract_address, 200);
    }

    #[test]
    fn test_set_token_permitted() {
        let (vault_dispatcher, wbtc_dispatcher, _,) = setup();

        start_cheat_caller_address(vault_dispatcher.contract_address, ADMIN());
        vault_dispatcher.set_token_permitted(wbtc_dispatcher.contract_address, 2_u256, true, 1_64);

        assert(
            vault_dispatcher.is_token_permitted(wbtc_dispatcher.contract_address),
            'token should be permitted'
        );
        stop_cheat_caller_address(vault_dispatcher.contract_address);
    }

    #[test]
    #[should_panic(expected: ('Non permited token',))]
    fn test_get_token_ratio_with_non_permitted_token() {
        let (vault_dispatcher, _, abtc_dispatcher,) = setup();

        start_cheat_caller_address(vault_dispatcher.contract_address, CALLER());
        vault_dispatcher.get_token_ratio(abtc_dispatcher.contract_address);
    }

    #[test]
    fn test_get_token_ratio() {
        let (vault_dispatcher, wbtc_dispatcher, _,) = setup();
        let ratio = 5;

        start_cheat_caller_address(vault_dispatcher.contract_address, ADMIN());
        vault_dispatcher.set_token_permitted(wbtc_dispatcher.contract_address, ratio, true, 1_64);
        stop_cheat_caller_address(vault_dispatcher.contract_address);

        start_cheat_caller_address(vault_dispatcher.contract_address, CALLER());
        let res = vault_dispatcher.get_token_ratio(wbtc_dispatcher.contract_address);

        assert(res == ratio, 'wrong ratio');
    }
}
