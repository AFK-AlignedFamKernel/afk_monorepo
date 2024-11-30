pub struct StakerInfo {}

#[starknet::interface]
pub trait ILST_Staking<TContractState> {
    fn stake(ref self: TContractState, amount: u256);
    fn increase_stake(ref self: TContractState, amount: u256);
    fn unstake_intent(ref self: TContractState);
    fn unstake_action(ref self: TContractState);
    fn claim_rewards(ref self: TContractState);
}