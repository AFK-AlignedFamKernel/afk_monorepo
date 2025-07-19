import { useAccount, useProvider } from '@starknet-react/core';
import { AccountInterface, CairoCustomEnum, CallData, constants, RpcProvider, uint256 } from 'starknet';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { TOKENS_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from 'common';


// const TOKENS_ADDRESS = {
//   [constants.StarknetChainId.SN_SEPOLIA]: {
//     STRK: '0x1234567890abcdef', // Replace with actual STRK address
//     ETH: '0xabcdef1234567890', // Replace with actual ETH address
//   },
//   [constants.StarknetChainId.SN_MAINNET]: {
//     STRK: '0x1234567890abcdef', // Replace with actual STRK address
//     ETH: '0xabcdef1234567890', // Replace with actual ETH address
//   },
// };

// Types
export interface VoteParams {
  nostr_address?: string;
  vote: string;
  is_upvote: boolean;
  upvote_amount: string;
  downvote_amount: string;
  amount: string;
  amount_token: string;
}

// Helper function to prepare contract
const prepareAndConnectContract = async (
  provider: RpcProvider,
  contractAddress: string,
  account?: AccountInterface
) => {
  // This is a placeholder - implement actual contract preparation
  // You'll need to import your contract ABI and create the contract instance
  console.log('Preparing contract:', contractAddress);
  return null;
};

// Helper function to format float to uint256
const formatFloatToUint256 = (value: number) => {
  // This is a placeholder - implement actual formatting
  return { low: value.toString(), high: '0' };
};

export const useDepositRewards = () => {
  const { account } = useAccount();
  const { provider } = useProvider();
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  const rpcProvider = new RpcProvider({
    nodeUrl: process.env.NEXT_PUBLIC_PROVIDER_URL || 'https://starknet-sepolia.public.blastapi.io'
  });

  // Mutation for depositing rewards
  const depositRewardsMutation = useMutation({
    mutationFn: async ({ voteParams, contractAddress }: {
      voteParams: VoteParams;
      contractAddress?: string;
    }) => {
      console.log('voteParams', voteParams);
      if (!account?.address) {
        throw new Error('No account connected');
      }

      try {
        const addressContract = contractAddress ??
          NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

        console.log('Contract address:', addressContract);

        // Get quote token address (STRK or ETH)
        let quoteAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
          TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ?? '';

        if (!quoteAddress) {
          throw new Error('No quote token address found');
        }

        console.log('Quote token address:', quoteAddress);

        // Format amounts
        const amountToken = formatFloatToUint256(Number(voteParams.amount_token));

        // Prepare approve call data
        const approveCallData = {
          contractAddress: quoteAddress,
          entrypoint: 'approve',
          calldata: CallData.compile({
            address: addressContract,
            amount: amountToken,
          }),
        };

        let depositRewardsType = new CairoCustomEnum({ General: {} });

        // Prepare deposit rewards call data
        const depositRewardsCallData = CallData.compile({
          amount: amountToken,
          deposit_rewards_type: depositRewardsType, // CairoCustomEnum equivalent
        });

        const depositRewards = {
          contractAddress: addressContract,
          entrypoint: 'deposit_rewards',
          calldata: depositRewardsCallData,
        };

        // Execute transaction
        // This is a placeholder - implement actual transaction execution
        const tx = await account.execute([
          approveCallData,
          depositRewards
        ]);

        // For now, return a mock result
        // const mockTx = {
        //   transaction_hash: 'mock_transaction_hash_' + Date.now(),
        //   success: true,
        // };

        console.log('Transaction hash:', tx);
        return tx;

      } catch (error) {
        console.error('Error depositing rewards:', error);
        throw error;
      }
      finally {
        // setIsDepositing(false);
      }
    },
    onSuccess: (data) => {
      showToast({
        message: 'Success',
        description: `Rewards deposited successfully! Hash: ${data.transaction_hash}`,
        type: 'success',
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['infofi'] });
    },
    onError: (error) => {
      showToast({
        message: 'Error',
        description: error.message || 'Failed to deposit rewards',
        type: 'error',
      });
    },
  });

  const handleDepositRewards = async (voteParams: VoteParams, contractAddress?: string) => {
    return depositRewardsMutation.mutateAsync({ voteParams, contractAddress });
  };

  return {
    handleDepositRewards,
    isDepositing: depositRewardsMutation.isPending,
  };
}; 