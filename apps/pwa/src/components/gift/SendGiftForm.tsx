// components/SendUSDCForm.tsx
import {Box, Button, Input, Select, Stack, Text, useToast} from '@chakra-ui/react';
import {useAccount as useAccountStarknet} from '@starknet-react/core';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {useEffect, useState} from 'react';
import {useAccount, useSendTransaction, useWriteContract} from 'wagmi';

import {useGift} from '@/hooks/useGift';

import Account from '../account/starknet/AccountStarknet';
import CopyableLink from '../button/CopyLink';
import {CustomConnectButtonWallet} from '../button/CustomConnectButtonWallet';
import CustomModal from '../modal';
interface SendFormProps {
  recipientAddress?: string;
  chainProps?: ChainString;
  tokenAddress?: string;
}
type ChainString = 'KAKAROT' | 'STARKNET' | 'SEPOLIA';
type Token = 'ETH' | 'STRK' | 'USDC';
enum GiftType {
  'INTERNAL',
  'EXTERNAL_PRIVATE_KEY',
  'API',
}
const SendGiftForm: React.FC<SendFormProps> = ({recipientAddress, chainProps}) => {
  const [amount, setAmount] = useState<string>('');
  const toast = useToast();
  const account = useAccount();
  const {account: accountStarknet} = useAccountStarknet();
  const [token, setToken] = useState<Token>('ETH');
  const [chain, setChain] = useState<ChainString>(chainProps ?? 'SEPOLIA');
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
  const {handleSubmit, urlReceived, setUrlReceived} = useGift({});

  // Initialize `viem` client
  // const walletClient = createWalletClient({
  //   chain: sepolia,
  //   transport: custom(window?.ethereum),
  // });
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

  const handlePresetAmount = (presetAmount: number) => {
    setUsdAmount(presetAmount.toString());
    const totalPrice = Number(presetAmount) / Number(tokenPrice);
    setAmount(totalPrice?.toString());
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
  };
  return (
    <Box maxWidth="400px" mx="auto" p={5} borderWidth="1px" borderRadius="md" boxShadow="md">
      {!account?.address && !accountStarknet?.address && (
        <Box>
          <Text>Connect you</Text>
          <Box display="flex">
            <Box>
              <Text>EVM</Text>
              <CustomConnectButtonWallet></CustomConnectButtonWallet>
            </Box>

            <Box>
              <Text>Starknet</Text>
              <Button
                onClick={() => {
                  // connectToStarknet()
                  openModal();
                }}
              >
                Connect
              </Button>
            </Box>

            <CustomModal
              isOpen={isModalOpen}
              onClose={closeModal}
              title="Sample Modal"
              footerContent={
                <Button colorScheme="green" onClick={closeModal}>
                  Confirm
                </Button>
              }
            >
              <Account></Account>
            </CustomModal>
          </Box>
        </Box>
      )}
      <Text fontSize="2xl" mb={4}>
        Send gift
      </Text>
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
        <Text mb={2}>
          Current {token} Price: ${tokenPrice.toFixed(2)} USD
        </Text>
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
      <Text>
        {' '}
        {tokenPrice && (
          <Text mb={2}>Amount: ${Number(tokenPrice.toFixed(2)) * Number(amount)} USD</Text>
        )}
      </Text>
      <Stack direction="row" spacing={4} mb={4}>
        <Button onClick={() => handlePresetAmount(1)}>💵 $1</Button>
        <Button onClick={() => handlePresetAmount(3)}>💸 $3</Button>
        <Button onClick={() => handlePresetAmount(5)}>💰 $5</Button>
      </Stack>
      <Button
        colorScheme="blue"
        // onClick={handleSubmit}
        onClick={() => {
          handleSubmit(amount, token, chain);
        }}
      >
        Send {token}
      </Button>

      {urlReceived && (
        <Box>
          <Text>Send this url to your friends.</Text>
          <Text>Everyone with this link can claim your gift.</Text>
          <Box>
            {/* <Text> {urlReceived}</Text> */}
            <CopyableLink link={urlReceived}></CopyableLink>
          </Box>
        </Box>
      )}

      {hash && <div>Transaction Hash: {hash}</div>}
    </Box>
  );
};

export default dynamic(() => Promise.resolve(SendGiftForm), {ssr: false});
