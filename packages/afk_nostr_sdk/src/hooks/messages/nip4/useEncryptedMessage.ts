import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth, useSettingsStore } from '../../../store';
import { x25519 } from '@noble/curves/ed25519'; // Fixed import path for noble-curves
import { encodeBase64, aes256cbcEncrypt, generateRandomBytesLength } from '../../../utils/crypto';
import { hexToBytes } from '@noble/hashes/utils';
import { checkIsConnected } from '../../connect';

export const useEncryptedMessage = () => {
  const { ndk } = useNostrContext();
  const { publicKey, privateKey } = useAuth();
  const { relays } = useSettingsStore();

  return useMutation({
    mutationKey: ['sendEncryptedMessage', ndk],
    mutationFn: async (data: {
      content: string;
      relayUrl?: string;
      subject?: string;
      receiverPublicKey?: string;
      tags?: string[][];
      isEncrypted?: boolean;
      encryptedMessage?: string;
    }) => {
      const { relayUrl, receiverPublicKey, content, subject } = data;

      await checkIsConnected(ndk);
      console.log('content', content);
      console.log('receiverPublicKey', receiverPublicKey);
      console.log('privateKey', privateKey);

      if (!privateKey || !publicKey) {
        throw new Error('Private key and public key are required for NIP-04 encryption');
      }

      if (!receiverPublicKey) {
        throw new Error('Receiver public key is required');
      }

      // 1. Convert keys to Uint8Array
      const privateKeyBytes = hexToBytes(privateKey); // 32 bytes
      const receiverPublicKeyBytes = hexToBytes(receiverPublicKey); // 32 bytes

      // 2. Derive shared key using X25519
      const sharedKey = x25519.scalarMult(privateKeyBytes, receiverPublicKeyBytes); // 32 bytes

      // 3. Use sharedKey directly for AES-256-CBC
      const iv = generateRandomBytesLength(16);
      const ciphertext = await aes256cbcEncrypt(content, sharedKey, iv);

      // 4. Format as NIP-4 requires
      const ciphertextB64 = encodeBase64(ciphertext);
      const ivB64 = encodeBase64(iv);
      const encryptedContent = `${ciphertextB64}?iv=${ivB64}`;

      // 5. Create and send event
      const eventDirectMessage = new NDKEvent(ndk);
      eventDirectMessage.kind = NDKKind.EncryptedDirectMessage;
      eventDirectMessage.created_at = Math.floor(Date.now() / 1000);
      eventDirectMessage.content = encryptedContent;
      eventDirectMessage.tags = [
        ["p", receiverPublicKey, relayUrl || ""],
        ...(subject ? [["subject", subject]] : []),
      ];

      // 6. Sign the event
      await eventDirectMessage.sign();

      console.log('Publishing NIP-04 event:', {
        id: eventDirectMessage.id,
        pubkey: eventDirectMessage.pubkey,
        kind: eventDirectMessage.kind,
        content: encryptedContent.substring(0, 50) + '...',
        tags: eventDirectMessage.tags,
      });

      // 7. Publish with better error handling
      try {
        const publishResult = await eventDirectMessage.publish();
        console.log('NIP-04 message published successfully:', publishResult);
        return eventDirectMessage;
      } catch (error) {
        console.error('Failed to publish NIP-04 message:', error);
        
        // Try to get more details about the failure
        const connectedRelays = ndk.pool.connectedRelays();
        console.log('Connected relays:', connectedRelays.map(r => r.url));
        
        throw new Error(`Failed to publish NIP-04 message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });
};
