import {useToast} from '@chakra-ui/react';
import {useAccount as useAccountStarknet} from '@starknet-react/core';
import axios from 'axios';
import {RPC_URLS_NUMBER, TOKENS_ADDRESS} from 'common';
import {useEffect, useState} from 'react';
import {Account, CallData, constants, RpcProvider, uint256} from 'starknet';
import {erc20Abi, parseEther, parseUnits} from 'viem';
import {sepolia} from 'viem/chains';
import {useAccount, useSendTransaction, useWriteContract} from 'wagmi';

import {
  generateDeployAccount,
  generateLinkReceived,
  generateStarknetWallet,
  generateWalletEvm,
} from '@/utils/generate';

import {ChainString, GiftType, Token} from '../types';

interface IGiftHook {
  recipientAddress?: string;
  chainProps?: ChainString;
  tokenAddress?: string;
}
export const useGift = ({chainProps, recipientAddress, tokenAddress}: IGiftHook) => {
  const toast = useToast();
  const account = useAccount();
  const {account: accountStarknet} = useAccountStarknet();
  const [amount, setAmount] = useState<string>('');
  const [token, setToken] = useState<Token>('ETH');
  const [chain, setChain] = useState<ChainString>(chainProps ?? 'SEPOLIA');
  const [urlReceived, setUrlReceived] = useState<string | undefined>();
  const [giftType, setGiftType] = useState<GiftType>(GiftType.EXTERNAL_PRIVATE_KEY);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [generateWallet, setGenerateWallet] = useState<string | undefined>();
  const [recipientVaultAddress, setVaultRecipientAddress] = useState<
    `0x${string}` | undefined | null
  >();
  const [recipientVaultStrkAddress, setVaultRecipientStrkAddress] = useState<string | undefined>();
  const [tokenAmount, setTokenAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const {data: hashSendEth, sendTransaction} = useSendTransaction();
  const {writeContract, data: hash} = useWriteContract();

  const handlePresetAmount = (presetAmount: number) => {
    setUsdAmount(presetAmount.toString());
    const totalPrice = Number(presetAmount) / Number(tokenPrice);
    setAmount(totalPrice?.toString());
  };

  useEffect(() => {
    const fetchTokenPrice = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,starknet,usd-coin&vs_currencies=usd`,
        );
        const prices = {
          ETH: response.data.ethereum.usd,
          STRK: response.data.starknet.usd,
          USDC: response.data['usd-coin'].usd,
        };
        setTokenPrice(prices[token]);
      } catch (error) {
        console.error('Error fetching token price:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenPrice();
  }, [token]);
  const handleSendGiftEvm = async (amount: string, token: string, chain: ChainString) => {
    const {address, privateKey} = await generateWalletEvm();
    const recipientAddress = address;
    setVaultRecipientAddress(recipientAddress as `0x${string}`);
    setGenerateWallet(privateKey);
    if (!recipientAddress) {
      toast({
        title: 'Error',
        description: 'Recipient address is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const chainId = account?.chainId;
    const addressToken = TOKENS_ADDRESS[chainId ?? sepolia.id][token ?? 'ETH'];
    const decimals = token == 'USDC' ? 6 : 18;

    if (token == 'ETH') {
      sendTransaction({to: recipientAddress as `0x${string}`, value: parseEther(amount)});
      // const generateUrl = await generateLinkReceived(privateKey, addressToken, amount, "KAKAROT")
      const generateUrl = await generateLinkReceived(
        privateKey,
        addressToken,
        amount,
        chainId?.toString() ?? 'KAKAROT',
      );
      setUrlReceived(generateUrl);
    } else {
      console.log('addressToken', addressToken);
      sendTransaction({to: recipientAddress as `0x${string}`, value: parseEther('0.00001')});

      // await writeContract({
      //   abi: erc20Abi,
      //   address: addressToken ?? '0x6b175474e89094c44da98b954eedeac495271d0f',
      //   functionName: 'transfer',
      //   args: [
      //     (recipientAddress as `0x${string}`) ?? (recipientVaultAddress as `0x${string}`),
      //     parseUnits(amount, decimals),
      //   ],
      // });
    }
  };

  const handleSendGiftStarknet = async (amount: string, token: string, chain: ChainString) => {
    console.log('starknet send');

    const chainId = await accountStarknet?.getChainId();
    // if (!token) {
    //   toast({
    //     title: 'Error',
    //     description: 'Recipient address is required.',
    //     status: 'error',
    //     duration: 5000,
    //     isClosable: true,
    //   });
    // }
    const addressToken =
      TOKENS_ADDRESS[chainId ?? constants.StarknetChainId.SN_SEPOLIA][token ?? 'ETH'];
    console.log('addressToken', addressToken);

    if (!addressToken) {
      toast({
        title: 'Error',
        description: 'Recipient address is required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    const recipientAddress = recipientVaultStrkAddress ?? accountStarknet?.address;
    const decimals = token == 'USDC' ? 6 : 18;

    if (giftType == GiftType.EXTERNAL_PRIVATE_KEY) {
      if (!accountStarknet?.address) {
        toast({
          title: 'Connect or create a wallet',
          description: 'Please contact the support if you need help',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const addressStrk = accountStarknet?.address;

      const {
        precomputeAddress,
        provider: providerTest,
        privateKey,
        starkKeyPub: pubkey,
        classHash,
        constructorCalldata,
      } = await generateStarknetWallet();
      //   await generateStarknetWallet(addressStrk);

      if (!precomputeAddress && !privateKey) {
        toast({
          title: 'Error generate a link',
          description: 'Please contact the support if you need help',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const generateUrl = await generateLinkReceived(
        privateKey ?? '',
        addressToken,
        amount,
        chainId?.toString() ?? 'STARKNET',
        precomputeAddress,
        pubkey,
      );
      setUrlReceived(generateUrl);

      let recipientAddress = recipientVaultStrkAddress ?? accountStarknet?.address;

      const rpcUrls = RPC_URLS_NUMBER[chainId ?? constants.StarknetChainId.SN_SEPOLIA];
      const provider = new RpcProvider({nodeUrl: rpcUrls});

      if (!provider) {
        toast({
          title: 'Error when generating the gift',
          description: 'Please try or contact the support',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      recipientAddress = precomputeAddress;
      console.log('starknet precomputeAddress', precomputeAddress);

      // const walletGenerated = await deployAccount(provider, precomputeAddress, pubkey, privateKey, classHash, constructorCalldata)
      // const calldataWalletGenerated = await generateDeployAccount(precomputeAddress, pubkey, classHash, constructorCalldata)
      const calldataWalletGenerated = await generateDeployAccount(
        precomputeAddress,
        pubkey,
        classHash,
        constructorCalldata,
      );

      // const gasFees = await accountStarknet?.estimateAccountDeployFee(calldataWalletGenerated?.deployAccountPayload)

      let gasFees = BigInt(0);
      // try {
      //     let gasFeesData = await accountStarknet?.estimateAccountDeployFee(
      //         calldataWalletGenerated?.deployAccountPayload,
      //     );

      //     gasFees = gasFeesData.overall_fee

      //     console.log("gasFees", gasFees)
      // } catch (error) {
      //     console.log("error get gasFees", error)

      // }

      const accountAX = new Account(provider, addressToken, privateKey);

      try {
        const gasFeesData = await accountAX?.estimateAccountDeployFee(
          calldataWalletGenerated?.deployAccountPayload,
        );

        gasFees = gasFeesData.overall_fee;

        console.log('gasFees', gasFees);
      } catch (error) {
        console.log('error get gasFees', error);
      }

      console.log('token', token);

      if (token == 'ETH') {
        const amountTotal = Math.ceil(Number(amount) * 10 ** decimals);
        console.log('amountTotal', amountTotal);
        console.log('gasFees', gasFees);

        const amountUint256 = uint256.bnToUint256(BigInt(amountTotal) + gasFees);
        const totalAmount = amountUint256;
        console.log('totalAmount', totalAmount);

        const txTransferCalldata = CallData.compile({
          recipient: precomputeAddress,
          totalAmount,
        });
        const receipt = await accountStarknet?.execute([
          {
            contractAddress: addressToken,
            entrypoint: 'transfer',
            calldata: txTransferCalldata,
          },
        ]);
        console.log('receipt', receipt);

        await accountStarknet?.waitForTransaction(receipt?.transaction_hash);
        if (calldataWalletGenerated?.deployAccountPayload) {
          try {
            const deployedAccount = await accountAX?.deployAccount(
              calldataWalletGenerated?.deployAccountPayload,
            );

            recipientAddress = deployedAccount?.contract_address;
            console.log('✅ ArgentX wallet deployed at:', deployedAccount);
          } catch (error) {
            console.log('error deploy account', error);

            // try {
            //     const deployedAccount = await accountStarknet?.deployAccount(
            //         calldataWalletGenerated?.deployAccountPayload,
            //     );
            //     recipientAddress = deployedAccount?.contract_address;
            //     console.log('✅ ArgentX wallet deployed at:', deployedAccount);

            // } catch (error) {
            //     console.log("error deploy")
            // }
          }
        }
      } else {
        // recipientAddress = walletGenerated?.contract_address
        const amountUint256 = uint256.bnToUint256(Math.ceil(Number(amount) * 10 ** decimals));
        console.log('amountUint256', amountUint256);
        const txTransferCalldata = CallData.compile({
          recipient: precomputeAddress ?? '',
          amountUint256,
        });
        const txTransfer = {
          contractAddress: addressToken,
          entrypoint: 'transfer',
          calldata: txTransferCalldata,
        };

        const txTransferEth = {
          contractAddress: TOKENS_ADDRESS[chainId ?? constants.StarknetChainId.SN_SEPOLIA]['ETH'],
          entrypoint: 'transfer',
          calldata: txTransferCalldata,
        };
        const receipt = await accountStarknet?.execute([txTransferEth, txTransfer]);
        console.log('receipt', receipt);
        await accountStarknet?.waitForTransaction(receipt?.transaction_hash);

        if (calldataWalletGenerated?.deployAccountPayload) {
          const deployedAccount = await accountAX?.deployAccount(
            calldataWalletGenerated?.deployAccountPayload,
          );
          recipientAddress = deployedAccount?.contract_address;
          console.log('✅ ArgentX wallet deployed at:', deployedAccount);
        }
      }
    } else if (giftType == GiftType.API) {
      // const amountUint256 = uint256.bnToUint256(Math.ceil(Number(amount) * 10 ** decimals));
      // recipientAddress = process.env.NEXT_PUBLIC_ACCOUNT_ADDRESS;
      // console.log('amountUint256', amountUint256);
      // const txTransferCalldata = CallData.compile({
      //     recipient: recipientAddress ?? '',
      //     amountUint256,
      // });
      // const receipt = await accountStarknet?.execute([
      //     {
      //         contractAddress: addressToken,
      //         entrypoint: 'transfer',
      //         calldata: txTransferCalldata,
      //     },
      // ]);
    }
  };

  const handleSubmit = async (amount: string, token: string, chain: ChainString) => {
    if (!account?.address && !accountStarknet?.address) {
      toast({
        title: 'Error',
        description: 'Please connect or create your wallet',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Convert amount to the smallest USDC unit (6 decimals)
      // const value = BigInt(parseFloat(amount) * 1e6); // USDC has 6 decimal places

      if (!amount) {
        toast({
          title: 'Error',
          description: 'Amount is required.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }

      if (chain == 'STARKNET' || accountStarknet) {
        await handleSendGiftStarknet(amount, token, chain);
      } else {
        await handleSendGiftEvm(amount, token, chain);
      }

      // const generateUrl = await generateLinkReceived(privateKey, addressToken, amount, chain)
      // setUrlReceived(generateUrl)

      // toast({
      //   title: 'Transaction Sent',
      //   description: `Transaction hash: ${hash}`,
      //   status: 'success',
      //   duration: 5000,
      //   isClosable: true,
      // });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Transaction failed.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return {
    handlePresetAmount,
    handleSubmit,
    urlReceived,
    setUrlReceived,
  };
};
