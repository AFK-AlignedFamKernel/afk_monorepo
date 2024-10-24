pub mod UserNameClaimErrors {
    pub const USERNAME_CLAIMED: felt252 = 'Username already claimed';
    pub const USER_HAS_USERNAME: felt252 = 'User already has a username';
    pub const USER_DOESNT_HAVE_USERNAME: felt252 = 'User does not have a username';
}

#[starknet::contract]
pub mod Nameservice {
    use afk::interfaces::username_store::IUsernameStore;
    use starknet::storage::{StoragePointerWriteAccess, StoragePathEntry, Map};
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, get_block_timestamp
    };
    use super::UserNameClaimErrors;

    #[storage]
    struct Storage {
        usernames: Map::<felt252, ContractAddress>,
        user_to_username: Map::<ContractAddress, felt252>,
        subscription_price: u256,
        token_quote: ContractAddress
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UserNameClaimed: UserNameClaimed,
        UserNameChanged: UserNameChanged
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameClaimed {
        #[key]
        address: ContractAddress,
        username: felt252,
        timestamp: u64
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameChanged {
        #[key]
        address: ContractAddress,
        old_username: felt252,
        new_username: felt252
    }

    #[abi(embed_v0)]
    impl Nameservice of IUsernameStore<ContractState> {
        fn claim_username(ref self: ContractState, key: felt252) {
            let caller_address = get_caller_address();

            // TODO add yearly timestamp subscription
            assert(
                self.user_to_username.read(caller_address) == 0,
                UserNameClaimErrors::USER_HAS_USERNAME
            );

            let username_address = self.usernames.read(key);
            assert(
                username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            self.usernames.entry(key).write(caller_address);
            self.user_to_username.entry(caller_address).write(key);

            self
                .emit(
                    UserNameClaimed {
                        username: key, address: caller_address, timestamp: get_block_timestamp()
                    }
                );
        }

        fn change_username(ref self: ContractState, new_username: felt252) {
            let caller_address = get_caller_address();
            let old_username = self.user_to_username.read(caller_address);
            assert(old_username != 0, UserNameClaimErrors::USER_DOESNT_HAVE_USERNAME);

            let new_username_address = self.usernames.read(new_username);
            assert(
                new_username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            self.usernames.entry(old_username).write(contract_address_const::<0>());
            self.usernames.entry(new_username).write(caller_address);
            self.user_to_username.entry(caller_address).write(new_username);

            self
                .emit(
                    UserNameChanged {
                        old_username: old_username,
                        new_username: new_username,
                        address: caller_address
                    }
                );
        }

        fn get_username(self: @ContractState, address: ContractAddress) -> felt252 {
            self.user_to_username.read(address)
        }

        fn get_username_address(self: @ContractState, key: felt252) -> ContractAddress {
            self.usernames.read(key)
        }
    }
}
