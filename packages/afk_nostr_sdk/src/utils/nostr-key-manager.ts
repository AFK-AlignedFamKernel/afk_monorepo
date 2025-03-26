// Rod Cashu wallet example
// File: /NostrKeyManager.ts

import * as Bip39 from 'bip39';
import { generateRandomKeypair } from './keypair';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

export class NostrKeyManager {
  private static STORAGE_KEY = 'nostr_pubkey';
  private static CRED_KEY_PREFIX = 'nostr_cred_';
  private static SALT_KEY_PREFIX = 'nostr_salt_';
  private static SALT_KEY_UNENCRYPTED_PREFIX = 'nostr_salt_unencrypted_';
  private static NOSTR_WALLETS_ACCOUNT_UNENCRYPTED_PREFIX = 'nostr_wallets_accounts_unencrypted_';
  private static NOSTR_WALLETS_ACCOUNT_ENCRYPTED_PREFIX = 'nostr_wallets_accounts_encrypted_';
  private static PBKDF2_ITERATIONS = 100000; // Adjust based on your security needs and performance requirements
  private static IS_CASHU_WALLET_SETUP = 'is_cashu_wallet_setup';
  private static NOSTR_WALLET_CONNECTED = 'nostr_wallet_connected';
  private static WALLET_CONNECTED = 'wallet_connected';
  private static NOSTR_WALLETS: {
    [key: string]: {
      secretKey: string;
      privateKey?: string;
      publicKey: string;
      mnemonic: string;
      seed: string;
      salt?: string;
      rawId?: string;
      nostrProfile?: any;
    };
  } = {};

  private static NOSTR_WALLETS_ENCRYPTED: {
    [key: string]: {
      secretKey: string;
      privateKey?: string;
      publicKey: string;
      mnemonic: string;
      seed: string;
      salt?: string;
      rawId?: string;
      nostrProfile?: any;
    };
  } = {};


  static getNostrAccountsFromStorage() {

    if (!localStorage) return undefined;
    const storedPubKey = localStorage.getItem(NostrKeyManager.NOSTR_WALLETS_ACCOUNT_UNENCRYPTED_PREFIX);
    if (!storedPubKey) return undefined;
    return JSON.parse(storedPubKey);
  }

  static getNostrWalletConnected() {
    const storedPubKey = localStorage.getItem(NostrKeyManager.NOSTR_WALLET_CONNECTED);
    return storedPubKey;
  }

  static setNostrWalletConnected(publicKey: string) {
    localStorage.setItem(NostrKeyManager.NOSTR_WALLET_CONNECTED, publicKey);
  }


  static getAccountConnected() {
    const storedPubKey = localStorage.getItem(NostrKeyManager.WALLET_CONNECTED);
    return storedPubKey;
  }

  static setAccountConnected(account: any) {
    localStorage.setItem(NostrKeyManager.WALLET_CONNECTED, JSON.stringify(account));
  }

  static async getOrCreateKeyPair(credential?: Credential | null, isCreatedBlocked?: boolean, nostrProfileMetadata?: NDKUserProfile): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic: string;
    credential?: Credential | null;
  } | undefined> {
    try {
      const storedPubKey = localStorage.getItem(NostrKeyManager.STORAGE_KEY);
      console.log('storedPubKey', storedPubKey);

      if (storedPubKey && isCreatedBlocked) {
        console.log('storedPubKey exist', storedPubKey);
        const { secretKey, mnemonic } = await this.retrieveSecretKey(storedPubKey);
        return { secretKey, publicKey: storedPubKey, mnemonic };
      }
      // return this.createAndStoreKeyPair(credential);
      return this.createAndStoreKeyPairUnencrypted(credential, nostrProfileMetadata);
    } catch (error) {
      console.log('error', error);
      return undefined;
    }

  }

  static getPublicKey() {
    const storedPubKey = localStorage.getItem(NostrKeyManager.STORAGE_KEY);

    return storedPubKey;
  }

  static async getDecryptedPrivateKey(): Promise<
    | {
      secretKey: string;
      publicKey: string;
      mnemonic: string;
    }
    | undefined
  > {
    const storedPubKey = localStorage.getItem(NostrKeyManager.STORAGE_KEY);

    if (storedPubKey) {
      const { secretKey, mnemonic } = await this.sessionRetrieveEncryptedData(storedPubKey);
      return { secretKey, publicKey: storedPubKey, mnemonic };
    }
    return undefined;
  }

  static getIsWalletSetup() {
    const isWalletSetup = localStorage.getItem(NostrKeyManager.IS_CASHU_WALLET_SETUP);
    return isWalletSetup;
  }

  private static async createAndStoreKeyPairUnencrypted(credential?: Credential | null, nostrProfileMetadata?: NDKUserProfile): Promise<{
    secretKey: string;
    publicKey: string;
    mnemonic: string;
  }> {
    const { publicKey, privateKey: secretKey } = generateRandomKeypair();
    // const publicKey = getPublicKey(secretKey);
    const mnemonic = Bip39.generateMnemonic(128, undefined, Bip39.wordlists['english']);

    await this.storeSecretKey(secretKey, publicKey, mnemonic, credential, nostrProfileMetadata);
    localStorage.setItem(NostrKeyManager.STORAGE_KEY, publicKey);

    return { secretKey, publicKey, mnemonic };
  }

  // Store the secret key in the local storage
  // TODO: Passkey optionnal
  private static async storeSecretKey(
    secretKey: string,
    publicKey: string,
    mnemonic: string,
    credentialProps?: Credential | null,
    nostrProfileMetadata?: NDKUserProfile,
  ): Promise<void> {
    const encoder = new TextEncoder();
    const credential =
      credentialProps ??
      (await navigator.credentials.create({
        publicKey: {
          challenge: encoder.encode('nostr-key-challenge'),
          rp: { name: 'Nostr Connect App' },
          user: {
            id: encoder.encode(publicKey),
            name: 'Nostr User',
            displayName: 'Nostr User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        },
      }));

    if (credential && credential.type === 'public-key') {
      const pkCred = credential as PublicKeyCredential;
      const rawId = Array.from(new Uint8Array(pkCred.rawId));

      // Generate a random salt
      const salt = crypto.getRandomValues(new Uint8Array(16));

      localStorage.setItem(
        `${NostrKeyManager.SALT_KEY_PREFIX}${publicKey}`,
        JSON.stringify(Array.from(salt)),
      );

      // Encrypt the secret key
      const encryptedKey = await this.encryptSecretKey(secretKey, rawId, salt);
      console.log('encryptedkey', encryptedKey);

      const encryptedMnemonic = await this.encryptSecretKey(mnemonic, rawId, salt);
      console.log('encryptedMnemonic', encryptedMnemonic);

      const seedHex = Bip39.mnemonicToSeedSync(mnemonic).toString('hex');

      const encryptedSeed = await this.encryptSecretKey(seedHex, rawId, salt);
      console.log('encryptedSeed', encryptedSeed);
      localStorage.setItem(
        `${NostrKeyManager.CRED_KEY_PREFIX}${publicKey}`,
        JSON.stringify({ rawId, encryptedKey, mnemonic: encryptedMnemonic }),
      );
      localStorage.setItem(
        `${NostrKeyManager.SALT_KEY_PREFIX}${publicKey}`,
        JSON.stringify(Array.from(salt)),
      );

      localStorage.setItem(
        `${NostrKeyManager.CRED_KEY_PREFIX}${publicKey}`,
        JSON.stringify({ rawId, encryptedKey, mnemonic: encryptedMnemonic }),
      );

      // Add multi account
      NostrKeyManager.NOSTR_WALLETS[publicKey] = {
        secretKey,
        publicKey,
        mnemonic,
        seed: encryptedSeed,
        salt: JSON.stringify(salt),
        rawId: JSON.stringify(rawId),
        nostrProfile: nostrProfileMetadata,
        ...nostrProfileMetadata,
      };
      localStorage.setItem(
        `${NostrKeyManager.NOSTR_WALLETS_ACCOUNT_UNENCRYPTED_PREFIX}`,
        JSON.stringify(NostrKeyManager.NOSTR_WALLETS),
      );

      // Multi account encrypted
      NostrKeyManager.NOSTR_WALLETS_ENCRYPTED[publicKey] = {
        secretKey: encryptedKey,
        publicKey,
        mnemonic: encryptedMnemonic,
        seed: encryptedSeed,
        salt: JSON.stringify(salt),
        rawId: JSON.stringify(rawId),
        nostrProfile: nostrProfileMetadata,
        ...nostrProfileMetadata,

      };

      localStorage.setItem(
        `${NostrKeyManager.NOSTR_WALLETS_ACCOUNT_ENCRYPTED_PREFIX}`,
        JSON.stringify(NostrKeyManager.NOSTR_WALLETS_ENCRYPTED),
      );


      localStorage.setItem(`${NostrKeyManager.IS_CASHU_WALLET_SETUP}`, 'true');
    } else {
      throw new Error('Failed to create credential');
    }
  }

  private static async retrieveSecretKey(publicKey: string): Promise<{
    secretKey: string;
    mnemonic: string;
  }> {
    const storedCred = localStorage.getItem(`nostr_cred_${publicKey}`);
    const storedSalt = localStorage.getItem(`${NostrKeyManager.SALT_KEY_PREFIX}${publicKey}`);
    if (!storedCred || !storedSalt) throw new Error('No stored credential or salt found');

    const { rawId, encryptedKey, mnemonic } = JSON.parse(storedCred);
    const encoder = new TextEncoder();
    const salt = new Uint8Array(JSON.parse(storedSalt));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: encoder.encode('nostr-key-challenge'),
        allowCredentials: [
          {
            id: new Uint8Array(rawId),
            type: 'public-key',
          },
        ],
      },
    });

    if (assertion && assertion.type === 'public-key') {
      const decryptedPrivateKey = await this.decryptSecretKey(encryptedKey, rawId, salt);
      const decryptedMnemonic = await this.decryptSecretKey(mnemonic, rawId, salt);

      return { secretKey: decryptedPrivateKey, mnemonic: decryptedMnemonic };
    }
    throw new Error('Failed to retrieve credential');
  }

  private static async encryptSecretKey(
    secretKey: string,
    rawId: number[],
    salt: Uint8Array,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secretKey);

    const baseKey = await crypto.subtle.importKey('raw', new Uint8Array(rawId), 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ]);

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: NostrKeyManager.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

    const encryptedArray = new Uint8Array(encryptedData);
    const resultArray = new Uint8Array(iv.length + encryptedArray.length);
    resultArray.set(iv);
    resultArray.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode.apply(null, resultArray as any));
  }

  private static async decryptSecretKey(
    encryptedKey: string,
    rawId: number[],
    salt: Uint8Array,
  ): Promise<string> {
    const encryptedData = Uint8Array.from(atob(encryptedKey), (c) => c.charCodeAt(0));

    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);

    const baseKey = await crypto.subtle.importKey('raw', new Uint8Array(rawId), 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ]);

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: NostrKeyManager.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );

    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

    const decoder = new TextDecoder();
    const decryptedPrivateKey = decoder.decode(decryptedData);
    return decryptedPrivateKey;
  }

  private static async sessionRetrieveEncryptedData(publicKey: string): Promise<{
    secretKey: string;
    mnemonic: string;
  }> {
    const storedCred = localStorage.getItem(`nostr_cred_${publicKey}`);
    const storedSalt = localStorage.getItem(`${NostrKeyManager.SALT_KEY_PREFIX}${publicKey}`);
    if (!storedCred || !storedSalt) throw new Error('No stored credential or salt found');

    const { rawId, encryptedKey, mnemonic } = JSON.parse(storedCred);
    const encoder = new TextEncoder();
    const salt = new Uint8Array(JSON.parse(storedSalt));

    const decryptedPrivateKey = await this.decryptSecretKey(encryptedKey, rawId, salt);
    const decryptedMnemonic = await this.decryptSecretKey(mnemonic, rawId, salt);

    return { secretKey: decryptedPrivateKey, mnemonic: decryptedMnemonic };
  }
}
