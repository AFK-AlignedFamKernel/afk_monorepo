// TODO: create component of it, implement a factory in the future

// Changes comparing to Solidity DN404 contract:
// - Flags unwinded from Bitmap to several boolean maps
// - Using 2 separate mappings for Owner aliases and Owned NFTs indexes
// Unimplemented features:
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

const TWO_POW_96: u256 = 0x1000000000000000000000000;

// Overridable functions from Solidity contract migrated to configuration struct
#[derive(Drop, Serde, starknet::Store)]
pub struct DN404Options {
    // Amount of token balance that is equal to one NFT.
    pub unit: u256,
    // Indicates whether the token IDs are one-indexed.
    pub use_one_indexed: bool,
    // Indicates if direct NFT transfers should be used during ERC20 transfers whenever possible.
    pub use_direct_transfers_if_possible: bool,
    // Indicates if burns should be added to the burn pool.
    pub add_to_burned_pool: bool,
    // Indicates whether to use the exists bitmap for more efficient scanning of an empty token ID
    // slot.
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
        self: @TContractState, owner: ContractAddress, operator: ContractAddress
    ) -> bool;

    fn owner_of_nft(self: @TContractState, id: u256) -> ContractAddress;
    fn owner_at_nft(self: @TContractState, id: u256) -> ContractAddress;

    fn approve_nft(
        ref self: TContractState, spender: ContractAddress, id: u256, msg_sender: ContractAddress
    ) -> ContractAddress;

    fn get_approved_nft(self: @TContractState, id: u256) -> ContractAddress;
    fn balance_of_nft(self: @TContractState, owner: ContractAddress) -> u256;
    fn total_nft_supply(self: @TContractState) -> u256;
    fn token_uri_nft(self: @TContractState, id: u256) -> felt252;
    fn implements_dn404(self: @TContractState) -> bool;

    // TODO: use Ownable component
    fn owner(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod DN404 {
    use core::num::traits::Zero;
    use crate::tokens::dn404::dn404_mirror::{
        NftTransferEvent, IDN404MirrorDispatcher, IDN404MirrorDispatcherTrait
    };
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePathEntry};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use super::DN404Options;
    // TODO
    type u96 = u128;
    type u88 = u128;

    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        decimals: u8,
        options: DN404Options,
        // TODO: use Ownable component
        owner: ContractAddress,
        // Flags unwinded from AddressData
        skip_nft: Map<ContractAddress, bool>,
        skip_nft_initialized: Map<ContractAddress, bool>,
        num_aliases: u32,
        next_token_id: u32,
        total_nft_supply: u32,
        total_supply: u96,
        mirror_erc721: ContractAddress,
        alias_to_address: Map<u32, ContractAddress>,
        // TODO: boolean map
        operator_approvals: Map<(ContractAddress, ContractAddress), u256>,
        nft_approvals: Map<u256, ContractAddress>,
        may_have_nft_approval: Map<u256, bool>,
        exists: Map<u256, bool>,
        allowance: Map<(ContractAddress, ContractAddress), u256>,
        owned: Map<ContractAddress, Map<u32, u32>>,
        // Burned pool
        burned_pool_head: u32,
        burned_pool_tail: u32,
        burned_pool: Map<u32, u32>,
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
    pub struct TransferEvent {
        from: ContractAddress,
        to: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ApprovalEvent {
        owner: ContractAddress,
        spender: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SkipNFTSetEvent {
        owner: ContractAddress,
        status: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Transfer: TransferEvent,
        Approval: ApprovalEvent,
        SkipNFTSet: SkipNFTSetEvent,
    }

    mod errors {
        pub const TransferToZeroAddress: felt252 = 'TransferToZeroAddress';
        pub const DNNotInitialized: felt252 = 'DNNotInitialized';
        pub const TotalSupplyOverflow: felt252 = 'TotalSupplyOverflow';
        pub const BalanceOverflow: felt252 = 'BalanceOverflow';
        pub const OwnedLengthOverflow: felt252 = 'OwnedLengthOverflow';
        pub const IndexOverflow: felt252 = 'IndexOverflow';
        pub const TokenIdOverflow: felt252 = 'TokenIdOverflow';
        pub const InsufficientBalance: felt252 = 'InsufficientBalance';
        pub const InvalidUnit: felt252 = 'InvalidUnit';
        pub const MirrorAddressIsZero: felt252 = 'MirrorAddressIsZero';
        pub const TransferFromIncorrectOwner: felt252 = 'TransferFromIncorrectOwner';
        pub const TransferCallerNotOwnerNorApproved: felt252 = 'TransfCallerNotOwnerNorApproved';
        pub const TokenDoesNotExist: felt252 = 'TokenDoesNotExist';
        pub const ApprovalCallerNotOwnerNorApproved: felt252 = 'ApprovCallerNotOwnerNorApproved';
        pub const CallerNotMirror: felt252 = 'CallerNotMirror';
        pub const DNAlreadyInitialized: felt252 = 'DNAlreadyInitialized';
        pub const InsufficientAllowance: felt252 = 'InsufficientAllowance';
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
        assert(options.unit < super::TWO_POW_96, errors::InvalidUnit);

        // Check that the contract is not already initialized
        assert(self.mirror_erc721.read().is_zero(), errors::DNAlreadyInitialized);

        // Assert that the mirror address is not zero
        assert(mirror.is_non_zero(), errors::MirrorAddressIsZero);

        // Link the mirror contract
        let mirror_contract = IDN404MirrorDispatcher { contract_address: mirror, };
        mirror_contract.link_mirror_contract(get_caller_address());

        // Initialize storage variables
        self.next_token_id.write(if options.use_one_indexed {
            1
        } else {
            0
        });
        self.mirror_erc721.write(mirror);

        if initial_token_supply != 0 {
            // Assert that the initial supply owner is not the zero address
            assert(initial_supply_owner.is_non_zero(), errors::TransferToZeroAddress);

            // Assert that the total supply does not overflow
            let initial_token_supply_u96 = initial_token_supply
                .try_into()
                .expect(errors::TotalSupplyOverflow);
            // TODO: pack AddressData effectively if needed

            self.total_supply.write(initial_token_supply_u96);
            let mut initial_owner_address_data = self.address_data.read(initial_supply_owner);
            initial_owner_address_data.balance = initial_token_supply_u96;
            self.address_data.write(initial_supply_owner, initial_owner_address_data);

            // Emit the Transfer event
            self
                .emit(
                    TransferEvent {
                        from: Zero::zero(), to: initial_supply_owner, amount: initial_token_supply,
                    }
                );

            self._set_skip_nft(initial_supply_owner, true);
        }

        self.options.write(options);
        self.name.write(name);
        self.symbol.write(symbol);
        self.decimals.write(decimals);

        self.owner.write(initial_supply_owner);
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

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress
        ) -> u256 {
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

        fn mirror_erc721(self: @ContractState) -> ContractAddress {
            self.mirror_erc721.read()
        }

        fn implements_dn404(self: @ContractState) -> bool {
            true
        }

        fn transfer_from(
            ref self: ContractState, from: ContractAddress, to: ContractAddress, amount: u256
        ) -> bool {
            // TODO: support Permit2
            let allowed = self.allowance.read((from, get_caller_address()));
            assert(amount <= allowed, errors::InsufficientAllowance);
            self._transfer(from, to, amount);
            return true;
        }

        fn transfer_from_nft(
            ref self: ContractState,
            from: ContractAddress,
            to: ContractAddress,
            id: u256,
            msg_sender: ContractAddress
        ) {
            self.assert_caller_is_mirror();
            self._transfer_from_nft(from, to, id, msg_sender);
        }

        fn set_approval_for_all_nft(
            ref self: ContractState,
            spender: ContractAddress,
            status: bool,
            msg_sender: ContractAddress
        ) {
            self.assert_caller_is_mirror();
            self._set_approval_for_all_nft(spender, status, msg_sender);
        }

        fn is_approved_for_all_nft(
            self: @ContractState, owner: ContractAddress, operator: ContractAddress
        ) -> bool {
            self.operator_approvals.read((owner, operator)) != 0
        }

        fn owner_of_nft(self: @ContractState, id: u256) -> ContractAddress {
            self._owner_of(id)
        }

        fn owner_at_nft(self: @ContractState, id: u256) -> ContractAddress {
            self._owner_at(id)
        }

        fn approve_nft(
            ref self: ContractState, spender: ContractAddress, id: u256, msg_sender: ContractAddress
        ) -> ContractAddress {
            self.assert_caller_is_mirror();
            let owner = self._approve_nft(spender, id, msg_sender);
            owner
        }

        fn get_approved_nft(self: @ContractState, id: u256) -> ContractAddress {
            self._get_approved(id)
        }

        fn balance_of_nft(self: @ContractState, owner: ContractAddress) -> u256 {
            self._balance_of_nft(owner)
        }

        fn total_nft_supply(self: @ContractState) -> u256 {
            self._total_nft_supply()
        }

        fn token_uri_nft(self: @ContractState, id: u256) -> felt252 {
            self._token_uri(id)
        }

        fn owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
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
            self.emit(SkipNFTSetEvent { owner: owner, status: state, });

            // Emit the SkipNFTSet event
            self.emit(SkipNFTSetEvent { owner: owner, status: state, });
        }

        // Internal approve function
        fn _approve(
            ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256
        ) {
            // TODO: support Permit2
            self.allowance.write((owner, spender), amount);
            self.emit(ApprovalEvent { owner: owner, spender: spender, amount: amount, });
        }

        // Internal transfer functions
        fn _transfer(
            ref self: ContractState, from: ContractAddress, to: ContractAddress, amount: u256
        ) {
            // Basic validation
            assert(!to.is_zero(), errors::TransferToZeroAddress);
            assert(!self.mirror_erc721.read().is_zero(), errors::DNNotInitialized);

            // Get storage data
            let mut from_data = self.address_data.read(from);
            let mut to_data = self.address_data.read(to);

            // Check balance and update balances
            let mut from_balance: u256 = from_data.balance.into();
            assert(amount <= from_balance, errors::InsufficientBalance);

            // Update balances
            from_balance -= amount;
            from_data.balance = from_balance.try_into().expect(errors::BalanceOverflow);

            let mut to_balance: u256 = to_data.balance.into() + amount;
            to_data.balance = to_balance.try_into().expect(errors::BalanceOverflow);

            // Calculate NFT changes needed
            let mut from_owned_length: u256 = from_data.owned_length.into();
            let mut to_owned_length: u256 = to_data.owned_length.into();
            let unit = self.options.read().unit;

            // Calculate NFTs to burn
            let mut num_nft_burns: u256 = Self::zero_floor_sub(
                from_owned_length, (from_balance / unit).try_into().unwrap()
            );
            let mut num_nft_mints: u256 = 0;

            if (!self.get_skip_nft(to)) {
                if from == to {
                    to_owned_length = from_owned_length - num_nft_burns;
                }
                num_nft_mints = Self::zero_floor_sub(to_balance / unit, to_owned_length);
            }

            if self.options.read().use_direct_transfers_if_possible {
                // Calculate number of tokens to directly transfer
                let n = Self::min(from_owned_length, Self::min(num_nft_burns, num_nft_mints));

                if n != 0 {
                    // Adjust burn and mint counts
                    num_nft_burns -= n;
                    num_nft_mints -= n;

                    // Handle self-transfer case
                    if from == to {
                        to_owned_length += n;
                    } else {
                        // Register alias for recipient
                        let to_alias = self._register_and_resolve_alias(ref to_data, to);
                        let mut to_index = to_owned_length;
                        let transfer_end = to_index + n;

                        // Store transfer logs
                        let mut nft_transfer_logs: Array<NftTransferEvent> = ArrayTrait::new();

                        // Direct transfer loop
                        while to_index < transfer_end {
                            // Get token from sender
                            from_owned_length -= 1;
                            let token_id = self
                                .owned
                                .entry(from)
                                .read(
                                    from_owned_length.try_into().expect(errors::OwnedLengthOverflow)
                                );

                            // Transfer to recipient
                            self
                                .owned
                                .entry(to)
                                .write(
                                    to_index.try_into().expect(errors::IndexOverflow),
                                    token_id.try_into().expect(errors::TokenIdOverflow)
                                );
                            self
                                ._set_owner_alias_and_owned_index(
                                    token_id.into(),
                                    to_alias,
                                    to_index.try_into().expect(errors::OwnedLengthOverflow)
                                );

                            // Add to transfer logs
                            nft_transfer_logs
                                .append(
                                    NftTransferEvent { from: from, to: to, id: token_id.into() }
                                );

                            // Clear approvals if they exist
                            if self.may_have_nft_approval.read(token_id.into()) {
                                self.may_have_nft_approval.write(token_id.into(), false);
                                self.nft_approvals.write(token_id.into(), Zero::zero());
                            }

                            to_index += 1;
                        };

                        // Update owned lengths
                        to_data
                            .owned_length = to_index
                            .try_into()
                            .expect(errors::OwnedLengthOverflow);
                        from_data
                            .owned_length = from_owned_length
                            .try_into()
                            .expect(errors::OwnedLengthOverflow);

                        // Send transfer logs
                        if nft_transfer_logs.len() > 0 {
                            let dispatcher = IDN404MirrorDispatcher {
                                contract_address: self.mirror_erc721.read(),
                            };
                            dispatcher.log_transfer(nft_transfer_logs);
                        }
                    }
                }
            }

            let total_nft_supply: u256 = self.total_nft_supply.read().into()
                + num_nft_mints
                - num_nft_burns;
            self
                .total_nft_supply
                .write(
                    total_nft_supply.try_into().expect(errors::TotalSupplyOverflow)
                ); // TODO: it's not written here in Solidity, just in the variable

            let mut nft_transfer_logs: Array<NftTransferEvent> = ArrayTrait::new();

            let mut burned_pool_tail = self.burned_pool_tail.read();
            if num_nft_burns != 0 {
                // Check if we should add to burned pool
                let add_to_burned_pool = self.options.read().add_to_burned_pool;

                let mut from_index: u64 = from_owned_length
                    .try_into()
                    .expect(errors::OwnedLengthOverflow);
                let from_end: u64 = from_index
                    - num_nft_burns.try_into().expect(errors::OwnedLengthOverflow);
                from_data.owned_length = from_end.try_into().expect(errors::OwnedLengthOverflow);

                // Burn loop
                while from_index != from_end {
                    from_index -= 1;
                    // get last token from the sender's owned list
                    let token_id = self.owned.entry(from).read(from_index.try_into().unwrap());
                    self._set_owner_alias_and_owned_index(token_id.into(), 0, 0);
                    // append to the logs
                    nft_transfer_logs
                        .append(
                            NftTransferEvent { from: from, to: Zero::zero(), id: token_id.into(), }
                        );

                    // Add to burned pool if enabled
                    if add_to_burned_pool {
                        self.burned_pool.write(burned_pool_tail, token_id);
                        burned_pool_tail += 1;
                    }

                    // Process exists map
                    if self.options.read().use_exists_lookup {
                        self.exists.write(token_id.into(), false);
                    }

                    // Clear approvals if they exist
                    if self.may_have_nft_approval.read(token_id.into()) {
                        self.may_have_nft_approval.write(token_id.into(), false);
                        self.nft_approvals.write(token_id.into(), Zero::zero());
                    }
                };

                // Update burned pool tail if needed
                if add_to_burned_pool {
                    self.burned_pool_tail.write(burned_pool_tail);
                }
            }

            if num_nft_mints != 0 {
                // Register and resolve alias
                let to_alias = self._register_and_resolve_alias(ref to_data, to);
                let id_limit = self.total_supply.read().into() / unit;
                let mut next_token_id = self
                    ._wrap_nft_id(self.next_token_id.read().into(), id_limit);
                let mut to_index = to_owned_length;
                let to_end = to_index + num_nft_mints;
                to_data.owned_length = to_end.try_into().expect(errors::OwnedLengthOverflow);

                // Track burned pool head
                let mut burned_pool_head = self.burned_pool_head.read();
                let burned_pool_tail = self.burned_pool_tail.read();

                // Mint loop
                while to_index < to_end {
                    let mut token_id: u256 = 0;

                    // Check if there are burned tokens available
                    if burned_pool_head != burned_pool_tail {
                        // Reuse a burned token ID
                        token_id = self.burned_pool.read(burned_pool_head).into();
                        burned_pool_head += 1;
                    } else {
                        // No burned tokens available, mint new token ID
                        token_id = next_token_id;
                        while self.owner_aliases.read(token_id.into()) != 0 {
                            // TODO: support exists lookup
                            token_id = self._wrap_nft_id(token_id + 1, id_limit);
                        };
                        next_token_id = self._wrap_nft_id(token_id + 1, id_limit);
                    }

                    // Update exists lookup if enabled
                    if self.options.read().use_exists_lookup {
                        self.exists.write(token_id, true);
                    }

                    // Append token to owner's owned list
                    self
                        .owned
                        .entry(to)
                        .write(
                            to_index.try_into().expect(errors::IndexOverflow),
                            token_id.try_into().expect(errors::TokenIdOverflow)
                        );
                    self
                        ._set_owner_alias_and_owned_index(
                            token_id.into(),
                            to_alias,
                            to_index.try_into().expect(errors::OwnedLengthOverflow)
                        );

                    nft_transfer_logs
                        .append(
                            NftTransferEvent { from: Zero::zero(), to: to, id: token_id.into(), }
                        );

                    to_index += 1;
                };

                // Update burned pool head and next token ID in storage
                self.burned_pool_head.write(burned_pool_head);
                self.next_token_id.write(next_token_id.try_into().expect(errors::TokenIdOverflow));
            }

            // TODO: send direct logs
            if nft_transfer_logs.len() > 0 {
                let dispatcher = IDN404MirrorDispatcher {
                    contract_address: self.mirror_erc721.read(),
                };
                dispatcher.log_transfer(nft_transfer_logs);
            }

            // Update address data
            self.address_data.write(from, from_data);
            self.address_data.write(to, to_data);

            self.emit(TransferEvent { from: from, to: to, amount: amount, });
            // TODO: afterNFTTransfers
        }

        // TODO: determine if this is needed
        fn is_account(address: ContractAddress) -> bool {
            true
        }

        fn min(a: u256, b: u256) -> u256 {
            if a < b {
                a
            } else {
                b
            }
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
        fn _ownership_index(self: @ContractState, i: u256) -> u256 {
            let use_one_indexed: u256 = if self.options.read().use_one_indexed {
                1
            } else {
                0
            };
            i - use_one_indexed
        }

        fn _register_and_resolve_alias(
            ref self: ContractState, ref to_data: AddressData, to: ContractAddress
        ) -> u32 {
            if to_data.address_alias == 0 {
                // No need to check for overflows because it's done by the runtime
                to_data.address_alias = self.num_aliases.read() + 1;
            }
            // TODO: check that owner_aliases is written somewhere else
            self.alias_to_address.write(to_data.address_alias, to);
            return to_data.address_alias;
        }

        /// Mints `amount` tokens to `to`, increasing the total supply.
        ///
        /// Will mint NFTs to `to` if the recipient's new balance supports
        /// additional NFTs AND the `to` address's skipNFT flag is set to false.
        fn _mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            // Basic validation
            assert(!to.is_zero(), errors::TransferToZeroAddress);
            assert(!self.mirror_erc721.read().is_zero(), errors::DNNotInitialized);

            // Get storage data
            let mut to_data = self.address_data.read(to);

            // Update balances and calculate NFT changes needed
            let to_balance: u256 = to_data.balance.into() + amount;
            to_data.balance = to_balance.try_into().expect(errors::BalanceOverflow);

            // Update total supply
            let new_total_supply: u256 = self.total_supply.read().into() + amount;
            assert(new_total_supply >= amount, errors::TotalSupplyOverflow);
            self
                .total_supply
                .write(new_total_supply.try_into().expect(errors::TotalSupplyOverflow));

            let unit = self.options.read().unit;
            let to_end: u256 = to_balance / unit;
            let id_limit = new_total_supply / unit;

            // Handle NFT minting if needed
            while !self.get_skip_nft(to) { // TODO: maybe convert while to if
                let to_owned_length: u256 = to_data.owned_length.into();
                let num_nft_mints = Self::zero_floor_sub(to_end, to_owned_length);

                if num_nft_mints == 0 {
                    break;
                }

                // Update total NFT supply
                let total_nft_supply: u256 = self.total_nft_supply.read().into() + num_nft_mints;
                self
                    .total_nft_supply
                    .write(total_nft_supply.try_into().expect(errors::TotalSupplyOverflow));

                // Register and resolve alias
                let to_alias = self._register_and_resolve_alias(ref to_data, to);
                let mut next_token_id = self
                    ._wrap_nft_id(self.next_token_id.read().into(), id_limit);
                let mut to_index = to_owned_length;
                let to_end = to_index + num_nft_mints;
                to_data.owned_length = to_end.try_into().expect(errors::OwnedLengthOverflow);

                // Store NFT transfer logs
                let mut nft_transfer_logs: Array<NftTransferEvent> = ArrayTrait::new();

                // Track burned pool head
                let mut burned_pool_head = self.burned_pool_head.read();
                let burned_pool_tail = self.burned_pool_tail.read();

                // Mint loop
                while to_index < to_end {
                    let mut token_id: u256 = 0;

                    // Check if there are burned tokens available
                    if burned_pool_head != burned_pool_tail {
                        // Reuse a burned token ID
                        token_id = self.burned_pool.read(burned_pool_head).into();
                        burned_pool_head += 1;
                    } else {
                        // No burned tokens available, mint new token ID
                        token_id = next_token_id;
                        while self.owner_aliases.read(token_id.into()) != 0 {
                            // TODO: support exists lookup
                            token_id = self._wrap_nft_id(token_id + 1, id_limit);
                        };
                        next_token_id = self._wrap_nft_id(token_id + 1, id_limit);
                    }

                    // Update exists lookup if enabled
                    if self.options.read().use_exists_lookup {
                        self.exists.write(token_id, true);
                    }

                    // Append token to owner's owned list
                    self
                        .owned
                        .entry(to)
                        .write(
                            to_index.try_into().expect(errors::IndexOverflow),
                            token_id.try_into().expect(errors::TokenIdOverflow)
                        );
                    self
                        ._set_owner_alias_and_owned_index(
                            token_id.into(),
                            to_alias,
                            to_index.try_into().expect(errors::OwnedLengthOverflow)
                        );

                    nft_transfer_logs
                        .append(
                            NftTransferEvent { from: Zero::zero(), to: to, id: token_id.into(), }
                        );

                    to_index += 1;
                };

                // Update burned pool head and next token ID
                self.burned_pool_head.write(burned_pool_head);
                self.next_token_id.write(next_token_id.try_into().expect(errors::TokenIdOverflow));

                // Send NFT transfer logs to mirror
                if nft_transfer_logs.len() > 0 {
                    let dispatcher = IDN404MirrorDispatcher {
                        contract_address: self.mirror_erc721.read(),
                    };
                    dispatcher.log_transfer(nft_transfer_logs);
                }
                break;
            };

            // Update address data
            self.address_data.write(to, to_data);

            // Emit Transfer event
            self.emit(TransferEvent { from: Zero::zero(), to: to, amount: amount, });
            // TODO: afterNFTTransfers hook
        }

        /// Mints `amount` tokens to `to`, increasing the total supply.
        /// This variant mints NFT tokens starting from ID
        /// `preTotalSupply / unit + use_one_indexed`.
        /// The `next_token_id` will not be changed.
        /// If any NFTs are minted, the burned pool will be invalidated (emptied).
        fn _mint_next(ref self: ContractState, to: ContractAddress, amount: u256) {
            // Basic validation
            assert(!to.is_zero(), errors::TransferToZeroAddress);
            assert(!self.mirror_erc721.read().is_zero(), errors::DNNotInitialized);

            // Get storage data
            let mut to_data = self.address_data.read(to);

            // Update balances and calculate NFT changes needed
            let to_balance: u256 = to_data.balance.into() + amount;
            to_data.balance = to_balance.try_into().expect(errors::BalanceOverflow);

            // Calculate pre and new total supply
            let pre_total_supply: u256 = self.total_supply.read().into();
            let new_total_supply: u256 = pre_total_supply + amount;
            assert(new_total_supply >= amount, errors::TotalSupplyOverflow);
            self
                .total_supply
                .write(new_total_supply.try_into().expect(errors::TotalSupplyOverflow));

            let unit = self.options.read().unit;
            let to_end: u256 = to_balance / unit;
            let id_limit = new_total_supply / unit;

            // Calculate initial token ID
            let mut id = self
                ._wrap_nft_id(
                    pre_total_supply / unit
                        + if self.options.read().use_one_indexed {
                            1
                        } else {
                            0
                        },
                    id_limit
                );

            // Handle NFT minting if needed
            while !self.get_skip_nft(to) { // TODO: maybe convert while to if
                let to_owned_length: u256 = to_data.owned_length.into();
                let num_nft_mints = Self::zero_floor_sub(to_end, to_owned_length);

                if num_nft_mints == 0 {
                    break;
                }

                // Update total NFT supply
                let total_nft_supply: u256 = self.total_nft_supply.read().into() + num_nft_mints;
                self
                    .total_nft_supply
                    .write(total_nft_supply.try_into().expect(errors::TotalSupplyOverflow));

                // Invalidate (empty) the burned pool
                self.burned_pool_head.write(0);
                self.burned_pool_tail.write(0);

                // Register and resolve alias
                let to_alias = self._register_and_resolve_alias(ref to_data, to);
                let mut to_index = to_owned_length;
                to_data.owned_length = to_end.try_into().expect(errors::OwnedLengthOverflow);

                // Store NFT transfer logs
                let mut nft_transfer_logs: Array<NftTransferEvent> = ArrayTrait::new();

                // Mint loop
                while to_index < to_end {
                    while self.owner_aliases.read(id.into()) != 0 {
                        // TODO: support exists lookup
                        id = self._wrap_nft_id(id + 1, id_limit);
                    };

                    // Append token to owner's owned list
                    self
                        .owned
                        .entry(to)
                        .write(
                            to_index.try_into().expect(errors::IndexOverflow),
                            id.try_into().expect(errors::TokenIdOverflow)
                        );
                    self
                        ._set_owner_alias_and_owned_index(
                            id.into(),
                            to_alias,
                            to_index.try_into().expect(errors::OwnedLengthOverflow)
                        );

                    nft_transfer_logs
                        .append(NftTransferEvent { from: Zero::zero(), to: to, id: id.into(), });

                    id = self._wrap_nft_id(id + 1, id_limit);
                    to_index += 1;
                };

                // Send NFT transfer logs to mirror
                if nft_transfer_logs.len() > 0 {
                    let dispatcher = IDN404MirrorDispatcher {
                        contract_address: self.mirror_erc721.read(),
                    };
                    dispatcher.log_transfer(nft_transfer_logs);
                }
                break;
            };

            // Update address data
            self.address_data.write(to, to_data);

            // Emit Transfer event
            self.emit(TransferEvent { from: Zero::zero(), to: to, amount: amount, });
            // TODO: afterNFTTransfers hook
        }

        /// Burns `amount` tokens from `from`, reducing the total supply.
        /// Will burn sender NFTs if balance after transfer is less than
        /// the amount required to support the current NFT balance.
        fn _burn(ref self: ContractState, from: ContractAddress, amount: u256) {
            // Basic validation
            assert(!self.mirror_erc721.read().is_zero(), errors::DNNotInitialized);

            // Get storage data
            let mut from_data = self.address_data.read(from);

            // Check balance and update balances
            let from_balance: u256 = from_data.balance.into();
            assert(amount <= from_balance, errors::InsufficientBalance);

            // Update balances
            from_data.balance = (from_balance - amount).try_into().expect(errors::BalanceOverflow);

            // Update total supply
            let new_total_supply: u256 = self.total_supply.read().into() - amount;
            self
                .total_supply
                .write(new_total_supply.try_into().expect(errors::TotalSupplyOverflow));

            // Calculate NFTs to burn
            let from_owned_length: u256 = from_data.owned_length.into();
            let num_nft_burns = Self::zero_floor_sub(
                from_owned_length, (from_balance - amount) / self.options.read().unit
            );

            if num_nft_burns != 0 {
                // Update total NFT supply and check if we should add to burned pool
                let total_nft_supply: u256 = self.total_nft_supply.read().into() - num_nft_burns;
                self
                    .total_nft_supply
                    .write(total_nft_supply.try_into().expect(errors::TotalSupplyOverflow));
                let add_to_burned_pool = self.options.read().add_to_burned_pool;

                // Store NFT transfer logs
                let mut nft_transfer_logs: Array<NftTransferEvent> = ArrayTrait::new();

                // Calculate burn range
                let mut from_index: u64 = from_owned_length
                    .try_into()
                    .expect(errors::OwnedLengthOverflow);
                let from_end: u64 = from_index
                    - num_nft_burns.try_into().expect(errors::OwnedLengthOverflow);
                from_data.owned_length = from_end.try_into().expect(errors::OwnedLengthOverflow);

                // Track burned pool tail
                let mut burned_pool_tail = self.burned_pool_tail.read();

                // Burn loop
                while from_index > from_end {
                    from_index -= 1;
                    // Get last token from the sender's owned list
                    let token_id = self.owned.entry(from).read(from_index.try_into().unwrap());

                    // Clear ownership data
                    self._set_owner_alias_and_owned_index(token_id.into(), 0, 0);

                    // Clear approvals if they exist
                    if self.may_have_nft_approval.read(token_id.into()) {
                        self.may_have_nft_approval.write(token_id.into(), false);
                        self.nft_approvals.write(token_id.into(), Zero::zero());
                    }

                    // Add to burned pool if enabled
                    if add_to_burned_pool {
                        self.burned_pool.write(burned_pool_tail, token_id);
                        burned_pool_tail += 1;
                    }

                    // Update exists lookup if enabled
                    if self.options.read().use_exists_lookup {
                        self.exists.write(token_id.into(), false);
                    }

                    // Add to transfer logs
                    nft_transfer_logs
                        .append(
                            NftTransferEvent { from: from, to: Zero::zero(), id: token_id.into() }
                        );
                };

                // Update burned pool tail if needed
                if add_to_burned_pool {
                    self.burned_pool_tail.write(burned_pool_tail);
                }

                // Send NFT transfer logs to mirror if any
                if nft_transfer_logs.len() > 0 {
                    let dispatcher = IDN404MirrorDispatcher {
                        contract_address: self.mirror_erc721.read(),
                    };
                    dispatcher.log_transfer(nft_transfer_logs);
                }
            }

            // Update storage
            self.address_data.write(from, from_data);

            // Emit Transfer event
            self.emit(TransferEvent { from: from, to: Zero::zero(), amount: amount });
            // TODO: afterNFTTransfers hook
        }

        /// Transfers token `id` from `from` to `to`.
        /// Also emits an ERC721 {Transfer} event on the `mirrorERC721`.
        ///
        /// Requirements:
        /// - Token `id` must exist.
        /// - `from` must be the owner of the token.
        /// - `to` cannot be the zero address.
        /// - `msgSender` must be the owner of the token, or be approved to manage the token.
        fn _initiate_transfer_from_nft(
            ref self: ContractState,
            from: ContractAddress,
            to: ContractAddress,
            id: u256,
            msg_sender: ContractAddress
        ) {
            // Emit ERC721 {Transfer} event via mirror contract
            // We do this before _transfer_from_nft since that may trigger additional transfers
            // via the _after_nft_transfers hook. This keeps event sequence consistent.
            let dispatcher = IDN404MirrorDispatcher { contract_address: self.mirror_erc721.read() };

            // Create and send single transfer log
            let mut nft_transfer_logs: Array<NftTransferEvent> = ArrayTrait::new();
            nft_transfer_logs.append(NftTransferEvent { from: from, to: to, id: id, });
            dispatcher.log_transfer(nft_transfer_logs);

            // Execute the NFT transfer
            self._transfer_from_nft(from, to, id, msg_sender);
        }

        fn _transfer_from_nft(
            ref self: ContractState,
            from: ContractAddress,
            to: ContractAddress,
            id: u256,
            msg_sender: ContractAddress
        ) {
            // Basic validation
            assert(!to.is_zero(), errors::TransferToZeroAddress);
            assert(!self.mirror_erc721.read().is_zero(), errors::DNNotInitialized);

            // Verify ownership
            let ownership_index = self._ownership_index(id);
            let owner_alias = self
                .owner_aliases
                .read(ownership_index); // TODO: check if we need _restrictNFTId
            let owner = self.alias_to_address.read(owner_alias);
            assert(from == owner, errors::TransferFromIncorrectOwner);

            // Check approval
            if msg_sender != from {
                let is_approved_for_all = self.operator_approvals.read((from, msg_sender)) != 0;
                if !is_approved_for_all {
                    let approved = self.nft_approvals.read(id);
                    assert(approved == msg_sender, errors::TransferCallerNotOwnerNorApproved);
                }
            }

            // Get storage data
            let mut from_data = self.address_data.read(from);
            let mut to_data = self.address_data.read(to);

            // Update balances
            let unit = self.options.read().unit;
            let from_balance: u256 = from_data.balance.into();
            assert(unit <= from_balance, errors::InsufficientBalance);
            from_data.balance = (from_balance - unit).try_into().expect(errors::BalanceOverflow);
            to_data
                .balance = (to_data.balance.into() + unit)
                .try_into()
                .expect(errors::BalanceOverflow);

            // Clear approvals if they exist
            if self.may_have_nft_approval.read(id) {
                self.may_have_nft_approval.write(id, false);
                self.nft_approvals.write(id, Zero::zero());
            }

            // Update from's owned tokens
            let mut from_owned_length = from_data.owned_length - 1;
            from_data.owned_length = from_owned_length;
            let updated_id = self.owned.entry(from).read(from_owned_length);
            let i = self.owned_indexes.read(id);
            self.owned.entry(from).write(i.into(), updated_id);
            self.owned_indexes.write(updated_id.into(), i); // TODO: check if correctly transferred

            // Update to's owned tokens
            let to_owned_length = to_data.owned_length;
            to_data.owned_length += 1;
            self
                .owned
                .entry(to)
                .write(
                    to_owned_length.try_into().expect(errors::IndexOverflow),
                    id.try_into().expect(errors::TokenIdOverflow)
                );
            let to_alias = self._register_and_resolve_alias(ref to_data, to);
            self._set_owner_alias_and_owned_index(id, to_alias, to_owned_length);

            // Update storage
            self.address_data.write(from, from_data);
            self.address_data.write(to, to_data);

            // Emit Transfer event
            self.emit(TransferEvent { from: from, to: to, amount: unit, });
            // TODO: implement afterNFTTransfers hook if needed
        }

        fn _get_approved(self: @ContractState, id: u256) -> ContractAddress {
            assert(self._exists(id), errors::TokenDoesNotExist);
            self.nft_approvals.read(id)
        }

        fn _approve_nft(
            ref self: ContractState, spender: ContractAddress, id: u256, msg_sender: ContractAddress
        ) -> ContractAddress {
            let index = self._ownership_index(id);
            let alias = self.owner_aliases.read(index);
            let owner = self.alias_to_address.read(alias);

            if msg_sender != owner {
                let is_approved_for_all = self.operator_approvals.read((owner, msg_sender)) != 0;
                assert(is_approved_for_all, errors::ApprovalCallerNotOwnerNorApproved);
            }

            self.nft_approvals.write(id, spender);
            self.may_have_nft_approval.write(id, spender.is_non_zero());

            owner
        }

        fn _set_approval_for_all_nft(
            ref self: ContractState,
            spender: ContractAddress,
            status: bool,
            msg_sender: ContractAddress
        ) {
            self.operator_approvals.write((msg_sender, spender), if status {
                1
            } else {
                0
            },);
        }

        fn _balance_of_nft(self: @ContractState, owner: ContractAddress) -> u256 {
            self.address_data.read(owner).owned_length.into()
        }

        fn _owner_of(self: @ContractState, id: u256) -> ContractAddress {
            assert(self._exists(id), errors::TokenDoesNotExist);
            self._owner_at(id)
        }

        fn _owner_at(self: @ContractState, id: u256) -> ContractAddress {
            // Get the owner alias from the owner_aliases mapping using the ownership index
            let ownership_index = self._ownership_index(id);
            let owner_alias = self.owner_aliases.read(ownership_index);
            // Return the address associated with this alias
            self.alias_to_address.read(owner_alias)
        }

        fn _exists(self: @ContractState, id: u256) -> bool {
            self._owner_at(id) != Zero::zero()
        }


        fn _total_nft_supply(self: @ContractState) -> u256 {
            self.total_nft_supply.read().into()
        }

        fn _token_uri(self: @ContractState, id: u256) -> felt252 {
            // TODO: override by hook
            ''
        }

        fn _set_owner_alias_and_owned_index(
            ref self: ContractState, id: u256, alias: u32, index: u32
        ) {
            let ownership_index = self._ownership_index(id);
            self.owner_aliases.write(ownership_index, alias);
            self.owned_indexes.write(ownership_index, index);
        }

        /// Asserts that the caller is the `mirrorERC721` contract.
        fn assert_caller_is_mirror(ref self: ContractState) {
            assert(get_caller_address() == self.mirror_erc721.read(), errors::CallerNotMirror);
        }
    }
}
