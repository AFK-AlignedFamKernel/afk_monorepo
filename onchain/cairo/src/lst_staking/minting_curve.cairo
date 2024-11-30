#[starknet::interface]
pub trait IMintingCurve<TContractState> {
    fn yearly_mint(self: @TContractState) -> u256;
    fn update_total_supply(ref self: TContractState);
}

#[starknet::contract]
mod MintingCurve {
    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    impl MintingCurveImpl of super::IMintingCurve<ContractState> {
        fn yearly_mint(self: @ContractState) -> u256 {
            5
        }

        fn update_total_supply(ref self: ContractState) {

        }
    }
}