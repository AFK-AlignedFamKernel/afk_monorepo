use afk_games::interfaces::vault::{IERCVault};
use afk_games::types::defi_types::{TokenPermitted, DepositUser};
use starknet::ContractAddress;


// Used the component for a vault
#[starknet::contract]
mod ERC4626Vault {
    use afk_games::interfaces::vault::{IERCVault};

    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::access::accesscontrol::interface::IAccessControl;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map
    };
    use super::{TokenPermitted, DepositUser};
    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
    const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
    const MAKER_ROLE: felt252 = selector!("MAKER_ROLE");

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Ownable

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableCamelOnlyImpl =
        OwnableComponent::OwnableCamelOnlyImpl<ContractState>;
    impl InternalImplOwnable = OwnableComponent::InternalImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;

    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        token_permitted: Map<ContractAddress, TokenPermitted>,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        owner: ContractAddress,
        initial_supply: u256
    ) {
        self.ownable.initializer(owner);
        self.erc20.initializer(name, symbol);
        self.erc20._mint(owner, initial_supply);
    }


    #[abi(embed_v0)]
    impl VaultImpl of super::IVault<ContractState> {
        //  Mint a coin
        fn mint_coin(ref self: ContractState, amount: u256) {}

        //  Mint a coin
        fn withdraw_coin(ref self: ContractState, amount: u256) {}
    }
}
