// Rod Cashu wallet example
// File: /WalletManager.ts
// import crypto from "crypto"
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { generatePrivateKey, generateMnemonic, privateKeyToAccount } from 'viem/accounts'
import { ec, stark } from "starknet";
import { GeneratePasskeyValues } from '../../types/storage';

export class WalletManager {
  private static SALT_KEY_PREFIX = "wallet_salt_";
  private static STORAGE_KEY = "wallet_pubkey";
  private static STORAGE_EVM_KEY = "evm_pubkey";
  private static STORAGE_STRK_KEY = "strk_pubkey";
  private static CRED_KEY_EVM_PREFIX = "evm_cred_";
  private static SALT_KEY_EVM_PREFIX = "evm_salt_";
  private static CRED_KEY_PREFIX = "wallet_cred_";
  private static CRED_KEY_STRK_PREFIX = "strk_cred_";

  private static SALT_KEY_STRK_PREFIX = "strk_salt_";
  private static PBKDF2_ITERATIONS = 100000; // Adjust based on your security needs and performance requirements
  private static IS_WALLET_SETUP = "is_wallet_setup";

  static async getOrCreateKeyPair(): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic?: string;
    strkPrivateKey?: string;
  }> {
    const storedPubKey = localStorage.getItem(WalletManager.STORAGE_EVM_KEY);

    if (storedPubKey) {
      const { secretKey, mnemonic, strkPrivateKey } = await this.retrieveSecretKey(storedPubKey);
      return { secretKey, publicKey: storedPubKey, mnemonic, strkPrivateKey };
    }
    return this.createAndStoreKeyPair();
  }

  static async getOrCreateKeyPairWithCredential(credential?:Credential|null): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic?: string;
    strkPrivateKey?: string;
  }> {
    const storedPubKey = localStorage.getItem(WalletManager.STORAGE_EVM_KEY);

    if (storedPubKey) {
      const { secretKey, mnemonic, strkPrivateKey } = await this.retrieveSecretKey(storedPubKey);
      return { secretKey, publicKey: storedPubKey, mnemonic, strkPrivateKey };
    }
    return this.createAndStoreKeyPairWithCredential(credential);
  }

  static getPublicKey() {
    const storedPubKey = localStorage.getItem(WalletManager.STORAGE_EVM_KEY);

    return storedPubKey;
  }

  static getStrkPublicKey() {
    const storedPubKey = localStorage.getItem(WalletManager.STORAGE_STRK_KEY);

    return storedPubKey;
  }

  static async getDecryptedPrivateKey(): Promise<{
    secretKey?: string;
    publicKey?: string;
    mnemonic?: string;
    strkPrivateKey?: string;
  } | undefined> {
    const storedPubKey = localStorage.getItem(WalletManager.STORAGE_EVM_KEY);
    const storedPubKeyEvm = localStorage.getItem(WalletManager.STORAGE_EVM_KEY);
    const storedStrkPubKey = localStorage.getItem(WalletManager.STORAGE_STRK_KEY);

    console.log("storedPubKey",storedPubKey)
    console.log("storedStrkPubKey",storedStrkPubKey)
    if (storedPubKey) {
      const evmResult = await this.sessionEvmRetrieveEncryptedData(storedPubKey);
      const resultStrk = await this.sessionStrkRetrieveEncryptedData(storedStrkPubKey ?? storedPubKey);
      return { secretKey:evmResult?.secretKey, publicKey: storedPubKey, mnemonic:evmResult?.mnemonic, strkPrivateKey: resultStrk?.secretKey ?? undefined };
    }
    return undefined;
  }

  static async getEvmDecryptedPrivateKey(): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic: string;
  } | undefined> {
    const storedPubKey = localStorage.getItem(WalletManager.STORAGE_EVM_KEY);

    if (storedPubKey) {
      const result= await this.sessionEvmRetrieveEncryptedData(storedPubKey);
      if(!result) return;
      return { secretKey:result?.secretKey, publicKey: storedPubKey, mnemonic:result?.mnemonic };

    }
  }

  static async getStrkDecryptedPrivateKey(): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic: string;
  } | undefined> {
    const storedPubKey = localStorage.getItem(WalletManager.STORAGE_STRK_KEY);

    if (storedPubKey) {
      const result = await this.sessionStrkRetrieveEncryptedData(storedPubKey);

      if (result) {
        const { secretKey, mnemonic } = result
        return { secretKey, publicKey: storedPubKey, mnemonic };
      }
    }
  }
  static getIsWalletSetup() {
    const isWalletSetup = localStorage.getItem(WalletManager.IS_WALLET_SETUP);
    return isWalletSetup;
  }

  private static async createAndStoreKeyPair(): Promise<{
    secretKey: string;
    publicKey: string;
    strkPrivateKey?: string;
    mnemonic?: string;
  }> {

    // Generate EVM address
    const secretKey = generatePrivateKey()
    const account = await privateKeyToAccount(secretKey)
    const publicKey = account?.address;

    // Generate Starknet account

    // TODO
    // Generate public and private key pair.
    const strkPrivateKey = stark.randomAddress();
    console.log('New OZ account:\nprivateKey=', strkPrivateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(strkPrivateKey);
    console.log('publicKey=', starkKeyPub);


    // Generate credential for navigator

    // Secure store for mobile

    // 
    await this.storeSecretKey(secretKey, publicKey, strkPrivateKey, starkKeyPub);
    localStorage.setItem(WalletManager.STORAGE_EVM_KEY, publicKey);
    localStorage.setItem(WalletManager.STORAGE_STRK_KEY, starkKeyPub);
    return { secretKey, publicKey, strkPrivateKey };
  }

  private static async createAndStoreKeyPairWithCredential(credential?:Credential|null, 
    propsPasskey?:GeneratePasskeyValues): Promise<{
    secretKey: string;
    publicKey: string;
    strkPrivateKey?: string;
    mnemonic?: string;
  }> {

    // Generate EVM address
    const secretKey = generatePrivateKey()
    const account = await privateKeyToAccount(secretKey)
    const publicKey = account?.address;

    // Generate Starknet account

    // TODO
    // Generate public and private key pair.
    const strkPrivateKey = stark.randomAddress();
    console.log('New OZ account:\nprivateKey=', strkPrivateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(strkPrivateKey);
    console.log('publicKey=', starkKeyPub);


    // Generate credential for navigator

    // Secure store for mobile



    // 
    await this.storeSecretKeyWithCredential(secretKey, publicKey, strkPrivateKey, starkKeyPub, credential, propsPasskey );
    localStorage.setItem(WalletManager.STORAGE_EVM_KEY, publicKey);
    localStorage.setItem(WalletManager.STORAGE_STRK_KEY, starkKeyPub);
    return { secretKey, publicKey, strkPrivateKey };
  }


  private static async generatePasskey(
    secretKey: string,
    publicKey: string,
    mnemonic: string
  ): Promise<Credential | null> {
    const encoder = new TextEncoder();
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: encoder.encode("wallet-key-challenge"),
        rp: { name: "Wallet Connect App" },
        user: {
          id: encoder.encode(publicKey),
          name: "Wallet User",
          displayName: "Wallet User",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      },
    });

    return credential
  }

  private static async storeSecretKey(
    secretKey: string,
    publicKey: string,
    strkPrivateKey: string,
    strkPublicKey: string,
    mnemonic?: string,
    strkMnemonic?: string,
  ): Promise<void> {
    try {
      const encoder = new TextEncoder();
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: encoder.encode("wallet-key-challenge"),
          rp: { name: "Wallet Connect App" },
          user: {
            id: encoder.encode(publicKey),
            name: "Wallet User",
            displayName: "Wallet User",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        },
      });

      if (credential && credential.type === "public-key") {
        const pkCred = credential as PublicKeyCredential;
        const rawId = Array.from(new Uint8Array(pkCred.rawId));

        // Generate a random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        localStorage.setItem(
          `${WalletManager.SALT_KEY_PREFIX}${publicKey}`,
          JSON.stringify(Array.from(salt))
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_PREFIX}${strkPublicKey}`,
          JSON.stringify(Array.from(salt))
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_PREFIX}`,
          JSON.stringify(Array.from(salt))
        );

        // EVM

        // Encrypt the secret key
        const encryptedKey = await this.encryptSecretKey(secretKey, rawId, salt);
        console.log("encryptedkey", encryptedKey)
        console.log("secretKey", secretKey)


        localStorage.setItem(
          `${WalletManager.CRED_KEY_EVM_PREFIX}${publicKey}`,
          JSON.stringify({
            rawId, encryptedKey,
            // mnemonic: encryptedMnemonic

          })
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_EVM_PREFIX}${publicKey}`,
          JSON.stringify(Array.from(salt))
        );
        // const encryptedMnemonic = await this.encryptSecretKey(mnemonic, rawId, salt);
        // console.log("encryptedMnemonic", encryptedMnemonic)
        // Starknet

        const encryptedStrkPrivateKey = await this.encryptSecretKey(strkPrivateKey, rawId, salt);
        console.log("strkPrivateKey", strkPrivateKey)
        console.log("encryptedStrkPrivateKey", encryptedStrkPrivateKey)


        localStorage.setItem(
          `${WalletManager.CRED_KEY_STRK_PREFIX}${strkPublicKey}`,
          JSON.stringify({ rawId, encryptedStrkPrivateKey, mnemonic: encryptedStrkPrivateKey })
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_STRK_PREFIX}${strkPublicKey}`,
          JSON.stringify(Array.from(salt))
        );

        // All
        localStorage.setItem(
          `${WalletManager.CRED_KEY_PREFIX}${publicKey}`,
          JSON.stringify({
            rawId, encryptedKey,
            strkPrivateKey
            // mnemonic: encryptedMnemonic
          })
        );

        localStorage.setItem(
          `${WalletManager.IS_WALLET_SETUP}`,
          "true"
        );

      } else {
        throw new Error("Failed to create credential");
      }

    } catch (error) {
      console.log("Error storeSecretKey WalletManager", error)

    }

  }

  private static async storeSecretKeyWithCredential(
    secretKey: string,
    publicKey: string,
    strkPrivateKey: string,
    strkPublicKey: string,
    credentialPropsGenerate?:Credential|null,
    credentialProps?:GeneratePasskeyValues,
    mnemonic?: string,
    strkMnemonic?: string,

  ): Promise<void> {
    try {

      const credential = credentialPropsGenerate;
      if(!credential) return undefined;
      
      if (credential && credential.type === "public-key") {
        const pkCred = credential as PublicKeyCredential;
        const rawId = Array.from(new Uint8Array(pkCred.rawId));

        // Generate a random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        localStorage.setItem(
          `${WalletManager.SALT_KEY_PREFIX}${publicKey}`,
          JSON.stringify(Array.from(salt))
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_PREFIX}${strkPublicKey}`,
          JSON.stringify(Array.from(salt))
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_PREFIX}`,
          JSON.stringify(Array.from(salt))
        );

        // EVM

        // Encrypt the secret key
        const encryptedKey = await this.encryptSecretKey(secretKey, rawId, salt);
        console.log("encryptedkey", encryptedKey)
        console.log("secretKey", secretKey)


        localStorage.setItem(
          `${WalletManager.CRED_KEY_EVM_PREFIX}${publicKey}`,
          JSON.stringify({
            rawId, encryptedKey,
            // mnemonic: encryptedMnemonic

          })
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_EVM_PREFIX}${publicKey}`,
          JSON.stringify(Array.from(salt))
        );
        // const encryptedMnemonic = await this.encryptSecretKey(mnemonic, rawId, salt);
        // console.log("encryptedMnemonic", encryptedMnemonic)
        // Starknet

        const encryptedStrkPrivateKey = await this.encryptSecretKey(strkPrivateKey, rawId, salt);
        console.log("strkPrivateKey", strkPrivateKey)
        console.log("encryptedStrkPrivateKey", encryptedStrkPrivateKey)


        localStorage.setItem(
          `${WalletManager.CRED_KEY_STRK_PREFIX}${strkPublicKey}`,
          JSON.stringify({ rawId, encryptedStrkPrivateKey, mnemonic: encryptedStrkPrivateKey })
        );
        localStorage.setItem(
          `${WalletManager.SALT_KEY_STRK_PREFIX}${strkPublicKey}`,
          JSON.stringify(Array.from(salt))
        );

        // All
        localStorage.setItem(
          `${WalletManager.CRED_KEY_PREFIX}${publicKey}`,
          JSON.stringify({
            rawId, encryptedKey,
            strkPrivateKey
            // mnemonic: encryptedMnemonic
          })
        );

        localStorage.setItem(
          `${WalletManager.IS_WALLET_SETUP}`,
          "true"
        );

      } else {
        throw new Error("Failed to create credential");
      }

    } catch (error) {
      console.log("Error storeSecretKey WalletManager", error)

    }

  }

  private static async retrieveSecretKey(publicKey: string): Promise<{
    secretKey: string,
    mnemonic: string,
    strkPrivateKey: string,
  }> {
    const storedCred = localStorage.getItem(`strk_cred_${publicKey}`);
    const storedSalt = localStorage.getItem(`${WalletManager.SALT_KEY_PREFIX}${publicKey}`);
    if (!storedCred || !storedSalt) throw new Error("No stored credential or salt found");


    const { rawId, encryptedKey, mnemonic, strkPrivateKey } = JSON.parse(storedCred);
    const encoder = new TextEncoder();
    const salt = new Uint8Array(JSON.parse(storedSalt));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: encoder.encode("wallet-key-challenge"),
        allowCredentials: [
          {
            id: new Uint8Array(rawId),
            type: "public-key",
          },
        ],
      },
    });

    if (assertion && assertion.type === "public-key") {
      const decryptedPrivateKey = await this.decryptSecretKey(encryptedKey, rawId, salt);
      const decryptedMnemonic = await this.decryptSecretKey(mnemonic, rawId, salt);
      const decryptedStrkPrivateKey = await this.decryptSecretKey(strkPrivateKey, rawId, salt);

      return { secretKey: decryptedPrivateKey, mnemonic: decryptedMnemonic, strkPrivateKey: decryptedStrkPrivateKey };
    }
    throw new Error("Failed to retrieve credential");
  }

  private static async encryptSecretKey(secretKey: string, rawId: number[], salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secretKey);

    const baseKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(rawId),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: WalletManager.PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const resultArray = new Uint8Array(iv.length + encryptedArray.length);
    resultArray.set(iv);
    resultArray.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode.apply(null, resultArray as any));
  }

  private static async decryptSecretKey(encryptedKey: string, rawId: number[], salt: Uint8Array): Promise<string> {
    const encryptedData = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));

    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);

    const baseKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(rawId),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: WalletManager.PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const decryptedPrivateKey = decoder.decode(decryptedData);
    return decryptedPrivateKey
  }


  private static async sessionEvmRetrieveEncryptedData(publicKey: string): Promise<{
    secretKey: string,
    mnemonic: string
  }|undefined> {
    try {
      const storedCred = localStorage.getItem(`evm_cred_${publicKey}`);
      console.log("storedCred",storedCred)
      const storedSalt = localStorage.getItem(`${WalletManager.SALT_KEY_PREFIX}${publicKey}`)
      console.log("storedSalt",storedSalt)
      if (!storedCred || !storedSalt) throw new Error("No stored credential or salt found");
  
      const { rawId, encryptedKey, mnemonic } = JSON.parse(storedCred);
      // const encoder = new TextEncoder();
      const salt = new Uint8Array(JSON.parse(storedSalt));
  
      const decryptedPrivateKey = await this.decryptSecretKey(encryptedKey, rawId, salt);
      const decryptedMnemonic = await this.decryptSecretKey(mnemonic, rawId, salt);
  
      return { secretKey: decryptedPrivateKey, mnemonic: decryptedMnemonic };
    } catch (error) {
      console.log("error sessionEvmRetrieveEncryptedData", error)
      return undefined
    }
  
  }

  private static async sessionStrkRetrieveEncryptedData(publicKey: string): Promise<{
    secretKey: string,
    mnemonic: string
  } | undefined> {
    try {
      const storedCred = localStorage.getItem(`strk_cred_${publicKey}`);
      console.log("storedCred",storedCred)
      const storedSalt = localStorage.getItem(`${WalletManager.SALT_KEY_PREFIX}${publicKey}`);
      console.log("storedSalt",storedSalt)

      if (!storedCred || !storedSalt) throw new Error("No stored credential or salt found");

      const { rawId, encryptedKey, mnemonic } = JSON.parse(storedCred);
      const encoder = new TextEncoder();
      const salt = new Uint8Array(JSON.parse(storedSalt));

      const decryptedPrivateKey = await this.decryptSecretKey(encryptedKey, rawId, salt);
      const decryptedMnemonic = await this.decryptSecretKey(mnemonic, rawId, salt);

      return { secretKey: decryptedPrivateKey, mnemonic: decryptedMnemonic };
    } catch (error) {
      console.log("error sessionStrkRetrieveEncryptedData", error)
      return undefined;
    }

  }


}
