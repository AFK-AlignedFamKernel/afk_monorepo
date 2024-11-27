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
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");


#[starknet::contract]
pub mod Nameservice {
    use afk::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::interfaces::nameservice::INameservice;
    // use afk::interfaces::username_store::INameservice;
    use openzeppelin::access::ownable::OwnableComponent;

    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use openzeppelin_access::accesscontrol::AccessControlComponent;

    use openzeppelin_governance::votes::VotesComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component};
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::storage::{StoragePointerWriteAccess, StoragePathEntry, Map};
    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, get_block_timestamp,
        get_contract_address, ClassHash
    };
    use super::ADMIN_ROLE;
    use super::MINTER_ROLE;
    use super::UserNameClaimErrors;

    const YEAR_IN_SECONDS: u64 = 31536000_u64; // 365 days in seconds

    // Components
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    component!(path: VotesComponent, storage: erc20_votes, event: ERC20VotesEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);
    /// Ownable
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    /// Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // // Nonces
    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    // Votes
    #[abi(embed_v0)]
    impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // #[abi(embed_v0)]
    // impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    // impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    // Storage

    #[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
    pub struct NameserviceStorage {
        pub owner: ContractAddress,
        pub username: felt252,
        pub expiry: u64,
        pub is_claimed: bool
    }

    #[derive(Drop, Debug, Serde, Copy, starknet::Store, PartialEq)]
    pub struct Auction {
        pub minimal_price: u256,
        pub is_accepted_price_reached: bool,
        pub highest_bid: u256,
        pub highest_bidder: ContractAddress
    }

    #[derive(Drop, Debug, Serde, Copy, starknet::Store, PartialEq)]
    struct Order {
        bidder: ContractAddress,
        amount: u256,
    }

    #[storage]
    struct Storage {
        usernames: Map::<felt252, ContractAddress>,
        user_to_username: Map::<ContractAddress, felt252>,
        usernames_claimed_by_user: Map<ContractAddress, Map<felt252, NameserviceStorage>>,
        subscription_expiry: Map::<ContractAddress, u64>,
        username_storage: Map::<felt252, NameserviceStorage>,
        auctions: Map::<felt252, Auction>,
        orders: Map<felt252, Order>,
        order_count: Map<felt252, u64>,
        order_return: Map::<ContractAddress, u256>,
        subscription_price: u256,
        token_quote: ContractAddress,
        is_payment_enabled: bool,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        nonces: NoncesComponent::Storage,
        #[substorage(v0)]
        erc20_votes: VotesComponent::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        UsernameClaimed: UsernameClaimed,
        UsernameChanged: UsernameChanged,
        SubscriptionRenewed: SubscriptionRenewed,
        PriceUpdated: PriceUpdated,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        #[flat]
        ERC20VotesEvent: VotesComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    #[derive(Drop, starknet::Event)]
    struct UsernameClaimed {
        #[key]
        address: ContractAddress,
        username: felt252,
        expiry: u64,
        paid: u256,
        quote_token: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct UsernameChanged {
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


    // Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `after_update` hook of the `ERC20Component::ERC20HooksTrait`.
    impl ERC20VotesHooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            let mut contract_state = ERC20Component::HasComponent::get_contract_mut(ref self);
            contract_state.erc20_votes.transfer_voting_units(from, recipient, amount);
        }
    }


    #[external(v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();
            self.accesscontrol.assert_only_role(ADMIN_ROLE);

            //TODO: Replace class hash
            self.upgradeable.upgrade(new_class_hash);
        }
    }


    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        admin: ContractAddress,
        subscription_price: u256,
        token_quote: ContractAddress,
        is_payment_enabled: bool
    ) {
        self.ownable.initializer(owner);

        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
        self.subscription_price.write(subscription_price);
        self.token_quote.write(token_quote);

        self.is_payment_enabled.write(is_payment_enabled);
        self.accesscontrol._grant_role(MINTER_ROLE, admin);
        self.accesscontrol._grant_role(MINTER_ROLE, get_contract_address());
        self.erc20.initializer(".afk", ".afk");
        // self.erc20.mint(owner, 1n);
    }


    #[abi(embed_v0)]
    impl Nameservice of INameservice<ContractState> {
        // Getters
        fn get_username(self: @ContractState, address: ContractAddress) -> felt252 {
            self.user_to_username.read(address)
        }

        fn get_username_address(self: @ContractState, key: felt252) -> ContractAddress {
            self.usernames.read(key)
        }

        fn get_token_quote(self: @ContractState) -> ContractAddress {
            self.token_quote.read()
        }

        fn get_is_payment_enabled(self: @ContractState) -> bool {
            self.is_payment_enabled.read()
        }

        fn get_subscription_price(self: @ContractState) -> u256 {
            self.subscription_price.read()
        }

        // Users call

        fn claim_username(ref self: ContractState, key: felt252) {
            let caller_address = get_caller_address();
            let current_time = get_block_timestamp();

            let price = self.subscription_price.read();
            let quote_token = self.token_quote.read();

            let username_storage = self.username_storage.entry(key);

            //   TODO uncomment. User can claimed few users name.
            // Check for user having username
            // assert(
            //     self.user_to_username.read(caller_address) == 0,
            //     UserNameClaimErrors::USER_HAS_USERNAME
            // );

            // Check for availability
            let username_address = self.usernames.read(key);
            assert(
                username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            // Payment
            if self.is_payment_enabled.read() {
                let payment_token = IERC20Dispatcher { contract_address: quote_token };
                payment_token.transfer_from(caller_address, get_contract_address(), price);
            }

            let expiry = current_time + YEAR_IN_SECONDS;
            self.usernames.entry(key).write(caller_address);
            self.user_to_username.entry(caller_address).write(key);

            let name_claimed = NameserviceStorage {
                owner: caller_address, username: key, expiry: expiry, is_claimed: true
            };
            self.username_storage.entry(key).write(name_claimed);

            self.subscription_expiry.entry(caller_address).write(expiry);

            self.erc20.mint(caller_address, 1_u256);
            self
                .emit(
                    UsernameClaimed {
                        username: key,
                        address: caller_address,
                        expiry,
                        paid: price,
                        quote_token: quote_token
                    }
                );
        }

        // TODO change main username
        fn change_main_username(ref self: ContractState, new_username: felt252) {}
        // TODO
        fn create_auction_for_username(
            ref self: ContractState,
            username: felt252,
            minimal_price: u256,
            is_accepted_price_reached: bool
        ) {
            let caller_address = get_caller_address();
            let username_address = self.get_username_address(username);

            assert(username_address == caller_address, 'Username not callers');

            let existing_auction = self.auctions.read(username);
            assert(existing_auction.minimal_price == 0, 'Auction does not exist');

            // Create a new auction
            let new_auction = Auction {
                minimal_price: minimal_price,
                is_accepted_price_reached: is_accepted_price_reached,
                highest_bid: 0,
                highest_bidder: contract_address_const::<0>(),
            };

            // Store the auction
            self.auctions.write(username, new_auction);
        }

        // TODO
        fn place_order(ref self: ContractState, username: felt252, amount: u256) {

            let auction = self.auctions.read(username);
            assert(auction.minimal_price > 0, 'Auction does not exist');
            assert(amount > auction.highest_bid, 'Bid too low');

            // Create a new order
            let bidder = get_caller_address();
            let quote_token = self.token_quote.read();

             // check if new bidder alredy has an outbidded amount (still in the contract)
            let bidder_amount = self.order_return.read(bidder);
            self.order_return.entry(bidder).write(0);
            let new_amount = amount - bidder_amount;

            if self.is_payment_enabled.read() {
                let payment_token = IERC20Dispatcher { contract_address: quote_token };
                payment_token.transfer_from(bidder, get_contract_address(), new_amount);
            }

            let order_id = self.order_count.read(username) + 1;
            let new_order = Order { bidder: bidder, amount: new_amount };

            let old_order = self.orders.read(username);

            // Store the order
            self.orders.write(username, new_order);
            self.order_count.write(username, order_id);

            let order_return_amount = self.order_return.read(old_order.bidder);
            println!(" order_return_amount: {:?}", order_return_amount);
            self.order_return.entry(old_order.bidder).write((order_return_amount + old_order.amount));

            // Update auction if this is the highest bid
            let mut updated_auction = auction;
            updated_auction.highest_bid = amount;
            updated_auction.highest_bidder = bidder;
            self.auctions.write(username, updated_auction);
        }
        
        
        // TODO
        fn accept_order(ref self: ContractState, username: felt252, id: u64) {}

        // TODO
        fn cancel_order(ref self: ContractState, username: felt252, id: u64) {
        }

        fn get_auction(self: @ContractState, username: felt252) -> Auction {
            // Read the auction from storage
            let auction = self.auctions.read(username);
            auction
        }

        // TODO
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


        fn change_username(ref self: ContractState, new_username: felt252) {
            let caller_address = get_caller_address();
            let current_time = get_block_timestamp();
            let old_username = self.user_to_username.read(caller_address);
            assert(old_username != 0, UserNameClaimErrors::USER_DOESNT_HAVE_USERNAME);
            let expiry = self.subscription_expiry.read(caller_address);
            assert(current_time < expiry, UserNameClaimErrors::SUBSCRIPTION_EXPIRED);

            let new_username_address = self.usernames.read(new_username);
            // TODO check if claimd and expiry is not finish too
            let username_storage = self.username_storage.entry(new_username);

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
                    UsernameChanged {
                        old_username: old_username,
                        new_username: new_username,
                        address: caller_address
                    }
                );
        }


        // ADMIN
        // Admin functions
        fn update_subscription_price(ref self: ContractState, new_price: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            assert(new_price > 0, UserNameClaimErrors::INVALID_PRICE);

            let old_price = self.subscription_price.read();
            self.subscription_price.write(new_price);

            self.emit(PriceUpdated { old_price, new_price });
        }

        fn set_token_quote(ref self: ContractState, token_quote: ContractAddress) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.token_quote.write(token_quote);
        }

        fn set_is_payment_enabled(ref self: ContractState, new_status: bool) -> bool {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            self.is_payment_enabled.write(new_status);
            new_status
        }


        fn get_subscription_expiry(self: @ContractState, address: ContractAddress) -> u64 {
            self.subscription_expiry.read(address)
        }

        

        fn withdraw_fees(ref self: ContractState, amount: u256) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            let token = IERC20Dispatcher { contract_address: self.token_quote.read() };
            token.transfer(self.ownable.owner(), amount);
        }
    }

    // #[abi(embed_v0)]
    // impl IERC20MintableImpl of super::IERC20<ContractState> {
    //     fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
    //         self.accesscontrol.assert_only_role(MINTER_ROLE);
    //         self.erc20.mint(recipient, amount);
    //     }

    //     fn burn(ref self: ContractState, recipient: ContractAddress, amount: u256) {
    //         self.accesscontrol.assert_only_role(MINTER_ROLE);
    //         self.erc20.burn(recipient, amount);
    //     }
    //     fn set_role(
    //         ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool
    //     ) {
    //         self._set_role(recipient, role, is_enable);
    //     }
    // }

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
