#[starknet::contract]
pub mod LockPosition {
    use afk_launchpad::launchpad::locker::interface::{
        ILockManagerDispatcher, ILockManagerDispatcherTrait
    };    
    use core::num::traits::Zero;

    // use core::num::{BoundedU256};
    // use core::num::{BoundedInt};
    use core::num::traits::{Bounded};
    // use core::num::bounded::{Bounded};
    // use num::bounded::{Bounded};
    // use core_lib::integer::BoundedInt;
    use openzeppelin::token::erc20::interface::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
    use starknet::ContractAddress;
    #[storage]
    struct Storage {
        lock_manager: ContractAddress,
        locked_token: ContractAddress
    }

    #[constructor]
    fn constructor(ref self: ContractState, locked_token: ContractAddress) {
        let lock_manager = starknet::get_caller_address();
        self.lock_manager.write(lock_manager);
        self.locked_token.write(locked_token);


        // TODO fixed Approve max
            // Give infinite allowance to the lock manager to retrieve the locked balance.

           let max_uint= Bounded::<u256>::MAX;
        ERC20ABIDispatcher { contract_address: locked_token }
            // .approve(lock_manager, BoundedInt::<u256>::max());
        .approve(lock_manager, max_uint);
        // // Give infinite allowance to the lock manager to retrieve the locked balance.
        // ERC20ABIDispatcher { contract_address: locked_token }
        //     .approve(lock_manager, BoundedInt::<u256>::max());
    }
}
