import { ethers } from 'ethers';
import { Account, constants, ec, json, stark, RpcProvider, hash, CallData } from 'starknet';

export function generateLink(privateKey: string) {
    const url = `https://your-app.com/redeem?privateKey=${encodeURIComponent(privateKey)}`;
    return url;
}

export function generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey;
    return { address, privateKey };
}

export function generateStarknetWalletOZ() {
    // connect provider (Mainnet or Sepolia)
    const provider = new RpcProvider({});
    // const provider = new RpcProvider({});

    // new Open Zeppelin account v0.8.1
    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    console.log('New OZ account:\nprivateKey=', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey=', starkKeyPub);

    const OZaccountClassHash = '0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f';
    // Calculate future address of the account
    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(
        starkKeyPub,
        OZaccountClassHash,
        OZaccountConstructorCallData,
        0
    );
    console.log('Precalculated account address=', OZcontractAddress);

    return {
        classHash: OZaccountClassHash,
        precomputeAddress: OZcontractAddress,
        starkKeyPub,
        privateKey
    }
}

export function generateStarknetWallet() {
    try {
        // connect provider (Mainnet or Sepolia)
        const provider = new RpcProvider({});

        // new Open Zeppelin account v0.8.1
        // Generate public and private key pair.
        const privateKey = stark.randomAddress();
        console.log('New OZ account:\nprivateKey=', privateKey);
        const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
        console.log('publicKey=', starkKeyPub);
        //new Argent X account v0.3.0
        const argentXaccountClassHash = '0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003';

        // Calculate future address of the ArgentX account
        const AXConstructorCallData = CallData.compile({
            owner: starkKeyPub,
            guardian: '0',
        });
        const AXcontractAddress = hash.calculateContractAddressFromHash(
            starkKeyPub,
            argentXaccountClassHash,
            AXConstructorCallData,
            0
        );
        console.log('Precalculated account address=', AXcontractAddress);

        return {
            precomputeAddress: AXcontractAddress,
            classHash: argentXaccountClassHash,
            starkKeyPub,
            privateKey
        }
    } catch (error) {
        console.log("error generate account",error)
        return undefined

    }

}

export async function deployAccount(provider: RpcProvider, contractAddress: string, pubkey: string, privateKey: string, classHash: string, constructorCalldata: any) {
    try {
        const accountAX = new Account(provider, contractAddress, privateKey);

        const deployAccountPayload = {
            classHash: classHash,
            constructorCalldata: constructorCalldata,
            contractAddress: contractAddress,
            addressSalt: pubkey,
        };

        const { transaction_hash: AXdAth, contract_address: AXcontractFinalAddress } =
            await accountAX.deployAccount(deployAccountPayload);
        console.log('✅ ArgentX wallet deployed at:', AXcontractFinalAddress);

        return {
            contract_address: AXcontractFinalAddress
        }
    } catch (error) {
        console.log("error deployAccount", error)

    }

}