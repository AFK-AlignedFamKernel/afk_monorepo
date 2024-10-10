// Rod Cashu wallet example
// File: /PasskeyManager.ts
// import crypto from "crypto"
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { GeneratePasskeyValues } from '../../types/storage';
const encoder = new TextEncoder();
export const DEFAULT_PASSKEY = {
  publicKey: {
    challenge: encoder.encode("afk-key-challenge"),
    rp: { name: "AFK Connect App" },
    user: {
      id: encoder.encode("LFG"),
      name: "AFK Wallet User",
      displayName: "AFK Wallet User",
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
  },
}
export class PasskeyManager {
  private static SALT_KEY_PREFIX = "passkey_salt_";
  private static RAW_ID_KEY_PREFIX = "rawId_";
  private static PBKDF2_ITERATIONS = 100000; // Adjust based on your security needs and performance requirements
  private static IS_WALLET_SETUP = "is_wallet_setup";


  static getIsWalletSetup() {
    const isWalletSetup = localStorage.getItem(PasskeyManager.IS_WALLET_SETUP);
    return isWalletSetup;
  }

  public static async generatePasskeyAndSave(props: GeneratePasskeyValues): Promise<Credential | null | undefined> {
    const passkey = await PasskeyManager.generatePasskey(props)
    if (passkey) {
      await PasskeyManager.storeSecretKey(passkey)
    }
    return passkey
  }

  /** Todo finish passkey mobile */
  private static async generatePasskey(props: GeneratePasskeyValues
  ): Promise<Credential | null | undefined> {
    const encoder = new TextEncoder();
    const { nameChallenge, nameRp, publicKey, user } = props
    const isWeb = Platform.OS == "web"
    if (isWeb) {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: encoder.encode(nameChallenge ?? "afk-key-challenge"),
          rp: { name: "AFK Connect App" },
          user: {
            id: encoder.encode(user?.id ?? publicKey),
            name: user?.name ?? "AFK Wallet User",
            displayName: user?.displayName ?? "AFK Wallet User",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        },
      });

      return credential
    }
    return null

  }

  public static async storeSecretKey(
    credentialProps: Credential,
  ): Promise<void> {
    try {
      const encoder = new TextEncoder();
      const credential = credentialProps
        // ?? await PasskeyManager.generatePasskey(DEFAULT_PASSKEY)
      if (credential && credential.type === "public-key") {
        const pkCred = credential as PublicKeyCredential;
        const rawId = Array.from(new Uint8Array(pkCred.rawId));

        // Generate a random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));


        localStorage.setItem(
          `${PasskeyManager.IS_WALLET_SETUP}`,
          "true"
        );

        localStorage.setItem(
          `${PasskeyManager.SALT_KEY_PREFIX}`,
          JSON.stringify(Array.from(salt))
        );


        localStorage.setItem(
          `${PasskeyManager.SALT_KEY_PREFIX}`,
          JSON.stringify({ rawId })
        );


      } else {
        throw new Error("Failed to create credential");
      }

    } catch (error) {
      console.log("Error storeSecretKey PasskeyManager", error)

    }

  }

  private static async retrieveSecretKey(publicKey: string): Promise<{
    secretKey: string,
    mnemonic: string,
    strkPrivateKey: string,
  }> {
    const storedCred = localStorage.getItem(`strk_cred_${publicKey}`);
    const storedSalt = localStorage.getItem(`${PasskeyManager.SALT_KEY_PREFIX}${publicKey}`);
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
        iterations: PasskeyManager.PBKDF2_ITERATIONS,
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
        iterations: PasskeyManager.PBKDF2_ITERATIONS,
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



}
