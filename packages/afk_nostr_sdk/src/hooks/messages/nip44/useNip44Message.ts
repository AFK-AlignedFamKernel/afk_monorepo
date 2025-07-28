import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth, useSettingsStore } from '../../../store';
import { v2 } from '../../../utils/nip44';
import { checkIsConnected } from '../../connect';

export const useNip44Message = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();
  const { relays } = useSettingsStore();

  return useMutation({
    mutationKey: ['sendNip44Message', ndk],
    mutationFn: async (data: {
      content: string;
      receiverPublicKey: string;
      relayUrl?: string;
      subject?: string;
      tags?: string[][];
    }) => {
      const { relayUrl, receiverPublicKey, content, subject } = data;

      await checkIsConnected(ndk);
      console.log('NIP-44: Sending message', {
        contentLength: content.length,
        receiverPublicKey,
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey
      });

      if (!privateKey || !publicKey) {
        throw new Error('Private key and public key are required for NIP-44 encryption');
      }

      if (!receiverPublicKey) {
        throw new Error('Receiver public key is required');
      }

      // Encrypt content using NIP-44
      const encryptedContent = v2.encryptNip44(content, privateKey, receiverPublicKey);

      // Create and send event
      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = NDKKind.EncryptedDirectMessage;
      eventDirectMessage.created_at = Math.floor(Date.now() / 1000);
      eventDirectMessage.content = encryptedContent;
      eventDirectMessage.tags = [
        ["p", receiverPublicKey, relayUrl || ""],
        ...(subject ? [["subject", subject]] : []),
      ];

      // Sign the event
      await eventDirectMessage.sign();

      console.log('NIP-44: Publishing event:', {
        id: eventDirectMessage.id,
        pubkey: eventDirectMessage.pubkey,
        kind: eventDirectMessage.kind,
        contentLength: encryptedContent.length,
        tags: eventDirectMessage.tags,
      });

      // Publish with better error handling
      try {
        const publishResult = await eventDirectMessage.publish();
        console.log('NIP-44: Message published successfully:', publishResult);
        return eventDirectMessage;
      } catch (error) {
        console.error('Failed to publish NIP-44 message:', error);
        
        // Try to get more details about the failure
        const connectedRelays = ndk.pool.connectedRelays();
        console.log('Connected relays:', connectedRelays.map(r => r.url));
        
        throw new Error(`Failed to publish NIP-44 message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });
};

// Hook for decrypting NIP-44 messages
export const useNip44Decrypt = () => {
  const { privateKey, publicKey } = useAuth();

  const decryptMessage = async (encryptedContent: string, senderPublicKey: string): Promise<string> => {
    if (!privateKey || !publicKey) {
      throw new Error('Private key and public key are required for NIP-44 decryption');
    }

    try {
      // Determine which public key to use for decryption
      // If we're the sender, use the receiver's public key
      // If we're the receiver, use the sender's public key
      const otherPublicKey = senderPublicKey === publicKey ? publicKey : senderPublicKey;
      
      const decryptedContent = v2.decryptNip44(encryptedContent, privateKey, otherPublicKey);
      return decryptedContent;
    } catch (error) {
      console.error('NIP-44: Failed to decrypt message:', error);
      throw new Error(`Failed to decrypt NIP-44 message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return { decryptMessage };
}; 