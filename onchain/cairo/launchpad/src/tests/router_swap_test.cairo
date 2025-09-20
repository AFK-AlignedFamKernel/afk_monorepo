// https://github.com/henryf10h/dynamic-fees-extension/blob/main/src/tests/router_swap_test.cairo

use ekubo::interfaces::core::{ICoreDispatcherTrait, ICoreDispatcher, IExtensionDispatcher};
use ekubo::interfaces::positions::{IPositionsDispatcher, IPositionsDispatcherTrait};
use ekubo::types::keys::{PoolKey};
use ekubo::types::bounds::{Bounds};
use ekubo::types::i129::{i129};
use core::num::traits::{Zero};
use afk_launchpad::tokens::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std::{
    declare, DeclareResultTrait, ContractClassTrait, ContractClass};
use starknet::{ContractAddress, get_contract_address, contract_address_const, get_caller_address};
use afk_launchpad::mocks::router_lite::{
    IRouterLiteDispatcher, IRouterLiteDispatcherTrait,IRouterLite
};
use afk_launchpad::launchpad::extensions::internal_swap_pool::{InternalSwapPool, Swap, IISPDispatcher, IISPDispatcherTrait,
// InternalSwapPoolDispatcher, InternalSwapPoolDispatcherTrait,
};
use ekubo::interfaces::router::{
    Delta, Depth, IRouterDispatcher, IRouterDispatcherTrait, RouteNode, TokenAmount,
};
use starknet::syscalls::deploy_syscall;

  // Math
  fn pow_256(self: u256, mut exponent: u8) -> u256 {
    if self.is_zero() {
        return 0;
    }
    let mut result = 1;
    let mut base = self;

    loop {
        if exponent & 1 == 1 {
            result = result * base;
        }

        exponent = exponent / 2;
        if exponent == 0 {
            break result;
        }

        base = base * base;
    }
}


fn DEFAULT_10K_SUPPLY() -> u256 {
    10_000_u256 * pow_256(10, 18)
}
fn deploy_token(
    class: ContractClass,
    name: ByteArray,
    symbol: ByteArray,
    initial_supply: u256,
    decimals: u8,
    recipient: ContractAddress,
    owner: ContractAddress,
    factory: ContractAddress,
) -> IERC20Dispatcher {
    let mut calldata = array![];

    name.serialize(ref calldata);
    symbol.serialize(ref calldata);
    initial_supply.serialize(ref calldata);
    decimals.serialize(ref calldata);
    recipient.serialize(ref calldata);
    owner.serialize(ref calldata);
    factory.serialize(ref calldata);
    let (contract_address, _) = class.deploy(@calldata).unwrap();

    IERC20Dispatcher { contract_address }
}

// fn deploy_token(
//     class: @ContractClass, recipient: ContractAddress, amount: u256
// ) -> IERC20Dispatcher {
//     let (contract_address, _) = class
//         .deploy(@array![recipient.into(), amount.low.into(), amount.high.into()])
//         .expect('Deploy token failed');

//     IERC20Dispatcher { contract_address }
// }

fn deploy_extension(
    class: @ContractClass,
    owner: ContractAddress,
    creator: ContractAddress,
    core_dispatcher: ICoreDispatcher,
    native_token: ContractAddress,
    protocol_address: ContractAddress,
    fee_percentage_creator: u256,
    fee_percentage_protocol: u256,
    factory_address: ContractAddress,
    is_auto_buyback_enabled: bool,
    router_address: ContractAddress,
    contract_address_salt: felt252,
) -> ContractAddress {
    let caller = get_caller_address();
    let mut calldata = array![];

    Serde::serialize(@owner.clone(), ref calldata);
    Serde::serialize(@creator.clone(), ref calldata);
    Serde::serialize(@core_dispatcher, ref calldata);
    Serde::serialize(@native_token, ref calldata);
    Serde::serialize(@protocol_address, ref calldata);
    Serde::serialize(@fee_percentage_creator, ref calldata);
    Serde::serialize(@fee_percentage_protocol, ref calldata);
    Serde::serialize(@factory_address, ref calldata);
    Serde::serialize(@is_auto_buyback_enabled, ref calldata);
    Serde::serialize(@router_address, ref calldata);

    let (extension_address, _) = deploy_syscall(
       *class.class_hash, contract_address_salt.clone(), calldata.span(), false,
    )
        .unwrap();

    extension_address
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
    (2 * initial_supply).serialize(ref calldata);
    recipient.serialize(ref calldata);
    18_u8.serialize(ref calldata);

    let (contract_address, _) = class.deploy(@calldata).unwrap();

    IERC20Dispatcher { contract_address }
}


fn deploy_router(class: ContractClass, ekubo_core: ICoreDispatcher) -> IRouterLiteDispatcher {
    let mut calldata = array![];
    Serde::serialize(@ekubo_core, ref calldata);
    let (contract_address, _) = class.deploy(@calldata).unwrap();
    IRouterLiteDispatcher { contract_address }
}

fn deploy_internal_swap_pool(
    class: @ContractClass, 
    owner: ContractAddress, 
    core: ICoreDispatcher,
    native_token: ContractAddress,
    protocol_address: ContractAddress,
    fee_percentage_creator: u256,
    fee_percentage_protocol: u256,
    factory_address: ContractAddress,
    is_auto_buyback_enabled: bool,
    router_address: ContractAddress,
    contract_address_salt: felt252
) -> IExtensionDispatcher {
    // let (contract_address, _) = class
    //     .deploy(@array![owner.into(), core.contract_address.into(), native_token.into()])
    //     .expect('Deploy InternalSwapPool failed');

    let core_dispatcher = ICoreDispatcher {
        contract_address: core.contract_address
    };
    let contract_address = deploy_extension(
        class, 
        owner, 
        owner, 
        core_dispatcher, 
        native_token,
        protocol_address,
        fee_percentage_creator,
        fee_percentage_protocol,
        factory_address,
        is_auto_buyback_enabled,
        router_address,
        contract_address_salt
    );
    println!("extension contract_address: {:?}", contract_address);
    IExtensionDispatcher { contract_address }
}

fn ekubo_core_contract_address() -> ContractAddress {
    contract_address_const::<
        0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b
    >()
}

fn ekubo_core() -> ICoreDispatcher {
    ICoreDispatcher {
        contract_address: contract_address_const::<
            0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b
        >()
    }
}

fn positions() -> IPositionsDispatcher {
    IPositionsDispatcher {
        contract_address: contract_address_const::<
            0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067
        >()
    }
}

fn setup() -> (PoolKey, IExtensionDispatcher) {
    // Declare contract classes
    let test_token_class = declare("Memecoin").unwrap().contract_class();
    let internal_swap_pool_class = declare("InternalSwapPool").unwrap().contract_class();

    // Get core contract
    let core = ekubo_core();
    
    // Use current contract as owner
    let owner = get_contract_address();

    let name = "Test Token";
    let symbol = "TTT";
    let initial_supply = DEFAULT_10K_SUPPLY();
    let recipient = owner;
    let factory = get_contract_address();
    let decimals = 18;
    let contract_address_salt = 0.try_into().unwrap();

    let name_2 = "Test Token 2";
    let symbol_2 = "TTT2";
    println!("deploy token 0");
    // Deploy tokens to owner (the test contract itself)
    let token0 = deploy_token(*test_token_class, name, symbol, initial_supply, decimals, recipient, owner, factory);
    println!("deploy token 1");
  
    let token1 = deploy_token(*test_token_class, name_2, symbol_2, initial_supply, decimals, recipient, owner, factory);
    // Sort tokens by address (inline implementation)
    let (tokenA, tokenB) = {
        let addr0 = token0.contract_address;
        let addr1 = token1.contract_address;
        if addr0 < addr1 {
            (addr0, addr1)
        } else {
            (addr1, addr0)
        }
    };


    let protocol_address = get_contract_address();
    let fee_percentage_creator = 100_u256;
    let fee_percentage_protocol = 100_u256;
    let factory_address = get_contract_address();
    let is_auto_buyback_enabled = false;
    let router_address = get_contract_address();
    println!("deploy internal swap pool");
    // Deploy InternalSwapPool once and get both interfaces
    let internal_swap_pool_extension = deploy_internal_swap_pool(
        internal_swap_pool_class,
        owner,  // owner
        core, 
        tokenA,   // native_token
        protocol_address,
        fee_percentage_creator,
        fee_percentage_protocol,
        factory_address,
        is_auto_buyback_enabled,
        router_address,
        contract_address_salt
    );

    // Create PoolKey
    let pool_key = PoolKey {
        token0: tokenA,
        token1: tokenB,
        fee: 0, // 0% fee
        tick_spacing: 999, // Tick spacing, tick spacing percentage 0.1%
        extension: internal_swap_pool_extension.contract_address
    };

    (pool_key, internal_swap_pool_extension)
}

#[test]
#[fork("Mainnet")]
fn test_isp_swap_token0_for_token1() {
    let (pool_key, _) = setup();

    println!("initialize pool");
    ekubo_core().initialize_pool(pool_key, Zero::zero());
    
    // Transfer tokens and mint position (your existing code)
    IERC20Dispatcher{ contract_address: pool_key.token0 }
        .transfer(positions().contract_address, 1_000_000);
    IERC20Dispatcher{ contract_address: pool_key.token1 }
        .transfer(positions().contract_address, 1_000_000);
    positions().mint_and_deposit_and_clear_both(
        pool_key,
        Bounds {
            lower: i129 { mag: 2302695, sign: true },
            upper: i129 { mag: 2302695, sign: false }
        },
        0
    );

    
    // // Deploy the router
    let router_class = declare("RouterLite").unwrap().contract_class();
    println!("deploy router");
    let router = deploy_router(
        *router_class, 
        // get_contract_address(), 
        ekubo_core(),
        // pool_key.token0
    );
    
    // Prepare swap parameters
    let amount_in: u128 = 100_00;
    let token_amount = TokenAmount {
        token: pool_key.token0,
        amount: i129 { mag: amount_in, sign: false }, // Exact input (positive)
    };

    println!("get pool price");
    // // Get current pool price
    let pool_price = ekubo_core().get_pool_price(pool_key);
    // let current_sqrt_price = pool_price.sqrt_ratio;
    println!("Current sqrt price: {}", pool_price.sqrt_ratio);
    // println!("Current sqrt price: {}", current_sqrt_price);

    // // // Determine trade direction
    let _is_token1 = pool_key.token1 == token_amount.token;
    // -5% 323268248574891540290205877060179800883 'INSUFFICIENT_TF_BALANCE'
    // 0% 340282366920938463463374607431768211456 Success
    // 5% 357296485266985386636543337803356622028 'LIMIT_DIRECTION'
    // 20% 408338840305126156156049528918121853747 'LIMIT_DIRECTION' 
    let sqrt_ratio_limit : u256 = 323268248574891540290205877060179800883;
    println!("Sqrt price limit: {}", sqrt_ratio_limit);

    let route = RouteNode {
        pool_key,
        sqrt_ratio_limit,
        skip_ahead: 0,
    };
    let swap_data = Swap {
        route,
        token_amount,
    };

    // println!("get balance before");

    // let balance_before = IERC20Dispatcher{ contract_address: pool_key.token0 }
    //     .balanceOf(get_contract_address());

    // println!("balance before: {:?}", balance_before);
    // println!("transfer tokens to router");
    // // Transfer tokens to router to spend
    // IERC20Dispatcher{ contract_address: pool_key.token0 }
    //     .transfer(router.contract_address, amount_in.into());

    // println!("execute swap");
    // // Execute the swap
    // router.swap(route, token_amount);

    // let balance_after = IERC20Dispatcher{ contract_address: pool_key.token0 }
    //     .balanceOf(get_contract_address());

    // assert(
    //     balance_after == balance_before - amount_in.into(), 'not correct token balance'
    // );

}

// #[test]
// #[fork("mainnet")]
// fn test_isp_swap_token1_for_token0_odd_fee() {
//     let (pool_key, _) = setup();
//     ekubo_core().initialize_pool(pool_key, Zero::zero());
    
//     // Transfer tokens and mint position (your existing code)
//     IERC20Dispatcher{ contract_address: pool_key.token0 }
//         .transfer(positions().contract_address, 1_000_000);
//     IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .transfer(positions().contract_address, 1_000_000);
//     positions().mint_and_deposit_and_clear_both(
//         pool_key,
//         Bounds {
//             lower: i129 { mag: 2302695, sign: true },
//             upper: i129 { mag: 2302695, sign: false }
//         },
//         0
//     );
    
//     // Deploy the router
//     let router_class = declare("IRouterLite").unwrap().contract_class();
//     let router = deploy_router(
//         router_class, 
//         // get_contract_address(), 
//         ekubo_core(),
//         // pool_key.token0
//     );
    
//     // Prepare swap parameters
//     let amount_in: u128 = 100_01; //ODD
//     let token_amount = TokenAmount {
//         token: pool_key.token1,
//         amount: i129 { mag: amount_in, sign: false }, // Exact input (positive)
//     };

//     // Get current pool price
//     let pool_price = ekubo_core().get_pool_price(pool_key);
//     let current_sqrt_price = pool_price.sqrt_ratio;
//     println!("Current sqrt price: {}", current_sqrt_price);

//     // Determine trade direction
//     let _is_token1 = pool_key.token1 == token_amount.token;
//     // -5% 323268248574891540290205877060179800883 'INSUFFICIENT_TF_BALANCE'
//     // 0% 340282366920938463463374607431768211456 Success
//     // 5% 357296485266985386636543337803356622028 'LIMIT_DIRECTION'
//     // 20% 408338840305126156156049528918121853747 'LIMIT_DIRECTION' 
//     let sqrt_ratio_limit : u256 = 357296485266985386636543337803356622028;
//     println!("Sqrt price limit: {}", sqrt_ratio_limit);

//     let route = RouteNode {
//         pool_key,
//         sqrt_ratio_limit,
//         skip_ahead: 0,
//     };
//     let swap_data = Swap {
//         route,
//         token_amount,
//     };

//     let balance_before = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(get_contract_address());

//     // Transfer tokens to router to spend
//     IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .transfer(router.contract_address, amount_in.into());

//     // Print balances before swap
//     let balance_core1 = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token1 before swap: {}", balance_core1);

//     let balance_core0 = IERC20Dispatcher{ contract_address: pool_key.token0 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token0 before swap: {}", balance_core0);

//     // Execute the swap
//     router.swap(swap_data);

//     let balance_after = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(get_contract_address());

//     assert(
//         balance_after == balance_before - amount_in.into(), 'not correct token balance'
//     );
    
//     let balance_core1 = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token1 after swap: {}", balance_core1);

//     let balance_core0 = IERC20Dispatcher{ contract_address: pool_key.token0 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token0 after swap: {}", balance_core0);

// }

// #[test]
// #[fork("mainnet")]
// fn test_isp_swap_token1_for_token0_even_fee() {
//     let (pool_key, _) = setup();
//     ekubo_core().initialize_pool(pool_key, Zero::zero());
    
//     // Transfer tokens and mint position (your existing code)
//     IERC20Dispatcher{ contract_address: pool_key.token0 }
//         .transfer(positions().contract_address, 1_000_000);
//     IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .transfer(positions().contract_address, 1_000_000);
//     positions().mint_and_deposit_and_clear_both(
//         pool_key,
//         Bounds {
//             lower: i129 { mag: 2302695, sign: true },
//             upper: i129 { mag: 2302695, sign: false }
//         },
//         0
//     );
    
//     // Deploy the router
//     let router_class = declare("IRouterLite").unwrap().contract_class();
//     let router = deploy_router(
//         router_class, 
//         // get_contract_address(), 
//         ekubo_core(),
//         // pool_key.token0
//     );
    
//     // Prepare swap parameters
//     let amount_in: u128 = 100_00; //EVEN
//     let token_amount = TokenAmount {
//         token: pool_key.token1,
//         amount: i129 { mag: amount_in, sign: false }, // Exact input (positive)
//     };

//     // Get current pool price
//     let pool_price = ekubo_core().get_pool_price(pool_key);
//     let current_sqrt_price = pool_price.sqrt_ratio;
//     println!("Current sqrt price: {}", current_sqrt_price);

//     // Determine trade direction
//     let _is_token1 = pool_key.token1 == token_amount.token;
//     // -5% 323268248574891540290205877060179800883 'INSUFFICIENT_TF_BALANCE'
//     // 0% 340282366920938463463374607431768211456 Success
//     // 5% 357296485266985386636543337803356622028 'LIMIT_DIRECTION'
//     // 20% 408338840305126156156049528918121853747 'LIMIT_DIRECTION' 
//     let sqrt_ratio_limit : u256 = 357296485266985386636543337803356622028;
//     println!("Sqrt price limit: {}", sqrt_ratio_limit);

//     let route = RouteNode {
//         pool_key,
//         sqrt_ratio_limit,
//         skip_ahead: 0,
//     };
//     let swap_data = Swap {
//         route,
//         token_amount,
//     };

//     let balance_before = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(get_contract_address());

//     // Transfer tokens to router to spend
//     IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .transfer(router.contract_address, amount_in.into());

//     // Print balances before swap
//         let balance_core1 = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token1 before swap: {}", balance_core1);

//     let balance_core0 = IERC20Dispatcher{ contract_address: pool_key.token0 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token0 before swap: {}", balance_core0);

//     // Execute the swap
//     router.swap(swap_data);

//     let balance_after = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(get_contract_address());

//     assert(
//         balance_after == balance_before - amount_in.into(), 'not correct token balance'
//     );
    
//     let balance_core1 = IERC20Dispatcher{ contract_address: pool_key.token1 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token1 after swap: {}", balance_core1);

//     let balance_core0 = IERC20Dispatcher{ contract_address: pool_key.token0 }
//         .balanceOf(ekubo_core().contract_address);

//     println!("Core balance token0 after swap: {}", balance_core0);

// }