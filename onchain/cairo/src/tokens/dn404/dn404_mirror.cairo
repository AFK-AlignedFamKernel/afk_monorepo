use starknet::ContractAddress;

pub use DN404Mirror::TransferEvent as NftTransferEvent;

#[starknet::interface]
pub trait IDN404Mirror<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn token_uri(self: @TContractState, id: u256) -> felt252;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, nft_owner: ContractAddress) -> u256;
    fn owner_of(self: @TContractState, id: u256) -> ContractAddress;
    fn owner_at(self: @TContractState, id: u256) -> ContractAddress;
    fn approve(ref self: TContractState, spender: ContractAddress, id: u256);
    fn get_approved(self: @TContractState, id: u256) -> ContractAddress;
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
    fn is_approved_for_all(
        self: @TContractState, 
        nft_owner: ContractAddress, 
        operator: ContractAddress
    ) -> bool;
    fn transfer_from(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256
    );

    fn safe_transfer_from(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256
    );

    fn safe_transfer_from_with_data(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256, 
        data: felt252
    );

    // TODO use OZ SRC5
    fn supports_interface(self: @TContractState, interface_id: felt252) -> bool;
    // TODO use OZ Ownable
    fn owner(self: @TContractState) -> ContractAddress;
    fn pull_owner(ref self: TContractState) -> bool;
    fn base_erc20(self: @TContractState) -> ContractAddress;


    // Methods assumed by DN404 Fallback

    fn log_transfer(ref self: TContractState, logs: Array<DN404Mirror::TransferEvent>);

    fn log_direct_transfer(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        direct_logs: Span<felt252>
    );

    fn link_mirror_contract(ref self: TContractState, deployer: ContractAddress);
}

#[starknet::contract]
pub mod DN404Mirror {

    use starknet::{ContractAddress, get_caller_address};
    use crate::tokens::dn404::dn404::{IDN404Dispatcher, IDN404DispatcherTrait};
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        // Address of the ERC20 base contract.
        base_erc20: ContractAddress,
        // The deployer, if provided. If non-zero, the initialization of the
        // ERC20 <-> ERC721 link can only be done by the deployer via the ERC20 base contract.
        deployer: ContractAddress,
        // The owner of the ERC20 base contract. For marketplace signaling.
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event, Serde)]
    pub struct TransferEvent {
        pub from: ContractAddress,
        pub to: ContractAddress,
        pub id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ApprovalEvent {
        owner: ContractAddress,
        account: ContractAddress,
        id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ApprovalForAllEvent {
        owner: ContractAddress,
        operator: ContractAddress,
        is_approved: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferredEvent {
        old_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Transfer: TransferEvent,
        Approval: ApprovalEvent,
        ApprovalForAll: ApprovalForAllEvent,
        OwnershipTransferred: OwnershipTransferredEvent,
    }

    #[constructor]
    fn constructor(ref self: ContractState, deployer: ContractAddress) {
        self.deployer.write(deployer);
    }

    #[abi(embed_v0)]
    impl DN404MirrorImpl of super::IDN404Mirror<ContractState> {
        fn name(self: @ContractState) -> felt252 {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.name()
        }

        fn symbol(self: @ContractState) -> felt252 {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.symbol()
        }

        fn token_uri(self: @ContractState, id: u256) -> felt252 {
            // ownerOf reverts if the token does not exist
            self.owner_of(id);
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.token_uri_nft(id)
        }

        fn total_supply(self: @ContractState) -> u256 {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.total_supply()
        }

        fn balance_of(self: @ContractState, nft_owner: ContractAddress) -> u256 {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.balance_of_nft(nft_owner)
        }

        fn owner_of(self: @ContractState, id: u256) -> ContractAddress {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.owner_of_nft(id)
        }

        fn owner_at(self: @ContractState, id: u256) -> ContractAddress {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.owner_at_nft(id)
        }

        fn approve(ref self: ContractState, spender: ContractAddress, id: u256) {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.approve_nft(spender, id, get_caller_address());
            self.emit(ApprovalEvent {
                owner: get_caller_address(),
                account: spender,
                id,
            });
        }

        fn get_approved(self: @ContractState, id: u256) -> ContractAddress {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.get_approved_nft(id)
        }

        fn set_approval_for_all(ref self: ContractState, operator: ContractAddress, approved: bool) {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.set_approval_for_all_nft(operator, approved, get_caller_address());
            self.emit(ApprovalForAllEvent {
                owner: get_caller_address(),
                operator,
                is_approved: approved,
            });
        }

        fn is_approved_for_all(
            self: @ContractState, 
            nft_owner: ContractAddress, 
            operator: ContractAddress
        ) -> bool {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.is_approved_for_all_nft(nft_owner, operator)
        }

        fn transfer_from(
            ref self: ContractState, 
            from: ContractAddress, 
            to: ContractAddress, 
            id: u256
        ) {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };
            dispatcher.transfer_from_nft(from, to, id, get_caller_address());
        }

        fn safe_transfer_from(
            ref self: ContractState, 
            from: ContractAddress, 
            to: ContractAddress, 
            id: u256
        ) {
            // TODO: support receiver checks
            self.transfer_from(from, to, id);
        }

        fn safe_transfer_from_with_data(
            ref self: ContractState, 
            from: ContractAddress, 
            to: ContractAddress, 
            id: u256, 
            data: felt252
        ) {
            // TODO: support receiver check
            self.transfer_from(from, to, id);
        }

        fn supports_interface(self: @ContractState, interface_id: felt252) -> bool {
            // TODO: OZ SRC5
            true
        }

        fn owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn pull_owner(ref self: ContractState) -> bool {
            let dispatcher = IDN404Dispatcher {
                contract_address: self.base_erc20.read(),
            };

            // Get the new owner from the base contract
            let new_owner = dispatcher.owner();
            
            // Get the current owner
            let old_owner = self.owner.read();

            // Only update and emit if the owner has changed
            if old_owner != new_owner {
                self.owner.write(new_owner);
                
                // Emit ownership transfer event
                self.emit(OwnershipTransferredEvent {
                    old_owner,
                    new_owner,
                });
            }

            // Return success
            true
        }

        fn base_erc20(self: @ContractState) -> ContractAddress {
            self.base_erc20.read()
        }

        fn log_transfer(ref self: ContractState, logs: Array<TransferEvent>) {
            // TODO: support packed logs
            for log in logs {
                self.emit(log);
            }
        }

        fn log_direct_transfer(
            ref self: ContractState, 
            from: ContractAddress, 
            to: ContractAddress, 
            direct_logs: Span<felt252>
        ) {
            // Default implementation
        }

        fn link_mirror_contract(ref self: ContractState, deployer: ContractAddress) {
            // Check if the deployer is set and matches the caller
            if self.deployer.read().is_non_zero() {
                assert!(deployer == self.deployer.read(), "SenderNotDeployer");
            }

            // Check if the base ERC20 is already linked
            assert!(self.base_erc20.read().is_zero(), "AlreadyLinked");

            // Link the base ERC20 to the caller
            self.base_erc20.write(get_caller_address());

            // Return success
            return ();
        }
    }
}


