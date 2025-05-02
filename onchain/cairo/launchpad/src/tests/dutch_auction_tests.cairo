
#[cfg(test)]
mod tests {
    use afk_launchpad::presale_suction::{DutchAuction, IDutchAuctionDispatcher, IDutchAuctionDispatcherTrait}; 
    use starknet::{
        ContractAddress, get_block_timestamp, contract_address_const, EthAddress, EthAddressConst,
        class_hash_const, Felt252TryIntoClassHash, storage_access::storage_base_address_const
    };
    use snforge_std::{
        declare, ContractClassTrait, start_prank, stop_prank, warp, roll, CheatTarget,
        CheatSpan, start_roll, stop_roll, start_warp, stop_warp, spy_events, EventSpy,
        EventFetcher, SpyOn, event_name_hash, fetch_events
    };
    use core::result::ResultTrait;
    use core::option::OptionTrait;
    use core::traits::TryInto;
    use array::ArrayTrait;

    use integer::u256;
    use integer::U256TryIntoFelt252;


    mod mock_erc20 {
        use starknet::ContractAddress;
        #[starknet::interface]
        trait IMockERC20<TContractState> {
            fn initialize(
                ref self: TContractState,
                name: felt252,
                symbol: felt252,
                decimals: u8,
                initial_supply: u256,
                recipient: ContractAddress
            );
            fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
            fn allowance(
                self: @TContractState, owner: ContractAddress, spender: ContractAddress
            ) -> u256;
            fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
            fn transfer_from(
                ref self: TContractState,
                sender: ContractAddress,
                recipient: ContractAddress,
                amount: u256
            ) -> bool;
            fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
            fn mint(ref self: TContractState, recipient: ContractAddress, amount: u256);
        }
    }
    use mock_erc20::IMockERC20Dispatcher;
    use mock_erc20::IMockERC20DispatcherTrait;

    const OWNER: felt252 = 'owner';
    const USER1: felt252 = 'user1';
    const USER2: felt252 = 'user2';

    const ONE_U256: u256 = u256 { low: 1, high: 0 };
    const TEN_POW_18: u256 = u256 { low: 1_000_000_000_000_000_000, high: 0 }; 

    const DAY_SECONDS: u64 = 86400;
    const HOUR_SECONDS: u64 = 3600;


    // Deploys the Mock ERC20 contract
    fn deploy_mock_erc20(initial_recipient: ContractAddress, initial_supply: u256) -> ContractAddress {
        let mut calldata = array![];
        calldata.append('MockToken'); // name
        calldata.append('MTK'); // symbol
        calldata.append(18); // decimals
        calldata.append(initial_supply.low); // initial_supply low
        calldata.append(initial_supply.high); // initial_supply high
        calldata.append(initial_recipient.into()); // recipient

        let contract = declare("MockERC20");
        let (contract_address, _) = contract.deploy(@calldata).expect("Mock ERC20 deploy failed");
        contract_address
    }
}