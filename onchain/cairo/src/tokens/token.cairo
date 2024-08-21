#[starknet::contract]
mod DualVmToken {
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;

    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // #[abi(embed_v0)]
    // impl SafeAllowanceImpl = ERC20Component::SafeAllowanceImpl<ContractState>;
    //     #[abi(embed_v0)]
    // impl SafeAllowanceCamelImpl =
    //     ERC20Component::SafeAllowanceCamelImpl<ContractState>;

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
    fn constructor(ref self: ContractState, fixed_supply: u256, recipient: ContractAddress) {
        let name: ByteArray = "MyToken";
        let symbol: ByteArray = "MTK";
        self.erc20.initializer(name, symbol);
        self.erc20._mint(recipient, fixed_supply);
    }
}
