//TODO(low prio): implement fallback mechanism for snake_case entrypoints
//TODO(low prio): implement a recover functions for tokens wrongly sent to the contract

#[starknet::contract]
pub mod LockManager {
    use afk_launchpad::launchpad::locker::errors;
    use afk_launchpad::launchpad::locker::interface::ILockManager;

    use core::num::traits::Zero;
    use core::starknet::SyscallResultTrait;
    use core::starknet::event::EventEmitter;
    use core::starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, Map, StoragePathEntry, MutableVecTrait,
        Vec, VecTrait
    };
    use core::traits::TryInto;
    use openzeppelin::token::erc20::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};

    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, get_contract_address,
        get_block_timestamp, Store, ClassHash
    };

    #[storage]
    struct Storage {
        min_lock_time: u64,
        lock_nonce: u128,
        locks: Map<ContractAddress, TokenLock>,
        lock_position_class_hash: ClassHash,
        user_locks: Map<(ContractAddress, ContractAddress), bool>,
        token_locks: Map<(ContractAddress, ContractAddress), bool>,
        user_locks_list: Map<ContractAddress, Vec<ContractAddress>>,
        token_locks_list: Map<ContractAddress, Vec<ContractAddress>>,
    }

    /// Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TokenLocked: TokenLocked,
        TokenUnlocked: TokenUnlocked,
        TokenWithdrawn: TokenWithdrawn,
        LockOwnershipTransferred: LockOwnershipTransferred,
        LockDurationIncreased: LockDurationIncreased,
        LockAmountIncreased: LockAmountIncreased
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokenLocked {
        #[key]
        pub lock_address: ContractAddress,
        pub token: ContractAddress,
        pub owner: ContractAddress,
        pub amount: u256,
        pub unlock_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokenUnlocked {
        #[key]
        pub lock_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokenWithdrawn {
        #[key]
        pub lock_address: ContractAddress,
        pub amount: u256
    }

    #[derive(Drop, starknet::Event)]
    struct LockOwnershipTransferred {
        #[key]
        lock_address: ContractAddress,
        new_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct LockDurationIncreased {
        #[key]
        lock_address: ContractAddress,
        new_unlock_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct LockAmountIncreased {
        lock_address: ContractAddress,
        amount_to_increase: u256
    }

    #[derive(Drop, Copy, starknet::Store, Serde, PartialEq)]
    pub struct TokenLock {
        pub token: ContractAddress,
        pub owner: ContractAddress,
        pub unlock_time: u64,
    }

    #[derive(Drop, Copy, PartialEq, starknet::Store, Serde)]
    pub struct LockPosition {
        pub token: ContractAddress,
        pub amount: u256,
        pub owner: ContractAddress,
        pub unlock_time: u64
    }

    /// Initializes a new instance of a LockManager contract.  The constructor
    /// sets the minimum lock time for all locks created by this contract.
    ///
    /// # Arguments
    ///
    /// * `min_lock_time` - The minimum lock time applicable to all locks
    ///  created by this contract.
    /// * `lock_position_class_hash` - The class hash of the lock position contract deployed.
    #[constructor]
    fn constructor(
        ref self: ContractState, min_lock_time: u64, lock_position_class_hash: ClassHash
    ) {
        self.min_lock_time.write(min_lock_time);
        self.lock_position_class_hash.write(lock_position_class_hash);
    }

    #[abi(embed_v0)]
    impl LockManager of ILockManager<ContractState> {
        fn lock_tokens(
            ref self: ContractState,
            token: ContractAddress,
            amount: u256,
            unlock_time: u64,
            withdrawer: ContractAddress
        ) -> ContractAddress {
            assert(amount != 0, errors::ZERO_AMOUNT);
            assert(token.into() != 0_felt252, errors::ZERO_TOKEN);
            assert(withdrawer.into() != 0_felt252, errors::ZERO_WITHDRAWER);
            assert(unlock_time < 10000000000, errors::LOCK_NOT_IN_SECONDS);
            assert(
                unlock_time >= get_block_timestamp() + self.min_lock_time.read(),
                errors::LOCK_TOO_SHORT
            );

            self._proceed_lock(token, withdrawer, amount, unlock_time)
        }

        fn extend_lock(
            ref self: ContractState, lock_address: ContractAddress, new_unlock_time: u64
        ) {
            self.assert_only_lock_owner(lock_address);

            assert(new_unlock_time >= get_block_timestamp(), errors::UNLOCK_IN_PAST);
            assert(new_unlock_time < 10000000000, errors::LOCK_NOT_IN_SECONDS);

            let mut token_lock = self.locks.read(lock_address);
            assert(new_unlock_time > token_lock.unlock_time, errors::LOCKTIME_NOT_INCREASED);
            token_lock.unlock_time = new_unlock_time;
            self.locks.write(lock_address, token_lock);

            self.emit(LockDurationIncreased { lock_address, new_unlock_time });
        }

        fn increase_lock_amount(
            ref self: ContractState, lock_address: ContractAddress, amount_to_increase: u256
        ) {
            self.assert_only_lock_owner(lock_address);

            assert(amount_to_increase != 0, errors::ZERO_AMOUNT);
            let mut token_lock = self.locks.read(lock_address);

            ERC20ABIDispatcher { contract_address: token_lock.token }
                .transferFrom(get_caller_address(), lock_address, amount_to_increase);
            self.emit(LockAmountIncreased { lock_address, amount_to_increase });
        }

        fn withdraw(ref self: ContractState, lock_address: ContractAddress) {
            let token_lock = self.locks.read(lock_address);
            let actual_balance = ERC20ABIDispatcher { contract_address: token_lock.token }
                .balanceOf(lock_address);
            self.partial_withdraw(lock_address, actual_balance);
        }

        fn partial_withdraw(ref self: ContractState, lock_address: ContractAddress, amount: u256) {
            self.assert_only_lock_owner(lock_address);

            let token_lock = self.locks.read(lock_address);
            let actual_balance = ERC20ABIDispatcher { contract_address: token_lock.token }
                .balanceOf(lock_address);

            assert(amount <= actual_balance, errors::WITHDRAW_AMOUNT_TOO_HIGH);
            assert(get_block_timestamp() >= token_lock.unlock_time, errors::STILL_LOCKED);

            // Effects
            let owner = token_lock.owner;

            if actual_balance == amount {
                // Position has been fully withdrawn
                self
                    .locks
                    .write(
                        lock_address,
                        TokenLock {
                            token: contract_address_const::<0>(),
                            owner: contract_address_const::<0>(),
                            unlock_time: 0
                        }
                    );

                // Remove lock from user and token lists -> Set lock to false
                self.remove_user_lock(owner, lock_address);
                self.remove_token_lock(token_lock.token, lock_address);

                self.emit(TokenUnlocked { lock_address });
            }

            // Interactions
            ERC20ABIDispatcher { contract_address: token_lock.token }
                .transferFrom(lock_address, owner, amount);
            self.emit(TokenWithdrawn { lock_address, amount });
        }

        fn transfer_lock(
            ref self: ContractState, lock_address: ContractAddress, new_owner: ContractAddress
        ) {
            self.assert_only_lock_owner(lock_address);
            assert(new_owner.into() != 0_felt252, errors::ZERO_WITHDRAWER);

            let mut token_lock = self.locks.read(lock_address);

            // Update owner's lock lists
            self.remove_user_lock(token_lock.owner, lock_address);
            self.user_locks.entry((new_owner, lock_address)).write(true);

            // Update lock details
            token_lock.owner = new_owner;
            self.locks.write(lock_address, token_lock);

            self.emit(LockOwnershipTransferred { lock_address: lock_address, new_owner });
        }

        fn get_lock_details(self: @ContractState, lock_address: ContractAddress) -> LockPosition {
            let token_lock = self.locks.read(lock_address);
            if token_lock.token.is_zero() {
                return LockPosition {
                    token: contract_address_const::<0>(),
                    amount: 0,
                    owner: contract_address_const::<0>(),
                    unlock_time: 0
                };
            }

            let actual_balance = ERC20ABIDispatcher { contract_address: token_lock.token }
                .balanceOf(lock_address);

            LockPosition {
                token: token_lock.token,
                amount: actual_balance,
                owner: token_lock.owner,
                unlock_time: token_lock.unlock_time
            }
        }

        fn get_remaining_time(self: @ContractState, lock_address: ContractAddress) -> u64 {
            let token_lock = self.locks.read(lock_address);
            let time = get_block_timestamp();
            if time < token_lock.unlock_time {
                return token_lock.unlock_time - time;
            }
            return 0;
        }

        fn get_min_lock_time(self: @ContractState) -> u64 {
            self.min_lock_time.read()
        }

        fn user_locks_length(self: @ContractState, user: ContractAddress) -> u32 {
            // Only count active locks
            let mut active_count = 0;
            let mut i = 0;
            
            while i < self.user_locks_list.entry(user).len() {
                let lock_address = self.user_locks_list.entry(user).at(i).read();

                if self.user_locks.entry((user, lock_address)).read() {
                    active_count += 1;
                }
                i += 1;
            };
            
            active_count
        }

        fn user_lock_at(
            self: @ContractState, user: ContractAddress, index: u32
        ) -> ContractAddress {
            // Return only active locks
            let mut active_index = 0;
            let mut i = 0;
            let mut user_lock = contract_address_const::<0>();
            
            while i < self.user_locks_list.entry(user).len() {
                let lock_address = self.user_locks_list.entry(user).at(i).read();

                if self.user_locks.entry((user, lock_address)).read() {
                    if active_index == index {
                        user_lock = lock_address;
                        break;
                    }
                    active_index += 1;
                }
                i += 1;
            };

            user_lock
        }

        fn token_locks_length(self: @ContractState, token: ContractAddress) -> u32 {
            // Only count active locks
            let mut active_count = 0;
            let mut i = 0;
            
            while i < self.token_locks_list.entry(token).len() {
                let lock_address = self.token_locks_list.entry(token).at(i).read();

                if self.token_locks.entry((token, lock_address)).read() {
                    active_count += 1;
                }
                i += 1;
            };
            
            active_count
        }

        fn token_locked_at(
            self: @ContractState, token: ContractAddress, index: u32
        ) -> ContractAddress {
            // Return only active locks
            let mut active_index = 0;
            let mut i = 0;
            let mut token_lock = contract_address_const::<0>();
            
            while i < self.token_locks_list.entry(token).len() {
                let lock_address = self.token_locks_list.entry(token).at(i).read();

                if self.token_locks.entry((token, lock_address)).read() {
                    if active_index == index {
                        token_lock = lock_address;
                        break;
                    }
                    active_index += 1;
                }
                i += 1;
            };

            token_lock
        }
    }

    #[generate_trait]
    impl InternalLockerImpl of InternalLockerTrait {
        /// Ensures that the caller is the owner of the specified lock.
        ///
        /// # Arguments
        ///
        /// * `lock_address` - The ID of the lock.
        ///
        /// # Panics
        ///
        /// This function will panic if:
        ///
        /// * The caller's address is not the same as the `owner` of the `TokenLock` (error code:
        /// `errors::NOT_LOCK_OWNER`).
        ///
        fn assert_only_lock_owner(self: @ContractState, lock_address: ContractAddress) {
            let token_lock = self.locks.read(lock_address);
            assert(get_caller_address() == token_lock.owner, errors::NOT_LOCK_OWNER);
        }

        /// Performs the logic to lock the tokens.
        ///
        /// This function creates a `TokenLock` instance and writes it to the `locks` mapping of the
        /// contract.
        /// It also increments the `lock_nonce` of the contract, which represents the amount of
        /// locks created.
        /// The function then transfers the specified `amount` of tokens from the caller to the
        /// contract.
        /// Finally, it emits a `TokenLocked` event.
        ///
        /// # Arguments
        ///
        /// * `token` - The address of the token contract.
        /// * `withdrawer` - The address that can withdraw the tokens after the `unlock_time`.
        /// * `amount` - The amount of tokens to be locked.
        /// * `unlock_time` - The time (in seconds) when the tokens can be unlocked.
        ///
        /// # Returns
        ///
        /// * `ContractAddress` - The address of the new lock.
        ///
        /// # Panics
        ///
        /// This function will panic if:
        ///
        /// * The `transferFrom` call to the ERC20 token contract fails.
        ///
        fn _proceed_lock(
            ref self: ContractState,
            token: ContractAddress,
            withdrawer: ContractAddress,
            amount: u256,
            unlock_time: u64
        ) -> ContractAddress {
            let token_lock = TokenLock { token, owner: withdrawer, unlock_time: unlock_time };

            let lock_nonce = self.lock_nonce.read() + 1;
            self.lock_nonce.write(lock_nonce);

            // Deploy a lock position contract that will receive the tokens.
            // This makes accountability for fee accrual easier,
            // as the tokens are not stored all together in the lock manager contract.
            let (lock_address, _) = deploy_syscall(
                self.lock_position_class_hash.read(),
                lock_nonce.into(),
                array![token.into()].span(),
                false
            )
                .unwrap_syscall();

            self.user_locks.entry((withdrawer, lock_address)).write(true);
            self.token_locks.entry((token, lock_address)).write(true);

            // Add to user lock lists
            self.user_locks_list.entry(withdrawer).append().write(lock_address);

            // Add to user lock lists
            self.token_locks_list.entry(token).append().write(lock_address);

            self.locks.write(lock_address, token_lock);

            ERC20ABIDispatcher { contract_address: token }
                .transferFrom(get_caller_address(), lock_address, amount);

            self.emit(TokenLocked { lock_address, token, owner: withdrawer, amount, unlock_time });

            return lock_address;
        }

        /// Sets user_locks Map<> with a given key to false
        /// Internally, this function updates the Map<> of locks of the specified `owner` and
        /// `lock_address`
        /// it set's it to false, which indicates that the lock is no longer available
        fn remove_user_lock(
            ref self: ContractState, owner: ContractAddress, lock_address: ContractAddress
        ) {
            self.user_locks.entry((owner, lock_address)).write(false);
        }

        fn remove_token_lock(
            ref self: ContractState, token: ContractAddress, lock_address: ContractAddress
        ) {
            self.token_locks.entry((token, lock_address)).write(false);
        }
    }
}
