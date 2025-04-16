mod ico_tests {
    use alexandria_math::fast_power::fast_power;
    use core::num::traits::Zero;
    use snforge_std::cheatcodes::events::Event;
    use snforge_std::{
        CheatSpan, ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, EventSpyTrait,
        EventsFilterTrait, cheat_block_timestamp, cheat_caller_address, declare, spy_events,
    };
    use starknet::{ClassHash, ContractAddress};
    use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interfaces::ico::{IICODispatcher, IICODispatcherTrait};
    // Remember the storage mutable issh, with update status -- doesn't take in a ref of token.
    // TODO: Don't forget to test this state.

    const EKUBO_EXCHANGE: ContractAddress =
        0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b
        .try_into()
        .unwrap();

    const OWNER: ContractAddress = 'OWNER'.try_into().unwrap();

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

    /// For base coin -- buy token
    fn deploy_erc20() -> ContractAddress {
        // name: felt252,
        // symbol: felt252,
        // initial_supply: u256,
        // recipient: ContractAddress,
        // decimals: u8,
        let mut calldata = array![];
        ('USD COIN', 'USDC', 1_000_000_u256 * fast_power(10, 18), OWNER, 18_u8)
            .serialize(ref calldata);
        let contract = declare("ERC20").unwrap().contract_class();
        let (contract_address, _) = contract.deploy(@calldata).unwrap();
        contract_address
    }

    #[test]
    fn test_ico_deploy_erc20() {
        let contract_address = deploy_erc20();
        let dispatcher = IERC20Dispatcher { contract_address };
        assert(dispatcher.name() == 'USD COIN', 'ERC20 NAME MISMATCH');
        assert(dispatcher.symbol() == 'USDC', 'ERC20 SYMBOL MISMATCH');
        assert(dispatcher.initial_supply() == 1_000_000_u256 * fast_power(10, 18), 'ERC20 SUPPLY MISMATCH');
    }
    // Test buy_token for a token twice, run claim_all, it shouldn't throw an error, but it should
// run perfectly.
// buy_token pushes the token's contract twice, so the second call to _claim should do
// absolutely nothing.
// But claim won't work until the token is deployed to Ekubo sepolia.
}
