use starknet::ContractAddress;
use afk::types::defi_types::{TokenPermitted, DepositUser, MintDepositEvent, WithdrawDepositEvent};

#[starknet::contract]
mod Vault {
    use afk::interfaces::vault::{IERCVault};
    // use afk::interfaces::erc20_mintable::{IERC20Mintable};

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use super::{DepositUser, TokenPermitted, MintDepositEvent, WithdrawDepositEvent};

    // TODO Change interface of IERC20 Mintable
    // Fix dispatcher
    // use afk::tokens::erc20_mintable::{ IERC20MintableDispatcher, IERC20MintableDispatcherTrait};

    #[storage]
    struct Storage {
        token_address:ContractAddress,
        is_mintable_paused:bool,
        token_permitted:LegacyMap<ContractAddress, TokenPermitted>,
        deposit_by_user: LegacyMap<ContractAddress, DepositUser>,
        deposit_by_user_by_token: LegacyMap::<(ContractAddress, ContractAddress), DepositUser>,
    }


    #[constructor]
    fn constructor(ref self: ContractState, token_address: ContractAddress) {
        // Give MINTER role to the Vault for the token used 
        self.token_address.write(token_address);
    }


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MintDepositEvent: MintDepositEvent,
        WithdrawDepositEvent: WithdrawDepositEvent,
    }


    #[abi(embed_v0)]
    impl VaultImpl of IERCVault<ContractState> {
     
        // Mint a coin
        // Use one token
        // Used the specificy ratio. Burn the token. Check the pooling withdraw
        fn mint_by_token(ref self: ContractState, token_address:ContractAddress, amount: u256) {
     
            let caller= get_caller_address();
            // Check if token valid

            // Sent token to deposit

            // let token_deposited= IERC20MintableDispatcher{ token_address};
            // token_deposited.transfer_from(caller, get_contract_address, amount);


            // Mint token and send it to the receiver

            // let token_mintable= IERC20MintableDispatcher{ token_address};

            // Calculate the ratio if 1:1, less or more
            // let amount_ratio=1;
            // // let ratio =;
            // token_mintable.mint(caller, amount_ratio);

        }

        //  Withdraw a coin
        // Use one token
        // Used the specificy ratio. Burn the token. Check the pooling withdraw
        fn withdraw_coin_by_token(ref self: ContractState, token_address:ContractAddress, amount: u256) {
            let caller= get_caller_address();
            // Check if token valid

            // Receive/burn token minted


            // Resend amount of coin deposit by user
            
        }
      
    }
}
