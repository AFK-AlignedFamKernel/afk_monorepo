# NIP-44 Implementation Guide

## Overview

This document explains the NIP-44 implementation in the AFK Nostr SDK, which provides secure encrypted messaging using the ChaCha20-Poly1305 cipher suite.

## What is NIP-44?

NIP-44 is a Nostr Improvement Proposal that defines a standardized way to encrypt direct messages between Nostr users. It replaces the older NIP-4 encryption method with a more secure and standardized approach.

### Key Features

- **ChaCha20-Poly1305**: Uses ChaCha20 for encryption and Poly1305 for authentication
- **secp256k1 Key Exchange**: Uses secp256k1 curve for key derivation
- **HKDF**: Uses HKDF (HMAC-based Key Derivation Function) for key expansion
- **Version 2**: Implements NIP-44 v2 specification

## Implementation Details

### Key Derivation

The implementation uses secp256k1 shared secret derivation:

```typescript
// Get conversation key using secp256k1 shared secret
getConversationKey(privkeyA: string, pubkeyB: string): Uint8Array {
  const pubkeyWithPrefix = pubkeyB.startsWith('02') ? pubkeyB : '02' + pubkeyB;
  const sharedX = secp256k1.getSharedSecret(privkeyA, pubkeyWithPrefix).subarray(1, 33);
  return hkdf_extract(sha256, sharedX, 'nip44-v2');
}
```

### Message Encryption

Messages are encrypted using ChaCha20-Poly1305:

```typescript
function encrypt(plaintext: string, conversationKey: Uint8Array, nonce = randomBytes(32)): string {
  const {chacha_key, chacha_nonce, hmac_key} = u.getMessageKeys(conversationKey, nonce);
  const padded = u.pad(plaintext);
  const ciphertext = chacha20(chacha_key, chacha_nonce, padded);
  const mac = u.hmacAad(hmac_key, ciphertext, nonce);
  return base64.encode(concatBytes(new Uint8Array([2]), nonce, ciphertext, mac));
}
```

### Message Decryption

Messages are decrypted and authenticated:

```typescript
function decrypt(payload: string, conversationKey: Uint8Array): string {
  const {nonce, ciphertext, mac} = u.decodePayload(payload);
  const {chacha_key, chacha_nonce, hmac_key} = u.getMessageKeys(conversationKey, nonce);
  const calculatedMac = u.hmacAad(hmac_key, ciphertext, nonce);
  if (!equalBytes(calculatedMac, mac)) throw new Error('invalid MAC');
  const padded = chacha20(chacha_key, chacha_nonce, ciphertext);
  return u.unpad(padded);
}
```

## Usage

### Basic Encryption/Decryption

```typescript
import { v2 } from 'afk_nostr_sdk';

// Encrypt a message
const encrypted = v2.encryptNip44(
  'Hello, world!',
  privateKey,
  receiverPublicKey
);

// Decrypt a message
const decrypted = v2.decryptNip44(
  encrypted,
  privateKey,
  senderPublicKey
);
```

### Using the React Hooks

```typescript
import { useNip44Message, useNip44Decrypt } from 'afk_nostr_sdk';

// Send a message
const { mutateAsync: sendMessage } = useNip44Message();

await sendMessage({
  content: 'Hello, world!',
  receiverPublicKey: '02...',
  relayUrl: 'wss://relay.example.com',
  subject: 'Optional subject'
});

// Decrypt a message
const { decryptMessage } = useNip44Decrypt();

const decrypted = await decryptMessage(
  encryptedContent,
  senderPublicKey
);
```

### Integration with NIP-17

NIP-17 (Gift Wraps) can use NIP-44 for encryption:

```typescript
// Create NIP-17 message with NIP-44 encryption
const createNip17Message = async (
  ndk: any,
  senderPrivateKey: string,
  receiverPublicKey: string,
  message: string
) => {
  // Encrypt the actual message with NIP-44
  const nip44EncryptedContent = v2.encryptNip44(message, senderPrivateKey, receiverPublicKey);

  // Create the seal event (kind 13)
  const sealEvent = {
    kind: 13,
    pubkey: receiverPublicKey,
    content: nip44EncryptedContent,
    tags: [['p', receiverPublicKey]],
    created_at: Math.floor(Date.now() / 1000),
  };

  // Encrypt the seal event for the gift wrap using NIP-44
  const giftWrapEncryptedContent = v2.encryptNip44(JSON.stringify(sealEvent), senderPrivateKey, receiverPublicKey);

  // Create the gift wrap event (kind 1059)
  const giftWrapEvent = {
    kind: 1059,
    content: giftWrapEncryptedContent,
    tags: [['p', receiverPublicKey]],
    created_at: Math.floor(Date.now() / 1000),
  };

  return giftWrapEvent;
};
```

## Differences from NIP-4

| Feature | NIP-4 | NIP-44 |
|---------|-------|--------|
| Cipher | AES-256-CBC | ChaCha20-Poly1305 |
| Key Exchange | X25519 | secp256k1 |
| Authentication | None | HMAC-SHA256 |
| Padding | None | Custom padding |
| Version | Fixed | Version 2 |

## Security Considerations

1. **Key Derivation**: Uses HKDF for secure key derivation
2. **Authentication**: Includes HMAC for message authentication
3. **Padding**: Implements proper padding to prevent length-based attacks
4. **Nonce**: Uses random nonces for each message
5. **Version**: Supports versioning for future updates

## Testing

Run the test suite to verify the implementation:

```bash
npm test nip44.test.ts
```

The tests include:
- Basic encryption/decryption
- Different public key formats
- Invalid input handling
- Edge cases (empty messages, special characters)

## Migration from NIP-4

To migrate from NIP-4 to NIP-44:

1. **Update imports**: Replace NIP-4 hooks with NIP-44 hooks
2. **Update message sending**: Use `useNip44Message` instead of `useEncryptedMessage`
3. **Update message receiving**: Use `useNip44Decrypt` for decryption
4. **Update NIP-17**: Modify NIP-17 implementation to use NIP-44 encryption

## API Reference

### v2 Object

```typescript
export const v2 = {
  utils: u,                    // Utility functions
  encrypt,                     // Low-level encrypt function
  decrypt,                     // Low-level decrypt function
  getConversationKey,          // Get conversation key from keys
  encryptNip44,               // High-level encrypt function
  decryptNip44,               // High-level decrypt function
};
```

### useNip44Message Hook

```typescript
const { mutateAsync: sendMessage } = useNip44Message();

await sendMessage({
  content: string,             // Message to encrypt
  receiverPublicKey: string,   // Recipient's public key
  relayUrl?: string,          // Optional relay URL
  subject?: string,           // Optional subject
  tags?: string[][],         // Optional tags
});
```

### useNip44Decrypt Hook

```typescript
const { decryptMessage } = useNip44Decrypt();

const decrypted = await decryptMessage(
  encryptedContent: string,    // Encrypted message
  senderPublicKey: string     // Sender's public key
);
```

## Error Handling

The implementation includes comprehensive error handling:

- Invalid key formats
- Malformed encrypted content
- Authentication failures
- Padding errors
- Version mismatches

All errors include descriptive messages to help with debugging.

## Performance

NIP-44 is designed to be efficient:
- Fast key derivation using secp256k1
- Efficient ChaCha20 encryption
- Minimal overhead for authentication
- Optimized padding implementation

## Compatibility

The implementation is compatible with:
- Other NIP-44 v2 implementations
- Nostr clients that support NIP-44
- Existing Nostr relay infrastructure

## Future Considerations

- Support for future NIP-44 versions
- Additional cipher suites
- Performance optimizations
- Enhanced error handling 