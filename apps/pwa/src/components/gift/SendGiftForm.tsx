// components/SendUSDCForm.tsx
import { useState, useEffect } from 'react';
import { Box, Button, Input, Text, Stack, useToast, Select } from '@chakra-ui/react';
import { createWalletClient, custom, parseEther, erc20Abi, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { useSendTransaction, useAccount, useWriteContract } from 'wagmi';
import { useAccount as useAccountStarknet } from '@starknet-react/core';
import { CustomConnectButtonWallet } from '../../app/components/button/CustomConnectButtonWallet';
import Account from '../../app/components/button/starknet/AccountStarknet';
import CustomModal from '../../app/components/modal';
import axios from 'axios';
import { TOKENS_ADDRESS } from 'common';
import { CallData, constants, uint256 } from 'starknet';
import { generateDeployAccount, generateStarknetWallet, generateWalletEvm, generateLinkReceived } from '@/utils/generate';
import CopyableLink from '../../app/components/button/CopyLink';
interface SendFormProps {
  recipientAddress?: string;
  chainProps?: ChainString;
  tokenAddress?: string;
}
type ChainString = "KAKAROT" | "STARKNET" | "SEPOLIA";
type Token = 'ETH' | 'STRK' | 'USDC';
enum GiftType {
  'INTERNAL', "EXTERNAL_PRIVATE_KEY", "API"
}
const SendGiftForm: React.FC<SendFormProps> = ({ recipientAddress, chainProps }) => {
  const [amount, setAmount] = useState<string>('');
  const toast = useToast();
  const account = useAccount()
  const { account: accountStarknet } = useAccountStarknet()
  const [token, setToken] = useState<Token>('ETH');
  const [chain, setChain] = useState<ChainString>(chainProps ?? "SEPOLIA");
  const [urlReceived, setUrlReceived] = useState<string | undefined>();
  const [giftType, setGiftType] = useState<GiftType>(GiftType.EXTERNAL_PRIVATE_KEY);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [generateWallet, setGenerateWallet] = useState<string | undefined>();
  const [recipientVaultAddress, setVaultRecipientAddress] = useState<`0x${string}` | undefined | null>();
  const [recipientVaultStrkAddress, setVaultRecipientStrkAddress] = useState<string | undefined>();
  const [tokenAmount, setTokenAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: hashSendEth, sendTransaction } = useSendTransaction()
  const { writeContract, data: hash } = useWriteContract()

  // Initialize `viem` client
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window?.ethereum),
  });
  const handleCalculate = () => {
    if (tokenPrice && usdAmount) {
      const usd = parseFloat(usdAmount);
      setTokenAmount(usd / tokenPrice);
    }
  };
  useEffect(() => {
    const fetchTokenPrice = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,starknet,usd-coin&vs_currencies=usd`
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
  }, [token])


  const handlePresetAmount = (presetAmount: number) => {
    setUsdAmount(presetAmount.toString());
    const totalPrice = Number(presetAmount) / Number(tokenPrice)
    setAmount(totalPrice?.toString())
  };

  const handleSubmit = async () => {
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
      const decimals = token == "USDC" ? 6 : 18

      if (chain == "STARKNET" || !chain && accountStarknet) {

        const chainId = await accountStarknet?.getChainId()
        // if (!token) {
        //   toast({
        //     title: 'Error',
        //     description: 'Recipient address is required.',
        //     status: 'error',
        //     duration: 5000,
        //     isClosable: true,
        //   });
        // }
        const addressToken = TOKENS_ADDRESS[chainId ?? constants.StarknetChainId.SN_SEPOLIA][token ?? "ETH"]
        console.log("addressToken", addressToken)

        if (!addressToken) {
          toast({
            title: 'Error',
            description: 'Recipient address is required.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
        let recipientAddress = recipientVaultStrkAddress ?? accountStarknet?.address

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

          const addressStrk = accountStarknet?.address

          const { precomputeAddress, provider, privateKey, starkKeyPub: pubkey, classHash, constructorCalldata } = await generateStarknetWallet(addressStrk)

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
          recipientAddress = precomputeAddress

          // const walletGenerated = await deployAccount(provider, precomputeAddress, pubkey, privateKey, classHash, constructorCalldata)
          // const calldataWalletGenerated = await generateDeployAccount(precomputeAddress, pubkey, classHash, constructorCalldata)
          const calldataWalletGenerated = await generateDeployAccount(precomputeAddress, addressStrk, classHash, constructorCalldata)
          // recipientAddress = walletGenerated?.contract_address

          if (calldataWalletGenerated?.deployAccountPayload) {
            const deployedAccount = await accountStarknet?.deployAccount(calldataWalletGenerated?.deployAccountPayload);
            recipientAddress = deployedAccount?.contract_address;
            console.log('✅ ArgentX wallet deployed at:', deployedAccount);
          }

          const amountUint256 = uint256.bnToUint256(
            Math.ceil(Number(amount) * 10 ** decimals),
          );
          console.log("amountUint256", amountUint256)
          const txTransferCalldata = CallData.compile({
            recipient: recipientAddress ?? "",
            amountUint256
          })

          const receipt = await accountStarknet?.execute(
            [
              {
                contractAddress: addressToken,
                entrypoint: "transfer",
                calldata: txTransferCalldata,
              },
            ],
          );
          console.log("receipt", receipt)
        } else if (giftType == GiftType.API) {
          const amountUint256 = uint256.bnToUint256(
            Math.ceil(Number(amount) * 10 ** decimals),
          );

          recipientAddress = process.env.NEXT_PUBLIC_ACCOUNT_ADDRESS;
          console.log("amountUint256", amountUint256)
          const txTransferCalldata = CallData.compile({
            recipient: recipientAddress ?? "",
            amountUint256
          })

          const receipt = await accountStarknet?.execute(
            [
              {
                contractAddress: addressToken,
                entrypoint: "transfer",
                calldata: txTransferCalldata,
              },
            ],
          );
        }

      } else {
        const { address, privateKey } = await generateWalletEvm()
        const recipientAddress = address;
        setVaultRecipientAddress(recipientAddress as `0x${string}`)
        setGenerateWallet(privateKey)
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
        const addressToken = TOKENS_ADDRESS[chainId ?? sepolia.id][token ?? "ETH"]

        if (token == "ETH") {
          sendTransaction({ to: recipientAddress as `0x${string}`, value: parseEther(amount) })
          // const generateUrl = await generateLinkReceived(privateKey, addressToken, amount, "KAKAROT")
          const generateUrl = await generateLinkReceived(privateKey, addressToken, amount, chainId?.toString() ?? "KAKAROT")
          setUrlReceived(generateUrl)
        } else {

          console.log("addressToken", addressToken)
          sendTransaction({ to: recipientAddress as `0x${string}`, value: parseEther("0.00001") })

          await writeContract({
            abi: erc20Abi,
            address: addressToken ?? '0x6b175474e89094c44da98b954eedeac495271d0f',
            functionName: 'transfer',
            args: [
              recipientAddress as `0x${string}` ?? recipientVaultAddress as `0x${string}`,
              parseUnits(amount, decimals),
            ],
          })
        }

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const connectToStarknet = async () => {
    // const { wallet, connectorData } = await connect()

    // if (wallet && wallet.isConnected) {
    //   setConnection(wallet)
    //   setAddress(wallet.selectedAddress)
    // }
  }
  return (
    <Box maxWidth="400px"
     mx="auto" p={5} borderWidth="1px" borderRadius="md" boxShadow="md"
    >

      {!account?.address && !accountStarknet?.address
        &&

        <Box>
          <Text>

            Connect you
          </Text>
          <Box
            display="flex"
          >
            <Box>
              <Text>EVM</Text>
              <CustomConnectButtonWallet></CustomConnectButtonWallet>
            </Box>

            <Box>
              <Text>Starknet</Text>
              <Button onClick={() => {
                // connectToStarknet()
                openModal()
              }

              } >Connect</Button>
            </Box>

            <CustomModal
              isOpen={isModalOpen}
              onClose={closeModal}
              title="Sample Modal"
              footerContent={<Button colorScheme="green" onClick={closeModal}>Confirm</Button>}
            >
              <Account></Account>
            </CustomModal>

          </Box>

        </Box>

      }
      <Text fontSize="2xl" mb={4}>Send gift</Text>
      <Select
        placeholder="Select Token"
        value={token}
        onChange={(e) => setToken(e.target.value as Token)}
        mb={4}
      >
        <option value="ETH">ETH</option>
        <option value="STRK">STRK</option>
        <option value="USDC">USDC</option>
      </Select>
      {tokenPrice && (
        <Text mb={2}>Current {token} Price: ${tokenPrice.toFixed(2)} USD</Text>
      )}
      {/* <Text>Dollar amount</Text> */}
      <Text>Token amount</Text>
      <Input
        placeholder="Enter amount"
        value={Number(amount)}
        type="number"
        onChange={(e) => setAmount(e.target.value)}
        mb={4}
      />
      <Text>    {tokenPrice && (
        <Text mb={2}>Amount: ${Number(tokenPrice.toFixed(2)) * Number(amount)} USD</Text>
      )}</Text>
      <Stack direction="row" spacing={4} mb={4}>
        <Button onClick={() => handlePresetAmount(1)}>💵 $1</Button>
        <Button onClick={() => handlePresetAmount(3)}>💸 $3</Button>
        <Button onClick={() => handlePresetAmount(5)}>💰 $5</Button>
      </Stack>
      <Button colorScheme="blue" onClick={handleSubmit}>
        Send {token}
      </Button>

      {urlReceived &&
        <Box>
          <Text>Send this url to your friends.</Text>
          <Text>Everyone with this link can claim your gift.</Text>
          <Box>
            {/* <Text> {urlReceived}</Text> */}
            <CopyableLink link={urlReceived}></CopyableLink>
          </Box>
        </Box>
      }

      {hash && <div>Transaction Hash: {hash}</div>}
    </Box>
  );
};

export default SendGiftForm;
