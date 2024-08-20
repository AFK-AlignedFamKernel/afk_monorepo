
#[starknet::interface]
pub trait ICounter<T> {
    fn number(self: @T) -> u256;
    fn set_number(ref self: T, number: u256);
    fn increment(ref self: T);
}

#[starknet::contract]
mod Counter {
    #[storage]
    struct Storage {
        number: u256,
    }

    #[abi(embed_v0)]
    impl CounterImpl of super::ICounter<ContractState> {
        fn number(self: @ContractState) -> u256 {
            self.number.read()
        }
        fn set_number(ref self: ContractState, number: u256) {
            self.number.write(number);
        }

        fn increment(ref self: ContractState) {
            self.number.write(self.number.read() + 1);
        }
    }
}
