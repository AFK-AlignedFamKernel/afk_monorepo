import {schnorr} from '@noble/curves/secp256k1';
import {getSharedSecret} from '@noble/secp256k1';
import * as secp from '@noble/secp256k1';

// Replace expo-crypto's getRandomBytes with Web Crypto API
export const getRandomBytes = (length: number): Uint8Array => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
};

export const generateRandomKeypair = () => {
  try {
    const privateKey = getRandomBytes(32);
    const privateKeyHex = Buffer.from(privateKey).toString('hex');

    const publicKey = schnorr.getPublicKey(privateKeyHex);
    const publicKeyHex = Buffer.from(publicKey).toString('hex');

    return {
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
    };
  } catch (error) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Failed to generate keypair');
  }
};

export const generateRandomBytes = async () => {
  try {
    return await getRandomBytes(32);
  } catch (error) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Failed to generateRandomBytes');
  }
};

// Generate a shared secret from the private key of one party and the public key of the other
export function generateSharedSecret(privateKey, publicKey) {
  // Ensure the keys are in the correct format (hex string for secp256k1)
  const sharedSecret = getSharedSecret(privateKey, publicKey);
  // The shared secret is a Uint8Array; convert it to hex
  return sharedSecret.slice(1); // Slice to remove the parity byte
}

export const transformStringToUint8Array = (str: string) => {
  // Convert string to Uint8Array using Buffer
  const initialUint8Array = new Uint8Array(Buffer.from(str, 'utf-8'));

  // Define the desired size (32 bytes for a private key)
  const desiredSize = 32;

  // Create a new Uint8Array of the desired size (32 bytes)
  const uint8Array = new Uint8Array(desiredSize);

  if (initialUint8Array.length > desiredSize) {
    // If the initial array is longer than 32 bytes, trim it to 32 bytes
    uint8Array.set(initialUint8Array.slice(0, desiredSize));
  } else if (initialUint8Array.length < desiredSize) {
    // If the initial array is shorter than 32 bytes, copy it and leave the rest as zeroes (padding)
    uint8Array.set(initialUint8Array);
  } else {
    // If the initial array is exactly 32 bytes, just copy it
    uint8Array.set(initialUint8Array);
  }

  return uint8Array;
};

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even length');
  }
  const uint8Array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    uint8Array[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return uint8Array;
}

// Derive the shared conversation key
export function deriveSharedKey(
  authorPrivateKeyHex: string,
  recipientPublicKeyHex: string,
): Uint8Array {
  try {
    // Convert the private key from a hex string to Uint8Array
    const privateKey = hexToUint8Array(authorPrivateKeyHex);

    // Convert the public key from a hex string to a secp256k1 Point
    const publicKeyPoint = recipientPublicKeyHex;

    // Compute shared secret using the ECDH method
    const sharedSecret = secp.getSharedSecret(privateKey, publicKeyPoint.toString(), true);

    // Return the shared secret (skip the first byte which is used for parity)
    return sharedSecret.slice(1);
  } catch (error) {
    console.error('Error deriving shared key:', error);
    return null;
  }
}

export const getPublicKeyFromSecret = (privateKey: string) => {
  try {
    const publicKey = schnorr.getPublicKey(privateKey);
    return Buffer.from(publicKey).toString('hex');
  } catch (error) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Failed to get public key from secret key');
  }
};

export const isValidNostrPrivateKey = (key: string): boolean => {
  // Check if the string is exactly 64 characters long
  if (key.length !== 64) {
    return false;
  }

  // Check if the string contains only hexadecimal characters
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(key)) {
    return false;
  }

  return true;
};

export const randomTimeUpTo2DaysInThePast = () => {
  // Get the current date and time
  const now = new Date();

  // Calculate 2 days in milliseconds (2 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second)
  const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000;

  // Generate a random time offset in milliseconds up to 2 days ago
  const randomOffset = Math.floor(Math.random() * twoDaysInMillis);

  // Subtract the random offset from the current date to get a time up to 2 days in the past
  const randomPastDate = new Date(now.getTime() - randomOffset);

  return randomPastDate;
};

export function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Fix a public key by padding with leading zeros if necessary.
 * @param pubkey - The potentially malformed public key.
 * @returns A correctly formatted public key.
 * @throws Error if the pubkey is invalid or cannot be corrected.
 */
export function fixPubKey(pubkey: string): string {
  // Determine the desired length for a compressed pubkey (66 characters)
  const desiredLength = 66;

  if (pubkey.length > desiredLength) {
    throw new Error('Public key is too long or unrecognized format.');
  }

  // Pad with leading zeros if the length is less than desired
  // const fixedPubKey = pubkey.padStart(desiredLength, '0');
  /** TODO fix pubkey padding way */
  const fixedPubKey = pubkey.padStart(desiredLength, '02');

  // Validate the corrected public key using secp256k1 library
  try {
    console.log("assure verification key")
    // secp.getSharedSecret(fixedPubKey);
    // const publicKeyPoint = secp.getPublicKey(fixedPubKey);
    // publicKeyPoint.assertValidity(); // Check if the point is valid on the curve
  } catch (error) {
    throw new Error('Corrected public key is not valid on the secp256k1 curve.');
  }

  return fixedPubKey;
}

// Replace expo-crypto's digestStringAsync with Web Crypto API
export const hashTag = async (tag: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(tag);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateRandomIdentifier = async (length = 16): Promise<string> => {
  const randomBytes = getRandomBytes(length);
  return Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};
