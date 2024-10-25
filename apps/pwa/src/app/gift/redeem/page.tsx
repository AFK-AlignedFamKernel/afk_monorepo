"use client";

import ReceiveGift from '@/app/components/gift/ReceiveGift';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { Box } from '@chakra-ui/react';
const Redeem = () => {
  // const router = useRouter();
  // const router = typeof window !== 'undefined' ? useRouter() : null;
  // const { privateKey, @/app/components/gift/ReceiveGift } = router?.query;
  // console.log("privateKey", privateKey)
  // console.log("tokenAddress", tokenAddress)
  // console.log("amount", amount)
  // console.log("network", network)
  // const [balance, setBalance] = useState<string | null>(null);
  // const [error, setError] = useState<string | null>(null);

  // const claimUSDC = async () => {
  //   if (!privateKey) return;

  //   try {
  //     const wallet = new ethers.Wallet(privateKey as string, ethers.getDefaultProvider());
  //     const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, [
  //       "function balanceOf(address owner) view returns (uint256)",
  //       "function transfer(address to, uint256 amount) returns (bool)",
  //     ], wallet);

  //     const usdcBalance = await usdcContract.balanceOf(wallet.address);
  //     setBalance(formatUnits(usdcBalance, 6)); // USDC has 6 decimals

  //     // Transfer USDC to user's wallet (if balance is sufficient)
  //     const recipientAddress = "user's wallet address here"; // could be prompted dynamically
  //     if (usdcBalance.gt(0)) {
  //       const tx = await usdcContract.transfer(recipientAddress, usdcBalance);
  //       await tx.wait();
  //       alert(`Successfully transferred ${balance} USDC`);
  //     } else {
  //       alert("No USDC to transfer.");
  //     }
  //   } catch (e) {
  //     setError("Failed to claim USDC. Please check the private key.");
  //   }
  // };

  return (
    <Box
      className="min-h-screen w-full relative bg-black"
    >
      <Navbar></Navbar>
      <ReceiveGift></ReceiveGift>
      <Footer></Footer>
    </Box>
  );
};

export default Redeem;
