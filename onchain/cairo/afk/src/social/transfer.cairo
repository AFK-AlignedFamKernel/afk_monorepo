use starknet::ContractAddress;
use super::profile::{NostrProfile, NostrProfileTrait};
use super::request::{ConvertToBytes, Encode};
#[derive(Clone, Debug, Drop, Serde)]
pub struct Transfer {
    pub amount: u256,
    // pub token: felt252,
    pub token_address: ContractAddress,
    pub joyboy: NostrProfile,
    pub recipient: NostrProfile,
    pub recipient_address: ContractAddress,
}

fn len(f: felt252) -> usize {
    let mut f: u128 = f.try_into().unwrap();
    let mut l = 0;
    while f != 0 {
        f = f / 256;
        l += 1;
    }
    l
}

impl TransferEncodeImpl of Encode<Transfer> {
    fn encode(self: @Transfer) -> @ByteArray {
        let mut token: ByteArray = Default::default();

        let token_address = *self.token_address;
        let token_address_felt252: felt252 = token_address.try_into().unwrap();
        // assuming token is no longer than 16 bytes
        @format!(
            "{} send {} {} to {}",
            self.joyboy.encode(),
            self.amount,
            token_address_felt252,
            self.recipient.encode(),
        )
    }
}
fn count_digits(mut num: u256) -> (u32, felt252) {
    let BASE: u256 = 16_u256;
    let mut count: u32 = 0;
    while num > 0 {
        num = num / BASE;
        count = count + 1;
    }
    let res: felt252 = count.try_into().unwrap();
    (count, res)
}
impl TransferImpl of ConvertToBytes<Transfer> {
    fn convert_to_bytes(self: @Transfer) -> ByteArray {
        let mut ba: ByteArray = "";
        // Encode amount (u256 to felt252 conversion)
        let (amount_count, amount_count_felt252) = count_digits(*self.amount);
        let amount_u256 = *self.amount;
        let amount_felt252: felt252 = amount_u256.try_into().unwrap();
        ba.append_word(amount_count_felt252, 1_u32);
        ba.append_word(amount_felt252, amount_count);

        // Encode token
        // ba.append_word(*self.token, 1_u32);

        // Encode token_address
        //  let addr:felt252 = self.token_address.into();
        //  ba.append_word(addr, 1_u32);
        let token_add = *self.token_address;
        let token_addr = token_add.try_into().unwrap();
        ba.append_word(token_addr, 1_u32);
        // Encode joyboy (NostrProfile encoding)
        let (joyboy_count, joyboy_count_felt252) = count_digits((*self.joyboy.public_key).into());
        let joyboy_u256 = *self.joyboy.public_key;
        let joyboy_felt252: felt252 = joyboy_u256.try_into().unwrap();
        ba.append_word(joyboy_count_felt252, 1_u32);
        ba.append_word(joyboy_felt252, joyboy_count);

        // Encode joyboy relays
        let joyboy_relays = self.joyboy.relays.span();
        for relay in joyboy_relays {
            ba.append(relay);
        }

        // Encode recipient (NostrProfile encoding)
        let (recipient_count, recipient_count_felt252) = count_digits(*self.recipient.public_key);
        let receipient_u256 = *self.recipient.public_key;
        let recipient_felt252: felt252 = receipient_u256.try_into().unwrap();
        ba.append_word(recipient_count_felt252, 1_u32);
        ba.append_word(recipient_felt252, recipient_count);

        // Encode recipient relays
        let recipient_relays = self.recipient.relays.span();
        for relay in recipient_relays {
            ba.append(relay);
        }

        // Encode recipient_address
        let receipient_add = *self.recipient_address;
        let receipient_addr = receipient_add.try_into().unwrap();
        ba.append_word(receipient_addr, 1_u32);

        ba
    }
}
#[cfg(test)]
mod tests {
    use core::option::OptionTrait;
    use starknet::ContractAddress;
    use super::Transfer;
    use super::super::profile::NostrProfile;
    use super::super::request::Encode;

    #[test]
    fn encode() {
        let joyboy = NostrProfile {
            public_key: 0x84603b4e300840036ca8cc812befcc8e240c09b73812639d5cdd8ece7d6eba40,
            relays: array!["wss://relay.joyboy.community.com"],
        };

        let recipient = NostrProfile {
            public_key: 0xa87622b57b52f366457e867e1dccc60ea631ccac94b7c74ab08254c489ef12c6,
            relays: array![],
        };

        let request = Transfer {
            amount: 1,
            // token: 'USDC',
            token_address: 1.try_into().unwrap(),
            joyboy,
            recipient,
            recipient_address: 1.try_into().unwrap(),
        };

        let expected =
            "nprofile1qys8wumn8ghj7un9d3shjtn2daukymme9e3k7mtdw4hxjare9e3k7mgqyzzxqw6wxqyyqqmv4rxgz2l0ej8zgrqfkuupycuatnwcannad6ayqx7zdcy send 1 USDC to nprofile1qqs2sa3zk4a49umxg4lgvlsaenrqaf33ejkffd78f2cgy4xy38h393s2w22mm";

        assert(request.encode() == @expected, 'request encode error');
    }
}
