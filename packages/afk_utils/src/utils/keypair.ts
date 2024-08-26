import { schnorr } from '@noble/curves/secp256k1';
import { getSharedSecret } from '@noble/secp256k1';
import { getRandomBytes } from 'expo-crypto';

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


export const generateRandomBytes = () => {
    try {
        const randomBytes = getRandomBytes(16);

        return randomBytes
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
    const uint8Array = new Uint8Array(Buffer.from(str, 'utf-8'));

    // Log the Uint8Array
    console.log(uint8Array);


    return uint8Array
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
}
