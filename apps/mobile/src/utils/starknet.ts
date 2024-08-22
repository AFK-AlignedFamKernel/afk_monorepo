import { AccountInterface, constants, Contract, ProviderInterface, RpcProvider } from 'starknet';


/** @TODO determine paymaster master specs to send the TX */
export const prepareAndConnectContract = async (
    provider: ProviderInterface,
    contractAddress: string,
    account?: AccountInterface,
) => {
    // read abi of Test contract
    console.log('contractAddress', contractAddress);
    // console.log("provider",await provider.getChainId())

    const { abi: testAbi } = await provider.getClassAt(contractAddress);
    if (testAbi === undefined) {
        console.log("no abi")
        throw new Error('no abi.');
    }
    const contract = new Contract(testAbi, contractAddress, provider);
    console.log('contract', contract);

    // // Connect account with the contract
    // if (account) {
    //   contract.connect(account);
    // }
    return contract;
};

export const prepareTokenAndConnectContract = async (
    provider: ProviderInterface,
    contractAddress: string,
    account?: AccountInterface,
) => {
    // read abi of Test contract
    console.log('contractAddress', contractAddress);
    // console.log("provider",await provider.getChainId())

    const { abi: testAbi } = await provider.getClassAt(contractAddress);
    if (testAbi === undefined) {
        console.log("no abi")
        throw new Error('no abi.');
    }
    const contract = new Contract(testAbi, contractAddress, provider);
    console.log('contract', contract);

    // Connect account with the contract
    if (account) {
        contract.connect(account);
    }
    return contract;
};