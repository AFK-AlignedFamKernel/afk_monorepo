import { useAccount, useProvider } from '@starknet-react/core';
import { AccountInterface, CairoCustomEnum, CallData, constants, cairo, RpcProvider, uint256 } from 'starknet';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { TOKENS_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from 'common';

// Types
export interface VoteParams {
  nostr_address?: string;
  vote: string;
  is_upvote?: boolean;
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

export const useVoteTip = () => {
  const { account } = useAccount();
  const { provider } = useProvider();
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  const rpcProvider = new RpcProvider({
    nodeUrl: process.env.NEXT_PUBLIC_PROVIDER_URL || 'https://starknet-sepolia.public.blastapi.io'
  });

  // Mutation for voting and tipping
  const voteTipMutation = useMutation({
    mutationFn: async ({ voteParams, contractAddress }: {
      voteParams: VoteParams;
      contractAddress?: string;
    }) => {
      // if (!account?.address) {
      //   throw new Error('No account connected');
      // }

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
        const amount = formatFloatToUint256(Number(voteParams.amount));
        const upvoteAmount = formatFloatToUint256(Number(voteParams.upvote_amount));
        const downvoteAmount = formatFloatToUint256(Number(voteParams.downvote_amount));

        // Prepare approve call data
        const approveCallData = {
          contractAddress: quoteAddress,
          entrypoint: 'approve',
          calldata: CallData.compile({
            address: addressContract,
            amount: amountToken,
          }),
        };

        // Prepare vote call data
        const voteEnum = voteParams.vote === 'good' ? { Good: {} } : { Bad: {} };

        const voteCallData = CallData.compile({
          nostr_address: voteParams.nostr_address || '',
          vote: voteEnum,
          upvote_amount: upvoteAmount,
          downvote_amount: downvoteAmount,
          amount: amount,
          amount_token: amountToken,
        });

        console.log("voteCallData", voteCallData);

        const vote = {
          contractAddress: addressContract,
          entrypoint: 'vote_nostr_profile_starknet_only',
          calldata: voteCallData,
        };

        // Execute transaction
        // This is a placeholder - implement actual transaction execution
        const tx = await account?.execute([approveCallData,
          vote

        ]);

        // // For now, return a mock result
        // const mockTx = {
        //   transaction_hash: 'mock_vote_transaction_hash_' + Date.now(),
        //   success: true,
        // };

        console.log('Vote transaction hash:', tx?.transaction_hash);
        return tx;

      } catch (error) {
        console.error('Error voting/tipping:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      showToast({
        message: 'Success',
        description: `Vote and tip submitted successfully! Hash: ${data?.transaction_hash}`,
        type: 'success',
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['infofi'] });
    },
    onError: (error) => {
      showToast({
        message: 'Error',
        description: error.message || 'Failed to submit vote and tip',
        type: 'error',
      });
    },
  });

  // Mutation for StarkNet only voting (without Nostr integration)
  const voteStarknetOnlyMutation = useMutation({
    mutationFn: async ({ voteParams, contractAddress }: {
      voteParams: VoteParams;
      contractAddress?: string;
    }) => {

      try {

        console.log("account", account);
        if (!account?.address) {
          throw new Error('No account connected');
        }

        console.log("contractAddress", contractAddress);
        const addressContract = contractAddress ??
          NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

        console.log('StarkNet only contract address:', addressContract);

        console.log("voteParams", voteParams);
        // Get quote token address (STRK or ETH)
        let quoteAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
          TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ?? '';

        if (!quoteAddress) {
          throw new Error('No quote token address found');
        }

        // Format amounts
        const amountToken = formatFloatToUint256(Number(voteParams.amount_token));
        const amount = formatFloatToUint256(Number(voteParams.amount_token));
        const upvoteAmount = formatFloatToUint256(Number(voteParams.upvote_amount));
        const downvoteAmount = formatFloatToUint256(Number(voteParams.downvote_amount));

        // Prepare approve call data
        const approveCallData = {
          contractAddress: quoteAddress,
          entrypoint: 'approve',
          calldata: CallData.compile({
            address: addressContract,
            amount: amountToken,
          }),
        };

        console.log("approveCallData", approveCallData);
        // Prepare StarkNet only vote call data
        const voteEnum = voteParams.vote === 'good' ? new CairoCustomEnum({ Good: {} }) : new CairoCustomEnum({ Bad: {} });

        console.log("voteEnum", voteEnum);
        // Convert nostr_address to felt format properly
        const nostrAddressFelt = voteParams.nostr_address ? 
          cairo.felt(voteParams.nostr_address) : 
          cairo.felt('0');

        const voteCallData = CallData.compile({
          nostr_address: nostrAddressFelt,
          vote: voteEnum,
          upvote_amount: upvoteAmount,
          downvote_amount: downvoteAmount,
          amount: amountToken,
          amount_token: amountToken,
        });

        const calldataVote = CallData.compile([
          nostrAddressFelt,
          voteEnum,
          upvoteAmount,
          downvoteAmount,
          amountToken,
          amountToken]);

        const vote = {
          contractAddress: addressContract,
          entrypoint: 'vote_nostr_profile_starknet_only',
          calldata: calldataVote,
        };

        // Execute transaction
        // This is a placeholder - implement actual transaction execution
        const tx = await account.execute([
          approveCallData,
          // vote


        ]);

        // For now, return a mock result
        // const mockTx = {
        //   transaction_hash: 'mock_starknet_vote_transaction_hash_' + Date.now(),
        //   success: true,
        // };

        console.log('StarkNet only vote transaction hash:', tx?.transaction_hash);
        return tx;

      } catch (error) {
        console.error('Error StarkNet only voting:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      showToast({
        message: 'Success',
        description: `StarkNet vote submitted successfully! Hash: ${data.transaction_hash}`,
        type: 'success',
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['infofi'] });
    },
    onError: (error) => {
      showToast({
        message: 'Error',
        description: error.message || 'Failed to submit StarkNet vote',
        type: 'error',
      });
    },
  });

  const handleVoteTip = async (voteParams: VoteParams, contractAddress?: string) => {
    return voteTipMutation.mutateAsync({ voteParams, contractAddress });
  };

  const handleVoteStarknetOnly = async (voteParams: VoteParams, contractAddress?: string) => {
    return voteStarknetOnlyMutation.mutateAsync({ voteParams, contractAddress });
  };

  return {
    handleVoteTip,
    handleVoteStarknetOnly,
    isVoting: voteTipMutation.isPending,
    isVotingStarknetOnly: voteStarknetOnlyMutation.isPending,
  };
}; 