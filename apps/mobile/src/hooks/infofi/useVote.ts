import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
import {  TOKENS_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from 'common';
import { AccountInterface, byteArray, cairo, CairoCustomEnum, CallData, constants, RpcProvider, uint256 } from 'starknet';
import { feltToAddress, formatFloatToUint256 } from '../../utils/format';
import { prepareAndConnectContract } from '../keys/useDataKeys';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
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
export const useVote = () => {
  const account = useAccount();
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({ nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL });
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const handleVoteStarknetOnly = async (
    account: AccountInterface,
    voteParams: VoteParams,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract =
      contractAddress ?? NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');

    let quote_address: string =
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ??
      '';
    console.log('read nameservice asset');

    

    let approveCallData = {
      contractAddress: quote_address,
      entrypoint: 'approve',
      calldata: CallData.compile({
        address: addressContract,
        amount: uint256.bnToUint256(voteParams.amount_token),
      }),
    };
    let voteEnum = new CairoCustomEnum({ Good: {} });
    if (voteParams?.vote === "good") {
      voteParams.is_upvote = true;
      voteEnum = new CairoCustomEnum({ Good: {} });
    } else {
      voteParams.is_upvote = false;
      voteEnum = new CairoCustomEnum({ Bad: {} });
    }

    const linkedData = CallData.compile({
      nostr_address: uint256.bnToUint256(`0x${voteParams.nostr_address}`), // Recipient nostr pubkey
      vote: voteEnum,
      is_upvote: cairo.felt(voteParams.is_upvote?.toString()),
      upvote_amount: cairo.uint256(voteParams.upvote_amount),
      downvote_amount: cairo.uint256(voteParams.downvote_amount),
      amount: cairo.uint256(voteParams.amount),
      amount_token: cairo.uint256(voteParams.amount_token),
    });

    const linkedNamespace = {
      contractAddress: addressContract,
      entrypoint: 'vote_nostr_profile_starknet_only',
      calldata: linkedData
    };

    const tx = await account?.execute([approveCallData, linkedNamespace], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  const handleVoteWithEvent= async (
    account: AccountInterface,
    voteParams: VoteParams,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract =
      contractAddress ?? NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');

    const nameservice = await prepareAndConnectContract(provider, addressContract);
    let quote_address: string =
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
      TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ??
      '';
    console.log('read nameservice asset');

    try {
      quote_address = await nameservice.get_token_quote();
    } catch (error) {
      console.log('Error get amount to paid', error);
    }

    const asset = await prepareAndConnectContract(
      provider,
      quote_address ?? TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH,
      account,
    );
    console.log('convert float');
    console.log('read amountToPaid');


    const getNostrEvent = async () => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.Text;
      event.content = `link to ${cairo.felt(account?.address!)}`;
      event.tags = [];

      await event.sign();
      return event.rawEvent();
    };

    // Send the claim through the wallet
    const event = await getNostrEvent();

    let approveCallData = {
      contractAddress: quote_address,
      entrypoint: 'approve',
      calldata: CallData.compile({
        address: addressContract,
        amount: uint256.bnToUint256(voteParams.amount_token),
      }),
    };
    const signature = event.sig ?? '';
    const signatureR = signature.slice(0, signature.length / 2);
    const signatureS = signature.slice(signature.length / 2);

    let voteEnum = new CairoCustomEnum({ Good: {} });

    if (voteParams?.vote === "good") {
      voteParams.is_upvote = true;
      voteEnum = new CairoCustomEnum({ Good: {} });

    } else {
      voteParams.is_upvote = false;
      voteEnum = new CairoCustomEnum({ Bad: {} });

    }

    const linkedData = CallData.compile({
      nostr_address: uint256.bnToUint256(`0x${voteParams.nostr_address}`), // Recipient nostr pubkey
      vote: voteEnum,
      is_upvote: cairo.felt(voteParams.is_upvote?.toString()),
      upvote_amount: cairo.uint256(voteParams.upvote_amount),
      downvote_amount: cairo.uint256(voteParams.downvote_amount),
      amount: cairo.uint256(voteParams.amount),
      amount_token: cairo.uint256(voteParams.amount_token),
    });

    const linkedNamespace = {
      contractAddress: addressContract,
      entrypoint: 'vote_nostr_profile_starknet_only',
      calldata: linkedData
    };

    const tx = await account?.execute([approveCallData, linkedNamespace], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  return {
    handleVoteStarknetOnly,
  };
};
