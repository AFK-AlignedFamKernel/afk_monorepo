// TODO: create component of it, implement a factory in the future

// Changes comparing to Solidity DN404 contract:
// - Owned NFTs storage became Vec<u32>
// - Flags unwinded from Bitmap to several boolean maps
// - Using 2 separate mappings for Owner aliases and Owned NFTs indexes
// Unimplemented features:
// - Burned pool
// - Packed logs
// - Hooks (exists bitmap, afterNFTTransfers, etc)
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
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePathEntry};
    use starknet::storage::{Vec, VecTrait, MutableVecTrait};
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
        owned: Map<ContractAddress, Vec<u32>>,
        burned_pool: Span<u32>,
        // Use two separate mappings for owner aliases and owned indexes:
        owner_aliases: Map<u256, u32>,
        owned_indexes: Map<u256, u32>,

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

        // Returns true if minting and transferring ERC20s to `owner` will skip minting NFTs.
        fn get_skip_nft(self: @ContractState, owner: ContractAddress) -> bool {
            // let flags = self.address_data.read(owner).flags;
            // let result = (flags & _ADDRESS_DATA_SKIP_NFT_FLAG) != 0;
            let result = self.skip_nft.read(owner);
            // if (flags & _ADDRESS_DATA_SKIP_NFT_INITIALIZED_FLAG) == 0 {
            if !self.skip_nft_initialized.read(owner) {
                // Check if the owner is a "contract"
                return !InternalFunctions::is_account(owner);
            }
            return result;
        }

        // Sets the caller's skipNFT flag to `skipNFT`. Returns true.
        fn set_skip_nft(ref self: ContractState, skip_nft: bool) -> bool {
            self._set_skip_nft(get_caller_address(), skip_nft);
            return true;
        }
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        // Skip NFT Functions

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
            let mut from_balance: u256 = from_data.balance.into();
            assert!(amount <= from_balance, "InsufficientBalance");

            // Update balances
            from_balance -= amount;
            from_data.balance = from_balance.try_into().expect('BalanceOverflow');

            let mut to_balance: u256 = to_data.balance.into() + amount;
            to_data.balance = to_balance.try_into().expect('BalanceOverflow');

            /// DONE

            // Calculate NFT changes needed
            let from_owned_length: u256 = from_data.owned_length.into();
            let mut to_owned_length: u256 = to_data.owned_length.into();
            let unit = self.options.read().unit;

            // Calculate NFTs to burn
            let num_nft_burns: u256 = Self::zero_floor_sub(from_owned_length, ((from_balance - amount) / unit).try_into().unwrap());
            let mut num_nft_mints: u256 = 0;

            if (!self.get_skip_nft(to)) {
                if from == to {
                    to_owned_length = from_owned_length - num_nft_burns;
                }
                num_nft_mints = Self::zero_floor_sub(to_balance / unit, to_owned_length);
            }

            // TODO: implement direct transfers
            let total_nft_supply: u256 = self.total_nft_supply.read().into() + num_nft_mints - num_nft_burns;
            self.total_nft_supply.write(total_nft_supply.try_into().expect('TotalSupplyOverflow')); // TODO: it's not written here in Solidity, just in the variable

            // let burned_pool_tail = self.burned_pool_tail.read();
            if num_nft_burns != 0 {
                // TODO: support [packed] logs
                // TODO: support burned pool
                let mut from_index: u64 = from_owned_length.try_into().expect('OwnedLengthOverflow');
                let from_end: u64 = from_index - num_nft_burns.try_into().expect('OwnedLengthOverflow');
                from_data.owned_length = from_end.try_into().expect('OwnedLengthOverflow');

                // Burn loop
                // We don't rely on wrapping here because we use Vecs instead of circle bufferred array-like mapping
                while from_index > from_end {
                    from_index -= 1;
                    // get last token from the sender's owned list
                    let token_id = self.owned.entry(from).at(from_index).read();
                    // _setOwnerAliasAndOwnedIndex(oo, id, 0, 0);
                    self.owner_aliases.write(token_id.into(), 0);
                    self.owned_indexes.write(token_id.into(), 0);
                    // TODO: process packed logs
                    // TODO: process exists map
                    // TODO: process burned pool
                    if self.may_have_nft_approval.read(token_id.into()) {
                        self.may_have_nft_approval.write(token_id.into(), false);
                        self.nft_approvals.write(token_id.into(), Zero::zero());
                    }
                }
            }

            if num_nft_mints != 0 {
                // Register and resolve alias
                let to_alias = self._register_and_resolve_alias(ref to_data, to);
                let id_limit = self.total_supply.read().into() / unit;
                let mut next_token_id = self._wrap_nft_id(self.next_token_id.read().into(), id_limit);
                let to_index = to_owned_length;
                let to_end = to_index + num_nft_mints;
                to_data.owned_length = to_end.try_into().expect('OwnedLengthOverflow');

                // Mint loop
                while to_index < to_end {
                    let mut token_id: u256 = 0;
                    if self.burned_pool_head.read() != self.burned_pool_tail.read() {
                        // TODO: support burned pool
                    } else {
                        token_id = next_token_id;
                        while self.owner_aliases.read(token_id.into()) != 0 {
                            // TODO: support exists lookup
                            token_id = self._wrap_nft_id(token_id + 1, id_limit);
                        };
                        next_token_id = self._wrap_nft_id(token_id + 1, id_limit);
                    }
                };

                self.next_token_id.write(next_token_id.try_into().expect('TokenIdOverflow'));
            }

            // TODO: send direct logs
            // TODO: send packed logs

            self.emit(TransferEvent {
                from: from,
                to: to,
                amount: amount,
            });

            // TODO: afterNFTTransfers
        }

        // TODO: determine if this is needed
        fn is_account(address: ContractAddress) -> bool {
            true
        }

        fn zero_floor_sub(a: u256, b: u256) -> u256 {
            if a > b {
                a - b
            } else {
                0
            }
        }

        /// Wraps the NFT ID to ensure it stays within valid range
        /// @param id - The NFT ID to wrap
        /// @param id_limit - The maximum ID value (exclusive)
        /// @return result - The wrapped ID value
        fn _wrap_nft_id(ref self: ContractState, id: u256, id_limit: u256) -> u256 {
            let start_index: u256 = if self.options.read().use_one_indexed {
                1
            } else {
                0
            };

            if id > id_limit {
                // If ID exceeds limit, wrap back to start_index
                start_index
            } else {
                // If ID is within range, return it unchanged
                id
            }
        }

        // We don't use single map for both owner aliases and owned indexes,
        // so index calculation is different
        fn _ownership_index(ref self: ContractState, i: u256) -> u256 {
            let use_one_indexed: u256 = if self.options.read().use_one_indexed {
                1
            } else {
                0
            };
            i - use_one_indexed
        }

        fn _register_and_resolve_alias(ref self: ContractState, ref to_data: AddressData, to: ContractAddress) -> u32 {
            if to_data.address_alias == 0 {
                // No need to check for overflows because it's done by the runtime
                to_data.address_alias = self.num_aliases.read() + 1;
            }
            // TODO: check that owner_aliases is written somewhere else
            self.alias_to_address.write(to_data.address_alias, to);
            return to_data.address_alias;
        }
    }
}
