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

#[test]
fn test_staking_constructor() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract("StakingRewards", staking_token_address, reward_token_address);

    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let owner: ContractAddress = starknet::contract_address_const::<0x123626789>();

    assert!(staking_contract.owner() == owner, "wrong owner");
    assert!(staking_contract.staking_token() == staking_token_address, "wrong staking token address");
    assert!(staking_contract.rewards_token() == reward_token_address, "wrong reward token address");
}

#[test]
#[should_panic(expected: ('Not authorized owner',))]
fn test_set_reward_duration_should_panic() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract("StakingRewards", staking_token_address, reward_token_address);

    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let duration: u256 = 1800_u256;

    staking_contract.set_rewards_duration(duration);
}

#[test]
fn test_set_rewards_duration() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract("StakingRewards", staking_token_address, reward_token_address);

    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let owner: ContractAddress = starknet::contract_address_const::<0x123626789>();
    let duration: u256 = 1800_u256;
    
    // using a block timestamp cheat to avoid get_block_timestamp() from returning 0: which is default on test environment
    start_cheat_block_timestamp_global(1698152400);

    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    stop_cheat_caller_address(staking_contract_address);

    assert!(staking_contract.duration() == duration, "duration not properly set");

    stop_cheat_block_timestamp_global();
}

#[test]
fn test_notify_reward_amount() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract("StakingRewards", staking_token_address, reward_token_address);

    let staking_token = IERC20Dispatcher { contract_address: staking_token_address };
    let reward_token = IERC20Dispatcher { contract_address: reward_token_address };
    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let owner: ContractAddress = starknet::contract_address_const::<0x123626789>();

    let mint_amount: u256 = 10000_u256 * ONE_E18;
    staking_token.mint(owner, mint_amount);
    reward_token.mint(owner, mint_amount);

    assert!(staking_token.balance_of(owner) == mint_amount, "wrong staking token balance");
    assert!(reward_token.balance_of(owner) == mint_amount, "wrong reward token balance");

    // Approve staking contract to spend reward token
    start_cheat_caller_address(reward_token_address, owner);
    reward_token.approve(staking_contract_address, mint_amount);
    stop_cheat_caller_address(reward_token_address);
    assert!(reward_token.allowance(owner, staking_contract_address) == mint_amount, "reward token approval failed");

    let duration: u256 = 1800_u256;
    
    // using a block timestamp cheat to avoid get_block_timestamp() from returning 0: which is default on test environment
    start_cheat_block_timestamp_global(1698152400);

    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    staking_contract.notify_reward_amount(mint_amount);
    stop_cheat_caller_address(staking_contract_address);

    assert!(staking_contract.duration() == duration, "duration not properly set");
    assert!(staking_contract.finish_at() == staking_contract.return_block_timestamp() + duration, "reward notification failed");

    stop_cheat_block_timestamp_global();
}

#[test]
fn test_stake() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract("StakingRewards", staking_token_address, reward_token_address);

    let staking_token = IERC20Dispatcher { contract_address: staking_token_address };
    let reward_token = IERC20Dispatcher { contract_address: reward_token_address };
    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let owner: ContractAddress = starknet::contract_address_const::<0x123626789>();

    let mint_amount: u256 = 10000_u256 * ONE_E18;
    staking_token.mint(owner, mint_amount);
    reward_token.mint(owner, mint_amount);

    assert!(staking_token.balance_of(owner) == mint_amount, "wrong staking token balance");
    assert!(reward_token.balance_of(owner) == mint_amount, "wrong reward token balance");

    // Approve staking contract to spend reward token
    start_cheat_caller_address(reward_token_address, owner);
    reward_token.approve(staking_contract_address, mint_amount);
    stop_cheat_caller_address(reward_token_address);
    assert!(reward_token.allowance(owner, staking_contract_address) == mint_amount, "reward token approval failed");

    // Approve staking contract to spend staking token.
    start_cheat_caller_address(staking_token_address, owner);
    staking_token.approve(staking_contract_address, mint_amount);
    stop_cheat_caller_address(staking_token_address);
    assert!(staking_token.allowance(owner, staking_contract_address) == mint_amount, "staking token approval failed");

    let duration: u256 = 1800_u256;
    let stake_amount = 100_u256 * ONE_E18;
    
    // using a block timestamp cheat to avoid get_block_timestamp() from returning 0: which is default on test environment
    start_cheat_block_timestamp_global(1698152400);

    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    staking_contract.notify_reward_amount(mint_amount);
    staking_contract.stake(stake_amount);
    stop_cheat_caller_address(staking_contract_address);

    assert!(staking_contract.total_supply() == stake_amount, "stake failed");
    assert!(staking_token.balance_of(staking_contract_address) == stake_amount, "stake didn't work");

    stop_cheat_block_timestamp_global();
}