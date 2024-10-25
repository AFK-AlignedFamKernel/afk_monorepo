// components/SendUSDCForm.tsx
import { useEffect, useState } from 'react';
import { Box, Button, Input, Text, Stack, useToast } from '@chakra-ui/react';
import { createWalletClient, custom, formatEther, formatUnits, parseEther, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { ethers, JsonRpcProvider } from 'ethers';
// import { useRouter } from 'next/router';
import { useRouter } from 'next/navigation';

import { useSearchParams } from 'next/navigation'
import { RPC_URLS_NUMBER, TOKENS_ADDRESS } from 'common';

import { useSendTransaction, useAccount, useWriteContract } from 'wagmi';
import { useAccount as useAccountStarknet } from '@starknet-react/core';
import { constants } from 'starknet';
import AccountManagement from '../account';

interface SendUSDCFormProps {
  recipientAddress?: string;
  chain?: "KAKAROT" | "STARKNET";
  tokenAddressProps?: string;
}

const ReceiveGift: React.FC<SendUSDCFormProps> = ({ recipientAddress, chain, tokenAddressProps }) => {
  const router = useRouter();
  const toast = useToast()
  // const router = typeof window !== 'undefined' ? useRouter() : null;
  const { account: accountStarknet } = useAccountStarknet()
  const account = useAccount()

  // const { privateKey, tokenAddress, amount, network } = router.query;
  const searchParams = useSearchParams()

  const privateKey = searchParams.get('privateKey')
  const tokenAddress = searchParams.get('tokenAddress')
  const amount = searchParams.get('amount')
  const network = searchParams.get('network')
  console.log("privateKey", privateKey)
  console.log("tokenAddress", tokenAddress)
  console.log("amount", amount)
  console.log("network", network)
  const [balance, setBalance] = useState<string | null>(null);
  const [publicKeyWallet, setPublicKeyWallet] = useState<string | undefined>();
  const [balanceETH, setBalanceETH] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    const fetchBalance = async () => {
      if (!account) return;
      const chainId = account?.chainId
      if (!chainId) return;
      const { wallet, provider } = await getProvider(chainId)
      setPublicKeyWallet(wallet?.address)
      await getBalance(provider, wallet)
    }
    fetchBalance()
  }, [account])

  const getProvider = async (chainId: number) => {
    const rpcUrl = RPC_URLS_NUMBER[network ? network : chainId ?? 0];

    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    const wallet = new ethers.Wallet(privateKey as string, provider);
    return {
      rpcUrl,
      provider,
      wallet
    }
  }

  const getBalance = async (provider: JsonRpcProvider, wallet: ethers.Wallet) => {
    // Get the RPC URL based on chainId or default to Sepolia


    let balance = "0"
    try {
      const balanceEthWallet = await provider.getBalance(wallet?.address)
      console.log("balanceEthWallet", balanceEthWallet)
      balance = formatUnits(balanceEthWallet, 18)
      setBalanceETH(balance)
    } catch (error) {
      console.log("error", error)
    }
    return balance;
  }
  const claimUSDC = async () => {
    if (!privateKey) return;

    const address = accountStarknet?.address ?? account?.address

    try {
      const chainIdStrk = await accountStarknet?.getChainId()
      const chainId = await account?.chainId
      const decimals = tokenAddress == "USDC" ? 6 : 18

      if (network == "STARKNET") {

      } else {
        // const addressToken = TOKENS_ADDRESS[chainId?.toString()][tokenAddress ?? "ETH"]

        if (!account?.address) {
          toast({
            title: "Please connect wallet",
            status: "info"
          })
          return;
        }
        const addressToken = tokenAddress ?? TOKENS_ADDRESS[chainId?.toString()]["ETH"];
        console.log('addressToken', addressToken)
        const chainId = await account?.chainId

        if (!chainId) {
          toast({
            title: "ChainId not find",
            status: "warning"
          })
          return;
        }
        const { wallet, provider } = await getProvider(chainId)
        await getBalance(provider, wallet)

        if (!wallet && !provider) {
          return;
        }
        // TODO add ETH check
        if (tokenAddress == "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9") {

          if (amount) {

            // Estimate Gas Limit for the transaction (standard transfer is ~21,000)
            const gasLimit = 21000;

            // Get current Gas Price from the network
            const gasFeeData = await provider.getFeeData();
            console.log("gasFeeData", gasFeeData)

            const gasPrice = gasFeeData?.gasPrice ?? BigInt(210000);

            // Calculate the total transaction fee
            // const totalFee = gasPrice.mul(gasLimit); // Total Fee in wei

            // Format fee into Ether for readability
            const totalFeeInEther = formatEther(gasPrice * BigInt(gasLimit)*BigInt(1000));
            console.log("totalFeeInEther", totalFeeInEther)
            const amountValue = parseEther(amount) - parseEther(totalFeeInEther)
            console.log("amountValue", amountValue)

            // const totalFeeInEther = formatEther(gasPrice * gasLimit);
            const tx = await wallet.sendTransaction({
              to: account?.address,
              value: amountValue,
            })

            if (tx) {
              toast({
                title: "Fund received",
                description: `Tx hash:`
              })
              return;
            }
          }

        } else {
          const tokenContract = new ethers.Contract(addressToken, [
            "function balanceOf(address owner) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)",
          ], wallet);
          const recipientAddress = address;

          try {
            const usdcBalance = await tokenContract.balanceOf(account?.address);
            console.log('usdcBalance', usdcBalance)
            setBalance(formatUnits(usdcBalance, decimals));
            if (usdcBalance.gt(0)) {
              const tx = await tokenContract.transfer(recipientAddress, usdcBalance);
              await tx.wait();
              alert(`Successfully transferred ${balance} USDC`);
            } else {
              alert("No USDC to transfer.");
            }
          } catch (error) {

          }
        }

      }

    } catch (e) {
      console.log("claimUSDC error", e)
      setError("Failed to claim USDC. Please check the private key.");
    }
  };

  return (
    <Box p={4}>
      <Text fontSize="lg">Redeem</Text>
      <Text fontSize="lg">Token address {tokenAddress}</Text>
      {amount && <Text>Amount: {amount}</Text>}
      {error && <Text color="red.500">{error}</Text>}
      {balance && <Text>Gift token Balance: {balance} USDC</Text>}

      {balanceETH && <Text>Gift ETH Balance: {balanceETH} ETH</Text>}
      <Button onClick={claimUSDC} colorScheme="blue" mt={4}>
        Claim {amount}
      </Button>


      <Box>

        {publicKeyWallet && <Text>Public key: {publicKeyWallet}</Text>}

      </Box>

      <AccountManagement></AccountManagement>
    </Box>
  );
};

export default ReceiveGift;
