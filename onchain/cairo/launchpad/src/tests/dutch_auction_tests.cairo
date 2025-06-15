#[cfg(test)]
mod tests {
    use afk_launchpad::presale_auction::{
        DutchAuction, IDutchAuctionDispatcher, IDutchAuctionDispatcherTrait,
    };
    use array::ArrayTrait;
    use core::option::OptionTrait;
    use core::result::ResultTrait;
    use core::traits::TryInto;
    use integer::{U256, U256TryIntoFelt252, u256};
    use openzeppelin::token::erc20::{ERC20Component, IERC20Dispatcher, IERC20DispatcherTrait};
    use snforge_std::{
        CheatSpan, CheatTarget, ContractClassTrait, EventSpyAssertionsTrait, cheat_block_timestamp,
        cheat_caller_address, declare, spy_events, start_cheat_block_timestamp,
        stop_cheat_block_timestamp, stop_cheat_caller_address,
    };
    use starknet::{
        ContractAddress, Felt252TryIntoClassHash, contract_address_const, get_block_timestamp,
    };

    const OWNER: felt252 = 'owner';
    const USER1: felt252 = 'user1';
    const USER2: felt252 = 'user2';
    const ONE_U256: u256 = u256 { low: 1, high: 0 };
    const TEN_POW_18: u256 = u256 { low: 1_000_000_000_000_000_000, high: 0 };
    const DAY_SECONDS: u64 = 86400;
    const HOUR_SECONDS: u64 = 3600;

    fn deploy_erc20(initial_recipient: ContractAddress, initial_supply: u256) -> ContractAddress {
        let mut calldata = array![];
        calldata.append('MockToken');
        calldata.append('MTK');
        calldata.append(18);
        calldata.append(initial_supply.low);
        calldata.append(initial_supply.high);
        calldata.append(initial_recipient.into());
        let contract = declare("ERC20");
        let (contract_address, _) = contract.deploy(@calldata).expect("Mock ERC20 deploy failed");
        contract_address
    }

    fn deploy_auction(
        owner: ContractAddress,
        token_sale_addr: ContractAddress,
        payment_token_addr: ContractAddress,
        start_price: u256,
        time_step: u256,
        price_decrement: u256,
        duration: u64,
        total_tokens: u256,
    ) -> ContractAddress {
        let mut calldata = array![];
        calldata.append(owner.into());
        calldata.append(token_sale_addr.into());
        calldata.append(payment_token_addr.into());
        calldata.append(start_price.low);
        calldata.append(start_price.high);
        calldata.append(time_step.low);
        calldata.append(time_step.high);
        calldata.append(price_decrement.low);
        calldata.append(price_decrement.high);
        calldata.append(duration.into());
        calldata.append(total_tokens.low);
        calldata.append(total_tokens.high);
        let contract = declare("DutchAuction");
        let (contract_address, _) = contract.deploy(@calldata).expect("Auction deploy failed");
        contract_address
    }

    struct TestSetup {
        owner_addr: ContractAddress,
        user1_addr: ContractAddress,
        user2_addr: ContractAddress,
        token_sale_addr: ContractAddress,
        payment_token_addr: ContractAddress,
        auction_addr: ContractAddress,
        token_sale: IERC20Dispatcher,
        payment_token: IERC20Dispatcher,
        auction: IDutchAuctionDispatcher,
    }

    fn setup_auction() -> TestSetup {
        let owner_addr: ContractAddress = OWNER.try_into().unwrap();
        let user1_addr: ContractAddress = USER1.try_into().unwrap();
        let user2_addr: ContractAddress = USER2.try_into().unwrap();

        let total_sale_supply = u256 { low: 1_000_000, high: 0 } * TEN_POW_18;
        let payment_supply_per_user = u256 { low: 10_000, high: 0 } * TEN_POW_18;

        let token_sale_addr = deploy_erc20(owner_addr, total_sale_supply);
        let token_sale = IERC20Dispatcher { contract_address: token_sale_addr };

        let payment_token_addr = deploy_erc20(OWNER, 0);
        let payment_token = IERC20Dispatcher { contract_address: payment_token_addr };

        cheat_caller_address(payment_token_addr, owner_addr, CheatSpan::Infinite());
        payment_token.mint(user1_addr, payment_supply_per_user);
        payment_token.mint(user2_addr, payment_supply_per_user);
        stop_cheat_caller_address(payment_token_addr);

        let start_price = u256 { low: 100, high: 0 } * TEN_POW_18;
        let time_step: u256 = U256 { low: HOUR_SECONDS.into(), high: 0 };
        let price_decrement = u256 { low: 5, high: 0 } * TEN_POW_18;
        let duration = DAY_SECONDS;
        let auction_total_tokens = total_sale_supply;

        let auction_addr = deploy_auction(
            owner_addr,
            token_sale_addr,
            payment_token_addr,
            start_price,
            time_step,
            price_decrement,
            duration,
            auction_total_tokens,
        );
        let auction = IDutchAuctionDispatcher { contract_address: auction_addr };

        cheat_caller_address(token_sale_addr, owner_addr, CheatSpan::TargetCalls(1));
        token_sale.transfer(auction_addr, auction_total_tokens);

        TestSetup {
            owner_addr,
            user1_addr,
            user2_addr,
            token_sale_addr,
            payment_token_addr,
            auction_addr,
            token_sale,
            payment_token,
            auction,
        }
    }

    #[test]
    fn test_constructor_valid_deployment() {
        let setup = setup_auction();
        assert(setup.auction.get_owner() == setup.owner_addr, "Invalid owner");

        let (
            token_addr,
            payment_addr,
            start_t,
            duration,
            start_p,
            time_s,
            price_dec,
            total_supply,
            sold,
        ) =
            setup
            .auction
            .get_auction_details();

        assert(token_addr == setup.token_sale_addr, "Invalid sale token addr");
        assert(payment_addr == setup.payment_token_addr, "Invalid payment token addr");
        assert(start_p == u256 { low: 100, high: 0 } * TEN_POW_18, "Invalid start price");
        assert(time_s == U256 { low: HOUR_SECONDS.into(), high: 0 }, "Invalid time step");
        assert(price_dec == u256 { low: 5, high: 0 } * TEN_POW_18, "Invalid price decrement");
        assert(duration == DAY_SECONDS, "Invalid duration");
        assert(
            total_supply == u256 { low: 1_000_000, high: 0 } * TEN_POW_18, "Invalid total supply",
        );
        assert(sold == u256 { low: 0, high: 0 }, "Invalid initial sold");
        assert(start_t > 0, "Start time not set");
    }

    #[test]
    #[should_panic(expected: ('Auction: Duration cannot be 0',))]
    fn test_constructor_invalid_duration() {
        let setup = setup_auction();
        deploy_auction(
            setup.owner_addr,
            setup.token_sale_addr,
            setup.payment_token_addr,
            u256 { low: 100, high: 0 } * TEN_POW_18,
            U256 { low: HOUR_SECONDS.into(), high: 0 },
            u256 { low: 5, high: 0 } * TEN_POW_18,
            0,
            u256 { low: 100, high: 0 } * TEN_POW_18,
        );
    }

    #[test]
    #[should_panic(expected: ('Auction: Supply cannot be 0',))]
    fn test_constructor_invalid_supply() {
        let setup = setup_auction();
        deploy_auction(
            setup.owner_addr,
            setup.token_sale_addr,
            setup.payment_token_addr,
            u256 { low: 100, high: 0 } * TEN_POW_18,
            U256 { low: HOUR_SECONDS.into(), high: 0 },
            u256 { low: 5, high: 0 } * TEN_POW_18,
            DAY_SECONDS,
            u256 { low: 0, high: 0 },
        );
    }

    #[test]
    fn test_get_price() {
        let setup = setup_auction();
        let (_, _, start_time, duration, start_price, time_step_u256, price_decrement, _, _) = setup
            .auction
            .get_auction_details();
        let time_step_u64: u64 = time_step_u256.low.try_into().unwrap();

        start_cheat_block_timestamp(setup.auction_addr, start_time - 10);
        assert(setup.auction.get_current_price() == start_price, "Price before mismatch");
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, start_time);
        assert(setup.auction.get_current_price() == start_price, "Price at start mismatch");
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, start_time + time_step_u64 - 1);
        assert(setup.auction.get_current_price() == start_price, "Price before 1st step mismatch");
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, start_time + time_step_u64);
        let expected_price_step1 = start_price - price_decrement;
        assert(
            setup.auction.get_current_price() == expected_price_step1, "Price at 1st step mismatch",
        );
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(
            setup.auction_addr, start_time + time_step_u64 + (time_step_u64 / 2),
        );
        assert(
            setup.auction.get_current_price() == expected_price_step1,
            "Price between steps mismatch",
        );
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, start_time + 2 * time_step_u64);
        let expected_price_step2 = start_price - (price_decrement * u256 { low: 2, high: 0 });
        assert(
            setup.auction.get_current_price() == expected_price_step2, "Price at 2nd step mismatch",
        );
        stop_cheat_block_timestamp(setup.auction_addr);

        let steps_to_zero: u256 = start_price / price_decrement;
        let zero_price_time_approx: u64 = start_time
            + (steps_to_zero.low * time_step_u256.low).try_into().unwrap();

        start_cheat_block_timestamp(setup.auction_addr, zero_price_time_approx + 1);
        assert(
            setup.auction.get_current_price() == u256 { low: 0, high: 0 }, "Price at zero mismatch",
        );
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, zero_price_time_approx + time_step_u64);
        assert(
            setup.auction.get_current_price() == u256 { low: 0, high: 0 },
            "Price after zero mismatch",
        );
        stop_cheat_block_timestamp(setup.auction_addr);

        let end_time = start_time + duration;
        start_cheat_block_timestamp(setup.auction_addr, end_time);
        let elapsed_at_end: u256 = duration.into();
        let intervals_at_end: u256 = elapsed_at_end / time_step_u256;
        let decrement_at_end = intervals_at_end * price_decrement;
        let expected_price_at_end = if decrement_at_end >= start_price {
            u256 { low: 0, high: 0 }
        } else {
            start_price - decrement_at_end
        };
        assert(setup.auction.get_current_price() == expected_price_at_end, "Price at end mismatch");
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, end_time + time_step_u64);
        assert(
            setup.auction.get_current_price() == expected_price_at_end, "Price after end mismatch",
        );
        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    fn test_buy_tokens_happy_path() {
        let setup = setup_auction();
        let (_, _, start_time, _, start_price, time_step_u256, price_decrement, _, _) = setup
            .auction
            .get_auction_details();
        let time_step_u64: u64 = time_step_u256.low.try_into().unwrap();

        let buy_time = start_time + time_step_u64 + 10;
        start_cheat_block_timestamp(setup.auction_addr, buy_time);

        let expected_price = start_price - price_decrement;

        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        let approval_amount = u256 { low: 10_000, high: 0 } * TEN_POW_18;
        setup.payment_token.approve(setup.auction_addr, approval_amount);

        let tokens_to_buy = u256 { low: 50, high: 0 } * TEN_POW_18;
        let expected_cost = tokens_to_buy * expected_price / TEN_POW_18;

        let user1_payment_balance_before = setup.payment_token.balance_of(setup.user1_addr);
        let user1_sale_balance_before = setup.token_sale.balance_of(setup.user1_addr);
        let contract_payment_balance_before = setup.payment_token.balance_of(setup.auction_addr);
        let contract_sale_balance_before = setup.token_sale.balance_of(setup.auction_addr);
        let (_, _, _, _, _, _, _, _, tokens_sold_before) = setup.auction.get_auction_details();

        let mut spy = spy_events();

        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(tokens_to_buy);

        stop_cheat_block_timestamp(setup.auction_addr);

        let user1_payment_balance_after = setup.payment_token.balance_of(setup.user1_addr);
        let user1_sale_balance_after = setup.token_sale.balance_of(setup.user1_addr);
        let contract_payment_balance_after = setup.payment_token.balance_of(setup.auction_addr);
        let contract_sale_balance_after = setup.token_sale.balance_of(setup.auction_addr);
        let (_, _, _, _, _, _, _, _, tokens_sold_after) = setup.auction.get_auction_details();

        assert(
            user1_payment_balance_after == user1_payment_balance_before - expected_cost,
            "User1 payment balance wrong",
        );
        assert(
            user1_sale_balance_after == user1_sale_balance_before + tokens_to_buy,
            "User1 sale balance wrong",
        );
        assert(
            contract_payment_balance_after == contract_payment_balance_before + expected_cost,
            "Contract payment balance wrong",
        );
        assert(
            contract_sale_balance_after == contract_sale_balance_before - tokens_to_buy,
            "Contract sale balance wrong",
        );
        assert(tokens_sold_after == tokens_sold_before + tokens_to_buy, "Tokens sold wrong");

        spy
            .assert_emitted(
                @array![
                    (
                        setup.auction_addr,
                        DutchAuction::Event::TokensPurchased(
                            DutchAuction::TokensPurchased {
                                buyer: setup.user1_addr,
                                amount_tokens: tokens_to_buy,
                                price_per_token: expected_price,
                                total_payment: expected_cost,
                            },
                        ),
                    ),
                ],
            );
    }

    #[test]
    #[should_panic(expected: ('Auction: Not started yet',))]
    fn test_buy_tokens_before_start() {
        let setup = setup_auction();
        let (_, _, start_time, _, _, _, _, _, _) = setup.auction.get_auction_details();

        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.payment_token.approve(setup.auction_addr, u256 { low: 1, high: 1 });

        cheat_block_timestamp(setup.auction_addr, start_time - 1, CheatSpan::TargetCalls(1));
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(ONE_U256);
    }

    #[test]
    #[should_panic(expected: ('Auction: Already ended',))]
    fn test_buy_tokens_after_end() {
        let setup = setup_auction();
        let (_, _, start_time, duration, _, _, _, _, _) = setup.auction.get_auction_details();

        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.payment_token.approve(setup.auction_addr, u256 { low: 1, high: 1 });

        let end_time = start_time + duration;
        cheat_block_timestamp(setup.auction_addr, end_time, CheatSpan::TargetCalls(1));
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(ONE_U256);
    }

    #[test]
    #[should_panic(expected: ('Auction: Invalid amount',))]
    fn test_buy_tokens_zero_amount() {
        let setup = setup_auction();
        let (_, _, start_time, _, _, _, _, _, _) = setup.auction.get_auction_details();

        start_cheat_block_timestamp(setup.auction_addr, start_time + 1);
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(u256 { low: 0, high: 0 });
        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    #[should_panic(expected: ('Auction: Not enough tokens left',))]
    fn test_buy_tokens_insufficient_supply() {
        let setup = setup_auction();
        let (_, _, start_time, _, _, _, _, total_supply, _) = setup.auction.get_auction_details();

        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.payment_token.approve(setup.auction_addr, u256 { low: 1, high: 1 });

        start_cheat_block_timestamp(setup.auction_addr, start_time + 1);
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(total_supply + ONE_U256);
        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    #[should_panic(expected: ('ERC20: insufficient allowance',))]
    fn test_buy_tokens_no_approval() {
        let setup = setup_auction();
        let (_, _, start_time, _, _, _, _, _, _) = setup.auction.get_auction_details();

        start_cheat_block_timestamp(setup.auction_addr, start_time + 1);
        // No approval call
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(ONE_U256);
        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    fn test_claim_unsold_happy_path() {
        let setup = setup_auction();
        let (
            _,
            _,
            start_time,
            duration,
            start_price,
            time_step_u256,
            price_decrement,
            total_supply,
            _,
        ) =
            setup
            .auction
            .get_auction_details();
        let end_time = start_time + duration;
        let time_step_u64: u64 = time_step_u256.low.try_into().unwrap();

        let buy_time = start_time + time_step_u64 + 1;
        start_cheat_block_timestamp(setup.auction_addr, buy_time);
        let price_at_buy = setup.auction.get_current_price();
        stop_cheat_block_timestamp(setup.auction_addr);

        let tokens_to_buy = u256 { low: 100, high: 0 } * TEN_POW_18;
        let cost = tokens_to_buy * price_at_buy / TEN_POW_18;

        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.payment_token.approve(setup.auction_addr, cost * u256 { low: 2, high: 0 });

        start_cheat_block_timestamp(setup.auction_addr, buy_time);
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(tokens_to_buy);
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, end_time + 1);

        let owner_sale_balance_before = setup.token_sale.balance_of(setup.owner_addr);
        let contract_sale_balance_before = setup.token_sale.balance_of(setup.auction_addr);
        let expected_unsold = total_supply - tokens_to_buy;

        let mut spy = spy_events();

        cheat_caller_address(setup.auction_addr, setup.owner_addr, CheatSpan::TargetCalls(1));
        setup.auction.claim_unsold_tokens();

        let owner_sale_balance_after = setup.token_sale.balance_of(setup.owner_addr);
        let contract_sale_balance_after = setup.token_sale.balance_of(setup.auction_addr);
        let (_, _, _, _, _, _, _, final_total_supply, final_sold) = setup
            .auction
            .get_auction_details();

        assert(
            owner_sale_balance_after == owner_sale_balance_before + expected_unsold,
            "Owner bal wrong",
        );
        assert(
            contract_sale_balance_after == contract_sale_balance_before - expected_unsold,
            "Contract bal wrong",
        );
        assert(contract_sale_balance_after == u256 { low: 0, high: 0 }, "Contract bal not zero");
        assert(final_sold == final_total_supply, "Final sold state wrong");

        spy
            .assert_emitted(
                @array![
                    (
                        setup.auction_addr,
                        DutchAuction::Event::AuctionEndedAndTokensClaimed(
                            DutchAuction::AuctionEndedAndTokensClaimed {
                                unsold_tokens_claimed: expected_unsold,
                            },
                        ),
                    ),
                ],
            );

        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    #[should_panic(expected: ('Ownable: caller is not the owner',))]
    fn test_claim_unsold_by_non_owner() {
        let setup = setup_auction();
        let (_, _, start_time, duration, _, _, _, _, _) = setup.auction.get_auction_details();
        let end_time = start_time + duration;

        start_cheat_block_timestamp(setup.auction_addr, end_time + 1);
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.claim_unsold_tokens();
        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    #[should_panic(expected: ('Auction: Not ended yet',))]
    fn test_claim_unsold_before_end() {
        let setup = setup_auction();
        let (_, _, start_time, duration, _, _, _, _, _) = setup.auction.get_auction_details();
        let end_time = start_time + duration;

        start_cheat_block_timestamp(setup.auction_addr, end_time - 1);
        cheat_caller_address(setup.auction_addr, setup.owner_addr, CheatSpan::TargetCalls(1));
        setup.auction.claim_unsold_tokens();
        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    fn test_withdraw_payment_happy_path() {
        let setup = setup_auction();
        let (_, _, start_time, duration, _, _, _, _, _) = setup.auction.get_auction_details();
        let end_time = start_time + duration;

        let buy_time = start_time + 1;
        start_cheat_block_timestamp(setup.auction_addr, buy_time);
        let price_at_buy = setup.auction.get_current_price();
        stop_cheat_block_timestamp(setup.auction_addr);

        let tokens_to_buy = u256 { low: 100, high: 0 } * TEN_POW_18;
        let payment_amount = tokens_to_buy * price_at_buy / TEN_POW_18;

        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.payment_token.approve(setup.auction_addr, payment_amount * u256 { low: 2, high: 0 });

        start_cheat_block_timestamp(setup.auction_addr, buy_time);
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(tokens_to_buy);
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(setup.auction_addr, end_time + 1);

        let owner_payment_balance_before = setup.payment_token.balance_of(setup.owner_addr);
        let contract_payment_balance_before = setup.payment_token.balance_of(setup.auction_addr);
        assert(contract_payment_balance_before == payment_amount, "Pre-withdraw balance mismatch");

        let mut spy = spy_events();

        cheat_caller_address(setup.auction_addr, setup.owner_addr, CheatSpan::TargetCalls(1));
        setup.auction.withdraw_payment();

        let owner_payment_balance_after = setup.payment_token.balance_of(setup.owner_addr);
        let contract_payment_balance_after = setup.payment_token.balance_of(setup.auction_addr);

        assert(
            owner_payment_balance_after == owner_payment_balance_before + payment_amount,
            "Owner payment bal wrong",
        );
        assert(
            contract_payment_balance_after == u256 { low: 0, high: 0 },
            "Contract payment bal not zero",
        );

        spy
            .assert_emitted(
                @array![
                    (
                        setup.auction_addr,
                        DutchAuction::Event::PaymentWithdrawn(
                            DutchAuction::PaymentWithdrawn { amount: payment_amount },
                        ),
                    ),
                ],
            );

        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    #[should_panic(expected: ('Ownable: caller is not the owner',))]
    fn test_withdraw_payment_by_non_owner() {
        let setup = setup_auction();
        start_cheat_block_timestamp(setup.auction_addr, setup.auction.get_auction_details().2 + 1);
        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.payment_token.approve(setup.auction_addr, u256 { low: 1, high: 1 });
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(ONE_U256);
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(
            setup.auction_addr, setup.auction.get_auction_details().2 + DAY_SECONDS + 1,
        );

        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.withdraw_payment();

        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    #[should_panic(expected: ('Auction: Not ended yet',))]
    fn test_withdraw_payment_before_end() {
        let setup = setup_auction();
        start_cheat_block_timestamp(setup.auction_addr, setup.auction.get_auction_details().2 + 1);
        cheat_caller_address(setup.payment_token_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.payment_token.approve(setup.auction_addr, u256 { low: 1, high: 1 });
        cheat_caller_address(setup.auction_addr, setup.user1_addr, CheatSpan::TargetCalls(1));
        setup.auction.buy_tokens(ONE_U256);
        stop_cheat_block_timestamp(setup.auction_addr);

        start_cheat_block_timestamp(
            setup.auction_addr, setup.auction.get_auction_details().2 + DAY_SECONDS - 1,
        );

        cheat_caller_address(setup.auction_addr, setup.owner_addr, CheatSpan::TargetCalls(1));
        setup.auction.withdraw_payment();

        stop_cheat_block_timestamp(setup.auction_addr);
    }

    #[test]
    #[should_panic(expected: ('Auction: No payment to withdraw',))]
    fn test_withdraw_payment_zero_balance() {
        let setup = setup_auction();
        start_cheat_block_timestamp(
            setup.auction_addr, setup.auction.get_auction_details().2 + DAY_SECONDS + 1,
        );

        cheat_caller_address(setup.auction_addr, setup.owner_addr, CheatSpan::TargetCalls(1));
        setup.auction.withdraw_payment();

        stop_cheat_block_timestamp(setup.auction_addr);
    }
}
