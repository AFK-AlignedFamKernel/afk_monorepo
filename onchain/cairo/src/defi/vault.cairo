use afk::types::defi_types::{TokenPermitted, DepositUser, MintDepositEvent, WithdrawDepositEvent};
use starknet::ContractAddress;

// TODO
// Create the as a Vault component
#[starknet::contract]
mod Vault {
    use afk::interfaces::vault::{IERCVault};
    // use afk::interfaces::erc20_mintable::{IERC20Mintable};
    use afk::types::constants::{MINTER_ROLE, ADMIN_ROLE};

    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;

    use starknet::{
        ContractAddress, get_caller_address, storage_access::StorageBaseAddress,
        contract_address_const, get_block_timestamp, get_contract_address, ClassHash
    };
    use super::{DepositUser, TokenPermitted, MintDepositEvent, WithdrawDepositEvent};


    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // TODO Change interface of IERC20 Mintable
    // Fix dispatcher
    // use afk::tokens::erc20_mintable::{ IERC20MintableDispatcher, IERC20MintableDispatcherTrait};

    #[storage]
    struct Storage {
        token_address: ContractAddress,
        is_mintable_paused: bool,
        token_permitted: LegacyMap<ContractAddress, TokenPermitted>,
        deposit_by_user: LegacyMap<ContractAddress, DepositUser>,
        deposit_by_user_by_token: LegacyMap::<(ContractAddress, ContractAddress), DepositUser>,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }


    #[constructor]
    fn constructor(
        ref self: ContractState, token_address: ContractAddress, admin: ContractAddress
    ) {
        // Give MINTER role to the Vault for the token used 
        self.token_address.write(token_address);
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(ADMIN_ROLE, admin);
    }


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MintDepositEvent: MintDepositEvent,
        WithdrawDepositEvent: WithdrawDepositEvent,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }


    #[abi(embed_v0)]
    impl VaultImpl of IERCVault<ContractState> {
        // Mint a coin
        // Use one token
        // Used the specify ratio. Burn the token. Check the pooling withdraw
        fn mint_by_token(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            let caller = get_caller_address();
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
        fn withdraw_coin_by_token(
            ref self: ContractState, token_address: ContractAddress, amount: u256
        ) {
            let caller = get_caller_address();
        // Check if token valid

        // Receive/burn token minted

        // Resend amount of coin deposit by user

        }

        // Set token permitted
        fn set_token_permitted(
            ref self: ContractState,
            token_address: ContractAddress,
            ratio: u256,
            ratio_mint: u256,
            is_available: bool,
            pooling_timestamp: u64
        ) {}
    }
// Admin
// Add OPERATOR role to the Vault escrow
// #[external(v0)]
// fn set_control_role(
//     ref self: ContractState, recipient: ContractAddress, role: felt252, is_enable: bool
// ) {
//     self.accesscontrol.assert_only_role(ADMIN_ROLE);
//     assert!(
//         role == ADMIN_ROLE
//             || role == OPERATOR_ROLE // Think and Add others roles needed on the protocol
//             ,
//         "role not enable"
//     );
//     if is_enable {
//         self.accesscontrol._grant_role(role, recipient);
//     } else {
//         self.accesscontrol._revoke_role(role, recipient);
//     }
// }

}
