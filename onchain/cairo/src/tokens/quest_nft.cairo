use starknet::ContractAddress;

#[starknet::contract]
pub mod QuestNFT {
    use afk::interfaces::quest::{IQuestNFT};
    use openzeppelin::introspection::src5::SRC5Component;

    use openzeppelin::access::accesscontrol::interface::IAccessControl;
    use openzeppelin::access::accesscontrol::{AccessControlComponent};
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc721::ERC721Component;
    use openzeppelin::token::erc721::interface::IERC721Metadata;
    use starknet::ContractAddress;

    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
    const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableCamelOnlyImpl = OwnableComponent::OwnableCamelOnlyImpl<ContractState>;
    
    #[abi(embed_v0)]
    impl AccessControlImpl =
    AccessControlComponent::AccessControlImpl<ContractState>;

    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721CamelOnly = ERC721Component::ERC721CamelOnlyImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MetadataCamelOnly =
    ERC721Component::ERC721MetadataCamelOnlyImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    
    impl InternalImplOwnable = OwnableComponent::InternalImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;
    impl InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        nft_count: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
    }


    #[constructor]
    fn constructor(ref self: ContractState, name: ByteArray, symbol: ByteArray, owner: ContractAddress) {
        self.ownable.initializer(owner);
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, owner);
        let base_uri = "";
        self.erc721.initializer(name, symbol, base_uri);
    }

    #[abi(embed_v0)]
    impl ERC721Metadata of IERC721Metadata<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc721.ERC721_name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc721.ERC721_symbol.read()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            self.erc721._base_uri()
        }
    }

    impl ERC721HooksEmptyImpl<ContractState> of ERC721Component::ERC721HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress
        ) {}

        fn after_update(
            ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress
        ) {}
    }


    #[abi(embed_v0)]
    pub impl QuestNFT of IQuestNFT<ContractState> {
        fn mint(ref self: ContractState, user: ContractAddress) -> u256 {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            let mut token_id = self.nft_count.read();

            if token_id < 1 {
                token_id += 1;
            }

            self.erc721._mint(user, token_id);
            self.nft_count.write(token_id + 1);
            token_id
        }

        fn set_role(
            ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool
        ) {
            self._set_role(recipient, role, is_enable);
        }
    }

      #[generate_trait]
    impl PrivateImpl of PrivateTrait {
        fn _set_role(
            ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert!(
                role == ADMIN_ROLE
                    || role == MINTER_ROLE
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
