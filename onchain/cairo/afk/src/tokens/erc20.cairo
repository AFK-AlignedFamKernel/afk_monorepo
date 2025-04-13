use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn totalSupply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn balanceOf(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn increase_allowance(ref self: TContractState, spender: ContractAddress, added_value: u256);
    fn decrease_allowance(
        ref self: TContractState, spender: ContractAddress, subtracted_value: u256,
    );
}


#[starknet::contract]
pub mod ERC20 {
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, contract_address_const, get_caller_address};
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
  
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress
    ) {

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }

    // #[constructor]
    // fn constructor(
    //     ref self: ContractState,
    //     name: felt252,
    //     symbol: felt252,
    //     initial_supply: u256,
    //     recipient: ContractAddress,
    //     decimals: u8,
    // ) {
    //     self.name.write(name);
    //     self.symbol.write(symbol);
    //     self.decimals.write(decimals);
    //     assert(!recipient.is_zero(), 'ERC20: mint to the 0 address');
    //     self.total_supply.write(initial_supply);
    //     self.balances.entry(recipient).write(initial_supply);
    //     self
    //         .emit(
    //             Event::Transfer(
    //                 Transfer {
    //                     from: contract_address_const::<0>(), to: recipient, value: initial_supply,
    //                 },
    //             ),
    //         );
    // }

}

