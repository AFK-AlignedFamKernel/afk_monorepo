#[cfg(test)]
mod vault_test {
use afk::interfaces::erc20_mintable::{IERC20MintableDispatcher, IERC20MintableDispatcherTrait};
    use afk::interfaces::vault::{IERCVault, IERCVaultDispatcher, IERCVaultDispatcherTrait};
    use afk::types::defi_types::{TokenPermitted, DepositUser, MintDepositEvent, WithdrawDepositEvent};
    use afk::tokens::erc20_mintable::{ERC20Mintable};

    use snforge_std::{declare, ContractClass, ContractClassTrait,};
    use starknet::ContractAddress;

    fn ADMIN() -> ContractAddress {
        123.try_into().unwrap()
    }

    fn NAME(name: felt252) -> felt252 {
        'name'.try_into().unwrap()
    }

    fn SYMBOL(symbol: felt252) -> felt252 {
        'symbol'.try_into().unwrap()
    }

    fn setup() -> (
        ContractAddress, IERCVaultDispatcher, IERC20MintableDispatcher, ContractAddress, IERC20MintableDispatcher, ContractAddress
    ) {
        let erc20mintable_class = declare("ERC20Mintable").unwrap();

        let (wBTC_address, wBTC_Dispathcer) = deploy_erc20(
            erc20mintable_class, 'wBTC token', 'wBTC', ADMIN(), 100_000_000_u256,
        );
        let (aBTC_address, aBTC_Dispathcer) = deploy_erc20(
            erc20mintable_class, 'aBTC token', 'aBTC', ADMIN(), 100_000_000_u256,
        );

        let vault_class = declare("Vault").unwrap();

        // let mut calldata = array![];
        // wBTC_address.serialize(ref calldata);
        // ADMIN().serialize(ref calldata);
        // let (vault_address, _) = vault_class.deploy(@calldata).unwrap();

        let mut calldata: Array<felt252> = ArrayTrait::new();
        calldata.append(wBTC_address.into());
        calldata.append(ADMIN().into());
        let (vault_address, _) = vault_class.deploy(@calldata).unwrap();

        let vaultDispatcher = IERCVaultDispatcher { contract_address: vault_address };

        (vault_address, vaultDispatcher, wBTC_Dispathcer, wBTC_address, aBTC_Dispathcer, aBTC_address)
    }

    fn deploy_erc20(
        class: ContractClass,
        name: felt252,
        symbol: felt252,
        owner: ContractAddress,
        initial_supply: u256,
    ) -> (ContractAddress, IERC20MintableDispatcher) {
        let mut calldata: Array<felt252> = ArrayTrait::new();

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        owner.serialize(ref calldata);
        initial_supply.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        (contract_address, IERC20MintableDispatcher { contract_address })
    }

    // #[test]
    // fn test_mint_by_token() {

    // }

    #[test]
    fn test_set_token_permitted() {
        let (_, vaultDispatcher, _, wBTC_address, _, _) = setup();

        vaultDispatcher.set_token_permitted(wBTC_address, 2_u256, true, 1_64);

        assert(vaultDispatcher.is_token_permitted(wBTC_address), 'token should be permitted')
    }
}
