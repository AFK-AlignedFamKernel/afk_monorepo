use core::traits::Into;
use starknet::ContractAddress;
use super::request::{ConvertToBytes, Encode, SocialRequest, SocialRequestImpl};
pub type DepositId = felt252;

#[derive(Clone, Debug, Drop, Serde)]
pub struct Claim {
    pub deposit_id: DepositId,
    pub starknet_recipient: ContractAddress,
    pub gas_token_address: ContractAddress,
    pub gas_amount: u256,
}

impl ClaimEncodeImpl of Encode<Claim> {
    fn encode(self: @Claim) -> @ByteArray {
        let recipient_address: felt252 = (*self.starknet_recipient).into();
        let gas_token_address: felt252 = (*self.gas_token_address).into();
        @format!(
            "claim: {},{},{},{}",
            self.deposit_id,
            recipient_address,
            gas_token_address,
            *self.gas_amount,
        )
    }
}
fn count_digits(mut num: u256) -> (u32, felt252) {
    let BASE: u256 = 16_u256;
    let mut count: u32 = 0;
    while num > 0 {
        num = num / BASE;
        count = count + 1;
    }
    let res: felt252 = count.try_into().unwrap();
    (count, res)
}

impl ClaimImpl of ConvertToBytes<Claim> {
    fn convert_to_bytes(self: @Claim) -> ByteArray {
        let mut ba: ByteArray = "";
        let deposit_id: felt252 = *self.deposit_id;
        ba.append_word(deposit_id, 1_u32);
        let starknet_recipient: felt252 = (*self.starknet_recipient).into();
        ba.append_word(starknet_recipient, 1_u32);
        ba.append_word((*self.gas_token_address).into(), 1_u32);
        let gas_u256 = *self.gas_amount;
        let (gas_count, gas_count_felt252) = count_digits(gas_u256);
        let gas_felt252: felt252 = gas_u256.try_into().unwrap();
        ba.append_word(gas_count_felt252, 1_u32);
        ba.append_word(gas_felt252, gas_count);
        ba
    }
}
type NostrPublicKey = u256;

#[derive(Copy, Debug, Drop, Serde)]
pub enum DepositResult {
    Transfer: ContractAddress,
    Deposit: DepositId,
}

#[derive(Copy, Debug, Drop, PartialEq, starknet::Store, Serde)]
struct Deposit {
    sender: ContractAddress,
    amount: u256,
    token_address: ContractAddress,
    recipient: NostrPublicKey,
    ttl: u64,
}

#[starknet::interface]
pub trait IDepositEscrow<TContractState> {
    fn get_deposit(self: @TContractState, deposit_id: DepositId) -> Deposit;
    fn deposit(
        ref self: TContractState,
        amount: u256,
        token_address: ContractAddress,
        nostr_recipient: NostrPublicKey,
        timelock: u64,
    ) -> DepositResult;
    fn cancel(ref self: TContractState, deposit_id: DepositId);
    fn claim(ref self: TContractState, request: SocialRequest<Claim>);
    fn claim_with_gas(ref self: TContractState, request: SocialRequest<Claim>, gas_amount: u256);
    fn get_starknet_address(self: @TContractState, nostr_pubkey: NostrPublicKey) -> ContractAddress;
    fn get_nostr_address(
        self: @TContractState, starknet_address: ContractAddress,
    ) -> NostrPublicKey;
}

#[starknet::contract]
pub mod DepositEscrow {
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    // use starknet::storage::Map;
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use super::super::request::{SocialRequest, SocialRequestImpl, SocialRequestTrait};
    use super::{Claim, Deposit, DepositId, DepositResult, IDepositEscrow, NostrPublicKey};

    impl DepositDefault of Default<Deposit> {
        #[inline(always)]
        fn default() -> Deposit {
            Deposit {
                sender: 0.try_into().unwrap(),
                amount: 0.into(),
                token_address: 0.try_into().unwrap(),
                recipient: 0_u256,
                ttl: 0_u64,
            }
        }
    }

    #[storage]
    struct Storage {
        next_deposit_id: DepositId,
        deposits: Map<DepositId, Deposit>,
        nostr_to_sn: Map<NostrPublicKey, ContractAddress>,
        sn_to_nostr: Map<ContractAddress, NostrPublicKey>,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ClaimEvent {
        #[key]
        deposit_id: DepositId,
        #[key]
        sender: ContractAddress,
        #[key]
        nostr_recipient: NostrPublicKey,
        #[key]
        starknet_recipient: ContractAddress,
        amount: u256,
        token_address: ContractAddress,
        gas_token_address: ContractAddress,
        gas_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DepositEvent {
        #[key]
        pub deposit_id: DepositId,
        #[key]
        pub sender: ContractAddress,
        #[key]
        pub nostr_recipient: NostrPublicKey,
        pub amount: u256,
        pub token_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct CancelEvent {
        #[key]
        deposit_id: DepositId,
        #[key]
        sender: ContractAddress,
        #[key]
        nostr_recipient: NostrPublicKey,
        amount: u256,
        token_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TransferEvent {
        #[key]
        pub sender: ContractAddress,
        #[key]
        pub nostr_recipient: NostrPublicKey,
        #[key]
        pub starknet_recipient: ContractAddress,
        pub amount: u256,
        pub token_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ClaimEvent: ClaimEvent,
        DepositEvent: DepositEvent,
        CancelEvent: CancelEvent,
        TransferEvent: TransferEvent,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.next_deposit_id.write(1);
    }

    #[abi(embed_v0)]
    impl DepositEscrowImpl of IDepositEscrow<ContractState> {
        fn get_deposit(self: @ContractState, deposit_id: DepositId) -> Deposit {
            self.deposits.read(deposit_id)
        }

        fn get_nostr_address(
            self: @ContractState, starknet_address: ContractAddress,
        ) -> NostrPublicKey {
            self.sn_to_nostr.read(starknet_address)
        }

        fn get_starknet_address(
            self: @ContractState, nostr_pubkey: NostrPublicKey,
        ) -> ContractAddress {
            self.nostr_to_sn.read(nostr_pubkey)
        }

        fn deposit(
            ref self: ContractState,
            amount: u256,
            token_address: ContractAddress,
            nostr_recipient: NostrPublicKey,
            timelock: u64,
        ) -> DepositResult {
            let recipient = self.nostr_to_sn.read(nostr_recipient);

            if (!recipient.is_zero()) {
                let erc20 = IERC20Dispatcher { contract_address: token_address };
                erc20.transfer_from(get_caller_address(), recipient, amount);
                self
                    .emit(
                        TransferEvent {
                            sender: get_caller_address(),
                            nostr_recipient,
                            starknet_recipient: recipient,
                            amount: amount,
                            token_address: token_address,
                        },
                    );
                return DepositResult::Transfer(recipient);
            }

            let deposit_id = self.next_deposit_id.read();
            self.next_deposit_id.write(deposit_id + 1);

            let erc20 = IERC20Dispatcher { contract_address: token_address };
            erc20.transfer_from(get_caller_address(), get_contract_address(), amount);

            self
                .deposits
                .entry(deposit_id)
                .write(
                    Deposit {
                        sender: get_caller_address(),
                        amount,
                        token_address,
                        recipient: nostr_recipient,
                        ttl: get_block_timestamp() + timelock,
                    },
                );

            self
                .emit(
                    DepositEvent {
                        deposit_id,
                        sender: get_caller_address(),
                        nostr_recipient,
                        amount,
                        token_address,
                    },
                );

            DepositResult::Deposit(deposit_id)
        }

        fn cancel(ref self: ContractState, deposit_id: DepositId) {
            let deposit = self.deposits.read(deposit_id);
            assert!(deposit != Default::default(), "can't find deposit");
            assert!(deposit.sender == get_caller_address(), "not authorized");
            assert!(
                deposit.ttl <= get_block_timestamp(), "can't cancel before timelock expiration",
            );

            let erc20 = IERC20Dispatcher { contract_address: deposit.token_address };

            erc20.transfer(get_caller_address(), deposit.amount);
            self.deposits.entry(deposit_id).write(Default::default());
            self
                .emit(
                    CancelEvent {
                        deposit_id,
                        sender: get_caller_address(),
                        nostr_recipient: deposit.recipient,
                        amount: deposit.amount,
                        token_address: deposit.token_address,
                    },
                );
        }

        fn claim(ref self: ContractState, request: SocialRequest<Claim>) {
            let claim = @request.content;
            let deposit = self.deposits.read(*claim.deposit_id);
            assert!(deposit != Default::default(), "can't find deposit");
            assert!(request.public_key == deposit.recipient, "invalid recipient");
            request.verify().expect('can\'t verify signature');

            let erc20 = IERC20Dispatcher { contract_address: deposit.token_address };
            erc20.transfer(*claim.starknet_recipient, deposit.amount);

            self.nostr_to_sn.entry(request.public_key).write(*claim.starknet_recipient);
            self.sn_to_nostr.entry(*claim.starknet_recipient).write(request.public_key);
            self.deposits.entry(*claim.deposit_id).write(Default::default());

            self
                .emit(
                    ClaimEvent {
                        deposit_id: *claim.deposit_id,
                        sender: get_caller_address(),
                        nostr_recipient: request.public_key,
                        amount: deposit.amount,
                        starknet_recipient: *claim.starknet_recipient,
                        token_address: deposit.token_address,
                        gas_token_address: *claim.gas_token_address,
                        gas_amount: *claim.gas_amount,
                    },
                );
        }

        fn claim_with_gas(
            ref self: ContractState, request: SocialRequest<Claim>, gas_amount: u256,
        ) {
            let claim = @request.content;
            let deposit = self.deposits.read(*claim.deposit_id);
            assert!(deposit != Default::default(), "can't find deposit");
            assert!(request.public_key == deposit.recipient, "invalid recipient");
            request.verify().expect('can\'t verify signature');

            let erc20 = IERC20Dispatcher { contract_address: deposit.token_address };
            erc20.transfer(*claim.starknet_recipient, deposit.amount - gas_amount);

            self.nostr_to_sn.entry(request.public_key).write(*claim.starknet_recipient);
            self.sn_to_nostr.entry(*claim.starknet_recipient).write(request.public_key);
            self.deposits.entry(*claim.deposit_id).write(Default::default());

            // TODO: swap if necessary
            assert!(deposit.token_address == *claim.gas_token_address, "invalid gas_token");
            assert!(gas_amount <= *claim.gas_amount, "gas_amount too big");
            let gas_token = IERC20Dispatcher { contract_address: *claim.gas_token_address };
            gas_token.transfer(get_caller_address(), gas_amount);
            self
                .emit(
                    ClaimEvent {
                        deposit_id: *claim.deposit_id,
                        sender: get_caller_address(),
                        nostr_recipient: request.public_key,
                        amount: deposit.amount,
                        starknet_recipient: *claim.starknet_recipient,
                        token_address: deposit.token_address,
                        gas_token_address: *claim.gas_token_address,
                        gas_amount: *claim.gas_amount,
                    },
                );
        }
    }
}

#[cfg(test)]
mod tests {
    use afk::bip340::{SchnorrSignature, Signature};
    use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::option::OptionTrait;
    use snforge_std::{
        ContractClass, ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare,
        spy_events, start_cheat_block_timestamp, start_cheat_caller_address,
        start_cheat_caller_address_global, stop_cheat_caller_address_global,
    };
    use starknet::{ContractAddress, get_block_timestamp};
    use super::super::request::SocialRequest;
    use super::{
        Claim, DepositEscrow, DepositResult, IDepositEscrowDispatcher,
        IDepositEscrowDispatcherTrait, NostrPublicKey,
    };

    fn declare_escrow() -> @ContractClass {
        declare("DepositEscrow").unwrap().contract_class()
    }

    fn declare_erc20() -> @ContractClass {
        declare("ERC20").unwrap().contract_class()
    }

    fn deploy_escrow(class: ContractClass) -> IDepositEscrowDispatcher {
        let mut calldata = array![];

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IDepositEscrowDispatcher { contract_address }
    }

    fn deploy_erc20(
        class: ContractClass,
        name: felt252,
        symbol: felt252,
        initial_supply: u256,
        recipient: ContractAddress,
    ) -> IERC20Dispatcher {
        let mut calldata = array![];

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        (2 * initial_supply).serialize(ref calldata);
        recipient.serialize(ref calldata);
        18_u8.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IERC20Dispatcher { contract_address }
    }

    fn request_fixture_custom_classes(
        erc20_class: ContractClass, escrow_class: ContractClass,
    ) -> (
        SocialRequest<Claim>,
        NostrPublicKey,
        ContractAddress,
        IERC20Dispatcher,
        IDepositEscrowDispatcher,
    ) {
        // recipient private key: 59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35
        // just for testing, do not use for anything else
        let recipient_public_key =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let sender_address: ContractAddress = 123.try_into().unwrap();

        let erc20 = deploy_erc20(erc20_class, 'USDC token', 'USDC', 100, sender_address);

        let escrow = deploy_escrow(escrow_class);

        let recipient_address: ContractAddress = 678.try_into().unwrap();

        // for test data see claim to:
        // https://replit.com/@msghais135/WanIndolentKilobyte-claimto#index.js
        let claim = Claim {
            deposit_id: 1,
            starknet_recipient: recipient_address,
            gas_amount: 0,
            gas_token_address: erc20.contract_address,
        };

        let request = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: claim,
            sig: SchnorrSignature {
                r: 0xf1dac3f8d0d19767805ca85933bdf0e744594aeee04058eedaa29e26de087be9_u256,
                s: 0x144c4636083c7d0e3b8186c8c0bc6fa38bd9c6a629ec6e2ce5e437797a6e911c_u256,
            },
        };

        (request, recipient_public_key, sender_address, erc20, escrow)
    }

    fn request_fixture() -> (
        SocialRequest<Claim>,
        NostrPublicKey,
        ContractAddress,
        IERC20Dispatcher,
        IDepositEscrowDispatcher,
    ) {
        let erc20_class = declare_erc20();
        let escrow_class = declare_escrow();
        request_fixture_custom_classes(*erc20_class, *escrow_class)
    }

    #[test]
    fn first_deposit_with_unassigned_starknet_recipient() {
        let (_, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();
        let recipient_address: ContractAddress = 678.try_into().unwrap();
        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let sender_balance_before_deposit = erc20.balance_of(sender_address);

        let mut spy = spy_events();
        // Deposit by sender to recipient
        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        let sender_balance_after_deposit = erc20.balance_of(sender_address);

        start_cheat_caller_address(escrow.contract_address, recipient_address);
        let escrow_balance_before_claim = erc20.balance_of(escrow.contract_address);

        // Sender check
        assert!(
            sender_balance_before_deposit - amount == sender_balance_after_deposit,
            "sender amount to deposit not send",
        );
        assert!(escrow_balance_before_claim == amount, "escrow before claim != amount");

        // check event
        spy
            .assert_emitted(
                @array![
                    (
                        escrow.contract_address,
                        DepositEscrow::Event::DepositEvent(
                            DepositEscrow::DepositEvent {
                                deposit_id: 1,
                                sender: sender_address,
                                nostr_recipient: recipient_nostr_key,
                                amount,
                                token_address: erc20.contract_address,
                            },
                        ),
                    ),
                ],
            );
        spy
            .assert_not_emitted(
                @array![
                    (
                        escrow.contract_address,
                        DepositEscrow::Event::TransferEvent(
                            DepositEscrow::TransferEvent {
                                sender: sender_address,
                                nostr_recipient: recipient_nostr_key,
                                starknet_recipient: recipient_address,
                                amount: amount,
                                token_address: erc20.contract_address,
                            },
                        ),
                    ),
                ],
            );
    }

    #[test]
    fn deposit_with_known_starknet_recipient() {
        let (request, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();
        let recipient_address: ContractAddress = 678.try_into().unwrap();
        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        // let sender_balance_before_deposit = erc20.balance_of(sender_address);

        let mut spy = spy_events();
        // Deposit by sender to recipient
        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        // Recipient user claim deposit
        start_cheat_caller_address(escrow.contract_address, recipient_address);
        escrow.claim_with_gas(request, 0_u256);

        start_cheat_caller_address(escrow.contract_address, sender_address);

        start_cheat_caller_address(escrow.contract_address, recipient_address);
        // let escrow_balance_before_claim = erc20.balance_of(escrow.contract_address);
        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        // Sender check
        // assert!(
        //     sender_balance_before_deposit - amount == sender_balance_after_deposit,
        //     "sender amount to deposit not send",
        // );
        // assert!(escrow_balance_before_claim == amount, "escrow before claim != amount");

        // check event
        spy
            .assert_not_emitted(
                @array![
                    (
                        escrow.contract_address,
                        DepositEscrow::Event::DepositEvent(
                            DepositEscrow::DepositEvent {
                                deposit_id: 2,
                                sender: sender_address,
                                nostr_recipient: recipient_nostr_key,
                                amount,
                                token_address: erc20.contract_address,
                            },
                        ),
                    ),
                ],
            );
        spy
            .assert_emitted(
                @array![
                    (
                        escrow.contract_address,
                        DepositEscrow::Event::TransferEvent(
                            DepositEscrow::TransferEvent {
                                sender: sender_address,
                                nostr_recipient: recipient_nostr_key,
                                starknet_recipient: recipient_address,
                                amount: amount,
                                token_address: erc20.contract_address,
                            },
                        ),
                    ),
                ],
            );
    }

    #[test]
    fn deposit_claim() {
        let (request, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();
        let recipient_address: ContractAddress = 678.try_into().unwrap();
        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let sender_balance_before_deposit = erc20.balance_of(sender_address);

        // Deposit by sender to recipient

        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        let sender_balance_after_deposit = erc20.balance_of(sender_address);

        start_cheat_caller_address(escrow.contract_address, recipient_address);
        let escrow_balance_before_claim = erc20.balance_of(escrow.contract_address);

        // Recipient user claim deposit
        let recipient_balance_before_claim = erc20.balance_of(recipient_address);
        escrow.claim_with_gas(request, 0_u256);

        // Sender check
        assert!(
            sender_balance_before_deposit - amount == sender_balance_after_deposit,
            "sender amount to deposit not send",
        );

        // Recipient check

        let recipient_balance_after_claim = erc20.balance_of(recipient_address);
        assert!(recipient_balance_before_claim == 0, "recipient balance before claim != 0");
        assert!(recipient_balance_after_claim == amount, "recipient balance after claim != 0");

        // Escrow balance
        assert!(escrow_balance_before_claim == amount, "escrow before claim != amount");
        let escrow_balance_after_claim = erc20.balance_of(escrow.contract_address);
        assert!(escrow_balance_after_claim == 0, "escrow balance after claim != 0");
    }

    #[test]
    fn deposit_claim_gas_fee() {
        let (request, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();

        let recipient_address: ContractAddress = 678.try_into().unwrap();
        let afk_address: ContractAddress = 159.try_into().unwrap();
        let amount = 100_u256;
        let gas_amount = 1_u256;

        let claim_gas_amount = Claim {
            deposit_id: 1,
            starknet_recipient: recipient_address,
            gas_amount: gas_amount,
            gas_token_address: erc20.contract_address,
        };

        let request_gas_amount = SocialRequest {
            content: claim_gas_amount,
            sig: SchnorrSignature {
                r: 0x68e441c1f8756b5278c815cc110efb302c2a08bcf0349328ba7bd7683e8b0b29_u256,
                s: 0xd592a5a5e9fc85334ab6801d6dde984c85d67fcd726fce38b9fb06874c25832e_u256,
            },
            ..request,
        };

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let sender_balance_before_deposit = erc20.balance_of(sender_address);

        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        let sender_balance_after_deposit = erc20.balance_of(sender_address);

        start_cheat_caller_address(escrow.contract_address, afk_address);

        let afk_balance_before_claim = erc20.balance_of(afk_address);

        // Sender check
        assert!(
            sender_balance_before_deposit - amount == sender_balance_after_deposit,
            "sender deposit amount not send",
        );

        // AFK account claim user for recipient with gas fees paid by the claim deposit
        let escrow_balance_before_claim = erc20.balance_of(escrow.contract_address);
        let recipient_balance_before_claim = erc20.balance_of(recipient_address);
        escrow.claim_with_gas(request_gas_amount, gas_amount);

        // Recipient check
        let recipient_balance_after_claim = erc20.balance_of(recipient_address);
        assert!(recipient_balance_before_claim == 0, "recipient balance before claim != 0");
        assert!(
            recipient_balance_after_claim == amount - gas_amount,
            "recipient after claim != (amount - gas)",
        );

        // Check gas amount receive by AFK account
        let afk_balance_after_claim = erc20.balance_of(afk_address);
        assert!(afk_balance_before_claim == 0, "afk balance before claim != 0");
        assert!(afk_balance_after_claim == gas_amount, "afk balance not equal gas amount received");

        // Escrow balance
        assert!(escrow_balance_before_claim == amount, "escrow before claim != amount deposit");
        let escrow_balance_after_claim = erc20.balance_of(escrow.contract_address);
        assert!(escrow_balance_after_claim == 0, "escrow balance after claim != 0");
    }

    #[test]
    #[should_panic(expected: "gas_amount to big")]
    fn claim_incorrect_gas_amount() {
        let (request, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();

        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 10_u64);

        escrow.claim_with_gas(request, 1_u256);
    }

    #[test]
    #[should_panic(expected: 'can\'t verify signature')]
    fn claim_incorrect_signature_claim_to() {
        let (request, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();
        let recipient_address: ContractAddress = 678.try_into().unwrap();

        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        start_cheat_caller_address(escrow.contract_address, recipient_address);

        let request = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
            ..request,
        };
        escrow.claim_with_gas(request, 0_u256);
    }


    #[test]
    #[should_panic(expected: 'can\'t verify signature')]
    fn claim_incorrect_signature_claim_to_incorrect_recipient() {
        let (request, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();

        let recipient_address: ContractAddress = 789.try_into().unwrap();
        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        start_cheat_caller_address(escrow.contract_address, recipient_address);

        let request = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
            ..request,
        };
        escrow.claim_with_gas(request, 0_u256);
    }

    #[test]
    fn deposit_cancel_no_timelock() {
        let (_, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();

        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let result = escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        if let DepositResult::Deposit(deposit_id) = result {
            assert!(deposit_id == 1, "wrong deposit_id");
            escrow.cancel(deposit_id);
        } else {
            assert!(false, "wrong deposit result");
        }
    }

    #[test]
    #[should_panic(expected: "can't cancel before timelock expiration")]
    fn deposit_cancel_before_timelock() {
        let (_, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();

        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let result = escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 10_u64);

        if let DepositResult::Deposit(deposit_id) = result {
            assert!(deposit_id == 1, "wrong deposit_id");
            escrow.cancel(deposit_id);
        }
    }

    #[test]
    fn deposit_cancel_timelock() {
        let (_, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();

        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let result = escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 10_u64);

        if let DepositResult::Deposit(deposit_id) = result {
            assert!(deposit_id == 1, "wrong deposit_id");
            start_cheat_block_timestamp(escrow.contract_address, get_block_timestamp() + 10_u64);
            escrow.cancel(deposit_id);
        } else {
            assert!(false, "wrong deposit result");
        }
    }

    #[test]
    #[should_panic(expected: "not authorized")]
    fn not_authorized_cancel() {
        let (_, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();

        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let result = escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        if let DepositResult::Deposit(deposit_id) = result {
            let not_sender: ContractAddress = 345.try_into().unwrap();
            start_cheat_caller_address(escrow.contract_address, not_sender);
            escrow.cancel(deposit_id);
        }
    }

    fn deposit_claim_deposit() {
        let (request, recipient_nostr_key, sender_address, erc20, escrow) = request_fixture();
        let recipient_address: ContractAddress = 345.try_into().unwrap();
        let amount = 100_u256;

        start_cheat_caller_address_global(sender_address);
        erc20.approve(escrow.contract_address, amount);
        stop_cheat_caller_address_global();

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let result = escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        if let DepositResult::Deposit(deposit_id) = result {
            assert!(deposit_id == 1, "wrong deposit_id");
        } else {
            assert!(false, "wrong first deposit result");
        }

        start_cheat_caller_address(escrow.contract_address, recipient_address);
        escrow.claim_with_gas(request, 0_u256);

        start_cheat_caller_address(escrow.contract_address, sender_address);
        let result = escrow.deposit(amount, erc20.contract_address, recipient_nostr_key, 0_u64);

        if let DepositResult::Transfer(recipient) = result {
            assert!(recipient == recipient_address, "wrong recipient address");
        } else {
            assert!(false, "wrong second deposit result");
        }
    }
}
