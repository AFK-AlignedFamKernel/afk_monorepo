// pages/redeem.tsx
import { useRouter } from 'next/router';
import { ethers, formatUnits } from 'ethers';
import { Button, Text, Box } from '@chakra-ui/react';
import { useState } from 'react';

const USDC_CONTRACT_ADDRESS = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const Redeem = () => {
  const router = useRouter();
  const { privateKey } = router.query;
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claimUSDC = async () => {
    if (!privateKey) return;

    try {
      const wallet = new ethers.Wallet(privateKey as string, ethers.getDefaultProvider());
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, [
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
      ], wallet);

      const usdcBalance = await usdcContract.balanceOf(wallet.address);
      setBalance(formatUnits(usdcBalance, 6)); // USDC has 6 decimals

      // Transfer USDC to user's wallet (if balance is sufficient)
      const recipientAddress = "user's wallet address here"; // could be prompted dynamically
      if (usdcBalance.gt(0)) {
        const tx = await usdcContract.transfer(recipientAddress, usdcBalance);
        await tx.wait();
        alert(`Successfully transferred ${balance} USDC`);
      } else {
        alert("No USDC to transfer.");
      }
    } catch (e) {
      setError("Failed to claim USDC. Please check the private key.");
    }
  };

  return (
    <Box p={4}>
      <Text fontSize="lg">Redeem USDC</Text>
      {error && <Text color="red.500">{error}</Text>}
      {balance && <Text>Your Balance: {balance} USDC</Text>}
      <Button onClick={claimUSDC} colorScheme="blue" mt={4}>
        Claim USDC
      </Button>
    </Box>
  );
};

export default Redeem;
