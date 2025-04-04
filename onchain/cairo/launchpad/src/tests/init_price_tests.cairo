#[cfg(test)]
mod init_price_tests {
    use afk_launchpad::launchpad::utils::{
        DECIMAL_FACTOR, calculate_price_ratio, calculate_sqrt_ratio,
    };
    use ekubo::types::i129::i129;
    use starknet::syscalls::library_call_syscall;
    use starknet::{ClassHash, SyscallResultTrait};

    const THRESHOLD: u256 = 10000 * DECIMAL_FACTOR;

    // Note: All the values for ticks were calculated via python script
    // def price_to_tick(price: float) -> int:
    //     return math.floor(math.log(price) / math.log(1.000001))

    fn obtain_tick(sqrt_ratio: u256) -> i129 {
        let mut call_data: Array<felt252> = array![];
        Serde::serialize(@sqrt_ratio, ref call_data);

        // let class_hash:ClassHash =
        // 0x37d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3.try_into().unwrap();
        let class_hash: ClassHash =
            0x037d63129281c4c42cba74218c809ffc9e6f87ca74e0bdabb757a7f236ca59c3
            .try_into()
            .unwrap();

        let mut res = library_call_syscall(
            class_hash, selector!("sqrt_ratio_to_tick"), call_data.span(),
        )
            .unwrap_syscall();

        let initial_tick: i129 = Serde::<i129>::deserialize(ref res).unwrap();
        return initial_tick;
    }


    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_1_and_obtain_right_tick() {
        let init_pool_supply = 20000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 693147, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_3_and_obtain_right_tick() {
        let init_pool_supply = 30000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 1098612, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_4_and_obtain_right_tick() {
        let init_pool_supply = 40000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 1386295, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_5_and_obtain_right_tick() {
        let init_pool_supply = 50000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 1609438, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_6_and_obtain_right_tick() {
        let init_pool_supply = 60000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 1791760, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_7_and_obtain_right_tick() {
        let init_pool_supply = 70000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 1945911, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_8_and_obtain_right_tick() {
        let init_pool_supply = 800000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 4382028, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_9_and_obtain_right_tick() {
        let init_pool_supply = 6570000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 6487687, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_10_and_obtain_right_tick() {
        let init_pool_supply = 10000000 * DECIMAL_FACTOR;
        let threshold_liquidity = THRESHOLD;
        let target_tick = i129 { mag: 6907758, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        println!("{}", tick.mag);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_and_obtain_right_tick_for_floating_price() {
        let init_pool_supply = 250 * DECIMAL_FACTOR;
        let threshold_liquidity = 100 * DECIMAL_FACTOR; // price would be like 2.5
        let target_tick = i129 { mag: 916291, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        println!("{}", tick.mag);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_ratio_close_to_end_of_curve() {
        let init_pool_supply = 340282366920938463463374607431768211455;
        let threshold_liquidity = 100; // price would be like 2.5
        let target_tick = i129 { mag: 84117710, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        println!("{}", tick.mag);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }

    #[test]
    #[fork("Mainnet")]
    fn test_calculate_sqrt_ratio_edge_case() {
        let init_pool_supply = 1010000000000000000000;
        let threshold_liquidity = 100; // price would be like 2.5
        let target_tick = i129 { mag: 43759088, sign: false };

        let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
        println!("{}", sqrt_ratio);
        let tick = obtain_tick(sqrt_ratio);
        println!("{}", tick.mag);
        assert(tick.mag == target_tick.mag, 'Wrong mag');
        assert(tick.sign == target_tick.sign, 'Wrong sign');
    }
    // #[test]
// #[fork("Mainnet")]
// fn test_calculate_sqrt_ratio_and_obtain_tick_max(){
//     let init_pool_supply = 340282366920938463463374607431768211455;
//     let threshold_liquidity = 1;
//     let target_tick = i129{mag: 88722883, sign: false};

    //     let sqrt_ratio = calculate_sqrt_ratio(threshold_liquidity, init_pool_supply);
//     println!("{}", sqrt_ratio);
//     let tick = obtain_tick(sqrt_ratio);
//     println!("{}", tick.mag);
//     assert(tick.mag == target_tick.mag, 'Wrong mag');
//     assert(tick.sign == target_tick.sign, 'Wrong sign');
// }
}
