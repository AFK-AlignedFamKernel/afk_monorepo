pub mod UserNameClaimErrors {
    pub const USERNAME_CLAIMED: felt252 = 'Username already claimed';
    pub const USER_HAS_USERNAME: felt252 = 'User already has a username';
    pub const USER_DOESNT_HAVE_USERNAME: felt252 = 'User does not have username';
    pub const SUBSCRIPTION_EXPIRED: felt252 = 'Subscription has expired';
    pub const INVALID_PAYMENT: felt252 = 'Invalid payment amount';
    pub const INVALID_PRICE: felt252 = 'Invalid price setting';
    pub const INVALID_USERNAME: felt252 = 'Invalid username format';
    pub const INVALID_DOMAIN_SUFFIX: felt252 = 'Domain must end with .afk';

}

const ADMIN_ROLE: felt252 = selector!("ADMIN_ROLE");


#[starknet::contract]
pub mod Nameservice {
    use afk::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::interfaces::username_store::IUsernameStore;
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};

    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use starknet::storage::{StoragePointerWriteAccess, StoragePathEntry, Map};
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, get_block_timestamp,
        get_contract_address, ClassHash
    };
    use super::UserNameClaimErrors;
    use super::ADMIN_ROLE;

    const YEAR_IN_SECONDS: u64 = 31536000_u64; // 365 days in seconds

    // Components
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    // component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    /// Ownable
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    /// Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl = AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // // ERC20
    // #[abi(embed_v0)]
    // impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    // #[abi(embed_v0)]
    // impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    // impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    
    #[storage]
    struct Storage {
        usernames: Map::<felt252, ContractAddress>,
        user_to_username: Map::<ContractAddress, felt252>,
        subscription_expiry: Map::<ContractAddress, u64>,
        subscription_price: u256,
        token_quote: ContractAddress,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
        // #[substorage(v0)]
        // erc20: ERC20Component::Storage

    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        UserNameClaimed: UserNameClaimed,
        UserNameChanged: UserNameChanged,
        SubscriptionRenewed: SubscriptionRenewed,
        PriceUpdated: PriceUpdated,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        // #[flat]
        // ERC20Event: ERC20Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameClaimed {
        #[key]
        address: ContractAddress,
        username: felt252,
        expiry: u64
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameChanged {
        #[key]
        address: ContractAddress,
        old_username: felt252,
        new_username: felt252
    }

    #[derive(Drop, starknet::Event)]
    struct SubscriptionRenewed {
        #[key]
        address: ContractAddress,
        expiry: u64
    }

    #[derive(Drop, starknet::Event)]
    struct PriceUpdated {
        old_price: u256,
        new_price: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState,
        owner: ContractAddress,
        admin: ContractAddress
    ) {
        self.ownable.initializer(owner);

        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
    }

    // External interfaces implementation
    // #[external(v0)]
    // impl AccessControlImpl = AccessControlComponent::AccessControlImpl<ContractState>;

    #[external(v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();
            //TODO: Replace class hash
        // self.upgradeable._upgrade(new_class_hash);
        }
    }

    #[abi(embed_v0)]
    impl Nameservice of IUsernameStore<ContractState> {
        fn claim_username(ref self: ContractState, key: felt252) {
            let caller_address = get_caller_address();
            let current_time = get_block_timestamp();

            // Check for user having username
            assert(
                self.user_to_username.read(caller_address) == 0,
                UserNameClaimErrors::USER_HAS_USERNAME
            );

            // Check for availability
            let username_address = self.usernames.read(key);
            assert(
                username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            // Payment
            let price = self.subscription_price.read();
            let payment_token = IERC20Dispatcher { contract_address: self.token_quote.read() };
            payment_token.transfer_from(caller_address, get_contract_address(), price);

            let expiry = current_time + YEAR_IN_SECONDS;
            self.usernames.entry(key).write(caller_address);
            self.user_to_username.entry(caller_address).write(key);
            self.subscription_expiry.entry(caller_address).write(expiry);

            self.emit(UserNameClaimed { username: key, address: caller_address, expiry });
        }

        fn change_username(ref self: ContractState, new_username: felt252) {
            let caller_address = get_caller_address();
            let current_time = get_block_timestamp();
            let old_username = self.user_to_username.read(caller_address);
            assert(old_username != 0, UserNameClaimErrors::USER_DOESNT_HAVE_USERNAME);
            let expiry = self.subscription_expiry.read(caller_address);
            assert(current_time < expiry, UserNameClaimErrors::SUBSCRIPTION_EXPIRED);

            let new_username_address = self.usernames.read(new_username);
            assert(
                new_username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            // Update username mappings
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

        fn renew_subscription(ref self: ContractState) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let current_expiry = self.subscription_expiry.read(caller);

            // Payment
            let price = self.subscription_price.read();
            let payment_token = IERC20Dispatcher { contract_address: self.token_quote.read() };
            payment_token.transfer_from(caller, get_contract_address(), price);

            let new_expiry = max(current_time, current_expiry) + YEAR_IN_SECONDS;
            self.subscription_expiry.write(caller, new_expiry);

            self.emit(SubscriptionRenewed { address: caller, expiry: new_expiry });
        }


        fn withdraw_fees(ref self: ContractState, amount: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            let token = IERC20Dispatcher { contract_address: self.token_quote.read() };
            token.transfer(self.ownable.owner(), amount);
        }
    }

    // Admin functions
    #[external(v0)]
    fn update_subscription_price(ref self: ContractState, new_price: u256) {
        self.accesscontrol.assert_only_role(ADMIN_ROLE);
        assert(new_price > 0, UserNameClaimErrors::INVALID_PRICE);
    
        let old_price = self.subscription_price.read();
        self.subscription_price.write(new_price);
    
        self.emit(PriceUpdated { old_price, new_price });
    }
    
    #[external(v0)]
    fn set_token_quote(ref self: ContractState, token_quote: ContractAddress) {
        self.accesscontrol.assert_only_role(ADMIN_ROLE);
        self.token_quote.write(token_quote);
    }
    
    
    //Internal function to check the maximum of two
    #[generate_trait]
    fn max(a: u64, b: u64) -> u64 {
        if a > b {
            a
        } else {
            b
        }
    }
}
