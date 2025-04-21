import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
import { KEYS_ADDRESS, NAMESERVICE_ADDRESS, TOKENS_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from 'common';
import { AccountInterface, byteArray, cairo, CairoCustomEnum, CallData, constants, RpcProvider, uint256 } from 'starknet';
import { TokenQuoteBuyKeys } from '../../types/keys';
import { feltToAddress, formatFloatToUint256 } from '../../utils/format';
import { prepareAndConnectContract } from '../keys/useDataKeys';
import { useQuery } from '@tanstack/react-query';
import { ApiIndexerInstance } from '../../services/api';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
import { useWaitConnection } from '..';
import { useWalletModal } from '../modals/useWalletModal';
import { useTransaction } from '../modals';
export const NAMESERVICE_ENDPOINTS = {
  claimed: '/username-claimed',
  byUsername: (username: string) => `/username-claimed/username/${username}`,
  byUser: (address: string) => `/username-claimed/user/${address}`,
} as const;

export interface NameserviceData {
  owner_address: string;
  username: string;
  time_stamp: string;
  paid: string;
  quote_address: string;
  expiry: string;
}

export interface VoteParams {
  nostr_address: string;
  vote: "good" | "bad";
  is_upvote: boolean;
  upvote_amount: number;
  downvote_amount: number;
  amount: number;
  amount_token: number;
}

// Original useNameservice hook for contract interactions
export const useDepositRewards = () => {
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({ nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL });
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const walletModal = useWalletModal();
  const waitConnection = useWaitConnection();
  const { sendTransaction } = useTransaction({});

  const account = useAccount();
  const handleDepositRewards = async (
    voteParams: VoteParams,
    contractAddress?: string,
  ) => {
    if (!account?.address) {
      walletModal.show();
    }

    const connectedAccount = await waitConnection();
    if (!connectedAccount || !connectedAccount.address) return;


    const addressContract =
      contractAddress ?? NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');

    // const nameservice = await prepareAndConnectContract(provider, addressContract);
    let quote_address: string =
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ??
      '';
    console.log('read nameservice asset');

    // try {
    //   quote_address = await nameservice.get_token_quote();
    // } catch (error) {
    //   console.log('Error get amount to paid', error);
    // }


    // const getNostrEvent = async () => {
    //   const event = new NDKEvent(ndk);
    //   event.kind = NDKKind.Text;
    //   event.content = `link to ${cairo.felt(account?.address!)}`;
    //   event.tags = [];

    //   await event.sign();
    //   return event.rawEvent();
    // };

    // // Send the claim through the wallet
    // const event = await getNostrEvent();

    // const signature = event.sig ?? '';
    // const signatureR = signature.slice(0, signature.length / 2);
    // const signatureS = signature.slice(signature.length / 2);

    let depositRewardsType = new CairoCustomEnum({ General: {} });
    const amountToken = formatFloatToUint256(voteParams.amount_token);


    let approveCallData = {
      contractAddress: quote_address,
      entrypoint: 'approve',
      calldata: CallData.compile({
        address: addressContract,
        amount: amountToken,
      }),
    };

    const depositRewardsCallData = CallData.compile({
    //  amount: uint256.bnToUint256(voteParams.amount_token),
     amount: amountToken,
     deposit_rewards_type: depositRewardsType
    });

    const depositRewards = {
      contractAddress: addressContract,
      entrypoint: 'deposit_rewards',
      calldata: depositRewardsCallData
    };


    let tx = await sendTransaction([approveCallData, depositRewards]);
    console.log('tx hash', tx.transaction_hash);
    return tx;
    // const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    // return wait_tx;
    // const tx = await account?.execute([approveCallData, depositRewards], undefined, {});
    // console.log('tx hash', tx.transaction_hash);
    // const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    // return wait_tx;

  };

  return {
    handleDepositRewards,
  };
};
