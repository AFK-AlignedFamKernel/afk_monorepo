#[cfg(test)]
mod dn404_presets_test {
    use core::num::traits::Zero;
    use crate::tokens::dn404::dn404_component::{
        DN404Options, IDN404Dispatcher, IDN404DispatcherTrait,
    };
    use crate::tokens::dn404::dn404_mirror_component::{
        DN404MirrorComponent, IDN404MirrorDispatcher, IDN404MirrorDispatcherTrait,
    };
    use crate::tokens::dn404::dn404_mirror_preset::DN404MirrorPreset;
    use crate::tokens::dn404::dn404_preset::DN404Preset;
    use openzeppelin::utils::serde::SerializedAppend;
    use snforge_std::{
        ContractClass, ContractClassTrait, DeclareResultTrait, Event, EventSpy,
        EventSpyAssertionsTrait, EventSpyTrait, declare, spy_events, start_cheat_caller_address,
        stop_cheat_caller_address,
    };
    use starknet::{ContractAddress, get_caller_address};

    // Constants for testing

    fn OWNER() -> ContractAddress {
        starknet::contract_address_const::<1>()
    }

    fn SENDER() -> ContractAddress {
        starknet::contract_address_const::<2>()
    }

    fn RECIPIENT() -> ContractAddress {
        starknet::contract_address_const::<3>()
    }

    fn declare_dn404() -> @ContractClass {
        declare("DN404Preset").expect('Failed to declare DN404').contract_class()
    }

    fn declare_mirror() -> @ContractClass {
        declare("DN404MirrorPreset").expect('Failed to declare DN404Mirror').contract_class()
    }

    fn deploy_dn404(
        class: ContractClass,
        name: ByteArray,
        symbol: ByteArray,
        base_uri: ByteArray,
        decimals: u8,
        initial_token_supply: u256,
        initial_supply_owner: ContractAddress,
        mirror: ContractAddress,
        options: DN404Options,
    ) -> ContractAddress {
        let mut calldata = array![];
        calldata.append_serde(name);
        calldata.append_serde(symbol);
        calldata.append_serde(base_uri);
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
            use_direct_transfers_if_possible: true,
            add_to_burned_pool: true,
            use_exists_lookup: false,
            use_after_nft_transfers: false,
        };

        let mirror = IDN404MirrorDispatcher { contract_address: deploy_mirror(*mirror_class) };
        let dn404 = IDN404Dispatcher {
            contract_address: deploy_dn404(
                *dn404_class,
                "DN404",
                "DN404",
                "https://dn404.com",
                18,
                1000000,
                OWNER(),
                mirror.contract_address,
                options,
            ),
        };

        (dn404, mirror)
    }

    #[test]
    fn test_basic_transfer() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 2000;

        // Do ERC20 transfer
        start_cheat_caller_address(dn404.contract_address, OWNER());
        let success = dn404.transfer(RECIPIENT(), transfer_amount);
        assert!(success, "Transfer should succeed");
        stop_cheat_caller_address(dn404.contract_address);

        // Check ERC20 balances
        let recipient_balance = dn404.balance_of(RECIPIENT());
        assert!(recipient_balance == transfer_amount, "Wrong recipient balance");

        // Check NFT balance (assuming 1 NFT per 1000 tokens)
        let nft_balance = mirror.balance_of(RECIPIENT());
        assert!(nft_balance == 2, "Should have 2 NFTs");

        // Verify NFT ownership
        let nft1_owner = mirror.owner_of(1);
        let nft2_owner = mirror.owner_of(2);
        assert!(nft1_owner == RECIPIENT(), "Wrong NFT 1 owner");
        assert!(nft2_owner == RECIPIENT(), "Wrong NFT 2 owner");
    }

    #[test]
    fn test_token_uri() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 10000;

        // Do ERC20 transfer to create several NFTs
        start_cheat_caller_address(dn404.contract_address, OWNER());
        let success = dn404.transfer(RECIPIENT(), transfer_amount);
        assert!(success, "Transfer should succeed");
        stop_cheat_caller_address(dn404.contract_address);

        // Check token URI for random NFT
        let token_uri = mirror.token_uri(5);
        assert!(token_uri == "https://dn404.com/5", "Wrong token URI");
    }

    #[test]
    fn test_skip_nft_transfer() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 2000;

        // Enable skip_nft for recipient
        start_cheat_caller_address(dn404.contract_address, RECIPIENT());
        dn404.set_skip_nft(true);
        assert!(dn404.get_skip_nft(RECIPIENT()), "Skip NFT should be enabled");
        stop_cheat_caller_address(dn404.contract_address);

        // Transfer tokens
        start_cheat_caller_address(dn404.contract_address, OWNER());
        let success = dn404.transfer(RECIPIENT(), transfer_amount);
        assert!(success, "Transfer should succeed");
        stop_cheat_caller_address(dn404.contract_address);

        // Verify ERC20 transfer happened but no NFTs were minted
        let token_balance = dn404.balance_of(RECIPIENT());
        let nft_balance = mirror.balance_of(RECIPIENT());
        assert!(token_balance == transfer_amount, "Wrong token balance");
        assert!(nft_balance == 0, "Should have no NFTs");
    }

    #[test]
    fn test_nft_transfer_events() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 1000;

        // Prepare (send tokens to sender)
        start_cheat_caller_address(dn404.contract_address, OWNER());
        dn404.transfer(SENDER(), transfer_amount);
        stop_cheat_caller_address(dn404.contract_address);

        // Spy on Transfer events
        let mut spy = spy_events();

        // Do transfer
        start_cheat_caller_address(dn404.contract_address, SENDER());
        dn404.transfer(RECIPIENT(), transfer_amount);
        stop_cheat_caller_address(dn404.contract_address);

        // Verify NFT transfer event was emitted
        spy
            .assert_emitted(
                @array![
                    (
                        mirror.contract_address,
                        DN404MirrorPreset::Event::DN404MirrorEvent(
                            DN404MirrorComponent::Event::Transfer(
                                DN404MirrorComponent::TransferEvent {
                                    from: SENDER(), to: RECIPIENT(), id: 1,
                                },
                            ),
                        ),
                    ),
                ],
            );
    }

    #[test]
    #[should_panic(expected: 'TokenDoesNotExist')]
    fn test_invalid_nft_query() {
        let (_, mirror) = setup();

        // Try to query owner of non-existent token
        mirror.owner_of(999);
    }

    #[test]
    fn test_burned_pool_reuse() {
        let (dn404, mirror) = setup();
        let transfer_amount: u256 = 2000; // Will create 2 NFTs

        // First transfer to recipient
        start_cheat_caller_address(dn404.contract_address, OWNER());
        let success = dn404.transfer(RECIPIENT(), transfer_amount);
        assert!(success, "Transfer should succeed");
        stop_cheat_caller_address(dn404.contract_address);

        // Verify initial NFT state
        let nft_balance = mirror.balance_of(RECIPIENT());
        assert!(nft_balance == 2, "Should have 2 NFTs");

        // Store original token IDs
        let token1_id = 1;
        let token2_id = 2;
        assert!(mirror.owner_of(token1_id) == RECIPIENT(), "Wrong initial NFT 1 owner");
        assert!(mirror.owner_of(token2_id) == RECIPIENT(), "Wrong initial NFT 2 owner");

        // Start spying on events before burning
        let mut spy = spy_events();

        // Transfer back to OWNER (causes NFTs to be burned since OWNER has skip_nft=true)
        start_cheat_caller_address(dn404.contract_address, RECIPIENT());
        let success = dn404.transfer(OWNER(), transfer_amount);
        assert!(success, "Transfer back should succeed");
        stop_cheat_caller_address(dn404.contract_address);

        // Verify burn events were emitted
        spy
            .assert_emitted(
                @array![
                    (
                        mirror.contract_address,
                        DN404MirrorPreset::Event::DN404MirrorEvent(
                            DN404MirrorComponent::Event::Transfer(
                                DN404MirrorComponent::TransferEvent {
                                    from: RECIPIENT(), to: Zero::zero(), id: token1_id,
                                },
                            ),
                        ),
                    ),
                    (
                        mirror.contract_address,
                        DN404MirrorPreset::Event::DN404MirrorEvent(
                            DN404MirrorComponent::Event::Transfer(
                                DN404MirrorComponent::TransferEvent {
                                    from: RECIPIENT(), to: Zero::zero(), id: token2_id,
                                },
                            ),
                        ),
                    ),
                ],
            );

        // Verify NFTs were burned
        let recipient_nft_balance = mirror.balance_of(RECIPIENT());
        assert!(recipient_nft_balance == 0, "Should have no NFTs after burn");

        // Reset spy for next transfer
        spy = spy_events();

        // Transfer again to a new recipient - should reuse the burned token IDs
        start_cheat_caller_address(dn404.contract_address, OWNER());
        let success = dn404.transfer(SENDER(), transfer_amount);
        assert!(success, "Transfer to new recipient should succeed");
        stop_cheat_caller_address(dn404.contract_address);

        // Verify mint events reuse the same token IDs
        spy
            .assert_emitted(
                @array![
                    (
                        mirror.contract_address,
                        DN404MirrorPreset::Event::DN404MirrorEvent(
                            DN404MirrorComponent::Event::Transfer(
                                DN404MirrorComponent::TransferEvent {
                                    from: Zero::zero(), to: SENDER(), id: token1_id,
                                },
                            ),
                        ),
                    ),
                    (
                        mirror.contract_address,
                        DN404MirrorPreset::Event::DN404MirrorEvent(
                            DN404MirrorComponent::Event::Transfer(
                                DN404MirrorComponent::TransferEvent {
                                    from: Zero::zero(), to: SENDER(), id: token2_id,
                                },
                            ),
                        ),
                    ),
                ],
            );

        // Verify the same token IDs were reused
        let sender_nft_balance = mirror.balance_of(SENDER());
        assert!(sender_nft_balance == 2, "New recipient should have 2 NFTs");
        assert!(mirror.owner_of(token1_id) == SENDER(), "Token 1 should be reused");
        assert!(mirror.owner_of(token2_id) == SENDER(), "Token 2 should be reused");
    }

    #[test]
    fn test_approval_and_transfer() {
        let (dn404, _) = setup();

        // Initial transfer to SENDER
        start_cheat_caller_address(dn404.contract_address, OWNER());
        dn404.transfer(SENDER(), 1000);
        stop_cheat_caller_address(dn404.contract_address);

        // Approve RECIPIENT to spend tokens
        start_cheat_caller_address(dn404.contract_address, SENDER());
        dn404.approve(RECIPIENT(), 500);
        stop_cheat_caller_address(dn404.contract_address);

        // Check allowance
        let allowance = dn404.allowance(SENDER(), RECIPIENT());
        assert!(allowance == 500, "Wrong allowance");

        // Transfer using transferFrom
        start_cheat_caller_address(dn404.contract_address, RECIPIENT());
        let success = dn404.transfer_from(SENDER(), RECIPIENT(), 500);
        assert!(success, "TransferFrom should succeed");
        stop_cheat_caller_address(dn404.contract_address);
    }

    #[test]
    #[should_panic(expected: 'InsufficientAllowance')]
    fn test_unauthorized_transfer() {
        let (dn404, _) = setup();

        // Initial transfer to SENDER
        start_cheat_caller_address(dn404.contract_address, OWNER());
        dn404.transfer(SENDER(), 1000);
        stop_cheat_caller_address(dn404.contract_address);

        // Try to transfer without approval (should fail)
        start_cheat_caller_address(dn404.contract_address, RECIPIENT());
        dn404.transfer_from(SENDER(), RECIPIENT(), 500);
        stop_cheat_caller_address(dn404.contract_address);
    }

    #[test]
    fn test_nft_approval_operations() {
        let (dn404, mirror) = setup();

        // Transfer tokens to create NFT
        start_cheat_caller_address(dn404.contract_address, OWNER());
        dn404.transfer(SENDER(), 1000);
        stop_cheat_caller_address(dn404.contract_address);

        // check NFT owner
        let nft_owner = mirror.owner_of(1);
        assert!(nft_owner == SENDER(), "NFT owner should be SENDER");

        // Approve NFT through mirror contract
        start_cheat_caller_address(mirror.contract_address, SENDER());
        mirror.approve(RECIPIENT(), 1);
        stop_cheat_caller_address(mirror.contract_address);

        // Check NFT approval
        let approved = mirror.get_approved(1);
        assert!(approved == RECIPIENT(), "Wrong NFT approval");

        // Try to transfer NFT using the approval
        start_cheat_caller_address(mirror.contract_address, RECIPIENT());
        mirror.transfer_from(SENDER(), RECIPIENT(), 1);
        stop_cheat_caller_address(mirror.contract_address);

        // Verify the transfer was successful
        let new_owner = mirror.owner_of(1);
        assert!(new_owner == RECIPIENT(), "NFT transfer failed");

        // Verify token balances were updated
        let sender_balance = dn404.balance_of(SENDER());
        let recipient_balance = dn404.balance_of(RECIPIENT());
        assert!(sender_balance == 0, "Wrong sender balance after transfer");
        assert!(recipient_balance == 1000, "Wrong recipient balance after transfer");
    }
}
