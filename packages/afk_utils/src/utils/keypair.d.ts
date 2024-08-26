export declare const generateRandomKeypair: () => {
    privateKey: string;
    publicKey: string;
};
export declare const generateRandomBytes: () => Uint8Array;
export declare function generateSharedSecret(privateKey: any, publicKey: any): Uint8Array;
export declare const transformStringToUint8Array: (str: string) => Uint8Array;
export declare function deriveSharedSecret(privateKeyHex: string, publicKeyHex: string): Uint8Array;
export declare const getPublicKeyFromSecret: (privateKey: string) => string;
export declare const isValidNostrPrivateKey: (key: string) => boolean;
export declare const randomTimeUpTo2DaysInThePast: () => Date;
