#[cfg(test)]
mod vault_test {
    // use afk::interfaces::erc20_mintable::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::interfaces::vault::{IERCVault, IERCVaultDispatcher, IERCVaultDispatcherTrait};
    // use afk::tokens::erc20_mintable::{ERC20Mintable};
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::types::defi_types::{
        TokenPermitted, DepositUser, MintDepositEvent, WithdrawDepositEvent
    };

    // use openzeppelin::token::erc20::interface::{IERC20, IERC20Dispatcher, IERC20DispatcherTrait};

    use snforge_std::{
        declare, ContractClass, ContractClassTrait, start_cheat_caller_address,
        stop_cheat_caller_address
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

    fn setup() -> (IERCVaultDispatcher, IERC20Dispatcher, IERC20Dispatcher,) {
        let erc20mintable_class = declare("ERC20Mintable").unwrap();
        let erc20_class = declare("ERC20").unwrap();

        let wBTC_Dispathcer = deploy_erc20(
            erc20_class, 'wBTC token', 'wBTC', 100_000_000_u256, ADMIN(),
        );
        let aBTC_Dispathcer = deploy_erc20_mint(
            erc20mintable_class, "aBTC token", "aBTC", ADMIN(), 100_000_000_u256,
        );

        let vault_class = declare("Vault").unwrap();

        let mut calldata = array![aBTC_Dispathcer.contract_address.into()];
        ADMIN().serialize(ref calldata);
        let (vault_address, _) = vault_class.deploy(@calldata).unwrap();

        let vaultDispatcher = IERCVaultDispatcher { contract_address: vault_address };

        (vaultDispatcher, wBTC_Dispathcer, aBTC_Dispathcer,)
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
        let (vaultDispatcher, wBTCDispatcher, aBTCDispatcher) = setup();
        let amount = 200;

        start_cheat_caller_address(vaultDispatcher.contract_address, ADMIN());
        vaultDispatcher.set_token_permitted(wBTCDispatcher.contract_address, 2_u256, true, 1_64);

        start_cheat_caller_address(wBTCDispatcher.contract_address, ADMIN());
        wBTCDispatcher.transfer(CALLER(), 400);
        stop_cheat_caller_address(wBTCDispatcher.contract_address);

        let caller_initial_balance = wBTCDispatcher.balance_of(CALLER());

        start_cheat_caller_address(wBTCDispatcher.contract_address, CALLER());
        wBTCDispatcher.approve(vaultDispatcher.contract_address, amount);
        stop_cheat_caller_address(wBTCDispatcher.contract_address);

        start_cheat_caller_address(vaultDispatcher.contract_address, CALLER());
        vaultDispatcher.mint_by_token(wBTCDispatcher.contract_address, amount);
        stop_cheat_caller_address(vaultDispatcher.contract_address);

        assert(
            wBTCDispatcher.balance_of(vaultDispatcher.contract_address) == amount, 'wrong balance'
        );
        assert(
            wBTCDispatcher.balance_of(CALLER()) == caller_initial_balance - amount, 'wrong balance'
        );

        let ratio = vaultDispatcher.get_token_ratio(wBTCDispatcher.contract_address);
        assert(aBTCDispatcher.balance_of(CALLER()) == amount * ratio, 'wrong balance');

        // withdraw coin by token
        let caller_init_aBTC_balance = aBTCDispatcher.balance_of(CALLER());
        let caller_init_wBTC_balance = wBTCDispatcher.balance_of(CALLER());

        start_cheat_caller_address(vaultDispatcher.contract_address, CALLER());
        vaultDispatcher.withdraw_coin_by_token(wBTCDispatcher.contract_address, amount);
        stop_cheat_caller_address(vaultDispatcher.contract_address);

        assert(
            aBTCDispatcher.balance_of(CALLER()) == caller_init_aBTC_balance - amount,
            'wrong balance'
        );
        assert(
            wBTCDispatcher.balance_of(CALLER()) == caller_init_wBTC_balance + (amount / ratio),
            'wrong balance'
        );
    }

    #[test]
    fn test_set_token_permitted() {
        let (vaultDispatcher, wBTCDispatcher, _,) = setup();

        start_cheat_caller_address(vaultDispatcher.contract_address, ADMIN());
        vaultDispatcher.set_token_permitted(wBTCDispatcher.contract_address, 2_u256, true, 1_64);

        assert(
            vaultDispatcher.is_token_permitted(wBTCDispatcher.contract_address),
            'token should be permitted'
        );
        stop_cheat_caller_address(vaultDispatcher.contract_address);
    }
}
