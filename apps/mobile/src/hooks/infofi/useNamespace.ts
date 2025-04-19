import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
import { KEYS_ADDRESS, NAMESERVICE_ADDRESS, TOKENS_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from 'common';
import { AccountInterface, byteArray, cairo, CallData, constants, RpcProvider, uint256 } from 'starknet';
import { TokenQuoteBuyKeys } from '../../types/keys';
import { feltToAddress, formatFloatToUint256 } from '../../utils/format';
import { prepareAndConnectContract } from '../keys/useDataKeys';
import { useQuery } from '@tanstack/react-query';
import { ApiIndexerInstance } from '../../services/api';
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

// Original useNameservice hook for contract interactions
export const useNamespace = () => {
  const account = useAccount();
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({ nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL });
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const handleLinkNamespace = async (
    account: AccountInterface,
    username: string,
    nostrEvent: NDKEvent,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract =
      contractAddress ?? NAMESERVICE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
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

    const signature = event.sig ?? '';
    const signatureR = signature.slice(0, signature.length / 2);
    const signatureS = signature.slice(signature.length / 2);

    const linkedData = CallData.compile([
      uint256.bnToUint256(`0x${event.pubkey}`),
      event.created_at,
      event.kind ?? 1,
      byteArray.byteArrayFromString(JSON.stringify(event.tags)),
      {
        starknet_address: cairo.felt(account?.address!),
      },
      {
        r: uint256.bnToUint256(`0x${signatureR}`),
        s: uint256.bnToUint256(`0x${signatureS}`),
      },
      uint256.bnToUint256(0),
    ]);

    const linkedNamespace = {
      contractAddress: addressContract,
      entrypoint: 'linked_nostr_profile',
      calldata: linkedData
    };

    const tx = await account?.execute([linkedNamespace], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  const handleLinkNamespaceFromNostrScore= async (
    account: AccountInterface,
    nostrEvent: NDKEvent,
    contractAddress?: string,
  ) => {
    if (!account) return;

    const addressContract =
      contractAddress ?? NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    console.log('addressContract', addressContract);
    console.log('read asset');


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

    const signature = event.sig ?? '';
    const signatureR = signature.slice(0, signature.length / 2);
    const signatureS = signature.slice(signature.length / 2);

    const linkedData = CallData.compile([
      uint256.bnToUint256(`0x${event.pubkey}`),
      event.created_at,
      event.kind ?? 1,
      byteArray.byteArrayFromString(JSON.stringify(event.tags)),
      {
        starknet_address: cairo.felt(account?.address!),
      },
      {
        r: uint256.bnToUint256(`0x${signatureR}`),
        s: uint256.bnToUint256(`0x${signatureS}`),
      },
      uint256.bnToUint256(0),
    ]);

    const linkedNamespace = {
      contractAddress: addressContract,
      entrypoint: 'linked_nostr_profile',
      calldata: linkedData
    };

    const tx = await account?.execute([linkedNamespace], undefined, {});
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  return {
    handleLinkNamespace,
    handleLinkNamespaceFromNostrScore,
  };
};
