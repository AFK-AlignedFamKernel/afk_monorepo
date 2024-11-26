use starknet::{ContractAddress, get_contract_address};
use starknet::testing::set_block_timestamp;
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait,
    start_cheat_caller_address, stop_cheat_caller_address,
    start_cheat_block_timestamp_global, stop_cheat_block_timestamp_global
};

const ONE_E18: u256 = 1000000000000000000_u256;

use afk::staking::mocks::mock_erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use afk::staking::staking::{IStakingDispatcher, IStakingDispatcherTrait};

fn deploy_token(name: ByteArray) -> ContractAddress {
    let contract = declare("MockToken").unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

fn deploy_staking_contract(name: ByteArray, staking_token: ContractAddress, reward_token: ContractAddress) -> ContractAddress {
    let owner: ContractAddress = starknet::contract_address_const::<0x123626789>();

    let mut constructor_calldata = ArrayTrait::new();

    constructor_calldata.append(owner.into());
    constructor_calldata.append(staking_token.into());
    constructor_calldata.append(reward_token.into());

    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

    contract_address
}

#[test]
fn test_token_mint() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");

    let staking_token = IERC20Dispatcher { contract_address: staking_token_address };
    let reward_token = IERC20Dispatcher { contract_address: reward_token_address };

    let receiver: ContractAddress = starknet::contract_address_const::<0x123626789>();

    let mint_amount: u256 = 10000_u256;
    staking_token.mint(receiver, mint_amount);
    reward_token.mint(receiver, mint_amount);

    assert!(staking_token.balance_of(receiver) == mint_amount, "wrong staking token balance");
    assert!(reward_token.balance_of(receiver) == mint_amount, "wrong reward token balance");
    assert!(staking_token.balance_of(receiver) > 0, "balance failed to increase");
    assert!(reward_token.balance_of(receiver) > 0, "balance didn't increase");
}