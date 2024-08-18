import { UNRUGGABLE_FACTORY_ADDRESS } from "common";
import { AccountInterface, CallData, Calldata, cairo, constants } from "starknet"

export type DeployTokenFormValues = {
    name: string | undefined;
    symbol: string | undefined;
    initialSupply: number | undefined;
    contract_address_salt: string | undefined
};

export const useDeployTokenUnruggable = () => {

    const deployTokenUnruggable = async (account: AccountInterface, data: DeployTokenFormValues) => {
        // const CONTRACT_ADDRESS_SALT_DEFAULT = data?.contract_address_salt ?? await account?.getChainId() == constants.StarknetChainId.SN_MAIN ?
        //     "0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6" :
        //     "0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6"
        const deployCall = {
            contractAddress: UNRUGGABLE_FACTORY_ADDRESS[constants.StarknetChainId.SN_MAIN],
            entrypoint: 'create_memecoin',
            calldata: CallData.compile({
                owner: account?.address,
                name: data.name ?? "LFG",
                symbol: data.symbol ?? "LFG",
                initialSupply: cairo.uint256(data?.initialSupply ?? 100),
                contract_address_salt:new Date().getTime()
            }),
        };

        const tx = await account.execute(deployCall)
        console.log('tx hash', tx.transaction_hash);
        const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
        return wait_tx
    }

    return {
        deployTokenUnruggable
    }
}