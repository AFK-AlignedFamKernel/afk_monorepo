use stark_vrf::{Error, generate_public_key, Proof, ScalarValue, StarkVRF};
use core::ec::stark_curve::GEN_X;
use core::ec::stark_curve::GEN_Y;
use core::ec::stark_curve::ORDER;
use core::fmt::{Display, Formatter, Error};
use core::ec::{EcPoint, EcPointTrait, ec_point_unwrap, NonZeroEcPoint, EcState, EcStateTrait};
use core::poseidon::PoseidonTrait;
use core::hash::{HashStateTrait, HashStateExTrait};
use core::math::u256_mul_mod_n;
use super::request::SocialRequest;
use afk::utils::{shl, shr, compute_sha256_byte_array};
//! bip340 implementation

use core::byte_array::ByteArrayTrait;
use core::option::OptionTrait;
use core::result::ResultTrait;
// TODO: uncomment once Cairo 2.7 is available
// use core::sha256::compute_sha256_byte_array;
use core::starknet::SyscallResultTrait;
use core::to_byte_array::{AppendFormattedToByteArray, FormatAsByteArray};
use core::traits::Into;
use starknet::{secp256k1::{Secp256k1Point}, secp256_trait::{Secp256Trait, Secp256PointTrait}};

const TWO_POW_32: u128 = 0x100000000;
const TWO_POW_64: u128 = 0x10000000000000000;
const TWO_POW_96: u128 = 0x1000000000000000000000000;

const p: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
pub impl EcPointDisplay of Display<EcPoint> {
    fn fmt(self: @EcPoint, ref f: Formatter) -> Result<(), Error> {
        let non_zero: NonZeroEcPoint = (*self).try_into().unwrap();
        let (x, y): (felt252, felt252) = ec_point_unwrap(non_zero);
        writeln!(f, "Point ({x}, {y})")
    }
}

impl PartialEqImpl of PartialEq<EcPoint> {
    fn eq(lhs: @EcPoint, rhs: @EcPoint) -> bool {
        let (lhs_x, lhs_y): (felt252, felt252) = ec_point_unwrap((*lhs).try_into().unwrap());
        let (rhs_x, rhs_y): (felt252, felt252) = ec_point_unwrap((*rhs).try_into().unwrap());

/// Represents a Schnorr signature
struct SchnorrSignature {
    s: u256,
    R: u256,
}
// pub impl EcPointDisplay of Display<Secp256k1Point> {
//     fn fmt(self: @EcPoint, ref f: Formatter) -> Result<(), Error> {
//         let non_zero: NonZeroEcPoint = (*self).try_into().unwrap();
//         let (x, y): (u256, u256) = ec_point_unwrap(non_zero);
//         writeln!(f, "Point ({x}, {y})")
//     }
// }

// impl PartialEqImpl of PartialEq<EcPoint> {
//     fn eq(lhs: @EcPoint, rhs: @EcPoint) -> bool {
//         let (lhs_x, lhs_y): (u256, u256) = ec_point_unwrap((*lhs).try_into().unwrap());
//         let (rhs_x, rhs_y): (felt252, felt252) = ec_point_unwrap((*rhs).try_into().unwrap());

//         if ((rhs_x == lhs_x) && (rhs_y == lhs_y)) {
//             true
//         } else {
//             false
//         }
//     }
// }
        if ((rhs_x == lhs_x) && (rhs_y == lhs_y)) {
            true
        } else {
            false
        }
    }
}

/// Computes BIP0340/challenge tagged hash.
///
/// References:
///   Schnorr signatures explained:
///   https://www.youtube.com/watch?v=wjACBRJDfxc&ab_channel=Bitcoinology
///   NIP-01:
///   https://github.com/nostr-protocol/nips/blob/master/01.md
///   BIP-340:
///   https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
///   reference implementation:
///   https://github.com/bitcoin/bips/blob/master/bip-0340/reference.py
///
///
/// # Parameters:
/// - `rx`: `u256` - The x-coordinate of the R point from the signature.
/// - `px`: `u256` - The x-coordinate of the public key.
/// - `m`: `ByteArray` - The message for which the signature is being verified.
///
/// # Returns:
/// `sha256(tag) || sha256(tag) || bytes(rx) || bytes(px) || m` as u256 where tag =
/// "BIP0340/challenge".
fn hash_challenge(rx: u256, px: u256, m: ByteArray) -> u256 {
    // sha256(tag)
    let [x0, x1, x2, x3, x4, x5, x6, x7] = compute_sha256_byte_array(@"BIP0340/challenge");

    let mut ba = Default::default();
    // sha256(tag)
    ba.append_word(x0.into(), 4);
    ba.append_word(x1.into(), 4);
    ba.append_word(x2.into(), 4);
    ba.append_word(x3.into(), 4);
    ba.append_word(x4.into(), 4);
    ba.append_word(x5.into(), 4);
    ba.append_word(x6.into(), 4);
    ba.append_word(x7.into(), 4);
    // sha256(tag)
    ba.append_word(x0.into(), 4);
    ba.append_word(x1.into(), 4);
    ba.append_word(x2.into(), 4);
    ba.append_word(x3.into(), 4);
    ba.append_word(x4.into(), 4);
    ba.append_word(x5.into(), 4);
    ba.append_word(x6.into(), 4);
    ba.append_word(x7.into(), 4);
    // bytes(rx)
    ba.append_word(rx.high.into(), 16);
    ba.append_word(rx.low.into(), 16);
    // bytes(px)
    ba.append_word(px.high.into(), 16);
    ba.append_word(px.low.into(), 16);
    // m
    ba.append(@m);

    let [x0, x1, x2, x3, x4, x5, x6, x7] = compute_sha256_byte_array(@ba);

    u256 {
        high: x0.into() * TWO_POW_96 + x1.into() * TWO_POW_64 + x2.into() * TWO_POW_32 + x3.into(),
        low: x4.into() * TWO_POW_96 + x5.into() * TWO_POW_64 + x6.into() * TWO_POW_32 + x7.into(),
    }
}

/// Verifies a signature according to the BIP-340.
///
/// This function checks if the signature `(rx, s)` is valid for a message `m` with
/// respect to the public key `px`.
///
/// # Parameters
/// - `px`: `u256` - The x-coordinate of the public key.
/// - `rx`: `u256` - The x-coordinate of the R point from the signature.
/// - `s`: `u256` - The scalar component of the signature.
/// - `m`: `ByteArray` - The message for which the signature is being verified.
///
/// # Returns
/// Returns `true` if the signature is valid for the given message and public key; otherwise,
/// returns `false`.
pub fn verify(px: u256, rx: u256, s: u256, m: ByteArray) -> bool {
    let n = Secp256Trait::<Secp256k1Point>::get_curve_size();

    if px >= p || rx >= p || s >= n {
        return false;
    }

    // p - field size, n - curve order
    // point P for which x(P) = px and has_even_y(P),
    let P =
        match Secp256Trait::<Secp256k1Point>::secp256_ec_get_point_from_x_syscall(px, false)
            .unwrap_syscall() {
        Option::Some(P) => P,
        Option::None => { return false; }
    };

    // e = int(hashBIP0340/challenge(bytes(rx) || bytes(px) || m)) mod n.
    let e = hash_challenge(rx, px, m) % n;

    let G = Secp256Trait::<Secp256k1Point>::get_generator_point();

    // R = s⋅G - e⋅P
    let p1 = G.mul(s).unwrap_syscall();
    let minus_e = Secp256Trait::<Secp256k1Point>::get_curve_size() - e;
    let p2 = P.mul(minus_e).unwrap_syscall();

    let R = p1.add(p2).unwrap_syscall();

    let (Rx, Ry) = R.get_coordinates().unwrap_syscall();

    // fail if is_infinite(R) || not has_even_y(R) || x(R) ≠ rx.
    !(Rx == 0 && Ry == 0) && Ry % 2 == 0 && Rx == rx
}
/// Represents a Schnorr signature
struct SchnorrSignature {
    s: felt252,
    R: EcPoint,
}

/// Generates a key pair (private key, public key) for Schnorr signatures
fn generate_keypair() -> (felt252, EcPoint) {
    let generator: EcPoint = EcPointTrait::new(GEN_X, GEN_Y).unwrap();
    let private_key: felt252 = 859825214214312162317391210310; // VRF needed
    let public_key: EcPoint = generator.mul(private_key);
    
    (private_key, public_key)
}

/// Generates a nonce and corresponding R point for signature
fn generate_nonce_point() -> (felt252, EcPoint) {
    let generator: EcPoint = EcPointTrait::new(GEN_X, GEN_Y).unwrap();
    let nonce: felt252 = 46952909012476409278523962123414653; // VRF needed
    let R: EcPoint = generator.mul(nonce);
    
    (nonce, R)
}

/// Computes the challenge hash e using Poseidon
fn compute_challenge(R: EcPoint, public_key: EcPoint, message: felt252) -> felt252 {
    let (R_x, R_y): (felt252, felt252) = ec_point_unwrap(R.try_into().unwrap());
    let (P_x, P_y): (felt252, felt252) = ec_point_unwrap(public_key.try_into().unwrap());
    
    PoseidonTrait::new()
        .update(R_x)
        .update(R_y)
        .update(P_x)
        .update(P_y)
        .update(message)
        .finalize()
}

/// Signs a message using Schnorr signature scheme
fn sign(private_key: felt252, message: felt252) -> SchnorrSignature {
    let (nonce, R) = generate_nonce_point();
    let generator: EcPoint = EcPointTrait::new(GEN_X, GEN_Y).unwrap();
    let public_key = generator.mul(private_key);
    
    let e = compute_challenge(R, public_key, message);
    let s = nonce + mul_mod_p(private_key, e, ORDER);
    
    SchnorrSignature { s, R }
}

/// Verifies a Schnorr signature
fn verify_sig(public_key: EcPoint, message: felt252, signature: SchnorrSignature) -> bool {
    let generator: EcPoint = EcPointTrait::new(GEN_X, GEN_Y).unwrap();
    let e = compute_challenge(signature.R, public_key, message);
    
    let s_G: EcPoint = generator.mul(signature.s);
    let P_e: EcPoint = public_key.mul(e);
    let rhs: EcPoint = P_e + signature.R;
    
    let (s_Gx, s_Gy): (felt252, felt252) = ec_point_unwrap(s_G.try_into().unwrap());
    let (rhs_x, rhs_y): (felt252, felt252) = ec_point_unwrap(rhs.try_into().unwrap());
    
    (rhs_x == s_Gx) && (s_Gy == rhs_y)
}

fn count_digits(mut num: u256) -> (u32, felt252) {
    let mut count: u32 = 0;
    while num > 0 {
        num = num / BASE;
        count = count + 1;
    };
    let res: felt252 = count.try_into().unwrap();
    (count, res)
}

fn encodeSocialRequest<C>(request: SocialRequest<C>) -> ByteArray {
    let mut ba: ByteArray = "";
    
    // Encode public_key
    let (pk_count, pk_count_felt252) = count_digits(request.public_key);
    let pk_felt252: felt252 = request.public_key.try_into().unwrap();
    ba.append_word(pk_count_felt252, 1_u32);
    ba.append_word(pk_felt252, pk_count);
    
    // Encode created_at
    let created_at_u256: u256 = request.created_at.into();
    let (created_count, created_count_felt252) = count_digits(created_at_u256);
    let created_felt252: felt252 = created_at_u256.try_into().unwrap();
    ba.append_word(created_count_felt252, 1_u32);
    ba.append_word(created_felt252, created_count);
    
    // Encode kind
    let kind_u256: u256 = request.kind.into();
    let (kind_count, kind_count_felt252) = count_digits(kind_u256);
    let kind_felt252: felt252 = kind_u256.try_into().unwrap();
    ba.append_word(kind_count_felt252, 1_u32);
    ba.append_word(kind_felt252, kind_count);
    
    // Encode tags directly
    ba.append(request.tags);
    
    // Encode content (assuming it can be converted to ByteArray) check needed
    let content_bytes = ByteArray::from(request.content);
    ba.append(content_bytes);
    
    let (rx, _) = request.sig.R.get_coordinates().unwrap_syscall();
    ba.append_word(rx.high.into(), 16);
    ba.append_word(rx.low.into(), 16);
    ba.append_word(request.sig.s.high.into(), 16);
    ba.append_word(request.sig.s.low.into(), 16);
    
    ba
}   

/// Generates a key pair (private key, public key) for Schnorr signatures
fn generate_keypair() -> (u256, Secp256k1Point) {
    let G = Secp256Trait::<Secp256k1Point>::get_generator_point();
    let private_key: u256 = 0x859825214214312162317391210310_u256; // VRF needed
    let public_key = G.mul(private_key).unwrap_syscall();
    
    (private_key, public_key)
}

/// Generates a nonce and corresponding R point for signature
fn generate_nonce_point() -> (u256, Secp256k1Point) {
    let G = Secp256Trait::<Secp256k1Point>::get_generator_point();
    let nonce: u256 = 0x46952909012476409278523962123414653_u256; // VRF needed
    let R = G.mul(nonce).unwrap_syscall();
    
    (nonce, R)
}

/// Computes the challenge hash e using Poseidon
fn compute_challenge(R: EcPoint, public_key: EcPoint, message: ByteArray) -> felt252 {
    let (rx, _) = R.get_coordinates().unwrap_syscall();
    let (px, _) = public_key.get_coordinates().unwrap_syscall();
    
    hash_challenge(rx, px, message)

}

/fn sign(private_key: u256, message: ByteArray) -> SchnorrSignature {
    let (nonce, R) = generate_nonce_point();
    let G = Secp256Trait::<Secp256k1Point>::get_generator_point();
    let public_key = G.mul(private_key).unwrap_syscall();
    let (s_G_x, s_G_y) = public_key.get_coordinates().unwrap_syscall();
    let s_G_x = r;
    let e = compute_challenge(R, public_key, message);
    let n = Secp256Trait::<Secp256k1Point>::get_curve_size();
 
    // s = nonce + private_key * e mod n
    let s = (nonce + (private_key * e)) % n;
    
    SchnorrSignature { s, r }
}

/// Verifies a Schnorr signature
fn verify_sig(public_key: Secp256k1Point, message: u256, signature: SchnorrSignature) -> bool {
    let G = Secp256Trait::<Secp256k1Point>::get_generator_point();
    let e = compute_challenge(signature.R, public_key, message);
    let n = Secp256Trait::<Secp256k1Point>::get_curve_size();
    
    // Check that s is within valid range
    if signature.s >= n {
        return false;
    }
    // Verify s⋅G = R + e⋅P
    let s_G = G.mul(signature.s).unwrap_syscall();
    let e_P = public_key.mul(e).unwrap_syscall();
    let R_plus_eP = signature.R.add(e_P).unwrap_syscall();
    
    // Compare the points
    let (s_G_x, s_G_y) = s_G.get_coordinates().unwrap_syscall();
    let (rhs_x, rhs_y) = R_plus_eP.get_coordinates().unwrap_syscall();
    
    s_G_x == rhs_x && s_G_y == rhs_y
}


#[cfg(test)]
mod tests {
    use core::byte_array::ByteArrayTrait;
    use core::clone::Clone;
    use core::option::OptionTrait;
    use core::traits::Into;
    use super::*;

    impl U256IntoByteArray of Into<u256, ByteArray> {
        fn into(self: u256) -> ByteArray {
            let mut ba = Default::default();
            ba.append_word(self.high.into(), 16);
            ba.append_word(self.low.into(), 16);
            ba
        }
    }

    // test data adapted from: https://github.com/bitcoin/bips/blob/master/bip-0340/test-vectors.csv

    #[test]
    fn test_0() {
        let px: u256 = 0xf9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9;
        let rx: u256 = 0xe907831f80848d1069a5371b402410364bdf1c5f8307b0084c55f1ce2dca8215;
        let s: u256 = 0x25f66a4a85ea8b71e482a74f382d2ce5ebeee8fdb2172f477df4900d310536c0;
        let m: u256 = 0x0;
        assert!(verify(px, rx, s, m.into()));
    }

    #[test]
    fn test_1() {
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0x6896bd60eeae296db48a229ff71dfe071bde413e6d43f917dc8dcf8c78de3341;
        let s: u256 = 0x8906d11ac976abccb20b091292bff4ea897efcb639ea871cfa95f6de339e4b0a;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;
        assert!(verify(px, rx, s, m.into()));
    }

    #[test]
    fn test_2() {
        let px: u256 = 0xdd308afec5777e13121fa72b9cc1b7cc0139715309b086c960e18fd969774eb8;
        let rx: u256 = 0x5831aaeed7b44bb74e5eab94ba9d4294c49bcf2a60728d8b4c200f50dd313c1b;
        let s: u256 = 0xab745879a5ad954a72c45a91c3a51d3c7adea98d82f8481e0e1e03674a6f3fb7;
        let m: u256 = 0x7e2d58d8b3bcdf1abadec7829054f90dda9805aab56c77333024b9d0a508b75c;

        assert!(verify(px, rx, s, m.into()));
    }

    #[test]
    fn test_3() {
        let px: u256 = 0x25d1dff95105f5253c4022f628a996ad3a0d95fbf21d468a1b33f8c160d8f517;
        let rx: u256 = 0x7eb0509757e246f19449885651611cb965ecc1a187dd51b64fda1edc9637d5ec;
        let s: u256 = 0x97582b9cb13db3933705b32ba982af5af25fd78881ebb32771fc5922efc66ea3;
        let m: u256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

        assert!(verify(px, rx, s, m.into()));
    }

    #[test]
    fn test_4() {
        let px: u256 = 0xd69c3509bb99e412e68b0fe8544e72837dfa30746d8be2aa65975f29d22dc7b9;
        let rx: u256 = 0x3b78ce563f89a0ed9414f5aa28ad0d96d6795f9c63;
        let s: u256 = 0x76afb1548af603b3eb45c9f8207dee1060cb71c04e80f593060b07d28308d7f4;
        let m: u256 = 0x4df3c3f68fcc83b27e9d42c90431a72499f17875c81a599b566c9889b9696703;

        assert!(verify(px, rx, s, m.into()));
    }

    #[test]
    fn test_5() {
        // public key not on the curve
        let px: u256 = 0xeefdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34;
        let rx: u256 = 0x6cff5c3ba86c69ea4b7376f31a9bcb4f74c1976089b2d9963da2e5543e177769;
        let s: u256 = 0x69e89b4c5564d00349106b8497785dd7d1d713a8ae82b32fa79d5f7fc407d39b;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;
        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_6() {
        // has_even_y(R) is false
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0xfff97bd5755eeea420453a14355235d382f6472f8568a18b2f057a1460297556;
        let s: u256 = 0x3cc27944640ac607cd107ae10923d9ef7a73c643e166be5ebeafa34b1ac553e2;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_7() {
        // negated message
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0x1fa62e331edbc21c394792d2ab1100a7b432b013df3f6ff4f99fcb33e0e1515f;
        let s: u256 = 0x28890b3edb6e7189b630448b515ce4f8622a954cfe545735aaea5134fccdb2bd;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_8() {
        // negated s value
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0x6cff5c3ba86c69ea4b7376f31a9bcb4f74c1976089b2d9963da2e5543e177769;
        let s: u256 = 0x961764b3aa9b2ffcb6ef947b6887a226e8d7c93e00c5ed0c1834ff0d0c2e6da6;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_9() {
        // sG - eP is infinite. Test fails in single verification if has_even_y(inf) is defined as
        // true and x(inf) as 0
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0x0;
        let s: u256 = 0x123dda8328af9c23a94c1feecfd123ba4fb73476f0d594dcb65c6425bd186051;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_10() {
        // sG - eP is infinite. Test fails in single verification if has_even_y(inf) is defined as
        // true and x(inf) as 1
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0x1;
        let s: u256 = 0x7615fbaf5ae28864013c099742deadb4dba87f11ac6754f93780d5a1837cf197;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;

        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_11() {
        // sig[0:32] is not an X coordinate on the curve
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0x4a298dacae57395a15d0795ddbfd1dcb564da82b0f269bc70a74f8220429ba1d;
        let s: u256 = 0x69e89b4c5564d00349106b8497785dd7d1d713a8ae82b32fa79d5f7fc407d39b;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;
        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_12() {
        // sig[0:32] is equal to field size
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f;
        let s: u256 = 0x69e89b4c5564d00349106b8497785dd7d1d713a8ae82b32fa79d5f7fc407d39b;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;
        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_13() {
        // sig[32:64] is equal to curve order
        let px: u256 = 0xdff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659;
        let rx: u256 = 0x6cff5c3ba86c69ea4b7376f31a9bcb4f74c1976089b2d9963da2e5543e177769;
        let s: u256 = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;
        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_14() {
        // public key is not a valid X coordinate because it exceeds the field size
        let px: u256 = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc30;
        let rx: u256 = 0x6cff5c3ba86c69ea4b7376f31a9bcb4f74c1976089b2d9963da2e5543e177769;
        let s: u256 = 0x69e89b4c5564d00349106b8497785dd7d1d713a8ae82b32fa79d5f7fc407d39b;
        let m: u256 = 0x243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89;
        assert(verify(px, rx, s, m.into()) == false, 'verify valid');
    }

    #[test]
    fn test_15() {
        // message of size 0
        let px: u256 = 0x778caa53b4393ac467774d09497a87224bf9fab6f6e68b23086497324d6fd117;
        let rx: u256 = 0x71535db165ecd9fbbc046e5ffaea61186bb6ad436732fccc25291a55895464cf;
        let s: u256 = 0x6069ce26bf03466228f19a3a62db8a649f2d560fac652827d1af0574e427ab63;
        let m = "";
        assert!(verify(px, rx, s, m));
    }

    #[test]
    fn test_16() {
        // message of size 1
        let px: u256 = 0x778caa53b4393ac467774d09497a87224bf9fab6f6e68b23086497324d6fd117;
        let rx: u256 = 0x8a20a0afef64124649232e0693c583ab1b9934ae63b4c3511f3ae1134c6a303;
        let s: u256 = 0xea3173bfea6683bd101fa5aa5dbc1996fe7cacfc5a577d33ec14564cec2bacbf;
        let m = "\x11";
        assert!(verify(px, rx, s, m));
    }

    #[test]
    fn test_17() {
        // message of size 17
        let px: u256 = 0x778caa53b4393ac467774d09497a87224bf9fab6f6e68b23086497324d6fd117;
        let rx: u256 = 0x5130f39a4059b43bc7cac09a19ece52b5d8699d1a71e3c52da9afdb6b50ac370;
        let s: u256 = 0xc4a482b77bf960f8681540e25b6771ece1e5a37fd80e5a51897c5566a97ea5a5;
        let m = "\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11";

        assert!(verify(px, rx, s, m));
    }

    #[test]
    fn test_18() {
        // message of size 100
        let px: u256 = 0x778caa53b4393ac467774d09497a87224bf9fab6f6e68b23086497324d6fd117;
        let rx: u256 = 0x403b12b0d8555a344175ea7ec746566303321e5dbfa8be6f091635163eca79a8;
        let s: u256 = 0x585ed3e3170807e7c03b720fc54c7b23897fcba0e9d0b4a06894cfd249f22367;

        let mut m: ByteArray = Default::default();
        let mut nines: ByteArray =
            0x9999999999999999999999999999999999999999999999999999999999999999_u256
            .into();
        m.append(@nines);
        m.append(@nines);
        m.append(@nines);
        m.append_byte(0x99);
        m.append_byte(0x99);
        m.append_byte(0x99);
        m.append_byte(0x99);

        assert!(verify(px, rx, s, m));
    }

    #[test]
    fn test_19() {
        // signature of message: afk, generated in browser with nos2x extension
        let px: u256 = 0x98298b0b4a0d586771e7f84c742394b5013d37c16af0924bd7ee62ec6a517a5d;
        let rx: u256 = 0x3b7a0877cefa952d536fc167446a22f017922743db5cddd912b7890b7c5c34fe;
        let s: u256 = 0x2591fff0a4ac15d3ed5d3f767e686e771ec456af2fb53ffba163e509e16b0eba;
        let m: u256 = 0x2e5673c8b39f7a0d41219676661159c59a93644c06b81684718b8a0cd53f7f06;

        assert!(verify(px, rx, s, m.into()));
    }
    #[test]
    fn test_20() {
        let (private_key, public_key) = generate_keypair();
    
        // Message to sign
        let message: felt252 = 'I love Cairo';
        
        // Sign message
        let signature = sign(private_key, message);
        
        // Verify signature
        let is_valid = verify_sig(public_key, message, signature);
        
        assert!(is_valid);
    }
}
