import { AccountInterface, CallData, Calldata, cairo, constants } from "starknet"
import { LAUNCHPAD_ADDRESS, UNRUGGABLE_FACTORY_ADDRESS } from "../../constants/contracts";

export type DeployTokenFormValues = {
    recipient?:string;
    name: string | undefined;
    symbol: string | undefined;
    initialSupply: number | undefined;
    contract_address_salt: string | undefined
};

export const useCreateToken = () => {

    const deployToken = async (account: AccountInterface, data: DeployTokenFormValues) => {
        const CONTRACT_ADDRESS_SALT_DEFAULT = data?.contract_address_salt ?? await account?.getChainId() == constants.StarknetChainId.SN_MAIN ?
            "0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6" :
            "0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6"
        const deployCall = {
            contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
            entrypoint: 'create_token',
            calldata: CallData.compile({
                owner: data?.recipient ?? account?.address,
                name: data.name ?? "LFG",
                symbol: data.symbol ?? "LFG",
                initialSupply: cairo.uint256(data?.initialSupply ?? 100),
                contract_address_salt:CONTRACT_ADDRESS_SALT_DEFAULT
            }),
        };

        const tx = await account.execute(deployCall)
        console.log('tx hash', tx.transaction_hash);
        const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
        return wait_tx
    }

    const deployTokenAndLaunch = async (account: AccountInterface, data: DeployTokenFormValues) => {
        const CONTRACT_ADDRESS_SALT_DEFAULT = data?.contract_address_salt ?? await account?.getChainId() == constants.StarknetChainId.SN_MAIN ?
            "0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6" :
            "0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6"
        const deployCall = {
            contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
            entrypoint: 'create_and_launch_token',
            calldata: CallData.compile({
                owner: account?.address,
                name: data.name ?? "LFG",
                symbol: data.symbol ?? "LFG",
                initialSupply: cairo.uint256(data?.initialSupply ?? 100),
                contract_address_salt:CONTRACT_ADDRESS_SALT_DEFAULT
            }),
        };

        const tx = await account.execute(deployCall)
        console.log('tx hash', tx.transaction_hash);
        const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
        return wait_tx
    }

    const launchToken = async (account: AccountInterface, coin_address:string) => {
        const deployCall = {
            contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
            entrypoint: 'launch_token',
            calldata: CallData.compile({
             coin_address:coin_address}),
        };

        const tx = await account.execute(deployCall)
        console.log('tx hash', tx.transaction_hash);
        const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
        return wait_tx
    }

    return {
        deployToken,
        deployTokenAndLaunch,
        launchToken

    }
}