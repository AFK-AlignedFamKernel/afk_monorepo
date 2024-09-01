use starknet::ContractAddress;

#[starknet::contract]
pub mod QuestNFT {
    use afk::interfaces::quest::{IQuestNFT};
    use openzeppelin::introspection::src5::SRC5Component;

    use openzeppelin::token::erc721::ERC721Component;
    use openzeppelin::token::erc721::interface::IERC721Metadata;
    use starknet::ContractAddress;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721CamelOnly = ERC721Component::ERC721CamelOnlyImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MetadataCamelOnly =
        ERC721Component::ERC721MetadataCamelOnlyImpl<ContractState>;
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    impl InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        nft_count: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }


    #[constructor]
    fn constructor(ref self: ContractState, name: ByteArray, symbol: ByteArray) {
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
            //TODO set restriction ?
            let mut token_id = self.nft_count.read();

            if token_id < 1 {
                token_id += 1;
            }

            self.erc721._mint(user, token_id);
            self.nft_count.write(token_id + 1);
            token_id
        }
    }
}
