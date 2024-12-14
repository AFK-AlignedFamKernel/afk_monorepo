#[cfg(test)]
mod quest_factory_tests {
    use afk_games::interfaces::erc20_mintable::{
        IERC20MintableDispatcher, IERC20MintableDispatcherTrait
    };
    use afk_games::interfaces::quest::{
        IQuestFactoryDispatcher, IQuestFactoryDispatcherTrait, IQuestNFTDispatcher,
        IQuestNFTDispatcherTrait, ITapQuestsDispatcher, ITapQuestsDispatcherTrait
    };

    use afk_games::interfaces::vault::{IERCVaultDispatcher};
    use afk_games::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use afk_games::types::quest::{QuestInfo};
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

    use snforge_std::{
        declare, ContractClass, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
        stop_cheat_caller_address
    };

    use starknet::{ContractAddress};

    fn ADMIN() -> ContractAddress {
        123.try_into().unwrap()
    }

    fn CALLER() -> ContractAddress {
        5.try_into().unwrap()
    }

    fn quest_name() -> felt252 {
        'Tap Quest'
    }

    fn quest_info(addr: ContractAddress) -> QuestInfo {
        return QuestInfo { name: quest_name(), address: addr, quest_id: 0, };
    }

    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

    fn setup() -> (IQuestFactoryDispatcher, ContractAddress, IERC721Dispatcher, IERC20Dispatcher) {
        let (vault_dispatcher, token_address) = deploy_and_setup_vault();
        let quest_nft_addr = deploy_quest_nft("QUEST NFT", "QNFT", ADMIN());
        let factory_dispatcher = deploy_factory_quest(
            quest_nft_addr, vault_dispatcher.contract_address
        );
        let tap_quest_addr = deploy_tap_quest();

        // set minter role for quest nft
        start_cheat_caller_address(quest_nft_addr, ADMIN());
        IQuestNFTDispatcher { contract_address: quest_nft_addr }
            .set_role(factory_dispatcher.contract_address, MINTER_ROLE, true);
        stop_cheat_caller_address(quest_nft_addr);

        (
            factory_dispatcher,
            tap_quest_addr,
            IERC721Dispatcher { contract_address: quest_nft_addr },
            IERC20Dispatcher { contract_address: token_address }
        )
    }

    fn deploy_tap_quest() -> ContractAddress {
        let class = declare("TapQuests").unwrap().contract_class();
        let mut calldata = array![];
        5.serialize(ref calldata);
        true.serialize(ref calldata);
        true.serialize(ref calldata);

        let (tap_quest_addr, _) = class.deploy(@calldata).unwrap();
        tap_quest_addr
    }

    fn deploy_factory_quest(
        quest_nft: ContractAddress, vault: ContractAddress
    ) -> IQuestFactoryDispatcher {
        let factory_class = declare("QuestFactory").unwrap().contract_class();
        let mut calldata = array![];
        quest_nft.serialize(ref calldata);
        vault.serialize(ref calldata);

        let (factory_address, _) = factory_class.deploy(@calldata).unwrap();

        IQuestFactoryDispatcher { contract_address: factory_address }
    }

    fn deploy_quest_nft(
        name: ByteArray, symbol: ByteArray, owner: ContractAddress
    ) -> ContractAddress {
        let class = declare("QuestNFT").unwrap().contract_class();
        let mut calldata = array![];
        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        owner.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        contract_address
    }


    fn deploy_and_setup_vault() -> (IERCVaultDispatcher, ContractAddress) {
        let erc20_mintable_class = declare("ERC20Mintable").unwrap().contract_class();
        let abtc_dispathcer = deploy_erc20_mint(
            *erc20_mintable_class, "aBTC token", "aBTC", ADMIN(), 100_000_000_u256,
        );

        let vault_class = declare("Vault").unwrap().contract_class();

        let mut calldata = array![abtc_dispathcer.contract_address.into()];
        ADMIN().serialize(ref calldata);
        let (vault_address, _) = vault_class.deploy(@calldata).unwrap();

        let vault_dispatcher = IERCVaultDispatcher { contract_address: vault_address };

        // set minter role in erc20 mintable token
        let abtc_mintable_dispathcer = IERC20MintableDispatcher {
            contract_address: abtc_dispathcer.contract_address
        };

        start_cheat_caller_address(abtc_dispathcer.contract_address, ADMIN());
        abtc_mintable_dispathcer.set_role(vault_dispatcher.contract_address, MINTER_ROLE, true);
        stop_cheat_caller_address(abtc_dispathcer.contract_address);

        (vault_dispatcher, abtc_dispathcer.contract_address)
    }

    fn deploy_erc20_mint(
        class: ContractClass,
        name: ByteArray,
        symbol: ByteArray,
        owner: ContractAddress,
        initial_supply: u256,
    ) -> IERC20Dispatcher {
        let mut calldata: Array<felt252> = ArrayTrait::new();

        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        owner.serialize(ref calldata);
        initial_supply.serialize(ref calldata);

        let (contract_address, _) = class.deploy(@calldata).unwrap();

        IERC20Dispatcher { contract_address }
    }

    #[test]
    fn test_add_quest() {
        let (factory_dispatcher, tap_quest_addr, _, _) = setup();

        factory_dispatcher.add_quest(quest_info(tap_quest_addr));

        let quest = factory_dispatcher.get_quest(0);

        assert(quest.name == quest_name(), 'wrong name');
        assert(quest.address == tap_quest_addr, 'wrong address');
        assert(quest.quest_id == 0, 'wrong id');
    }

    #[test]
    fn test_get_quests() {
        let (factory_dispatcher, tap_quest_addr, _, _) = setup();

        factory_dispatcher.add_quest(quest_info(tap_quest_addr));
        factory_dispatcher.add_quest(quest_info(tap_quest_addr));
        factory_dispatcher.add_quest(quest_info(tap_quest_addr));

        let quests = factory_dispatcher.get_quests();

        assert(quests.len() == 3, 'wrong length');
        assert(*quests.at(0).quest_id == 0, 'wrong id');
        assert(*quests.at(1).quest_id == 1, 'wrong id');
        assert(*quests.at(2).quest_id == 2, 'wrong id');
        assert(*quests.at(0).address == tap_quest_addr, 'wrong address');
        assert(*quests.at(1).address == tap_quest_addr, 'wrong address');
        assert(*quests.at(2).address == tap_quest_addr, 'wrong address');
    }

    // #[test]
    // #[should_panic(expected: 'Quest not claimable',)]
    // fn test_claim_reward_for_non_eligible_user() {
    //     let (factory_dispatcher, tap_quest_addr, _, _) = setup();

    //     factory_dispatcher.add_quest(quest_info(tap_quest_addr));

    //     let quests = factory_dispatcher.get_quests();

    //     start_cheat_caller_address(factory_dispatcher.contract_address, CALLER());
    //     factory_dispatcher.claim_reward(*quests.at(0).quest_id);

    // }

    #[test]
    fn test_claim_reward() {
        let (factory_dispatcher, tap_quest_addr, quest_nft_dispatcher, token_dispacher) = setup();

        factory_dispatcher.add_quest(quest_info(tap_quest_addr));

        let quests = factory_dispatcher.get_quests();

        start_cheat_caller_address(*quests.at(0).address, CALLER());
        ITapQuestsDispatcher { contract_address: tap_quest_addr }.handle_tap_daily();
        stop_cheat_caller_address(*quests.at(0).address);

        start_cheat_caller_address(factory_dispatcher.contract_address, CALLER());
        factory_dispatcher.claim_reward(*quests.at(0).quest_id);

        //asert token rewar was minted
        assert(token_dispacher.balance_of(CALLER()) == 5, 'wrong balance');

        // assert nft was minted
        assert(quest_nft_dispatcher.balance_of(CALLER()) == 1, 'wrong numder of nfts');

        let user_quest_info = factory_dispatcher.get_user_quest_info(*quests.at(0).quest_id);
        stop_cheat_caller_address(factory_dispatcher.contract_address);

        assert(user_quest_info.quest_id == *quests.at(0).quest_id, 'wrong quest id');
        assert(user_quest_info.is_complete, 'wrong complete status');
        assert(user_quest_info.claimed_token == 5, 'wrong complete status');
        assert(user_quest_info.claimed_nft_id == 1, 'wrong complete status');
    }
}
