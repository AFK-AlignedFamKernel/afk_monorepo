#[cfg(test)]
mod nostrfi_scoring_tests {
    use afk::bip340::SchnorrSignature;
    use afk::interfaces::nostrfi_scoring_interfaces::{
        INostrFiScoring, INostrFiScoringDispatcher, INostrFiScoringDispatcherTrait, LinkedResult,
        LinkedStarknetAddress, NostrPublicKey, Vote, VoteParams,
    };
    use afk::social::request::SocialRequest;
    // use core::array::SpanTrait;
    // use core::traits::Into;
    use snforge_std::{
        ContractClass, ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
        start_cheat_caller_address_global, stop_cheat_caller_address_global,
    };
    use starknet::ContractAddress;

    fn declare_nostrfi_scoring() -> ContractClass {
        // declare("nostrfi_scoring").unwrap().contract_class()
        *declare("NostrFiScoring").unwrap().contract_class()
    }

    fn deploy_nostrfi_scoring(class: ContractClass) -> INostrFiScoringDispatcher {
        let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
        let mut calldata = array![];
        ADMIN_ADDRESS.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();

        INostrFiScoringDispatcher { contract_address }
    }

    fn request_fixture_custom_classes(
        nostrfi_scoring_class: ContractClass,
    ) -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrFiScoringDispatcher,
        SocialRequest<LinkedStarknetAddress>,
    ) {
        // recipient private key: 59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35
        // just for testing, do not use for anything else
        // let recipient_public_key =
        //     0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let recipient_public_key =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let sender_address: ContractAddress = 123.try_into().unwrap();

        let nostrfi_scoring = deploy_nostrfi_scoring(nostrfi_scoring_class);

        let recipient_address_user: ContractAddress = 678.try_into().unwrap();

        // TODO change with the correct signature with the content LinkedWalletProfileDefault id and
        // strk recipient TODO Uint256 to felt on Starknet js
        // for test data see claim to:
        // https://replit.com/@msghais135/WanIndolentKilobyte-claimto#linked_to.js

        let linked_wallet = LinkedStarknetAddress {
            starknet_address: sender_address.try_into().unwrap(),
        };

        // @TODO format the content and get the correct signature
        let request_linked_wallet_to = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: linked_wallet.clone(),
            sig: SchnorrSignature {
                r: 0x4e04216ca171673375916f12e1a56e00dca1d39e44207829d659d06f3a972d6f_u256,
                s: 0xa16bc69fab00104564b9dad050a29af4d2380c229de984e49ad125fe29b5be8e_u256,
                // r: 0x051b6d408b709d29b6ef55b1aa74d31a9a265c25b0b91c2502108b67b29c0d5c_u256,
            // s: 0xe31f5691af0e950eb8697fdbbd464ba725b2aaf7e5885c4eaa30a1e528269793_u256
            },
        };

        let linked_wallet_not_caller = LinkedStarknetAddress {
            starknet_address: recipient_address_user.try_into().unwrap(),
        };

        // @TODO format the content and get the correct signature
        let fail_request_linked_wallet_to_caller = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: linked_wallet_not_caller.clone(),
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a4e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
        };

        (
            request_linked_wallet_to,
            recipient_public_key,
            sender_address,
            nostrfi_scoring,
            fail_request_linked_wallet_to_caller,
        )
    }

    fn request_fixture() -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrFiScoringDispatcher,
        SocialRequest<LinkedStarknetAddress>,
    ) {
        let nostrfi_scoring_class = declare_nostrfi_scoring();
        request_fixture_custom_classes(nostrfi_scoring_class)
    }

    #[test]
    fn linked_wallet_to() {
        let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        nostrfi_scoring.linked_nostr_profile(request);

        let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(recipient_nostr_key);
        assert!(nostr_linked == sender_address, "nostr not linked");
    }

    #[test]
    #[should_panic()]
    fn link_incorrect_signature() {
        let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to_caller) =
            request_fixture();
        stop_cheat_caller_address_global();
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);

        let request_test_failed_sig = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966606f_u256,
            },
            ..fail_request_linked_wallet_to_caller,
        };
        nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
    }

    #[test]
    #[should_panic()]
    fn link_incorrect_signature_link_to() {
        let (request, _, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        let request_test_failed_sig = SocialRequest {
            sig: SchnorrSignature {
                r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
                s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
            },
            ..request,
        };

        nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
    }

    #[test]
    #[should_panic()]
    // #[should_panic(expected: ' invalid caller ')]
    fn link_incorrect_caller_link_to() {
        let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to) =
            request_fixture();
        start_cheat_caller_address_global(sender_address);
        stop_cheat_caller_address_global();
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        nostrfi_scoring.linked_nostr_profile(fail_request_linked_wallet_to);
    }

    #[test]
    fn vote_user_for_profile() {
        let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);  
        nostrfi_scoring.vote_user_for_profile(request);
    }

    #[test]
    fn vote_user_for_profile_starknet() {
        let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);  

        let vote_params = VoteParams {
            nostr_address: recipient_nostr_key,
            vote: Vote::Good,
            is_upvote: true,
            upvote_amount: 100,
            downvote_amount: 0, 
            amount: 100,
            amount_token: 100,
        };
        
        nostrfi_scoring.vote_nostr_profile_starknet_only(vote_params);
    }

    #[test]
    fn claim_and_distribute_my_rewards() {
        let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);  
        nostrfi_scoring.claim_and_distribute_my_rewards();
    }

    #[test]
    fn distribute_algo_rewards_by_user() {
        let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _) = request_fixture();
        start_cheat_caller_address_global(sender_address);
        nostrfi_scoring.distribute_algo_rewards_by_user();
    }   
}
