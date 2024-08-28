use afk::types::defi_types::{TokenPermitted, DepositUser, MintDepositEvent, WithdrawDepositEvent};
use starknet::ContractAddress;

// TODO
// Create the as a Vault component
#[starknet::contract]
pub mod Vault {
    use afk::interfaces::erc20_mintable::{IERC20MintableDispatcher, IERC20MintableDispatcherTrait};
    use afk::interfaces::vault::{IERCVault};
    use afk::tokens::erc20::{ERC20, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use afk::types::constants::{MINTER_ROLE, ADMIN_ROLE};
    use core::num::traits::Zero;

    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use starknet::event::EventEmitter;

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

    #[storage]
    struct Storage {
        token_address: ContractAddress,
        is_mintable_paused: bool,
        token_permitted: LegacyMap<ContractAddress, TokenPermitted>,
        is_token_permitted: LegacyMap<ContractAddress, bool>,
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
    pub enum Event {
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
            assert(self.is_token_permitted(token_address), 'Non permited token');

            // Sent token to deposit
            let token_deposited = IERC20Dispatcher { contract_address: token_address };
            token_deposited.approve(caller, amount);
            token_deposited.transfer_from(caller, get_contract_address(), amount);

            // Mint token and send it to the receiver
            let token_mintable = IERC20MintableDispatcher {
                contract_address: self.token_address.read()
            };
            let _token = self.token_permitted.read(token_address);

            //TODO Calculate the ratio if 1:1, less or more
            // let amount_ratio = token.ratio_mint * amount;

            token_mintable.mint(caller, amount);

            // update user deposit state
            let mut old_deposit_user = self.deposit_by_user.read(caller);

            let mut deposit_user = old_deposit_user.clone();
            if old_deposit_user.token_address.is_zero() {
                deposit_user =
                    DepositUser {
                        token_address: token_address,
                        deposited: amount,
                        minted: amount,
                        withdraw: 0,
                    };
            } else {
                deposit_user.deposited += amount;
                deposit_user.minted += amount;
            }

            self.deposit_by_user.write(caller, deposit_user);
            self.deposit_by_user_by_token.write((caller, token_address), deposit_user);

            // emit event
            self
                .emit(
                    MintDepositEvent {
                        caller: caller,
                        token_deposited: token_address,
                        amount_deposit: amount,
                        mint_receive: amount
                    }
                );
        }

        //  Withdraw a coin
        // Use one token
        // Used the specify ratio. Burn the token. Check the pooling withdraw
        fn withdraw_coin_by_token(
            ref self: ContractState, token_address: ContractAddress, amount: u256
        ) {
            let caller = get_caller_address();
            // Check if token valid
            assert(self.is_token_permitted(token_address), 'Non permited token');

            // Receive/burn token minted
            let token_mintable = IERC20MintableDispatcher {
                contract_address: self.token_address.read()
            };
            token_mintable.burn(caller, amount);

            // Resend amount of coin deposit by user
            let token_deposited = IERC20Dispatcher { contract_address: token_address };
            //TODO calculate ratio
            // let amount_ratio = amount / self.token_permitted.read(token_address).ratio_mint;
            token_deposited.transfer(caller, amount);

            // update user withdraw state
            let mut deposit_user = self.deposit_by_user.read(caller);

            deposit_user.withdraw += amount;

            self.deposit_by_user.write(caller, deposit_user);
            self.deposit_by_user_by_token.write((caller, token_address), deposit_user);

            // emit event
            self
                .emit(
                    WithdrawDepositEvent {
                        caller: caller,
                        token_deposited: self.token_address.read(),
                        amount_deposit: amount,
                        mint_receive: amount,
                        mint_to_get_after_poolin: 0,
                        pooling_interval: self.token_permitted.read(token_address).pooling_timestamp
                    }
                );
        }

        // Set token permitted
        fn set_token_permitted(
            ref self: ContractState,
            token_address: ContractAddress,
            // ratio: u256,
            ratio_mint: u256,
            is_available: bool,
            pooling_timestamp: u64
        ) {
            self.accesscontrol.assert_only_role(ADMIN_ROLE);
            let token_permitted = TokenPermitted {
                token_address, ratio_mint, is_available, pooling_timestamp,
            };
            self.token_permitted.write(token_address, token_permitted);
            self.is_token_permitted.write(token_address, true);
        }

        fn is_token_permitted(ref self: ContractState, token_address: ContractAddress,) -> bool {
            self.is_token_permitted.read(token_address)
        }

        fn get_token_ratio(ref self: ContractState, token_address: ContractAddress) -> u256 {
            assert(self.is_token_permitted(token_address), 'Non permited token');
            self.token_permitted.read(token_address).ratio_mint
        }
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
