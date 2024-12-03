use afk::staking::interfaces::{
    IERC20Dispatcher, IERC20DispatcherTrait, IStakingDispatcher, IStakingDispatcherTrait
};
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
    stop_cheat_caller_address, start_cheat_block_timestamp_global, stop_cheat_block_timestamp_global
};
use starknet::ContractAddress;

const ONE_E18: u256 = 1000000000000000000_u256;

fn deploy_token(name: ByteArray) -> ContractAddress {
    let contract = declare("MockToken").unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

fn deploy_staking_contract(
    name: ByteArray, staking_token: ContractAddress, reward_token: ContractAddress
) -> ContractAddress {
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
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let owner: ContractAddress = starknet::contract_address_const::<0x123626789>();

    assert!(staking_contract.owner() == owner, "wrong owner");
    assert!(
        staking_contract.staking_token() == staking_token_address, "wrong staking token address"
    );
    assert!(staking_contract.rewards_token() == reward_token_address, "wrong reward token address");
}

#[test]
#[should_panic(expected: ('Not authorized owner',))]
fn test_set_reward_duration_should_panic() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let duration: u256 = 1800_u256;

    staking_contract.set_rewards_duration(duration);
}

#[test]
fn test_set_rewards_duration() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

    let staking_contract = IStakingDispatcher { contract_address: staking_contract_address };

    let owner: ContractAddress = starknet::contract_address_const::<0x123626789>();
    let duration: u256 = 1800_u256;

    // using a block timestamp cheat to avoid get_block_timestamp() from returning 0: which is
    // default on test environment
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
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

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
    assert!(
        reward_token.allowance(owner, staking_contract_address) == mint_amount,
        "reward token approval failed"
    );

    let duration: u256 = 1800_u256;

    // using a block timestamp cheat to avoid get_block_timestamp() from returning 0: which is
    // default on test environment
    start_cheat_block_timestamp_global(1698152400);

    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    staking_contract.notify_reward_amount(mint_amount);
    stop_cheat_caller_address(staking_contract_address);

    assert!(staking_contract.duration() == duration, "duration not properly set");
    assert!(
        staking_contract.finish_at() == staking_contract.return_block_timestamp() + duration,
        "reward notification failed"
    );

    stop_cheat_block_timestamp_global();
}

#[test]
fn test_stake() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

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
    assert!(
        reward_token.allowance(owner, staking_contract_address) == mint_amount,
        "reward token approval failed"
    );

    // Approve staking contract to spend staking token.
    start_cheat_caller_address(staking_token_address, owner);
    staking_token.approve(staking_contract_address, mint_amount);
    stop_cheat_caller_address(staking_token_address);
    assert!(
        staking_token.allowance(owner, staking_contract_address) == mint_amount,
        "staking token approval failed"
    );

    let duration: u256 = 1800_u256;
    let stake_amount = 100_u256 * ONE_E18;

    // using a block timestamp cheat to avoid get_block_timestamp() from returning 0: which is
    // default on test environment
    start_cheat_block_timestamp_global(1698152400);

    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    staking_contract.notify_reward_amount(mint_amount);
    staking_contract.stake(stake_amount);
    stop_cheat_caller_address(staking_contract_address);

    assert!(staking_contract.total_supply() == stake_amount, "stake failed");
    assert!(
        staking_token.balance_of(staking_contract_address) == stake_amount, "stake didn't work"
    );

    stop_cheat_block_timestamp_global();
}

#[test]
fn test_rewards_earned() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

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
    assert!(
        reward_token.allowance(owner, staking_contract_address) == mint_amount,
        "reward token approval failed"
    );

    // Approve staking contract to spend staking token.
    start_cheat_caller_address(staking_token_address, owner);
    staking_token.approve(staking_contract_address, mint_amount);
    stop_cheat_caller_address(staking_token_address);
    assert!(
        staking_token.allowance(owner, staking_contract_address) == mint_amount,
        "staking token approval failed"
    );

    let duration: u256 = 1800_u256;
    let stake_amount = 100_u256 * ONE_E18;

    // using a block timestamp cheat to prevent get_block_timestamp() from returning 0: which is
    // default on test environment
    start_cheat_block_timestamp_global(1698152400);
    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    staking_contract.notify_reward_amount(mint_amount);
    staking_contract.stake(stake_amount);
    stop_cheat_caller_address(staking_contract_address);
    stop_cheat_block_timestamp_global();

    // Using a 10mins increased block_timestamp to stake again
    start_cheat_block_timestamp_global(1698153000);
    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.stake(stake_amount);
    stop_cheat_caller_address(staking_contract_address);

    assert!(staking_contract.total_supply() == stake_amount + stake_amount, "stake failed");
    assert!(
        staking_token.balance_of(staking_contract_address) == stake_amount + stake_amount,
        "stake didn't work"
    );

    // testing assert that user earnings increased
    assert!(staking_contract.rewards_earned(owner) > 0, "earnings didn't increase");
    assert!(staking_contract.rewards(owner) > 0, "rewards didn't increase");

    assert!(staking_contract.reward_per_token_stored() > 0, "wrong reward_per_token_stored");
    assert!(
        staking_contract.user_reward_per_token_paid(owner) > 0, "wrong user_reward_per_token_paid"
    );

    stop_cheat_block_timestamp_global();
}

#[test]
fn test_claim_reward() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

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
    assert!(
        reward_token.allowance(owner, staking_contract_address) == mint_amount,
        "reward token approval failed"
    );

    // Approve staking contract to spend staking token.
    start_cheat_caller_address(staking_token_address, owner);
    staking_token.approve(staking_contract_address, mint_amount);
    stop_cheat_caller_address(staking_token_address);
    assert!(
        staking_token.allowance(owner, staking_contract_address) == mint_amount,
        "staking token approval failed"
    );

    let duration: u256 = 1800_u256;
    let stake_amount = 100_u256 * ONE_E18;

    // using a block timestamp cheat to prevent get_block_timestamp() from returning 0: which is
    // default on test environment
    start_cheat_block_timestamp_global(1698152400);
    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    staking_contract.notify_reward_amount(mint_amount);
    staking_contract.stake(stake_amount);
    stop_cheat_caller_address(staking_contract_address);
    stop_cheat_block_timestamp_global();
    assert!(reward_token.balance_of(owner) == 0, "reward notification failed");

    // Using a 10mins increased block_timestamp to stake again
    start_cheat_block_timestamp_global(1698153000);
    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.stake(stake_amount);
    stop_cheat_caller_address(staking_contract_address);

    assert!(staking_contract.total_supply() == stake_amount + stake_amount, "stake failed");
    assert!(
        staking_token.balance_of(staking_contract_address) == stake_amount + stake_amount,
        "stake didn't work"
    );

    // testing assert that user earnings increased
    assert!(staking_contract.rewards_earned(owner) > 0, "earnings didn't increase");
    assert!(staking_contract.rewards(owner) > 0, "rewards didn't increase");
    assert!(staking_contract.reward_per_token_stored() > 0, "wrong reward_per_token_stored");
    assert!(
        staking_contract.user_reward_per_token_paid(owner) > 0, "wrong user_reward_per_token_paid"
    );

    // Testing user claiming rewards
    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.claim_reward();
    stop_cheat_caller_address(staking_contract_address);
    assert!(reward_token.balance_of(owner) > 0, "reward claiming failed");

    stop_cheat_block_timestamp_global();
}

#[test]
fn test_withdraw() {
    let staking_token_address = deploy_token("StakingToken");
    let reward_token_address = deploy_token("RewardToken");
    let staking_contract_address = deploy_staking_contract(
        "StakingRewards", staking_token_address, reward_token_address
    );

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
    assert!(
        reward_token.allowance(owner, staking_contract_address) == mint_amount,
        "reward token approval failed"
    );

    // Approve staking contract to spend staking token.
    start_cheat_caller_address(staking_token_address, owner);
    staking_token.approve(staking_contract_address, mint_amount);
    stop_cheat_caller_address(staking_token_address);
    assert!(
        staking_token.allowance(owner, staking_contract_address) == mint_amount,
        "staking token approval failed"
    );

    let duration: u256 = 1800_u256;
    let stake_amount = 100_u256 * ONE_E18;

    // using a block timestamp cheat to avoid get_block_timestamp() from returning 0: which is
    // default on test environment
    start_cheat_block_timestamp_global(1698152400);

    // Mocking owner address
    // Stake and assert that staking contract balance increased and owner's balance decreased
    start_cheat_caller_address(staking_contract_address, owner);
    staking_contract.set_rewards_duration(duration);
    staking_contract.notify_reward_amount(mint_amount);
    staking_contract.stake(stake_amount);

    let balance_after_stake = staking_token.balance_of(owner);

    assert!(staking_contract.total_supply() == stake_amount, "stake failed");
    assert!(
        staking_token.balance_of(staking_contract_address) == stake_amount, "stake didn't work"
    );
    assert!(balance_after_stake == mint_amount - stake_amount, "stake didn't work");

    // Withdraw from staking contract and assert that staking contract balance decreased and owner's
    // balance increased
    staking_contract.withdraw(stake_amount);
    assert!(staking_contract.total_supply() == 0, "withdraw failed");
    assert!(staking_token.balance_of(staking_contract_address) == 0, "withdraw didn't work");
    assert!(
        staking_token.balance_of(owner) == balance_after_stake + stake_amount,
        "wrong user balance after withdraw"
    );

    stop_cheat_caller_address(staking_contract_address);
    stop_cheat_block_timestamp_global();
}
