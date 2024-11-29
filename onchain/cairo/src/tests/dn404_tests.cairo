#[cfg(test)]
mod dn404_tests {
    use starknet::{ContractAddress, get_caller_address};
    use snforge_std::{
        declare, ContractClass, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
        stop_cheat_caller_address, spy_events, EventSpy, EventSpyTrait, EventSpyAssertionsTrait, Event
    };
    use crate::tokens::dn404::dn404::{DN404, DN404Options, IDN404Dispatcher, IDN404DispatcherTrait};
    use crate::tokens::dn404::dn404_mirror::{DN404Mirror, IDN404MirrorDispatcher, IDN404MirrorDispatcherTrait};
    use openzeppelin::utils::serde::SerializedAppend;

    // Constants for testing
    fn OWNER() -> ContractAddress {
        starknet::contract_address_const::<1>()
    }

    fn RECIPIENT() -> ContractAddress {
        starknet::contract_address_const::<2>()
    }

    fn declare_dn404() -> @ContractClass {
        declare("DN404").expect('Failed to declare DN404').contract_class()
    }

    fn declare_mirror() -> @ContractClass {
        declare("DN404Mirror").expect('Failed to declare DN404Mirror').contract_class()
    }

    fn deploy_dn404(
        class: ContractClass,
        name: felt252,
        symbol: felt252,
        decimals: u8,
        initial_token_supply: u256,
        initial_supply_owner: ContractAddress,
        mirror: ContractAddress,
        options: DN404Options,
    ) -> ContractAddress {
        let mut calldata = array![];
        calldata.append(name);
        calldata.append(symbol);
        calldata.append(decimals.into());
        calldata.append_serde(initial_token_supply);
        calldata.append(initial_supply_owner.into());
        calldata.append(mirror.into());
        calldata.append_serde(options);
        let (contract_address, _) = class.deploy(@calldata).expect('Failed to deploy DN404');
        contract_address
    }

    fn deploy_mirror(class: ContractClass) -> ContractAddress {
        let mut calldata = array![];
        let deployer = get_caller_address();
        calldata.append(deployer.into());
        let (contract_address, _) = class.deploy(@calldata).expect('Failed to deploy DN404Mirror');
        contract_address
    }

    fn setup() -> (IDN404Dispatcher, IDN404MirrorDispatcher) {
        let dn404_class = declare_dn404();
        let mirror_class = declare_mirror();
        
        let options = DN404Options {
            unit: 1000,
            use_one_indexed: true,
            use_direct_transfers_if_possible: false, // TODO: not supported yet
            add_to_burned_pool: false,
            use_exists_lookup: false,
            use_after_nft_transfers: false,
        };

        let mirror = IDN404MirrorDispatcher { contract_address: deploy_mirror(*mirror_class) };
        let dn404 = IDN404Dispatcher { contract_address: deploy_dn404(*dn404_class, 'DN404', 'DN404', 18, 1000000, OWNER(), mirror.contract_address, options) };
        
        (dn404, mirror)
    }

    #[test]
    fn test_basic_transfer() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 2000;

        // Do ERC20 transfer
        start_cheat_caller_address(dn404.contract_address, OWNER());
        let success = dn404.transfer(RECIPIENT(), transfer_amount);
        assert(success, 'Transfer should succeed');
        stop_cheat_caller_address(dn404.contract_address);

        // Check ERC20 balances
        let recipient_balance = dn404.balance_of(RECIPIENT());
        assert(recipient_balance == transfer_amount, 'Wrong recipient balance');

        // Check NFT balance (assuming 1 NFT per 1000 tokens)
        let nft_balance = mirror.balance_of(RECIPIENT());
        println!("nft balance: {}", nft_balance);
        assert(nft_balance == 2, 'Should have 2 NFTs');

        // Verify NFT ownership
        println!("checking nft ownership 2");
        let nft2_owner = mirror.owner_of(2);
        println!("nft2_owner: {:?}", nft2_owner);
        println!("checking nft ownership 1");
        let nft1_owner = mirror.owner_of(1);
        println!("nft1_owner: {:?}", nft1_owner);
        assert(nft2_owner == RECIPIENT(), 'Wrong NFT 2 owner');
        assert(nft1_owner == RECIPIENT(), 'Wrong NFT 1 owner');
    }

    #[test]
    fn test_skip_nft_transfer() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 2000;

        // Enable skip_nft for recipient
        start_cheat_caller_address(dn404.contract_address, RECIPIENT());
        dn404.set_skip_nft(true);
        assert(dn404.get_skip_nft(RECIPIENT()), 'Skip NFT should be enabled');
        stop_cheat_caller_address(dn404.contract_address);

        // Transfer tokens
        start_cheat_caller_address(dn404.contract_address, OWNER());
        let success = dn404.transfer(RECIPIENT(), transfer_amount);
        assert(success, 'Transfer should succeed');
        stop_cheat_caller_address(dn404.contract_address);

        // Verify ERC20 transfer happened but no NFTs were minted
        let token_balance = dn404.balance_of(RECIPIENT());
        let nft_balance = mirror.balance_of(RECIPIENT());
        assert(token_balance == transfer_amount, 'Wrong token balance');
        assert(nft_balance == 0, 'Should have no NFTs');
    }

    #[test]
    fn test_nft_transfer_events() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 1000;

        // Spy on Transfer events
        let mut spy = spy_events();

        // Do transfer
        start_cheat_caller_address(dn404.contract_address, OWNER());
        dn404.transfer(RECIPIENT(), transfer_amount);
        stop_cheat_caller_address(dn404.contract_address);

        // Verify NFT transfer event was emitted
        spy.assert_emitted(@array![
            (
                mirror.contract_address,
                DN404Mirror::Event::Transfer(
                    DN404Mirror::TransferEvent { from: OWNER(), to: RECIPIENT(), id: 1 }
                )
            )
        ]);
    }

    #[test]
    #[should_panic(expected: ('TokenDoesNotExist',))]
    fn test_invalid_nft_query() {
        let (_, mirror) = setup();
        
        // Try to query owner of non-existent token
        mirror.owner_of(999);
    }
}
