use afk_launchpad::launchpad::errors;
use afk_launchpad::launchpad::math::PercentageMath;
use afk_launchpad::launchpad::utils::{
    get_initial_tick_from_starting_price, get_next_tick_bounds, sort_tokens, unique_count,
};
use afk_launchpad::tokens::erc20::{ERC20, IERC20Dispatcher, IERC20DispatcherTrait};
use afk_launchpad::tokens::memecoin::{IMemecoinDispatcher, IMemecoinDispatcherTrait, Memecoin};
use afk_launchpad::types::launchpad_types::{
    ADMIN_ROLE, BondingType, BuyToken, CallbackData, CreateLaunch, CreateToken, EkuboLP,
    EkuboLaunchParameters, EkuboPoolParameters, LaunchCallback, LaunchParameters, LaunchUpdated,
    LiquidityCanBeAdded, LiquidityCreated, LiquidityType, MINTER_ROLE, MetadataCoinAdded,
    MetadataLaunch, SellToken, SetJediswapNFTRouterV2, SetJediswapV2Factory, SharesTokenUser,
    StoredName, SupportedExchanges, Token, TokenClaimed, TokenLaunch, TokenQuoteBuyCoin,
};
use ekubo::types::bounds::Bounds;
use ekubo::types::i129::i129;
use starknet::storage_access::StorageBaseAddress;
use starknet::{ContractAddress, contract_address_const, get_block_timestamp, get_caller_address};

const MAX_SUPPLY_PERCENTAGE_TEAM_ALLOCATION: u16 = 1_000; // 10%
const MAX_HOLDERS_LAUNCH: u8 = 10;

/// Checks the launch parameters and calculates the team allocation.
///
/// This function checks that the memecoin and quote addresses are valid,
/// that the caller is the owner of the memecoin,
/// that the memecoin has not been launched,
/// and that the lengths of the initial holders and their amounts are equal and do not exceed the
/// maximum allowed.
/// It then calculates the maximum team allocation as a percentage of the total supply,
/// and iteratively adds the amounts of the initial holders to the team allocation,
/// ensuring that the total allocation does not exceed the maximum.
/// It finally returns the total team allocation and the count of unique initial holders.
///
/// # Arguments
///
/// * `self` - A reference to the ContractState struct.
/// * `launch_parameters` - The parameters for the token launch.
///
/// # Returns
///
/// * `(u256, u8)` - The total amount of memecoin allocated to the team and the count of unique
/// initial holders.
///
/// # Panics
///
/// * If the memecoin address is not a memecoin.
/// * If the quote address is a memecoin.
/// * If the caller is not the owner of the memecoin.
/// * If the memecoin has been launched.
/// * If the lengths of the initial holders and their amounts are not equal.
/// * If the number of initial holders exceeds the maximum allowed.
/// * If the total team allocation exceeds the maximum allowed.
///
pub fn check_common_launch_parameters(launch_parameters: LaunchParameters) -> (u256, u8) {
    let LaunchParameters {
        memecoin_address,
        transfer_restriction_delay,
        max_percentage_buy_launch,
        quote_address,
        initial_holders,
        initial_holders_amounts,
    } = launch_parameters;
    let memecoin = IMemecoinDispatcher { contract_address: memecoin_address };
    let erc20 = IERC20Dispatcher { contract_address: memecoin_address };

    // TODO fix owner call memecoin interface
    // assert(get_caller_address() == memecoin.owner(), errors::CALLER_NOT_OWNER);

    // assert(self.is_memecoin(memecoin_address), errors::NOT_UNRUGGABLE);
    // assert(!self.is_memecoin(quote_address), errors::QUOTE_TOKEN_IS_MEMECOIN);
    assert(!memecoin.is_launched(), errors::ALREADY_LAUNCHED);
    assert(initial_holders.len() == initial_holders_amounts.len(), errors::ARRAYS_LEN_DIF);
    assert(initial_holders.len() <= MAX_HOLDERS_LAUNCH.into(), errors::MAX_HOLDERS_REACHED);

    let initial_supply = erc20.total_supply();

    // Check that the sum of the amounts of initial holders does not exceed the max allocatable
    // supply for a team.
    let max_team_allocation = initial_supply
        .percent_mul(MAX_SUPPLY_PERCENTAGE_TEAM_ALLOCATION.into());
    let mut team_allocation: u256 = 0;
    let mut i: usize = 0;
    loop {
        if i == initial_holders.len() {
            break;
        }

        let address = *initial_holders.at(i);
        let amount = *initial_holders_amounts.at(i);

        team_allocation += amount;
        assert(team_allocation <= max_team_allocation, errors::MAX_TEAM_ALLOCATION_REACHED);
        i += 1;
    }

    (team_allocation, unique_count(initial_holders).try_into().unwrap())
}

pub fn distribute_team_alloc(
    // memecoin: IMemecoinDispatcher,
    memecoin: IERC20Dispatcher,
    mut initial_holders: Span<ContractAddress>,
    mut initial_holders_amounts: Span<u256>,
) {
    loop {
        match initial_holders.pop_front() {
            Option::Some(holder) => {
                match initial_holders_amounts.pop_front() {
                    Option::Some(amount) => { memecoin.transfer(*holder, *amount); },
                    // Should never happen as the lengths of the spans are equal.
                    Option::None => { break; },
                }
            },
            Option::None => { break; },
        }
    }
}
