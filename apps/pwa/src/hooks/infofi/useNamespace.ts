import { useAccount, useProvider } from '@starknet-react/core';
import { AccountInterface, Call, CallData, cairo, constants, Contract, RpcProvider } from 'starknet';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';

import { NAMESPACE_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from 'common'
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ABI_NAMESPACE } from 'common/src/abi/namespace.abi';
// Contract addresses - replace with your actual addresses


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

export const useNamespace = () => {
  const { account } = useAccount();
  const { provider } = useProvider();
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  const rpcProvider = new RpcProvider({
    nodeUrl: process.env.NEXT_PUBLIC_PROVIDER_URL || 'https://starknet-sepolia.public.blastapi.io'
  });

  // Mutation for linking namespace
  const linkNamespaceMutation = useMutation({
    mutationFn: async () => {
      if (!account?.address) {
        throw new Error('No account connected');
      }

      try {
        const addressContract = NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
        // const contract = await prepareAndConnectContract(rpcProvider, addressContract, account);

        // if (!contract) {
        //   throw new Error('Failed to prepare contract');
        // }

        let timestamp = 1716285235;
        // let starknetAddressFelt = account.address;
        const starknetAddressFelt = cairo.felt(account.address);

        // Create Nostr event for linking
        // const event = {
        //   content: `link ${account.address}`,
        //   tags: [],
        //   // Add other event properties as needed
        // };

        const event = new NDKEvent(ndk);
        event.content = `link ${starknetAddressFelt}`;
        event.tags = [];
        event.created_at = timestamp;
        event.kind = 1;
        await event.sign();
        const signature = event.sig ?? '';

        console.log("event", event);

        let signatureR = "0x" + signature.slice(0, signature.length / 2);
        let signatureS = "0x" + signature.slice(signature.length / 2);


        const requestArgs = {
          public_key: `0x${event?.pubkey}`,
          created_at: timestamp,
          kind: 1,
          tags: "[]",
          content: {
            starknet_address: starknetAddressFelt,
            // starknet_address: account.address,
          },
          sig: {
            r: signatureR,
            s: signatureS,
          }
        }

        const contract: Contract = new Contract(ABI_NAMESPACE, addressContract, provider)
        // const call: Call = contract.populate('linked_nostr_profile', {
        //   request: requestArgs
        // })

        // const call: Call = contract.populate('linked_nostr_default_account', {
        //   request: requestArgs
        // })
        // const tx = await account.execute(call);

        const calldata = CallData.compile([
          requestArgs
        ]
        )
        const linkedNostrProfile = {
          contractAddress: addressContract,
          entrypoint: 'linked_nostr_profile',
          calldata: calldata,
        };
        const tx = await account.execute([linkedNostrProfile]);

        await account.waitForTransaction(tx.transaction_hash);
        console.log("Transaction Hash:", tx.transaction_hash)
        return tx;

        // Call contract method to link namespace
        // const result = await contract.link_namespace(event);

        // For now, return a mock result
        // return { success: true, transactionHash: 'mock_hash' };
      } catch (error) {
        console.error('Error linking namespace:', error);
        throw error;
      }
    },
    onSuccess: () => {
      showToast({
        message: 'Success',
        description: 'Namespace linked successfully',
        type: 'success',
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['infofi'] });
    },
    onError: (error) => {
      showToast({
        message: 'Error',
        description: error.message || 'Failed to link namespace',
        type: 'error',
      });
    },
  });

  // Mutation for linking namespace from Nostr score
  const linkNamespaceFromNostrScoreMutation = useMutation({
    mutationFn: async (nostrAddress: string) => {
      if (!account?.address) {
        throw new Error('No account connected');
      }

      try {
        const addressContract = NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
        const contract = await prepareAndConnectContract(rpcProvider, addressContract, account);

        if (!contract) {
          throw new Error('Failed to prepare contract');
        }

        // Call contract method to link from Nostr score
        // const result = await contract.link_from_nostr_score(nostrAddress);

        // For now, return a mock result
        return { success: true, transactionHash: 'mock_hash' };
      } catch (error) {
        console.error('Error linking from Nostr score:', error);
        throw error;
      }
    },
    onSuccess: () => {
      showToast({
        message: 'Success',
        description: 'Linked from Nostr score successfully',
        type: 'success',
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['infofi'] });
    },
    onError: (error) => {
      showToast({
        message: 'Error',
        description: error.message || 'Failed to link from Nostr score',
        type: 'error',
      });
    },
  });

  const handleLinkNamespace = async () => {
    return linkNamespaceMutation.mutateAsync();
  };

  const handleLinkNamespaceFromNostrScore = async (nostrAddress: string) => {
    return linkNamespaceFromNostrScoreMutation.mutateAsync(nostrAddress);
  };

  return {
    handleLinkNamespace,
    handleLinkNamespaceFromNostrScore,
    isLinkingNamespace: linkNamespaceMutation.isPending,
    isLinkingFromNostrScore: linkNamespaceFromNostrScoreMutation.isPending,
  };
}; 