#[cfg(test)]
mod score_factory_tests {
    use afk::bip340::SchnorrSignature;
    use afk::infofi::score_factory::{
        IFactoryNostrFiScoringDispatcher, IFactoryNostrFiScoringDispatcherTrait,
    };
    use afk::interfaces::common_interfaces::LinkedStarknetAddress;
    use afk::interfaces::nostrfi_scoring_interfaces::{
        DEFAULT_BATCH_INTERVAL_WEEK, DepositRewardsType, INostrFiScoring, INostrFiScoringDispatcher,
        INostrFiScoringDispatcherTrait, LinkedResult, NostrMetadata, NostrPublicKey,
        ProfileAlgorithmScoring, PushAlgoScoreNostrNote, Vote, VoteNostrNote, VoteParams,
    };
    use afk::social::namespace::{INostrNamespaceDispatcher, INostrNamespaceDispatcherTrait};
    use afk::social::request::SocialRequest;
    use afk::tokens::erc20_intern::{IERC20Dispatcher, IERC20DispatcherTrait};
    // use afk::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    // use core::array::SpanTrait;
    // use core::traits::Into;
    use snforge_std::{
        CheatSpan, ContractClass, ContractClassTrait, DeclareResultTrait, cheat_block_timestamp,
        declare, start_cheat_caller_address, start_cheat_caller_address_global,
        stop_cheat_caller_address, stop_cheat_caller_address_global,
    };
    use starknet::{ClassHash, ContractAddress};
    fn declare_nostrfi_scoring() -> ContractClass {
        *declare("NostrFiScoring").unwrap().contract_class()
    }


    const second_recipient_public_key: u256 =
        0xfff4c090cf5a6c03af4238075e20da4497f73a4183e115b7de1b08471a1758f6_u256;

    fn deploy_nostrfi_scoring(
        class: ContractClass,
        main_token_address: ContractAddress,
        admin_nostr_pubkey: NostrPublicKey,
        namespace_address: ContractAddress,
        metadata: NostrMetadata,
    ) -> INostrFiScoringDispatcher {
        let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
        let mut calldata = array![];
        ADMIN_ADDRESS.serialize(ref calldata);
        ADMIN_ADDRESS.serialize(ref calldata);
        main_token_address.serialize(ref calldata);
        admin_nostr_pubkey.serialize(ref calldata);
        namespace_address.serialize(ref calldata);
        let nostr_metadata = NostrMetadata {
            name: metadata.name,
            about: metadata.about,
            nostr_address: metadata.nostr_address,
            event_id_nip_72: metadata.event_id_nip_72,
            event_id_nip_29: metadata.event_id_nip_29,
            main_tag: metadata.main_tag,
        };
        // nostr_metadata.serialize(ref calldata);
        nostr_metadata.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();

        INostrFiScoringDispatcher { contract_address }
    }

    fn declare_namespace() -> ContractClass {
        // declare("Namespace").unwrap().contract_class()
        *declare("Namespace").unwrap().contract_class()
    }

    fn declare_score_factory() -> ContractClass {
        // declare("Namespace").unwrap().contract_class()
        *declare("FactoryNostrFiScoring").unwrap().contract_class()
    }


    fn deploy_score_factory(
        class: ContractClass, score_nostr_hash: ClassHash, namespace_address: ContractAddress,
    ) -> IFactoryNostrFiScoringDispatcher {
        let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
        let admin_nostr_pubkey =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;
        let mut calldata = array![];
        ADMIN_ADDRESS.serialize(ref calldata);
        admin_nostr_pubkey.serialize(ref calldata);
        score_nostr_hash.serialize(ref calldata);
        namespace_address.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IFactoryNostrFiScoringDispatcher { contract_address }
    }


    fn deploy_namespace(class: ContractClass) -> INostrNamespaceDispatcher {
        let ADMIN_ADDRESS: ContractAddress = 123.try_into().unwrap();
        let admin_nostr_pubkey =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;
        let mut calldata = array![];
        ADMIN_ADDRESS.serialize(ref calldata);
        admin_nostr_pubkey.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();

        INostrNamespaceDispatcher { contract_address }
    }


    fn declare_erc20() -> @ContractClass {
        declare("ERC20").unwrap().contract_class()
    }

    fn deploy_erc20(
        class: ContractClass,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
    ) -> IERC20Dispatcher {
        let mut calldata = array![];
        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        initial_supply.serialize(ref calldata);
        recipient.serialize(ref calldata);
        let (contract_address, _) = class.deploy(@calldata).unwrap();
        IERC20Dispatcher { contract_address }
    }

    fn request_fixture_custom_classes(
        nostrfi_scoring_class: ContractClass,
    ) -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrFiScoringDispatcher,
        SocialRequest<LinkedStarknetAddress>,
        SocialRequest<PushAlgoScoreNostrNote>,
        SocialRequest<VoteNostrNote>,
        IERC20Dispatcher,
        SocialRequest<LinkedStarknetAddress>,
        INostrNamespaceDispatcher,
        IFactoryNostrFiScoringDispatcher,
    ) {
        // recipient private key: 59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35
        // just for testing, do not use for anything else
        // let recipient_public_key =
        //     0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let recipient_public_key =
            0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc_u256;

        let second_recipient_public_key =
            0xfff4c090cf5a6c03af4238075e20da4497f73a4183e115b7de1b08471a1758f6_u256;

        let sender_address: ContractAddress = 123.try_into().unwrap();

        let second_sender_address: ContractAddress = 456.try_into().unwrap();

        let declare_namespace_class = declare_namespace();
        let namespace_dispatcher = deploy_namespace(declare_namespace_class);
        let erc20_class = declare_erc20();
        println!("deploying erc20");
        // let erc20_dispatcher = deploy_erc20(
        //     *erc20_class, 'Test Token', 'TEST', 1_000_000_u256, sender_address, 18,
        // );
        let erc20_dispatcher = deploy_erc20(
            *erc20_class, "Test Token", "TEST", 1_000_000_u256, sender_address,
        );
        println!("declare score factory");

        let declare_score_factory_class = declare_score_factory();

        println!("deploying score factory");
        let score_factory_dispatcher = deploy_score_factory(
            declare_score_factory_class,
            nostrfi_scoring_class.class_hash,
            namespace_dispatcher.contract_address,
        );

        println!("deploying nostrfi scoring");
        let nostrfi_scoring = deploy_nostrfi_scoring(
            nostrfi_scoring_class,
            erc20_dispatcher.contract_address,
            recipient_public_key,
            namespace_dispatcher.contract_address,
            init_metadata(
                recipient_public_key,
                "Test Namespace",
                "Test namespace for InfoFI about topics & communities on Nostr and more soon",
                "test@example.com",
            ),
        );

        let recipient_address_user: ContractAddress = 678.try_into().unwrap();

        // TODO change with the correct signature with the content LinkedWalletProfileDefault id and
        // strk recipient TODO Uint256 to felt on Starknet js
        // for test data see claim to:
        // https://replit.com/@msghais135/afk-scripts#linked_to.js

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
                r: 0xac9c698ef50872a5fbfec95f5aaa84014519912ab398f192df6cd3c91dfb563c_u256,
                s: 0xf9403e3bf9dea20a06c8416a0ef78ad08e93dd21e665c72826d22976a4d08126_u256,
                // r: 0x39c240a341bbba95b429027b302074bfaefd819db679484de93ad4687e731550_u256,
            // r: 0x38c0d2ca3e26a774a3f37a15e3f20f17c3d1b7509c8c0e257e6e72d4d351b639_u256,
            // s: 0x93c6f53d83691282ab0469c1fa2368413f19fede348a1c7c7b3363_u256,
            // r: 0x4e04216ca171673375916f12e1a56e00dca1d39e44207829d659d06f3a972d6f_u256,
            // s: 0xa16bc69fab00104564b9dad050a29af4d2380c229de984e49ad125fe29b5be8e_u256,
            // r: 0x051b6d408b709d29b6ef55b1aa74d31a9a265c25b0b91c2502108b67b29c0d5c_u256,
            // s: 0xe31f5691af0e950eb8697fdbbd464ba725b2aaf7e5885c4eaa30a1e528269793_u256
            },
        };

        // https://replit.com/@msghais135/afk-scripts#admin_script.js

        println!("init nostr push algo score {:?}", recipient_public_key);
        // let nostr_address_score = PushAlgoScoreNostrNote { nostr_address:
        // recipient_public_key.try_into().unwrap()};
        let nostr_address_score = PushAlgoScoreNostrNote { nostr_address: recipient_public_key };
        let request_score_admin_nostr_profile = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: nostr_address_score.clone(),
            sig: SchnorrSignature {
                r: 0x127c0d1ef0e58b746b7f370cf1e97ee64c3f057f4dbb1081e682dae90c89c90c_u256,
                s: 0xf3388d2095c0fca6006d0f430b934834c93ec45be80d56c59d28b821dc57d0f8_u256,
                // working
            // r: 0x315cfcf10274c4c99c940d3885920a5e243fc58f0222a7c71c43296105dce674_u256,
            // s: 0x01b663ddca40625da7fa85f32e7563c24fbf818a820f0717ddd532e615bf5d31_u256,
            },
        };

        // https://replit.com/@msghais135/afk-scripts#vote.js

        let vote_score = VoteNostrNote {
            nostr_address: recipient_public_key,
            starknet_address: sender_address.try_into().unwrap(),
            vote: Vote::Good,
            is_upvote: true,
            upvote_amount: 100,
            downvote_amount: 0,
            amount: 100,
            amount_token: 100,
        };

        let request_vote_tips_nostr_profile = SocialRequest {
            public_key: recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: vote_score.clone(),
            sig: SchnorrSignature {
                r: 0x5e6a5b9a4e17f09760dc7f3c3eb73fcc409b3fb6cbe1eb6de49ce7efe50f4301_u256,
                s: 0x181b5121d93b083e74b7c081a7170ee3971ca5aab887aa8343632f9116370020_u256,
                // not working
            // r: 0xba5fd33681ac29194bb0c2bd4292293ffde57fa45d67a6f7c674b602d644dd19_u256,
            // s: 0x706177f057ebcf8eafc28eb1639616b8fd618cf9ec4b6fad6d585eca536ca2f5_u256,
            // r: 0x5fe83e6e2566643bcd8d90e1e0af66da97e1e1bb49774c27ff6e4cb709b4f176_u256,
            // s: 0x91cf9a0a109dbc851fc182fda61f5cf40b14d9f523cd37531dbc8886ffdda3f6_u256,

                // r: 0x69f502afad80fe36615b0c0dfa89df5dd063c6e35ac6b7bc6a7a692e92a02711_u256,
            // s: 0x05c7bba57f76185f2feb93691ab081b2368dd3cfa4c5ec946eca1c7d5a5266d6_u256,
            // r: 0x7bc1d6ea5881be5517b4ea788debbd972323b89dec5e2f649f7654876e25a228_u256,
            // s: 0xf21f7ba4e2805627d78e131342d4a274244795a50c4dc20447d4286e6a529597_u256,
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

        let linked_wallet_second_recipient = LinkedStarknetAddress {
            starknet_address: sender_address.try_into().unwrap(),
        };

        let linked_wallet_second_recipient_and_strk_user = LinkedStarknetAddress {
            starknet_address: second_sender_address.try_into().unwrap(),
        };

        // @TODO format the content and get the correct signature
        let request_linked_wallet_to_second_recipient = SocialRequest {
            public_key: second_recipient_public_key,
            created_at: 1716285235_u64,
            kind: 1_u16,
            tags: "[]",
            content: linked_wallet_second_recipient_and_strk_user.clone(),
            sig: SchnorrSignature {
                r: 0xa90a9b8bfc35bc68c1f1bc605487b03fcf720ae9ea010ea2d74dd7106cbcb67c_u256,
                s: 0xc01daabf2b8b86d654ef4c35c644b786a74bc431dfc9bc78ea29532b34c2de9f_u256,
                // r: 0xed8b5144dbb7a7a44b86421489d189e873b25c2eedb271f499bcf80155f4729d_u256,
            // s: 0x4f9012d81dd51f64d8d737940308e6da33e9908765487bb6470cd7f12d539c1c_u256,
            // r: 0x38c0d2ca3e26a774a3f37a15e3f20f17c3d1b7509c8c0e257e6e72d4d351b639_u256,
            // s: 0x93c6f53d83691282ab0469c1fa2368413f19fede348a1c7c7b3363_u256,
            // r: 0x4e04216ca171673375916f12e1a56e00dca1d39e44207829d659d06f3a972d6f_u256,
            // s: 0xa16bc69fab00104564b9dad050a29af4d2380c229de984e49ad125fe29b5be8e_u256,
            // r: 0x051b6d408b709d29b6ef55b1aa74d31a9a265c25b0b91c2502108b67b29c0d5c_u256,
            // s: 0xe31f5691af0e950eb8697fdbbd464ba725b2aaf7e5885c4eaa30a1e528269793_u256
            },
        };

        (
            request_linked_wallet_to,
            recipient_public_key,
            sender_address,
            nostrfi_scoring,
            fail_request_linked_wallet_to_caller,
            request_score_admin_nostr_profile,
            request_vote_tips_nostr_profile,
            erc20_dispatcher,
            request_linked_wallet_to_second_recipient,
            namespace_dispatcher,
            score_factory_dispatcher,
        )
    }

    fn request_fixture() -> (
        SocialRequest<LinkedStarknetAddress>,
        NostrPublicKey,
        ContractAddress,
        INostrFiScoringDispatcher,
        SocialRequest<LinkedStarknetAddress>,
        SocialRequest<PushAlgoScoreNostrNote>,
        SocialRequest<VoteNostrNote>,
        IERC20Dispatcher,
        SocialRequest<LinkedStarknetAddress>,
        INostrNamespaceDispatcher,
        IFactoryNostrFiScoringDispatcher,
    ) {
        let nostrfi_scoring_class = declare_nostrfi_scoring();
        request_fixture_custom_classes(nostrfi_scoring_class)
    }

    fn push_profile_score_algo(
        nostrfi_scoring_address: ContractAddress,
        sender_address: ContractAddress,
        recipient_nostr_key: NostrPublicKey,
        erc20: IERC20Dispatcher,
        request_score_admin_nostr_profile: SocialRequest<PushAlgoScoreNostrNote>,
    ) {
        start_cheat_caller_address(nostrfi_scoring_address, sender_address);
        let nostrfi_scoring = INostrFiScoringDispatcher {
            contract_address: nostrfi_scoring_address,
        };
        // Setup NostrFi Scoring Admin
        println!("set admin nostr pubkey");
        nostrfi_scoring.set_admin_nostr_pubkey(recipient_nostr_key, true);

        let profile_score = ProfileAlgorithmScoring {
            nostr_address: recipient_nostr_key,
            starknet_address: sender_address.try_into().unwrap(),
            ai_score: 100,
            is_claimed: false,
            total_score: 100,
            veracity_score: 100,
            // ai_score_to_claimed: 0,
        // overview_score: 100,
        // overview_score_to_claimed: 0,
        // skills_score: 100,
        // skills_score_to_claimed: 0,
        // value_shared_score: 100,
        // value_shared_score_to_claimed: 0,
        };
        println!("push profile score");
        nostrfi_scoring.push_profile_score_algo(request_score_admin_nostr_profile, profile_score);

        stop_cheat_caller_address(nostrfi_scoring.contract_address);
    }


    fn vote_user_nostr_profile(
        nostrfi_scoring_address: ContractAddress,
        sender_address: ContractAddress,
        recipient_nostr_key: NostrPublicKey,
        request: SocialRequest<VoteNostrNote>,
        erc20: IERC20Dispatcher,
    ) {
        let nostrfi_scoring = INostrFiScoringDispatcher {
            contract_address: nostrfi_scoring_address,
        };
        println!("approve erc20 to spend");
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let vote_params = VoteParams {
            nostr_address: recipient_nostr_key,
            vote: Vote::Good,
            is_upvote: true,
            upvote_amount: 100,
            downvote_amount: 0,
            amount: 100,
            amount_token: 100,
        };
        erc20.approve(nostrfi_scoring.contract_address, vote_params.amount_token * 2);
        // erc20
        //     .approve(
        //         nostrfi_scoring.contract_address, vote_params.amount_token,
        //     );
        let erc20_allowance = erc20.allowance(sender_address, nostrfi_scoring.contract_address);
        println!("erc20 allowance: {:?}", erc20_allowance);
        println!("amount token: {:?}", vote_params.amount_token);
        assert!(erc20_allowance >= vote_params.amount_token, "erc20 allowance not correct");
        stop_cheat_caller_address(erc20.contract_address);

        println!("vote nostr note");
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        nostrfi_scoring.vote_nostr_profile_starknet_only(vote_params);
    }


    fn end_to_end_basic_flow(
        nostrfi_scoring_address: ContractAddress,
        sender_address: ContractAddress,
        recipient_nostr_key: NostrPublicKey,
        request: SocialRequest<LinkedStarknetAddress>,
        request_score_admin_nostr_profile: SocialRequest<PushAlgoScoreNostrNote>,
        request_vote_tips_nostr_profile: SocialRequest<VoteNostrNote>,
        erc20: IERC20Dispatcher,
        epoch_index: u64,
        current_time: u64,
        amount_token_deposit_rewards: u256,
    ) {
        // let (
        //     request,
        //     recipient_nostr_key,
        //     sender_address,
        //     nostrfi_scoring,
        //     request_profile_score,
        //     request_score_admin_nostr_profile,
        //     request_vote_tips_nostr_profile,
        //     erc20,
        // ) =
        //     request_fixture();

        let nostrfi_scoring = INostrFiScoringDispatcher {
            contract_address: nostrfi_scoring_address,
        };
        start_cheat_caller_address_global(sender_address);
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);

        println!("linked nostr profile");
        nostrfi_scoring.linked_nostr_profile(request);

        println!("get nostr linked");
        let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(recipient_nostr_key);
        println!("nostr linked: {:?}", nostr_linked);
        assert!(nostr_linked == sender_address, "nostr not linked");

        // let erc20_balance = erc20.balance_of(sender_address);
        // assert!(erc20_balance == amount_token_deposit_rewards, "erc20 balance not correct");

        // Setup NostrFi Scoring Admin
        println!("set admin nostr pubkey");
        nostrfi_scoring.set_admin_nostr_pubkey(recipient_nostr_key, true);

        let profile_score = ProfileAlgorithmScoring {
            nostr_address: recipient_nostr_key,
            starknet_address: sender_address.try_into().unwrap(),
            ai_score: 100,
            is_claimed: false,
            total_score: 100,
            veracity_score: 100,
            // ai_score_to_claimed: 0,
        // overview_score: 100,
        // overview_score_to_claimed: 0,
        // skills_score: 100,
        // skills_score_to_claimed: 0,
        // value_shared_score: 100,
        // value_shared_score_to_claimed: 0,
        };
        println!("push profile score");
        nostrfi_scoring.push_profile_score_algo(request_score_admin_nostr_profile, profile_score);

        println!("approve erc20 to spend");
        start_cheat_caller_address(erc20.contract_address, sender_address);
        let vote_params = VoteParams {
            nostr_address: recipient_nostr_key,
            vote: Vote::Good,
            is_upvote: true,
            upvote_amount: amount_token_deposit_rewards,
            downvote_amount: 0,
            amount: amount_token_deposit_rewards,
            amount_token: amount_token_deposit_rewards,
        };
        erc20.approve(nostrfi_scoring.contract_address, vote_params.amount_token * 2);
        // erc20
        //     .approve(
        //         nostrfi_scoring.contract_address, vote_params.amount_token,
        //     );
        let erc20_allowance = erc20.allowance(sender_address, nostrfi_scoring.contract_address);
        println!("erc20 allowance: {:?}", erc20_allowance);
        println!("amount token: {:?}", vote_params.amount_token);
        assert!(erc20_allowance >= vote_params.amount_token, "erc20 allowance not correct");

        println!("vote nostr note");
        stop_cheat_caller_address(erc20.contract_address);

        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);

        nostrfi_scoring.vote_nostr_profile_starknet_only(vote_params);

        println!("deposit rewards");

        start_cheat_caller_address(erc20.contract_address, sender_address);

        erc20.approve(nostrfi_scoring.contract_address, amount_token_deposit_rewards);
        stop_cheat_caller_address(erc20.contract_address);

        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
        nostrfi_scoring.deposit_rewards(amount_token_deposit_rewards, DepositRewardsType::General);
        // let created_at = starknet::get_block_timestamp();

        // let current_time = created_at
        // + DEFAULT_BATCH_INTERVAL_WEEK
        // + 1; // Proposal duration reached

        println!("cheat block timestamp");
        cheat_block_timestamp(
            nostrfi_scoring.contract_address, current_time, CheatSpan::TargetCalls(1),
        );
        start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);

        let contract_balance = erc20.balance_of(nostrfi_scoring.contract_address);
        println!("contract balance: {:?}", contract_balance);
        // assert!(contract_balance == amount_token_deposit_rewards, "erc20
        // balanceinit_nostr_profile not correct");

        println!("claim and distribute rewards");

        nostrfi_scoring.claim_and_distribute_my_rewards(epoch_index);

        println!("contract balance: {:?}", contract_balance);

        let contract_balance_after = erc20.balance_of(nostrfi_scoring.contract_address);
        println!("contract balance after: {:?}", contract_balance_after);

        assert!(contract_balance > contract_balance_after, "contract balance not correct");

        println!("contract balance after == 0: {:?}", contract_balance_after == 0);
        // SECOND EPOCH TEST

    }

    // #[test]
    // fn end_to_end_flow_strk() {
    //     let (
    //         request,
    //         recipient_nostr_key,
    //         sender_address,
    //         nostrfi_scoring,
    //         request_profile_score,
    //         request_score_admin_nostr_profile,
    //         request_vote_tips_nostr_profile,
    //         erc20,
    //         request_linked_wallet_to_second_recipient,
    //         namespace_dispatcher,
    //     ) =
    //         request_fixture();

    //     let mut created_at = starknet::get_block_timestamp();
    //     println!("created at: {:?}", created_at);
    //     println!("start end to end basic flow");
    //     let mut current_time = created_at
    //         + DEFAULT_BATCH_INTERVAL_WEEK
    //         + 1; // Proposal duration reached
    //     println!("current time: {:?}", current_time);

    //     let mut amount_token_deposit_rewards = 150_u256;

    //     end_to_end_basic_flow(
    //         nostrfi_scoring.contract_address,
    //         sender_address,
    //         recipient_nostr_key,
    //         request.clone(),
    //         request_score_admin_nostr_profile.clone(),
    //         request_vote_tips_nostr_profile.clone(),
    //         erc20.clone(),
    //         0,
    //         current_time,
    //         amount_token_deposit_rewards,
    //     );

    //     cheat_block_timestamp(
    //         nostrfi_scoring.contract_address, current_time, CheatSpan::TargetCalls(1),
    //     );
    //     let mut new_created_at = starknet::get_block_timestamp();
    //     println!("new_created_at: {:?}", new_created_at);

    //     println!("cheat block timestamp");
    //     cheat_block_timestamp(
    //         nostrfi_scoring.contract_address, new_created_at, CheatSpan::TargetCalls(1),
    //     );

    //     current_time = (new_created_at + DEFAULT_BATCH_INTERVAL_WEEK + 1)
    //         * 2; // Proposal duration reached

    //     // current_time = new_created_at
    //     // + DEFAULT_BATCH_INTERVAL_WEEK
    //     // + 1; // Proposal duration reached

    //     println!("start end to end basic flow");
    //     println!("current time second epoch: {:?}", current_time);

    //     amount_token_deposit_rewards = 200_u256;

    //     end_to_end_basic_flow(
    //         nostrfi_scoring.contract_address,
    //         sender_address,
    //         recipient_nostr_key,
    //         request.clone(),
    //         request_score_admin_nostr_profile.clone(),
    //         request_vote_tips_nostr_profile.clone(),
    //         erc20.clone(),
    //         1,
    //         current_time,
    //         amount_token_deposit_rewards,
    //     );
    // }

    fn init_metadata(
        recipient_nostr_key: NostrPublicKey, name: ByteArray, about: ByteArray, main_tag: ByteArray,
    ) -> NostrMetadata {
        let nostr_metadata = NostrMetadata {
            name: name,
            about: about,
            nostr_address: recipient_nostr_key,
            event_id_nip_72: 0_u256,
            event_id_nip_29: 0_u256,
            main_tag: main_tag,
        };
        nostr_metadata
    }
    fn init_score_by_factory(
        erc20_address: ContractAddress,
        score_factory_address: ContractAddress,
        metadata: NostrMetadata,
        sender_address: ContractAddress,
        recipient_nostr_key: NostrPublicKey,
    ) -> ContractAddress {
        let score_factory_dispatcher = IFactoryNostrFiScoringDispatcher {
            contract_address: score_factory_address,
        };
        let nostr_metadata = NostrMetadata {
            name: metadata.name,
            about: metadata.about,
            nostr_address: metadata.nostr_address,
            event_id_nip_72: metadata.event_id_nip_72,
            event_id_nip_29: metadata.event_id_nip_29,
            main_tag: metadata.main_tag,
        };

        start_cheat_caller_address(score_factory_dispatcher.contract_address, sender_address);
        let topic_address = score_factory_dispatcher
            .create_nostr_topic(
                sender_address,
                recipient_nostr_key,
                erc20_address,
                'test@example.com',
                nostr_metadata,
            );

        println!("topic address: {:?}", topic_address);
        stop_cheat_caller_address(score_factory_dispatcher.contract_address);
        topic_address
    }

    #[test]
    fn init_score_factory() {
        let (
            request,
            recipient_nostr_key,
            sender_address,
            _,
            request_profile_score,
            request_score_admin_nostr_profile,
            request_vote_tips_nostr_profile,
            erc20,
            request_linked_wallet_to_second_recipient,
            namespace_dispatcher,
            score_factory_dispatcher,
        ) =
            request_fixture();

        println!("init score factory");
        let topic_address = init_score_by_factory(
            erc20.contract_address,
            score_factory_dispatcher.contract_address,
            init_metadata(
                recipient_nostr_key,
                "Test Namespace",
                "Test namespace for InfoFI about topics & communities on Nostr and more soon",
                "test@example.com",
            ),
            sender_address,
            recipient_nostr_key,
        );

        let nostrfi_scoring = INostrFiScoringDispatcher { contract_address: topic_address };

        let mut created_at = starknet::get_block_timestamp();
        println!("created at: {:?}", created_at);
        println!("start end to end basic flow");
        let mut current_time = created_at
            + DEFAULT_BATCH_INTERVAL_WEEK
            + 1; // Proposal duration reached
        println!("current time: {:?}", current_time);
        start_cheat_caller_address(topic_address, sender_address);

        println!("linked nostr profile");
        nostrfi_scoring.linked_nostr_profile(request.clone());

        stop_cheat_caller_address(topic_address);
        let second_sender_address: ContractAddress = 456.try_into().unwrap();

        start_cheat_caller_address(topic_address, second_sender_address);

        println!("linked nostr profile second profile");
        nostrfi_scoring.linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());
        stop_cheat_caller_address(topic_address);

        println!("get nostr linked");
        let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(second_recipient_public_key);
        println!("nostr linked: {:?}", nostr_linked);
        println!("nostr second_sender_address: {:?}", second_sender_address);
        assert!(nostr_linked == second_sender_address, "nostr not linked");
        start_cheat_caller_address(topic_address, second_sender_address);

        println!("namespace linked second recipient: {:?}", second_recipient_public_key);

        namespace_dispatcher
            .linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());
        println!("namespace linked second recipient again: {:?}", second_recipient_public_key);

        namespace_dispatcher
            .linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());

        // cheat_block_timestamp(
        //     nostrfi_scoring.contract_address, current_time, CheatSpan::TargetCalls(1),
        // );

        let mut amount_token_deposit_rewards = 150_u256;

        end_to_end_basic_flow(
            nostrfi_scoring.contract_address,
            sender_address,
            recipient_nostr_key,
            request.clone(),
            request_score_admin_nostr_profile.clone(),
            request_vote_tips_nostr_profile.clone(),
            erc20.clone(),
            0,
            current_time,
            amount_token_deposit_rewards,
        );

        let mut new_created_at = starknet::get_block_timestamp();
        println!("new_created_at: {:?}", new_created_at);

        println!("cheat block timestamp");
        cheat_block_timestamp(
            nostrfi_scoring.contract_address, new_created_at, CheatSpan::TargetCalls(1),
        );

        current_time = (new_created_at + DEFAULT_BATCH_INTERVAL_WEEK + 1)
            * 2; // Proposal duration reached

        current_time = new_created_at
            + DEFAULT_BATCH_INTERVAL_WEEK
            + 1; // Proposal duration reached

        println!("start end to end basic flow");
        println!("current time second epoch: {:?}", current_time);
    }

    #[test]
    fn init_score_factory_and_topic() {
        let (
            request,
            recipient_nostr_key,
            sender_address,
            _,
            request_profile_score,
            request_score_admin_nostr_profile,
            request_vote_tips_nostr_profile,
            erc20,
            request_linked_wallet_to_second_recipient,
            namespace_dispatcher,
            score_factory_dispatcher,
        ) =
            request_fixture();
        println!("init_score_factory_and_topic");

        let topic_address = init_score_by_factory(
            erc20.contract_address,
            score_factory_dispatcher.contract_address,
            init_metadata(
                recipient_nostr_key,
                "Test Namespace",
                "Test namespace for InfoFI about topics & communities on Nostr and more soon",
                "test@example.com",
            ),
            sender_address,
            recipient_nostr_key,
        );

        let nostrfi_scoring = INostrFiScoringDispatcher { contract_address: topic_address };

        let mut created_at = starknet::get_block_timestamp();
        println!("created at: {:?}", created_at);
        println!("start end to end basic flow");
        let mut current_time = created_at
            + DEFAULT_BATCH_INTERVAL_WEEK
            + 1; // Proposal duration reached
        println!("current time: {:?}", current_time);
        start_cheat_caller_address(topic_address, sender_address);

        println!("linked nostr profile");
        nostrfi_scoring.linked_nostr_profile(request.clone());

        stop_cheat_caller_address(topic_address);
        let second_sender_address: ContractAddress = 456.try_into().unwrap();

        start_cheat_caller_address(topic_address, second_sender_address);

        println!("linked nostr profile second profile");
        nostrfi_scoring.linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());
        stop_cheat_caller_address(topic_address);

        println!("get nostr linked");
        let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(second_recipient_public_key);
        println!("nostr linked: {:?}", nostr_linked);
        println!("nostr second_sender_address: {:?}", second_sender_address);
        assert!(nostr_linked == second_sender_address, "nostr not linked");
        start_cheat_caller_address(topic_address, second_sender_address);

        println!("namespace linked second recipient: {:?}", second_recipient_public_key);

        namespace_dispatcher
            .linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());
        println!("namespace linked second recipient again: {:?}", second_recipient_public_key);

        namespace_dispatcher
            .linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());

        // cheat_block_timestamp(
        //     nostrfi_scoring.contract_address, current_time, CheatSpan::TargetCalls(1),
        // );

        let mut amount_token_deposit_rewards = 150_u256;

        end_to_end_basic_flow(
            nostrfi_scoring.contract_address,
            sender_address,
            recipient_nostr_key,
            request.clone(),
            request_score_admin_nostr_profile.clone(),
            request_vote_tips_nostr_profile.clone(),
            erc20.clone(),
            0,
            current_time,
            amount_token_deposit_rewards,
        );

        let mut new_created_at = starknet::get_block_timestamp();
        println!("new_created_at: {:?}", new_created_at);

        println!("cheat block timestamp");
        cheat_block_timestamp(
            nostrfi_scoring.contract_address, new_created_at, CheatSpan::TargetCalls(1),
        );

        current_time = (new_created_at + DEFAULT_BATCH_INTERVAL_WEEK + 1)
            * 2; // Proposal duration reached

        current_time = new_created_at
            + DEFAULT_BATCH_INTERVAL_WEEK
            + 1; // Proposal duration reached

        println!("start end to end basic flow");
        println!("current time second epoch: {:?}", current_time);
    }

    #[test]
    fn init_score_factory_and_topic_with_test() {
        let (
            request,
            recipient_nostr_key,
            sender_address,
            _,
            request_profile_score,
            request_score_admin_nostr_profile,
            request_vote_tips_nostr_profile,
            erc20,
            request_linked_wallet_to_second_recipient,
            namespace_dispatcher,
            score_factory_dispatcher,
        ) =
            request_fixture();
        println!("init_score_factory_and_topic_with_test");

        let topic_address = init_score_by_factory(
            erc20.contract_address,
            score_factory_dispatcher.contract_address,
            init_metadata(
                recipient_nostr_key,
                "Test Namespace",
                "Test namespace for InfoFI about topics & communities on Nostr and more soon",
                "test@example.com",
            ),
            sender_address,
            recipient_nostr_key,
        );

        let nostrfi_scoring = INostrFiScoringDispatcher { contract_address: topic_address };

        let mut created_at = starknet::get_block_timestamp();
        println!("created at: {:?}", created_at);
        println!("start end to end basic flow");
        let mut current_time = created_at
            + DEFAULT_BATCH_INTERVAL_WEEK
            + 1; // Proposal duration reached
        println!("current time: {:?}", current_time);
        start_cheat_caller_address(topic_address, sender_address);

        println!("linked nostr profile");
        nostrfi_scoring.linked_nostr_profile(request.clone());

        stop_cheat_caller_address(topic_address);
        let second_sender_address: ContractAddress = 456.try_into().unwrap();

        start_cheat_caller_address(topic_address, second_sender_address);

        println!("linked nostr profile second profile");
        nostrfi_scoring.linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());
        stop_cheat_caller_address(topic_address);

        println!("get nostr linked");
        let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(second_recipient_public_key);
        println!("nostr linked: {:?}", nostr_linked);
        println!("nostr second_sender_address: {:?}", second_sender_address);
        assert!(nostr_linked == second_sender_address, "nostr not linked");
        start_cheat_caller_address(topic_address, second_sender_address);

        println!("namespace linked second recipient: {:?}", second_recipient_public_key);

        namespace_dispatcher
            .linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());
        println!("namespace linked second recipient again: {:?}", second_recipient_public_key);

        namespace_dispatcher
            .linked_nostr_profile(request_linked_wallet_to_second_recipient.clone());

        // cheat_block_timestamp(
        //     nostrfi_scoring.contract_address, current_time, CheatSpan::TargetCalls(1),
        // );

        let mut amount_token_deposit_rewards = 150_u256;

        end_to_end_basic_flow(
            nostrfi_scoring.contract_address,
            sender_address,
            recipient_nostr_key,
            request.clone(),
            request_score_admin_nostr_profile.clone(),
            request_vote_tips_nostr_profile.clone(),
            erc20.clone(),
            0,
            current_time,
            amount_token_deposit_rewards,
        );

        let mut new_created_at = starknet::get_block_timestamp();
        println!("new_created_at: {:?}", new_created_at);

        println!("cheat block timestamp");
        cheat_block_timestamp(
            nostrfi_scoring.contract_address, new_created_at, CheatSpan::TargetCalls(1),
        );

        current_time = (new_created_at + DEFAULT_BATCH_INTERVAL_WEEK + 1)
            * 2; // Proposal duration reached

        current_time = new_created_at
            + DEFAULT_BATCH_INTERVAL_WEEK
            + 1; // Proposal duration reached

        println!("start end to end basic flow");
        println!("current time second epoch: {:?}", current_time);
    }
    // #[test]
// #[should_panic()]
// fn should_panic_multi_distribute_rewards() {
//     let (
//         request,
//         recipient_nostr_key,
//         sender_address,
//         nostrfi_scoring,
//         request_profile_score,
//         request_score_admin_nostr_profile,
//         request_vote_tips_nostr_profile,
//         erc20,
//         request_linked_wallet_to_second_recipient,
//     ) =
//         request_fixture();

    //     let mut created_at = starknet::get_block_timestamp();
//     println!("created at: {:?}", created_at);
//     println!("start end to end basic flow");
//     let mut current_time = created_at
//         + DEFAULT_BATCH_INTERVAL_WEEK
//         + 1; // Proposal duration reached
//     println!("current time: {:?}", current_time);

    //     let mut amount_token_deposit_rewards = 150_u256;

    //     end_to_end_basic_flow(
//         nostrfi_scoring.contract_address,
//         sender_address,
//         recipient_nostr_key,
//         request.clone(),
//         request_score_admin_nostr_profile.clone(),
//         request_vote_tips_nostr_profile.clone(),
//         erc20.clone(),
//         0,
//         current_time,
//         amount_token_deposit_rewards,
//     );

    //     cheat_block_timestamp(
//         nostrfi_scoring.contract_address, current_time, CheatSpan::TargetCalls(1),
//     );
//     let mut new_created_at = starknet::get_block_timestamp();
//     println!("new_created_at: {:?}", new_created_at);

    //     println!("cheat block timestamp");
//     cheat_block_timestamp(
//         nostrfi_scoring.contract_address, new_created_at, CheatSpan::TargetCalls(1),
//     );

    //     current_time = (new_created_at + DEFAULT_BATCH_INTERVAL_WEEK + 1)
//         * 2; // Proposal duration reached
//     println!("start end to end basic flow");
//     println!("current time second epoch: {:?}", current_time);

    //     amount_token_deposit_rewards = 200_u256;

    //     end_to_end_basic_flow(
//         nostrfi_scoring.contract_address,
//         sender_address,
//         recipient_nostr_key,
//         request.clone(),
//         request_score_admin_nostr_profile.clone(),
//         request_vote_tips_nostr_profile.clone(),
//         erc20.clone(),
//         0,
//         current_time,
//         amount_token_deposit_rewards,
//     );
// }
// #[test]
// fn end_to_end_flow_strk() {
//         let (
//         request,
//         recipient_nostr_key,
//         sender_address,
//         nostrfi_scoring,
//         request_profile_score,
//         request_score_admin_nostr_profile,
//         request_vote_tips_nostr_profile,
//         erc20,
//         request_linked_wallet_to_second_recipient,
//     ) =
//         request_fixture();

    //     println!("start end to end basic flow");
//     end_to_end_basic_flow(nostrfi_scoring.contract_address, sender_address,
//     recipient_nostr_key, request.clone(), request_score_admin_nostr_profile.clone(),
//     request_vote_tips_nostr_profile.clone(), erc20.clone(),0);

    //     println!("end to end basic flow");
//     end_to_end_basic_flow(nostrfi_scoring.contract_address, sender_address,
//     recipient_nostr_key, request.clone(), request_score_admin_nostr_profile.clone(),
//     request_vote_tips_nostr_profile.clone(), erc20.clone(),1);

    // }

    // #[test]
// fn linked_wallet_to() {
//     let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _, _, _, _) =
//         request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
//     nostrfi_scoring.linked_nostr_profile(request);

    //     let nostr_linked = nostrfi_scoring.get_nostr_by_sn_default(recipient_nostr_key);
//     assert!(nostr_linked == sender_address, "nostr not linked");
// }

    // #[test]
// #[should_panic()]
// fn link_incorrect_signature() {
//     let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to_caller, _, _,
//     _) =
//         request_fixture();
//     stop_cheat_caller_address_global();
//     start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);

    //     let request_test_failed_sig = SocialRequest {
//         sig: SchnorrSignature {
//             r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
//             s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966606f_u256,
//         },
//         ..fail_request_linked_wallet_to_caller,
//     };
//     nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
// }

    // #[test]
// #[should_panic()]
// fn link_incorrect_signature_link_to() {
//     let (request, _, sender_address, nostrfi_scoring, _, _, _, _) = request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     stop_cheat_caller_address_global();
//     start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
//     let request_test_failed_sig = SocialRequest {
//         sig: SchnorrSignature {
//             r: 0x2570a9a0c92c180bd4ac826c887e63844b043e3b65da71a857d2aa29e7cd3a5e_u256,
//             s: 0x1c0c0a8b7a8330b6b8915985c9cd498a407587213c2e7608e7479b4ef966605f_u256,
//         },
//         ..request,
//     };

    //     nostrfi_scoring.linked_nostr_profile(request_test_failed_sig);
// }

    // #[test]
// #[should_panic()]
// // #[should_panic(expected: ' invalid caller ')]
// fn link_incorrect_caller_link_to() {
//     let (_, _, sender_address, nostrfi_scoring, fail_request_linked_wallet_to, _, _, _) =
//         request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     stop_cheat_caller_address_global();
//     start_cheat_caller_address(nostrfi_scoring.contract_address, sender_address);
//     nostrfi_scoring.linked_nostr_profile(fail_request_linked_wallet_to);
// }

    // #[test]
// fn vote_user_for_profile() {
//     let (
//         request,
//         recipient_nostr_key,
//         sender_address,
//         nostrfi_scoring,
//         request_profile_score,
//         request_score_admin_nostr_profile,
//         request_vote_nostr_profile,
//     ) =
//         request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     nostrfi_scoring.vote_nostr_note(request_vote_nostr_profile);
// }

    // #[test]
// fn vote_user_for_profile_starknet() {
//     let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _, _, _, _) =
//         request_fixture();
//     start_cheat_caller_address_global(sender_address);

    //     let vote_params = VoteParams {
//         nostr_address: recipient_nostr_key,
//         vote: Vote::Good,
//         is_upvote: true,
//         upvote_amount: 100,
//         downvote_amount: 0,
//         amount: 100,
//         amount_token: 100,
//     };

    //     nostrfi_scoring.vote_nostr_profile_starknet_only(vote_params);
// }
// #[test]
// fn claim_and_distribute_my_rewards() {
//     let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _ _, _) =
//     request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     nostrfi_scoring.claim_and_distribute_my_rewards();
// }

    // #[test]
// fn distribute_algo_rewards_by_user() {
//     let (request, recipient_nostr_key, sender_address, nostrfi_scoring, _ _, _) =
//     request_fixture();
//     start_cheat_caller_address_global(sender_address);
//     nostrfi_scoring.distribute_algo_rewards_by_user();
// }
}
