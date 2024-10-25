// components/SendUSDCForm.tsx
import { useState } from 'react';
import { Box, Button, Input, Text, Stack, useToast } from '@chakra-ui/react';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';


interface SendUSDCFormProps {
  recipientAddress?: string;
  chain?: "KAKAROT"| "STARKNET";
  tokenAddress?:string;
}

const SendUSDCForm: React.FC<SendUSDCFormProps> = ({ recipientAddress, chain, tokenAddress}) => {
  const [amount, setAmount] = useState<string>('');
  const toast = useToast();

  // Initialize `viem` client
  const walletClient = createWalletClient({
    chain: mainnet,
    transport: custom(window.ethereum),
  });

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleSubmit = async () => {
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

    try {
      // Convert amount to the smallest USDC unit (6 decimals)
      const value = BigInt(parseFloat(amount) * 1e6); // USDC has 6 decimal places

      const { request } = await walletClient.simulateContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: [
          // Simplified ERC20 transfer ABI
          {
            type: 'function',
            name: 'transfer',
            stateMutability: 'nonpayable',
            inputs: [
              { name: '_to', type: 'address' },
              { name: '_value', type: 'uint256' },
            ],
            outputs: [{ type: 'bool' }],
          },
        ],
        functionName: 'transfer',
        args: [recipientAddress, value],
      });

      const hash = await walletClient.writeContract(request);

      toast({
        title: 'Transaction Sent',
        description: `Transaction hash: ${hash}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
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

  return (
    <Box maxWidth="400px" mx="auto" p={5} borderWidth="1px" borderRadius="md" boxShadow="md">
      <Text fontSize="2xl" mb={4}>Send USDC</Text>
      <Input
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        mb={4}
      />
      <Stack direction="row" spacing={4} mb={4}>
        <Button onClick={() => handlePresetAmount(1)}>💵 $1</Button>
        <Button onClick={() => handlePresetAmount(3)}>💸 $3</Button>
        <Button onClick={() => handlePresetAmount(5)}>💰 $5</Button>
      </Stack>
      <Button colorScheme="blue" onClick={handleSubmit}>
        Send USDC
      </Button>
    </Box>
  );
};

export default SendUSDCForm;
