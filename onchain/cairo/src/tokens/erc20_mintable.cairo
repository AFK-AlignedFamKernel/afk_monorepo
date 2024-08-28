use afk::interfaces::erc20_mintable::{IERC20Mintable};
use starknet::ContractAddress;

#[starknet::contract]
pub mod ERC20Mintable {
    use openzeppelin::access::accesscontrol::interface::IAccessControl;
    use openzeppelin::access::accesscontrol::{AccessControlComponent};
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
    const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");
    const MAKER_ROLE: felt252 = selector!("MAKER_ROLE");

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);


    // Ownable

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableCamelOnlyImpl =
        OwnableComponent::OwnableCamelOnlyImpl<ContractState>;
    impl InternalImplOwnable = OwnableComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;

    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;


    // #[abi(embed_v0)]
    // impl SafeAllowanceCamelImpl =
    //     ERC20Component::SafeAllowanceCamelImpl<ContractState>;
    // impl InternalImpl = ERC20Component::InternalImpl<ContractState>;
    // #[abi(embed_v0)]
    // impl SafeAllowanceImpl = ERC20Component::SafeAllowanceImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
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
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, owner);
    }

    // #[external(v0)]
    // fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
    //     self.ownable.assert_only_owner();
    //     self.erc20._mint(recipient, amount);
    // }

    #[abi(embed_v0)]
    impl IERC20MintableImpl of super::IERC20Mintable<ContractState> {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.erc20._mint(recipient, amount);
        }

        fn burn(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.erc20._burn(recipient, amount);
        }
        fn set_role(
            ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool
        ) {
            self._set_role(recipient, role, is_enable);
        }
    }

    // Admin
    //Add OPERATOR role to the Vault escrow
    // #[external(v0)]
    #[generate_trait]
    impl PrivateImpl of PrivateTrait {
        fn _set_role(
            ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert!(
                role == ADMIN_ROLE
                    || role == MINTER_ROLE // Think and Add others roles needed on the protocol
                    ,
                "role not enable"
            );
            if is_enable {
                self.accesscontrol._grant_role(role, recipient);
            } else {
                self.accesscontrol._revoke_role(role, recipient);
            }
        }
    }
}
