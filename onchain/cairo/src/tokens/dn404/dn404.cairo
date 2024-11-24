// TODO: create component of it, implement a factory in the future
use starknet::ContractAddress;

// TODO: add hooks like in OZ:

// /// @dev Hook that is called after a batch of NFT transfers.
// /// The lengths of `from`, `to`, and `ids` are guaranteed to be the same.
// function _afterNFTTransfers(address[] memory from, address[] memory to, uint256[] memory ids)
//     internal
//     virtual
// {}


// Overridable functions from Solidity contract migrated to configuration struct
#[derive(Drop, Serde, starknet::Store)]
struct DN404Options {
    // Amount of token balance that is equal to one NFT.
    pub unit: u256,
    // Indicates whether the token IDs are one-indexed.
    pub use_one_indexed: bool,
    // Indicates if direct NFT transfers should be used during ERC20 transfers whenever possible.
    pub use_direct_transfers_if_possible: bool,
    // Indicates if burns should be added to the burn pool.
    pub add_to_burned_pool: bool,
    // Indicates whether to use the exists bitmap for more efficient scanning of an empty token ID slot.
    pub use_exists_lookup: bool,
    // Indicates if `_afterNFTTransfers` is used.
    pub use_after_nft_transfers: bool,
}

#[starknet::interface]
pub trait IDN404<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, to: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256
    ) -> bool;
    fn mirror_erc721(self: @TContractState) -> ContractAddress;
    fn get_skip_nft(self: @TContractState, owner: ContractAddress) -> bool;
    fn set_skip_nft(ref self: TContractState, skip_nft: bool) -> bool;

    // Methods assumed by DN404 mirror fallback:

    fn transfer_from_nft(
        ref self: TContractState, 
        from: ContractAddress, 
        to: ContractAddress, 
        id: u256, 
        msg_sender: ContractAddress
    );

    fn set_approval_for_all_nft(
        ref self: TContractState, 
        spender: ContractAddress, 
        status: bool, 
        msg_sender: ContractAddress
    );

    fn is_approved_for_all_nft(
        self: @TContractState, 
        owner: ContractAddress, 
        operator: ContractAddress
    ) -> bool;

    fn owner_of_nft(self: @TContractState, id: u256) -> ContractAddress;
    fn owner_at_nft(self: @TContractState, id: u256) -> ContractAddress;

    fn approve_nft(
        ref self: TContractState, 
        spender: ContractAddress, 
        id: u256, 
        msg_sender: ContractAddress
    ) -> ContractAddress;

    fn get_approved_nft(self: @TContractState, id: u256) -> ContractAddress;
    fn balance_of_nft(self: @TContractState, owner: ContractAddress) -> u256;
    fn total_nft_supply(self: @TContractState) -> u256;
    fn token_uri_nft(self: @TContractState, id: u256) -> felt252;
    fn implements_dn404(self: @TContractState) -> bool;
}

#[starknet::contract]
pub mod DN404 {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use core::num::traits::Zero;
    use super::DN404Options;
    use crate::tokens::dn404::dn404_mirror::{IDN404MirrorDispatcher, IDN404MirrorDispatcherTrait};
    // TODO
    type u96 = u128;
    type u88 = u128;
    
    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        decimals: u8,

        options: DN404Options,

        // Flags unwinded from AddressData
        skip_nft: Map<ContractAddress, bool>,
        skip_nft_initialized: Map<ContractAddress, bool>,

        num_aliases: u32,
        next_token_id: u32,
        burned_pool_head: u32,
        burned_pool_tail: u32,
        total_nft_supply: u32,
        total_supply: u96,
        mirror_erc721: ContractAddress,
        alias_to_address: Map<u32, ContractAddress>,
        operator_approvals: Map<(ContractAddress, ContractAddress), u256>,
        nft_approvals: Map<u256, ContractAddress>,
        may_have_nft_approval: Map<u256, bool>,
        exists: Map<u256, bool>,
        allowance: Map<(ContractAddress, ContractAddress), u256>,
        owned: Map<ContractAddress, Span<u32>>,
        burned_pool: Span<u32>,
        oo: Map<u256, u32>,
        address_data: Map<ContractAddress, AddressData>,
    }

    #[derive(Drop, Serde, starknet::Store)]
    struct AddressData {
        aux: u88,
        flags: u8,
        address_alias: u32,
        owned_length: u32,
        balance: u96,
    }


    #[derive(Drop, starknet::Event)]
    struct TransferEvent {
        from: ContractAddress,
        to: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ApprovalEvent {
        owner: ContractAddress,
        spender: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SkipNFTSetEvent {
        owner: ContractAddress,
        status: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: TransferEvent,
        Approval: ApprovalEvent,
        SkipNFTSet: SkipNFTSetEvent,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: felt252,
        symbol: felt252,
        decimals: u8,
        
        initial_token_supply: u256,
        initial_supply_owner: ContractAddress,
        // TODO store dispatcher instead of address
        mirror: ContractAddress,

        options: DN404Options,
    ) {
        // Check if the unit is valid
        // TODO: validate conditions
        // assert!(options.unit - 1 < 2 ** 96 - 1, "InvalidUnit");

        // Check that the contract is not already initialized
        assert!(self.mirror_erc721.read().is_zero(), "DNAlreadyInitialized");


        // Assert that the mirror address is not zero
        assert!(mirror.is_non_zero(), "MirrorAddressIsZero");

        // Link the mirror contract
        let mirror_contract = IDN404MirrorDispatcher {
            contract_address: mirror,
        };
        mirror_contract.link_mirror_contract(get_caller_address());

        // Initialize storage variables
        self.next_token_id.write(
            if options.use_one_indexed { 1 } else { 0 }
        );
        self.mirror_erc721.write(mirror);

        if initial_token_supply != 0 {
            // Assert that the initial supply owner is not the zero address
            assert!(initial_supply_owner.is_non_zero(), "TransferToZeroAddress");

            // Assert that the total supply does not overflow
            let initial_token_supply_u96 = initial_token_supply.try_into().expect('TotalSupplyOverflow');
            // TODO: pack AddressData effectively if needed

            self.total_supply.write(initial_token_supply_u96);
            let mut initial_owner_address_data = self.address_data.read(initial_supply_owner);
            initial_owner_address_data.balance = initial_token_supply_u96;
            self.address_data.write(initial_supply_owner, initial_owner_address_data);

            // Emit the Transfer event
            self.emit(TransferEvent {
                from: Zero::zero(),
                to: initial_supply_owner,
                amount: initial_token_supply,
            });

            self._set_skip_nft(initial_supply_owner, true);
        }

        self.options.write(options);
        self.name.write(name);
        self.symbol.write(symbol);
        self.decimals.write(decimals);
    }

    #[abi(embed_v0)]
    impl DN404Impl of super::IDN404<ContractState> {
        fn name(self: @ContractState) -> felt252 {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> felt252 {
            self.symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read().into()
        }

        fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
            self.address_data.read(owner).balance.into()
        }

        fn allowance(self: @ContractState, owner: ContractAddress, spender: ContractAddress) -> u256 {
            // TODO: support Permit2
            self.allowance.read((owner, spender)).into()
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            self._approve(get_caller_address(), spender, amount);
            return true;
        }

        fn transfer(ref self: ContractState, to: ContractAddress, amount: u256) -> bool {
            self._transfer(get_caller_address(), to, amount);
            return true;
        }

    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        // Skip NFT Functions

        // Returns true if minting and transferring ERC20s to `owner` will skip minting NFTs.
        fn get_skip_nft(self: @ContractState, owner: ContractAddress) -> bool {
            // let flags = self.address_data.read(owner).flags;
            // let result = (flags & _ADDRESS_DATA_SKIP_NFT_FLAG) != 0;
            let result = self.skip_nft.read(owner);
            // if (flags & _ADDRESS_DATA_SKIP_NFT_INITIALIZED_FLAG) == 0 {
            if !self.skip_nft_initialized.read(owner) {
                // Check if the owner is a "contract"
                return !Self::is_account(owner);
            }
            return result;
        }

        // Sets the caller's skipNFT flag to `skipNFT`. Returns true.
        fn set_skip_nft(ref self: ContractState, skip_nft: bool) -> bool {
            self._set_skip_nft(get_caller_address(), skip_nft);
            return true;
        }

        // Internal function to set account `owner` skipNFT flag to `state`
        fn _set_skip_nft(ref self: ContractState, owner: ContractAddress, state: bool) {
            // TODO: remove it or convert to Alexandria's Bitmap usage
            // let mut d = self.address_data.read(owner);
            // let mut flags = d.flags;
            // let s = ((flags & _ADDRESS_DATA_SKIP_NFT_FLAG) == 0) != state;
            // flags = flags ^ (_ADDRESS_DATA_SKIP_NFT_FLAG * s);
            // flags = flags | _ADDRESS_DATA_SKIP_NFT_INITIALIZED_FLAG;
            // d.flags = flags;
            // self.address_data.write(owner, d);

            self.skip_nft.write(owner, state);
            self.skip_nft_initialized.write(owner, true);

            // Emit the SkipNFTSet event
            self.emit(SkipNFTSetEvent {
                owner: owner,
                status: state,
            });

            // Emit the SkipNFTSet event
            self.emit(SkipNFTSetEvent {
                owner: owner,
                status: state,
            });
        }

        // Internal approve function
        fn _approve(ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256) {
            // TODO: support Permit2
            self.allowance.write((owner, spender), amount);
            self.emit(ApprovalEvent {
                owner: owner,
                spender: spender,
                amount: amount,
            });
        }

        // Internal transfer functions
        fn _transfer(ref self: ContractState, from: ContractAddress, to: ContractAddress, amount: u256) {
            // TODO: this code is generated and need to be rewritten

            // Basic validation
            assert!(!to.is_zero(), "TransferToZeroAddress");
            assert!(!self.mirror_erc721.read().is_zero(), "DNNotInitialized");

            // Get storage data
            let mut from_data = self.address_data.read(from);
            let mut to_data = self.address_data.read(to);

            // Check balance and update balances
            let from_balance: u256 = from_data.balance.into();
            assert!(amount <= from_balance, "InsufficientBalance");

            // Update balances
            from_data.balance = (from_balance - amount).try_into().expect('BalanceOverflow');
            to_data.balance = (to_data.balance.into() + amount).try_into().expect('BalanceOverflow');

            // Calculate NFT changes needed
            let from_nft_balance = from_data.owned_length;
            let to_nft_balance = to_data.owned_length;
            let unit = self.options.read().unit;

            // Calculate NFTs to burn
            let new_from_nft_balance = (from_balance - amount) / unit;
            let nfts_to_burn = if from_nft_balance > new_from_nft_balance.try_into().unwrap() {
                from_nft_balance - new_from_nft_balance.try_into().unwrap()
            } else {
                0
            };

            // Calculate NFTs to mint
            let new_to_nft_balance = (to_data.balance.into()) / unit;
            let nfts_to_mint = if !self.get_skip_nft(@self, to) 
                && new_to_nft_balance.try_into().unwrap() > to_nft_balance {
                new_to_nft_balance.try_into().unwrap() - to_nft_balance
            } else {
                0
            };

            // Handle NFT transfers
            if nfts_to_burn > 0 {
                self._burn_nfts(from, nfts_to_burn);
            }

            if nfts_to_mint > 0 {
                self._mint_nfts(to, nfts_to_mint);
            }

            // Update storage
            self.address_data.write(from, from_data);
            self.address_data.write(to, to_data);

            // Emit transfer event
            self.emit(TransferEvent { from, to, amount });
        }

        // TODO: determine if this is needed
        fn is_account(address: ContractAddress) -> bool {
            return true;
        }

        fn _burn_nfts(ref self: ContractState, from: ContractAddress, count: u32) {
            // TODO: this code is generated and need to be rewritten

            let mut from_data = self.address_data.read(from);
            let options = self.options.read();
            
            let mut i: u32 = 0;
            while i < count {
                let last_index = from_data.owned_length - 1;
                // TODO: Implement owned array access
                let token_id = self.owned.read(from)[last_index];
                
                // Clear approvals
                if self.may_have_nft_approval.read(token_id.into()) {
                    self.may_have_nft_approval.write(token_id.into(), false);
                    self.nft_approvals.write(token_id.into(), Zero::zero());
                }
                
                // Clear ownership
                self._set_owner_alias_and_owned_index(token_id.into(), 0, 0);
                
                // Update exists bitmap if used
                if options.use_exists_lookup {
                    self.exists.write(token_id.into(), false);
                }
                
                from_data.owned_length -= 1;
                self.total_nft_supply.write(self.total_nft_supply.read() - 1);
                
                // Add to burned pool if needed
                if options.add_to_burned_pool {
                    let tail = self.burned_pool_tail.read();
                    // TODO: Implement burned pool array access
                    self.burned_pool.write(tail.into(), token_id);
                    self.burned_pool_tail.write(tail + 1);
                }
                
                i += 1;
            }
            
            self.address_data.write(from, from_data);
        }

        fn _mint_nfts(ref self: ContractState, to: ContractAddress, count: u32) {
            // TODO: this code is generated and need to be rewritten

            let mut to_data = self.address_data.read(to);
            let options = self.options.read();
            
            // TODO: Implement alias registration
            let to_alias = self._register_and_resolve_alias(to_data, to);
            
            let mut i: u32 = 0;
            while i < count {
                let token_id: u32;
                
                // Try to use burned pool first
                if self.burned_pool_head.read() != self.burned_pool_tail.read() {
                    let head = self.burned_pool_head.read();
                    // TODO: Implement burned pool array access
                    token_id = self.burned_pool.read(head.into());
                    self.burned_pool_head.write(head + 1);
                } else {
                    // Mint new token
                    token_id = self.next_token_id.read();
                    let total_supply: u256 = self.total_supply.read().into();
                    let id_limit = total_supply / options.unit;
                    
                    // TODO: Implement token ID wrapping and ownership checking
                    self.next_token_id.write(token_id + 1);
                }
                
                if options.use_exists_lookup {
                    self.exists.write(token_id.into(), true);
                }
                
                // Set ownership
                let new_index = to_data.owned_length;
                // TODO: Implement owned array access
                self.owned.write(to, new_index.into(), token_id);
                self._set_owner_alias_and_owned_index(token_id.into(), to_alias, new_index);
                
                to_data.owned_length += 1;
                self.total_nft_supply.write(self.total_nft_supply.read() + 1);
                
                i += 1;
            }
            
            self.address_data.write(to, to_data);
        }
    }
}
