// Rod Cashu wallet example
// File: /NostrKeyManager.ts

import { generateNewMnemonic } from "@cashu/cashu-ts";
import { generateRandomKeypair } from "../keypair";

export class NostrKeyManager {
  private static STORAGE_KEY = "nostr_pubkey";
  private static CRED_KEY_PREFIX = "nostr_cred_";
  private static SALT_KEY_PREFIX = "nostr_salt_";
  private static PBKDF2_ITERATIONS = 100000; // Adjust based on your security needs and performance requirements
  private static IS_CASHU_WALLET_SETUP = "is_cashu_wallet_setup";

  static async getOrCreateKeyPair(credential?:Credential|null): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic: string;
    credential?:Credential|null
  }> {
    const storedPubKey = localStorage.getItem(NostrKeyManager.STORAGE_KEY);

    if (storedPubKey) {
      const { secretKey, mnemonic } = await this.retrieveSecretKey(storedPubKey);
      return { secretKey, publicKey: storedPubKey, mnemonic };
    }
    return this.createAndStoreKeyPair(credential);
  }

  static getPublicKey() {
    const storedPubKey = localStorage.getItem(NostrKeyManager.STORAGE_KEY);

    return storedPubKey;
  }

  static async getDecryptedPrivateKey(): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic: string;
  } | undefined> {
    const storedPubKey = localStorage.getItem(NostrKeyManager.STORAGE_KEY);

    if (storedPubKey) {
      const { secretKey, mnemonic } = await this.sessionRetrieveEncryptedData(storedPubKey);
      return { secretKey, publicKey: storedPubKey, mnemonic };
    }
  }

  static getIsWalletSetup() {
    const isWalletSetup = localStorage.getItem(NostrKeyManager.IS_CASHU_WALLET_SETUP);
    return isWalletSetup;
  }

  private static async createAndStoreKeyPair(credential?:Credential|null): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic: string;
  }> {
    const {publicKey, privateKey:secretKey} = generateRandomKeypair();
    // const publicKey = getPublicKey(secretKey);
    const mnemonic = generateNewMnemonic()

    await this.storeSecretKey(secretKey, publicKey, mnemonic, credential);
    localStorage.setItem(NostrKeyManager.STORAGE_KEY, publicKey);

    return { secretKey, publicKey, mnemonic };
  }

  private static async storeSecretKey(
    secretKey: string,
    publicKey: string,
    mnemonic: string,
    credentialProps?:Credential|null
  ): Promise<void> {
    const encoder = new TextEncoder();
    const credential = credentialProps ?? await navigator.credentials.create({
      publicKey: {
        challenge: encoder.encode("nostr-key-challenge"),
        rp: { name: "Nostr Connect App" },
        user: {
          id: encoder.encode(publicKey),
          name: "Nostr User",
          displayName: "Nostr User",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      },
    });

    if (credential && credential.type === "public-key") {
      const pkCred = credential as PublicKeyCredential;
      const rawId = Array.from(new Uint8Array(pkCred.rawId));

      // Generate a random salt
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // Encrypt the secret key
      const encryptedKey = await this.encryptSecretKey(secretKey, rawId, salt);
      console.log("encryptedkey", encryptedKey)

      const encryptedMnemonic = await this.encryptSecretKey(mnemonic, rawId, salt);
      console.log("encryptedMnemonic", encryptedMnemonic)

      localStorage.setItem(
        `${NostrKeyManager.CRED_KEY_PREFIX}${publicKey}`,
        JSON.stringify({ rawId, encryptedKey, mnemonic: encryptedMnemonic })
      );
      localStorage.setItem(
        `${NostrKeyManager.SALT_KEY_PREFIX}${publicKey}`,
        JSON.stringify(Array.from(salt))
      );
      localStorage.setItem(
        `${NostrKeyManager.IS_CASHU_WALLET_SETUP}`,
        "true"
      );

    } else {
      throw new Error("Failed to create credential");
    }
  }

  private static async retrieveSecretKey(publicKey: string): Promise<{
    secretKey: string,
    mnemonic: string
  }> {
    const storedCred = localStorage.getItem(`nostr_cred_${publicKey}`);
    const storedSalt = localStorage.getItem(`${NostrKeyManager.SALT_KEY_PREFIX}${publicKey}`);
    if (!storedCred || !storedSalt) throw new Error("No stored credential or salt found");

    const { rawId, encryptedKey, mnemonic } = JSON.parse(storedCred);
    const encoder = new TextEncoder();
    const salt = new Uint8Array(JSON.parse(storedSalt));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: encoder.encode("nostr-key-challenge"),
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

      return { secretKey: decryptedPrivateKey, mnemonic: decryptedMnemonic };
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
        iterations: NostrKeyManager.PBKDF2_ITERATIONS,
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
        iterations: NostrKeyManager.PBKDF2_ITERATIONS,
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


  private static async sessionRetrieveEncryptedData(publicKey: string): Promise<{
    secretKey: string,
    mnemonic: string
  }> {
    const storedCred = localStorage.getItem(`nostr_cred_${publicKey}`);
    const storedSalt = localStorage.getItem(`${NostrKeyManager.SALT_KEY_PREFIX}${publicKey}`);
    if (!storedCred || !storedSalt) throw new Error("No stored credential or salt found");

    const { rawId, encryptedKey, mnemonic } = JSON.parse(storedCred);
    const encoder = new TextEncoder();
    const salt = new Uint8Array(JSON.parse(storedSalt));

    const decryptedPrivateKey = await this.decryptSecretKey(encryptedKey, rawId, salt);
    const decryptedMnemonic = await this.decryptSecretKey(mnemonic, rawId, salt);

    return { secretKey: decryptedPrivateKey, mnemonic: decryptedMnemonic };
  }

}
