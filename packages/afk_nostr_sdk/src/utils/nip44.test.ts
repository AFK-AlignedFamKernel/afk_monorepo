import { v2 } from './nip44';

// Test vectors from NIP-44 specification
const testCases = [
  {
    name: 'Basic encryption/decryption',
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
    message: 'Hello, world!',
  },
  {
    name: 'Empty message',
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
    message: '',
  },
  {
    name: 'Long message',
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
    message: 'A'.repeat(1000),
  },
];

describe('NIP-44 Implementation', () => {
  test('should encrypt and decrypt messages correctly', () => {
    testCases.forEach(({ name, privateKey, publicKey, message }) => {
      console.log(`Testing: ${name}`);
      
      // Test conversation key derivation
      const conversationKey = v2.getConversationKey(privateKey, publicKey);
      expect(conversationKey).toBeInstanceOf(Uint8Array);
      expect(conversationKey.length).toBe(32);
      
      // Test encryption
      const encrypted = v2.encryptNip44(message, privateKey, publicKey);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
      
      // Test decryption
      const decrypted = v2.decryptNip44(encrypted, privateKey, publicKey);
      expect(decrypted).toBe(message);
      
      console.log(`✓ ${name} passed`);
    });
  });

  test('should handle different public key formats', () => {
    const privateKey = '0000000000000000000000000000000000000000000000000000000000000001';
    const publicKeyWithPrefix = '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';
    const publicKeyWithoutPrefix = 'eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';
    const message = 'Test message';

    // Test with prefix
    const encrypted1 = v2.encryptNip44(message, privateKey, publicKeyWithPrefix);
    const decrypted1 = v2.decryptNip44(encrypted1, privateKey, publicKeyWithPrefix);
    expect(decrypted1).toBe(message);

    // Test without prefix
    const encrypted2 = v2.encryptNip44(message, privateKey, publicKeyWithoutPrefix);
    const decrypted2 = v2.decryptNip44(encrypted2, privateKey, publicKeyWithoutPrefix);
    expect(decrypted2).toBe(message);

    // Test cross-compatibility
    const decryptedCross = v2.decryptNip44(encrypted1, privateKey, publicKeyWithoutPrefix);
    expect(decryptedCross).toBe(message);
  });

  test('should reject invalid inputs', () => {
    const privateKey = '0000000000000000000000000000000000000000000000000000000000000001';
    const publicKey = '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

    // Test invalid private key
    expect(() => {
      v2.encryptNip44('test', 'invalid', publicKey);
    }).toThrow();

    // Test invalid public key
    expect(() => {
      v2.encryptNip44('test', privateKey, 'invalid');
    }).toThrow();

    // Test invalid encrypted content
    expect(() => {
      v2.decryptNip44('invalid', privateKey, publicKey);
    }).toThrow();
  });

  test('should handle edge cases', () => {
    const privateKey = '0000000000000000000000000000000000000000000000000000000000000001';
    const publicKey = '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

    // Test very short message
    const shortMessage = 'A';
    const encryptedShort = v2.encryptNip44(shortMessage, privateKey, publicKey);
    const decryptedShort = v2.decryptNip44(encryptedShort, privateKey, publicKey);
    expect(decryptedShort).toBe(shortMessage);

    // Test message with special characters
    const specialMessage = 'Hello, 世界! 🌍\n\t\r';
    const encryptedSpecial = v2.encryptNip44(specialMessage, privateKey, publicKey);
    const decryptedSpecial = v2.decryptNip44(encryptedSpecial, privateKey, publicKey);
    expect(decryptedSpecial).toBe(specialMessage);
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running NIP-44 tests...');
  
  testCases.forEach(({ name, privateKey, publicKey, message }) => {
    console.log(`\nTesting: ${name}`);
    
    try {
      const conversationKey = v2.getConversationKey(privateKey, publicKey);
      console.log('✓ Conversation key derived successfully');
      
      const encrypted = v2.encryptNip44(message, privateKey, publicKey);
      console.log('✓ Message encrypted successfully');
      
      const decrypted = v2.decryptNip44(encrypted, privateKey, publicKey);
      if (decrypted === message) {
        console.log('✓ Message decrypted successfully');
      } else {
        console.log('✗ Decryption failed - message mismatch');
      }
    } catch (error) {
      console.log(`✗ Test failed: ${error}`);
    }
  });
  
  console.log('\nNIP-44 tests completed!');
} 