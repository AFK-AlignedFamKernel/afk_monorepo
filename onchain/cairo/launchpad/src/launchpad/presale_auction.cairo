use integer::{U256, U256TryIntoFelt252};
use openzeppelin::access::ownable::OwnableComponent;
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};

#[starknet::interface]
pub trait IDutchAuction<TContractState> {
    fn get_current_price(self: @TContractState) -> u256;

    fn buy_tokens(ref self: TContractState, amount_tokens_to_buy: u256);

    fn claim_unsold_tokens(ref self: TContractState);

    fn withdraw_payment(ref self: TContractState);

    fn get_auction_details(
        self: @TContractState,
    ) -> (ContractAddress, ContractAddress, u64, u64, u256, u256, u256, u256);
}

#[starknet::contract]
/// Implements a Dutch auction contract for ERC20 token presales.
///
/// This contract allows an owner to set up an auction where the price of a token
/// starts high and decreases linearly over a set duration until a minimum price
/// is reached. Users can buy tokens at the current price by sending payment tokens
/// (typically an ETH wrapper) after approving the contract. The owner can withdraw
/// collected payments and claim unsold tokens after the auction concludes.
mod DutchAuction {
    use super::*;

    component!(path: OwnableComponent, storage: owner, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;

    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    /// Defines the storage variables for the Dutch Auction contract.
    #[storage]
    struct Storage {
        /// Storage for the Ownable component, tracking the owner.
        #[substorage(v0)]
        owner: OwnableComponent::Storage,
        /// The address of the ERC20 token being sold in the auction.
        token_for_sale_address: ContractAddress,
        /// The address of the ERC20 token used for payment (e.g., ETH wrapper).
        payment_token_address: ContractAddress,
        /// The block timestamp when the auction officially starts.
        start_time: u64,
        /// The duration of the auction in seconds.
        duration: u64,
        /// The price per token at the start of the auction, denominated in the payment token.
        start_price: u256,
        /// The minimum price per token, reached at the end of the auction duration.
        end_price: u256,
        /// The total amount of tokens offered for sale in this auction.
        total_tokens_for_sale: u256,
        /// A counter tracking the cumulative amount of tokens sold so far.
        tokens_sold: u256,
    }

    /// Defines the events emitted by the Dutch Auction contract.
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        /// Event emitted by the embedded Ownable component.
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        /// Emitted when the auction is successfully created and configured.
        AuctionCreated: AuctionCreated,
        /// Emitted when a user successfully purchases tokens.
        TokensPurchased: TokensPurchased,
        /// Emitted when the owner claims unsold tokens after the auction ends.
        AuctionEndedAndTokensClaimed: AuctionEndedAndTokensClaimed,
        /// Emitted when the owner withdraws the collected payment tokens.
        PaymentWithdrawn: PaymentWithdrawn,
    }

    /// Event details for when the auction is created.
    #[derive(Drop, starknet::Event)]
    struct AuctionCreated {
        start_time: u64,
        duration: u64,
        start_price: u256,
        end_price: u256,
        total_tokens_for_sale: u256,
        token_for_sale: ContractAddress,
        payment_token: ContractAddress,
    }

    /// Event details for when tokens are purchased.
    #[derive(Drop, starknet::Event)]
    struct TokensPurchased {
        buyer: ContractAddress,
        amount_tokens: u256,
        price_per_token: u256,
        total_payment: u256,
    }

    /// Event details for when unsold tokens are claimed.
    #[derive(Drop, starknet::Event)]
    struct AuctionEndedAndTokensClaimed {
        unsold_tokens_claimed: u256,
    }

    /// Event details for when collected payments are withdrawn.
    #[derive(Drop, starknet::Event)]
    struct PaymentWithdrawn {
        amount: u256,
    }

    /// Defines constant felt252 error messages for cleaner assertions.
    mod Errors {
        const AUCTION_NOT_STARTED: felt252 = 'Auction: Not started yet';
        const AUCTION_ENDED: felt252 = 'Auction: Already ended';
        const INVALID_AMOUNT: felt252 = 'Auction: Invalid amount';
        const INSUFFICIENT_TOKENS: felt252 = 'Auction: Not enough tokens left';
        const DURATION_ZERO: felt252 = 'Auction: Duration cannot be 0';
        const PRICE_ORDER: felt252 = 'Auction: Start price < end price';
        const SUPPLY_ZERO: felt252 = 'Auction: Supply cannot be 0';
        const ALREADY_ENDED: felt252 =
            'Auction: Already ended'; // Used potentially? Replaced by AUCTION_ENDED generally
        const NOT_ENDED: felt252 = 'Auction: Not ended yet';
        const ZERO_BALANCE: felt252 = 'Auction: No payment to withdraw';
    }


    /// Initializes the Dutch Auction contract state.
    ///
    /// Sets up the auction parameters, configures ownership, and emits the `AuctionCreated` event.
    /// The deployer must ensure the contract address receives the `total_tokens` of the
    /// `token_for_sale` after deployment for the auction to function correctly.
    ///
    /// # Parameters
    /// - `initial_owner`: `ContractAddress` - The address designated as the owner of the contract.
    /// - `token_for_sale`: `ContractAddress` - The ERC20 token address being sold.
    /// - `payment_token`: `ContractAddress` - The ERC20 token address used for payment (e.g., ETH
    /// wrapper).
    /// - `start_price`: `u256` - The initial price per token sold, in units of the payment token.
    /// - `end_price`: `u256` - The minimum price per token sold, reached at the auction's end.
    /// - `duration_seconds`: `u64` - The total duration of the auction in seconds.
    /// - `total_tokens`: `u256` - The total amount of `token_for_sale` available in this auction.
    ///
    /// # Panics
    /// - If `duration_seconds` is 0 (`Errors::DURATION_ZERO`).
    /// - If `start_price` is less than `end_price` (`Errors::PRICE_ORDER`).
    /// - If `total_tokens` is 0 (`Errors::SUPPLY_ZERO`).
    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_owner: ContractAddress,
        token_for_sale: ContractAddress,
        payment_token: ContractAddress,
        start_price: u256,
        end_price: u256,
        duration_seconds: u64,
        total_tokens: u256,
    ) {
        // Initialize Ownable component
        self.owner.initializer(initial_owner);

        // Validate inputs
        assert(duration_seconds > 0, Errors::DURATION_ZERO);
        assert(start_price >= end_price, Errors::PRICE_ORDER);
        assert(total_tokens > 0, Errors::SUPPLY_ZERO);

        // Store configuration
        self.token_for_sale_address.write(token_for_sale);
        self.payment_token_address.write(payment_token);
        self.start_price.write(start_price);
        self.end_price.write(end_price);
        self.duration.write(duration_seconds);
        self.total_tokens_for_sale.write(total_tokens);

        // Set start time and initial sold count
        self.start_time.write(get_block_timestamp());
        self.tokens_sold.write(0);

        // Emit event
        self
            .emit(
                AuctionCreated {
                    start_time: self.start_time.read(),
                    duration: duration_seconds,
                    start_price: start_price,
                    end_price: end_price,
                    total_tokens_for_sale: total_tokens,
                    token_for_sale: token_for_sale,
                    payment_token: payment_token,
                },
            );
    }

    #[abi(embed_v0)]
    impl DutchAuctionImpl of IDutchAuction<ContractState> {
        /// Calculates the current price per token based on the time elapsed since the auction
        /// start.
        ///
        /// The price decreases linearly from `start_price` to `end_price` over the `duration`.
        /// Before the auction starts, it returns `start_price`. After the auction ends,
        /// it returns `end_price`.
        ///
        /// # Returns
        /// `u256` - The current price per token, denominated in the payment token.
        fn get_current_price(self: @ContractState) -> u256 {
            let start_time = self.start_time.read();
            let duration = self.duration.read();
            let start_price = self.start_price.read();
            let end_price = self.end_price.read();
            let current_time = get_block_timestamp();

            if current_time < start_time {
                return start_price;
            }

            let auction_end_time = start_time + duration;
            if current_time >= auction_end_time {
                return end_price;
            }

            let elapsed_time: u256 = (current_time - start_time).into();
            let total_duration: u256 = duration.into();
            let price_drop: u256 = start_price - end_price;
            let current_reduction = (price_drop * elapsed_time) / total_duration;
            let current_price = start_price - current_reduction;

            if current_price < end_price {
                return end_price;
            }

            current_price
        }

        /// Allows a user to purchase tokens during the active auction period.
        ///
        /// The user pays the current price per token, calculated based on the time of the call.
        /// Requires the caller to have previously approved this contract to spend the required
        /// amount of the payment token. Transfers the purchased tokens to the caller.
        ///
        /// # Parameters
        /// - `amount_tokens_to_buy`: `u256` - The amount of tokens the user wishes to purchase.
        ///
        /// # Panics
        /// - If the auction has not started yet.
        /// - If the auction has already ended.
        /// - If `amount_tokens_to_buy` is 0.
        /// - If `amount_tokens_to_buy` exceeds the remaining available tokens.
        /// - If the required payment token transfer fails (e.g., insufficient balance or approval).
        /// - If the purchased token transfer fails.
        fn buy_tokens(ref self: ContractState, amount_tokens_to_buy: u256) {
            let start_time = self.start_time.read();
            let duration = self.duration.read();
            let current_time = get_block_timestamp();
            let auction_end_time = start_time + duration;

            assert(current_time >= start_time, Errors::AUCTION_NOT_STARTED);
            assert(current_time < auction_end_time, Errors::AUCTION_ENDED);
            assert(amount_tokens_to_buy > 0, Errors::INVALID_AMOUNT);

            let total_supply = self.total_tokens_for_sale.read();
            let sold = self.tokens_sold.read();
            let tokens_remaining = total_supply - sold;
            assert(amount_tokens_to_buy <= tokens_remaining, Errors::INSUFFICIENT_TOKENS);

            let current_price_per_token = self.get_current_price();
            let total_payment_cost = amount_tokens_to_buy * current_price_per_token;

            let caller = get_caller_address();
            let payment_token_addr = self.payment_token_address.read();
            let payment_token = IERC20Dispatcher { contract_address: payment_token_addr };
            payment_token
                .transfer_from(
                    sender: caller, recipient: get_contract_address(), amount: total_payment_cost,
                );

            self.tokens_sold.write(sold + amount_tokens_to_buy);

            let token_for_sale_addr = self.token_for_sale_address.read();
            let token_for_sale = IERC20Dispatcher { contract_address: token_for_sale_addr };
            token_for_sale.transfer(recipient: caller, amount: amount_tokens_to_buy);

            self
                .emit(
                    TokensPurchased {
                        buyer: caller,
                        amount_tokens: amount_tokens_to_buy,
                        price_per_token: current_price_per_token,
                        total_payment: total_payment_cost,
                    },
                );
        }

        /// Allows the contract owner to claim any tokens that remained unsold after the auction
        /// ended.
        ///
        /// Can only be called after the auction duration has passed. Transfers the unsold tokens
        /// from this contract to the owner's address.
        ///
        /// # Panics
        /// - If the caller is not the owner (`Ownable: caller is not the owner`).
        /// - If the auction has not yet ended (`Errors::NOT_ENDED`).
        /// - If the token transfer fails.
        fn claim_unsold_tokens(ref self: ContractState) {
            self.owner.assert_only_owner();

            let start_time = self.start_time.read();
            let duration = self.duration.read();
            let current_time = get_block_timestamp();
            let auction_end_time = start_time + duration;
            assert(current_time >= auction_end_time, Errors::NOT_ENDED);

            let total_supply = self.total_tokens_for_sale.read();
            let sold = self.tokens_sold.read();
            let unsold_tokens = total_supply - sold;

            if unsold_tokens > 0 {
                self.tokens_sold.write(total_supply); // Mark all accounted for

                let owner_address = self.owner.read();
                let token_for_sale_addr = self.token_for_sale_address.read();
                let token_for_sale = IERC20Dispatcher { contract_address: token_for_sale_addr };
                token_for_sale.transfer(recipient: owner_address, amount: unsold_tokens);

                self.emit(AuctionEndedAndTokensClaimed { unsold_tokens_claimed: unsold_tokens });
            } else {
                self.emit(AuctionEndedAndTokensClaimed { unsold_tokens_claimed: 0 });
            }
        }

        /// Allows the contract owner to withdraw the accumulated payment tokens collected during
        /// the auction.
        ///
        /// Can only be called after the auction duration has passed. Transfers the entire balance
        /// of the payment token held by this contract to the owner's address.
        ///
        /// # Panics
        /// - If the caller is not the owner (`Ownable: caller is not the owner`).
        /// - If the auction has not yet ended (`Errors::NOT_ENDED`).
        /// - If the contract holds zero balance of the payment token (`Errors::ZERO_BALANCE`).
        /// - If the payment token transfer fails.
        fn withdraw_payment(ref self: ContractState) {
            self.owner.assert_only_owner();

            let start_time = self.start_time.read();
            let duration = self.duration.read();
            let current_time = get_block_timestamp();
            let auction_end_time = start_time + duration;
            assert(current_time >= auction_end_time, Errors::NOT_ENDED);

            let payment_token_addr = self.payment_token_address.read();
            let payment_token = IERC20Dispatcher { contract_address: payment_token_addr };
            let contract_balance = payment_token.balance_of(get_contract_address());

            assert(contract_balance > 0, Errors::ZERO_BALANCE);

            if contract_balance > 0 {
                let owner_address = self.owner.read();
                payment_token.transfer(recipient: owner_address, amount: contract_balance);

                self.emit(PaymentWithdrawn { amount: contract_balance });
            }
        }

        /// Retrieves the core configuration parameters and current state of the auction.
        ///
        /// # Returns
        /// `(ContractAddress, ContractAddress, u64, u64, u256, u256, u256, u256)` - A tuple
        /// containing:
        ///   - `token_for_sale_address`: Address of the token being sold.
        ///   - `payment_token_address`: Address of the token used for payment.
        ///   - `start_time`: Timestamp when the auction started.
        ///   - `duration`: Duration of the auction in seconds.
        ///   - `start_price`: Initial price per token.
        ///   - `end_price`: Final minimum price per token.
        ///   - `total_tokens_for_sale`: Total tokens initially offered.
        ///   - `tokens_sold`: Total tokens sold so far.
        fn get_auction_details(
            self: @ContractState,
        ) -> (ContractAddress, ContractAddress, u64, u64, u256, u256, u256, u256) {
            (
                self.token_for_sale_address.read(),
                self.payment_token_address.read(),
                self.start_time.read(),
                self.duration.read(),
                self.start_price.read(),
                self.end_price.read(),
                self.total_tokens_for_sale.read(),
                self.tokens_sold.read(),
            )
        }
    }
}
