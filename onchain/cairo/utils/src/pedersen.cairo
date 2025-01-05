use core::ec::stark_curve::GEN_X;
use core::ec::stark_curve::GEN_Y;
use core::fmt::{Display, Formatter, Error};
use core::ec::{EcPoint, EcPointTrait, ec_point_unwrap, NonZeroEcPoint};
use core::poseidon::PoseidonTrait;
use core::hash::{HashStateTrait, HashStateExTrait,};

pub impl EcPointDisplay of Display<EcPoint> {
    fn fmt(self: @EcPoint, ref f: Formatter) -> Result<(), Error> {
        let non_zero: NonZeroEcPoint = (*self).try_into().unwrap();
        let (x, y): (felt252, felt252) = ec_point_unwrap(non_zero);
        writeln!(f, "Point ({x}, {y})")
    }
}

fn pedersen_commit(value: felt252, salt: felt252, H: EcPoint) -> EcPoint {
    let generator: EcPoint = EcPointTrait::new(GEN_X, GEN_Y).unwrap();
    let c_1 = generator.mul(value);
    let c_2 = H.mul(salt);

    c_1 + c_2 //Elliptic curve point addition
}

fn verify_commitment(commitment: EcPoint, value: felt252, salt: felt252, H: EcPoint) -> bool {
    // Recompute commitment using revealed value and salt
    let computed_commitment = pedersen_commit(value, salt, H);

    // Compare the original commitment with the recomputed one
    let non_zero1: NonZeroEcPoint = commitment.try_into().unwrap();
    let non_zero2: NonZeroEcPoint = computed_commitment.try_into().unwrap();
    let (x1, y1) = ec_point_unwrap(non_zero1);
    let (x2, y2) = ec_point_unwrap(non_zero2);
    x1 == x2 && y1 == y2
}

fn hash_to_curve() -> Option<EcPoint> {
    let g_hash = PoseidonTrait::new().update(GEN_X);
    let mut counter = 0;
    loop {
        // 2^16 is the maximum number of attempts we allow to find a valid point
        if counter == 65536_u32 {
            break Option::None;
        }
        let hash: felt252 = g_hash.update_with(counter).finalize();
        println!("Hash_to_curve counter: {}", counter);
        // Check if the point is on the curve
        match EcPointTrait::new_from_x(hash) {
            // If the point is on the curve, return it
            Option::Some(point) => { break Option::Some(point); },
            // If the point is not on the curve, try again
            Option::None(_) => { counter += 1; }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pedersen_commit() {
        let H: EcPoint = hash_to_curve().unwrap();
        let value: felt252 = 77777;
        let salt: felt252 = 228282189421094;
        let commitment = pedersen_commit(value, salt, H);
        
        let is_valid = verify_commitment(commitment, value, salt, H);
        assert(is_valid, 'The commitment is not valid');
    }

}