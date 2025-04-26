import { useAccount, useNetwork, useProvider } from '@starknet-react/core';
import { KEYS_ADDRESS, NAMESERVICE_ADDRESS, TOKENS_ADDRESS, NOSTR_FI_SCORING_ADDRESS, NAMESPACE_ADDRESS } from 'common';
import { AccountInterface, byteArray, cairo, CallData, constants, RpcProvider, uint256 } from 'starknet';
import { TokenQuoteBuyKeys } from '../../types/keys';
import { feltToAddress, formatFloatToUint256 } from '../../utils/format';
import { prepareAndConnectContract } from '../keys/useDataKeys';
import { useQuery } from '@tanstack/react-query';
import { ApiIndexerInstance } from '../../services/api';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
import { useTransaction, useWalletModal } from '../modals';
import { useWaitConnection } from '../useWaitConnection';
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
  const chain = useNetwork();
  const rpcProvider = useProvider();
  const chainId = chain?.chain?.id;
  const provider = new RpcProvider({ nodeUrl: process.env.EXPO_PUBLIC_PROVIDER_URL });
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  const { sendTransaction } = useTransaction({});
  const account = useAccount();
  const walletModal = useWalletModal();
  const waitConnection = useWaitConnection();

  const handleLinkNamespace = async (contractAddress?: string) => {
    try {
      if (!account.address) {
        walletModal.show();
      }

      const connectedAccount = await waitConnection();
      if (!connectedAccount || !connectedAccount.address) return;

      const addressContract =
        contractAddress ?? NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

      // Create the content object matching LinkedStarknetAddress structure
      const content = {
        starknet_address: connectedAccount.address
      };

      const event = new NDKEvent(ndk);
      event.kind = NDKKind.Text;
      // Use stringified content object instead of string
      event.content = JSON.stringify(content);
      event.tags = [];
      await event.sign();
      const rawEvent = event.rawEvent();

      const signature = rawEvent.sig ?? '';
      const signatureR = signature.slice(0, signature.length / 2);
      const signatureS = signature.slice(signature.length / 2);

      // Match the exact structure from the working test
      const linkedArrayCalldata = CallData.compile([
        uint256.bnToUint256(`0x${rawEvent.pubkey}`),
        rawEvent.created_at,
        rawEvent.kind ?? 1,
        byteArray.byteArrayFromString(JSON.stringify(rawEvent.tags)),
        {
          starknet_address: connectedAccount.address
        },
        {
          r: uint256.bnToUint256(`0x${signatureR}`),
          s: uint256.bnToUint256(`0x${signatureS}`),
        }
      ]);

      const receipt = await sendTransaction([
        {
          contractAddress: addressContract,
          entrypoint: 'linked_nostr_profile',
          calldata: linkedArrayCalldata,
        },
      ]);

      return { receipt };
    } catch (error) {
      console.log('error handleLinkNamespace', error);
      return null;
    }
  };
  // const handleLinkNamespace = async (
  //   // account: AccountInterface,
  //   // username: string,
  //   // nostrEvent: NDKEvent,
  //   contractAddress?: string,
  // ) => {
  //   try {
  //     if (!account.address) {
  //       walletModal.show();
  //     }

  //     const connectedAccount = await waitConnection();
  //     if (!connectedAccount || !connectedAccount.address) return;

  //     const addressContract =
  //       contractAddress ?? NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
  //     console.log('addressContract', addressContract);

  //     // // const nameservice = await prepareAndConnectContract(provider, addressContract);
  //     // let quote_address: string =
  //     //   TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
  //     //   TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ??
  //     //   '';

  //     const getNostrEvent = async () => {
  //       const event = new NDKEvent(ndk);
  //       event.kind = NDKKind.Text;
  //       // event.content = `link to ${cairo.felt(account?.address)}`;
  //       event.content = `link ${cairo.felt(connectedAccount.address!)}`;
  //       // event.content = `link to ${connectedAccount.address!}`;
  //       event.tags = [];

  //       await event.sign();
  //       return event.rawEvent();
  //     };

  //     // Send the claim through the wallet
  //     const event = await getNostrEvent();

  //     console.log('event nostr for link namespace', event);
  //     const signature = event.sig ?? '';
  //     const signatureR = signature.slice(0, signature.length / 2);
  //     const signatureS = signature.slice(signature.length / 2);


  //     console.log("event.pubkey", event.pubkey);
  //     console.log("publicKey", publicKey);
  //     console.log("event.created_at", event.created_at);
  //     console.log("event.kind", event.kind);
  //     console.log("event.tags", event.tags);

  //     const linkedArrayCalldata = CallData.compile([
  //       uint256.bnToUint256(`0x${event.pubkey}`),
  //       event.created_at,
  //       event.kind ?? 1,
  //       byteArray.byteArrayFromString(JSON.stringify(event.tags)),
  //       {
  //         // starknet_address: cairo.felt(account?.address!),
  //         starknet_address: connectedAccount.address,
  //       },
  //       {
  //         r: uint256.bnToUint256(`0x${signatureR}`),
  //         s: uint256.bnToUint256(`0x${signatureS}`),
  //       },
  //     ]);


  //     // const linkedData = CallData.compile({
  //     //   pubkey: uint256.bnToUint256(`0x${event.pubkey}`),
  //     //   created_at: event.created_at,
  //     //   kind: event.kind ?? 1,
  //     //   tags: byteArray.byteArrayFromString(JSON.stringify(event.tags)),
  //     //   content: {
  //     //     starknet_address: account?.address!,
  //     //   },
  //     //   r: uint256.bnToUint256(`0x${signatureR}`),
  //     //   s: uint256.bnToUint256(`0x${signatureS}`),
  //     // });

  //     console.log("publicKey",publicKey);
  //     console.log("event?.pubkey",event?.pubkey);
  //     console.log("account address", connectedAccount?.address);
  //     // const linkedArrayCalldata = {
  //     //   public_key: uint256.bnToUint256(`0x${event.pubkey}`),
  //     //   created_at: event.created_at,
  //     //   kind: event.kind ?? 1,
  //     //   tags: byteArray.byteArrayFromString(JSON.stringify(event.tags)),
  //     //   content: {
  //     //     // starknet_address: cairo.felt(account?.address!),
  //     //     starknet_address: connectedAccount.address,
  //     //   },
  //     //   sig: {
  //     //     r: uint256.bnToUint256(`0x${signatureR}`),
  //     //     s: uint256.bnToUint256(`0x${signatureS}`),
  //     //   },
  //     // };

  //     // const linkedArrayCalldata = CallData.compile([
  //     //   uint256.bnToUint256(`0x${event.pubkey}`),
  //     //   event.created_at,
  //     //   event.kind ?? 1,
  //     //   byteArray.byteArrayFromString(JSON.stringify(event.tags)),
  //     //   {
  //     //     starknet_address: connectedAccount.address,
  //     //     // starknet_address: cairo.felt(account?.address!),

  //     //   },
  //     //   {
  //     //     r: uint256.bnToUint256(`0x${signatureR}`),
  //     //     s: uint256.bnToUint256(`0x${signatureS}`),
  //     //   },
  //     // ]);

  //     // const linkedArrayCalldata = CallData.compile({
  //     //   pubkey: uint256.bnToUint256(`0x${event.pubkey}`), 
  //     //   created_at: event.created_at,
  //     //   kind: event.kind ?? 1,
  //     //   tags: byteArray.byteArrayFromString(JSON.stringify(event.tags)),
  //     //   content: {
  //     //     starknet_address: connectedAccount.address,
  //     //     // starknet_address: cairo.felt(account?.address!),

  //     //   },
  //     //   sig: {
  //     //     r: uint256.bnToUint256(`0x${signatureR}`),
  //     //     s: uint256.bnToUint256(`0x${signatureS}`),
  //     //   },
  //     // });
  //     // ]);
  //     console.log("linkedArrayCalldata", linkedArrayCalldata);


  //     const linkedNamespace = {
  //       contractAddress: addressContract,
  //       entrypoint: 'linked_nostr_profile',
  //       // calldata: CallData.compile([linkedData])
  //       // calldata: CallData.compile(linkedData)
  //       // calldata: linkedArrayCalldata,
  //       calldata: CallData.compile(linkedArrayCalldata),

  //     };
  //     // console.log('tx hash', tx.transaction_hash);
  //     // const tx = await account?.execute([linkedNamespace], undefined, {});
  //     // console.log('tx', tx);
  //     // const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
  //     // return wait_tx;
  //     // const tx = await account?.execute([linkedNamespace], undefined, {});
  //     const receipt = await sendTransaction([
  //       {
  //         contractAddress: addressContract,
  //         entrypoint: 'linked_nostr_profile',
  //         // calldata: linkedArrayCalldata,
  //         calldata: linkedArrayCalldata,
  //         // calldata: CallData.compile(linkedArrayCalldata),
  //         // calldata: CallData.compile([linkedArrayCalldata]),

  //       },
  //     ]);
  //     // console.log('receipt', receipt);

  //     return {
  //       receipt: receipt,
  //       // tx: tx,
  //     };

  //   } catch (error) {
  //     console.log('error handleLinkNamespace', error);
  //     return null;
  //   }
  // };

  const handleLinkNamespaceFromNostrScore = async (
    account: AccountInterface,
    // nostrEvent: NDKEvent,
    contractAddress?: string,
  ) => {

    try {
      if (!account) return;

      const addressContract =
        contractAddress ?? NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
      console.log('addressContract', addressContract);
      console.log('read asset');

      const address = account?.address;
      console.log('account address', address);


      const getNostrEvent = async () => {
        const event = new NDKEvent(ndk);
        // event.created_at = Date.now();
        event.kind = NDKKind.Text;
        event.content = `link to ${cairo.felt(account?.address)}`;
        // event.content = `link to ${address}`;

        event.tags = [];

        await event.sign();
        return event.rawEvent();
      };

      // Send the claim through the wallet
      const event = await getNostrEvent();

      console.log('event nostr for link namespace', event);

      const signature = event.sig ?? '';
      const signatureR = signature.slice(0, signature.length / 2);
      const signatureS = signature.slice(signature.length / 2);

      // const linkedDataCalldata = CallData.compile([
      //   uint256.bnToUint256(`0x${event.pubkey}`),
      //   event.created_at,
      //   event.kind ?? 1,
      //   byteArray.byteArrayFromString(JSON.stringify(event.tags)),
      //   {
      //     // starknet_address: cairo.felt(account?.address!),
      //     starknet_address: account?.address!,
      //   },
      //   {
      //     r: uint256.bnToUint256(`0x${signatureR}`),
      //     s: uint256.bnToUint256(`0x${signatureS}`),
      //   },
      // ]);

      const linkedData = {
        public_key: uint256.bnToUint256(`0x${event.pubkey}`),
        created_at: event.created_at,
        kind: event.kind ?? 1,
        tags: byteArray.byteArrayFromString(JSON.stringify(event.tags)),
        content: {
          starknet_address: cairo.felt(account?.address!),
        },
        sig: {
          r: uint256.bnToUint256(`0x${signatureR}`),
          s: uint256.bnToUint256(`0x${signatureS}`),
        },
      };

      console.log("event pubkey uint256", uint256.bnToUint256(`0x${event.pubkey}`));
      console.log("event created_at", event.created_at);
      console.log("event kind", event.kind);
      console.log("event tags", byteArray.byteArrayFromString(JSON.stringify(event.tags)));
      console.log("event content", event.content);
      console.log("event sig", {
        r: uint256.bnToUint256(`0x${signatureR}`),
        s: uint256.bnToUint256(`0x${signatureS}`),
      });
      console.log("event sig r", uint256.bnToUint256(`0x${signatureR}`));
      console.log("event sig s", uint256.bnToUint256(`0x${signatureS}`));
      console.log("event pubkey", event.pubkey);

      const claimCalldata = CallData.compile([
        uint256.bnToUint256(`0x${event.pubkey}`),
        event.created_at,
        event.kind ?? 1,
        byteArray.byteArrayFromString(JSON.stringify(event.tags)),
        {
          starknet_address: address,
        },
        {
          r: uint256.bnToUint256(`0x${signatureR}`),
          s: uint256.bnToUint256(`0x${signatureS}`),
        },
      ]);

      console.log('claimCalldata', claimCalldata);
      // 84649885359376033758417120942655271210
      // 192064483361766736515151843213653945187
      // 1745070416909
      // 1
      // 0
      // 23389
      // 2
      // 1201582117220250281093610950915479340547227715138863347526632
      // 183964894709336
      // 301798465916164124303394151758432530976
      // 236469222878665826327034169558597076966
      // 167225676748096022493795914005872458661
      // 26471472853229000730834354560148771254
      // const linkedNamespace = {
      //   contractAddress: addressContract,
      //   entrypoint: 'linked_nostr_profile',
      //   calldata: linkedData
      // };

      const receipt = await sendTransaction([
        {
          contractAddress: addressContract,
          entrypoint: 'linked_nostr_profile',
          // calldata: CallData.compile([linkedData]),
          calldata: claimCalldata,
        },
      ]);
      console.log('receipt', receipt);

      return receipt?.transaction_hash;


      // const tx = await account?.execute([linkedNamespace], undefined, {});
      // console.log('tx hash', tx.transaction_hash);
      // const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
      // return wait_tx;
    } catch (error) {
      console.log('error handleLinkNamespaceFromNostrScore', error);
      return null;
    }
  };

  return {
    handleLinkNamespace,
    handleLinkNamespaceFromNostrScore,
  };
};
