import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';

import {pbkdf2Decrypt, pbkdf2Encrypt, PBKDF2EncryptedObject} from './encryption';

const isSecureStoreAvailable = Platform.OS === 'android' || Platform.OS === 'ios';
export const KEY_STORE = {
  PUBLIC_KEY: 'publicKey',
  PASSWORD: 'PASSWORD',
  ENCRYPTED_PRIVATE_KEY: 'encryptedPrivateKey',
  ENCRYPTED_CASHU_MNEMONIC: 'encryptedCashuMnemonic',
  ENCRYPTED_CASHU_SEED: 'encryptedCashuSeed',
  AUTH_DATA: 'authData',
  CODE_VERIFIER: 'CODE_VERIFIER',
};
export const storePublicKey = async (publicKey: string) => {
  if (isSecureStoreAvailable) {
    return SecureStore.setItemAsync(KEY_STORE.PUBLIC_KEY, publicKey);
  }

  return AsyncStorage.setItem(KEY_STORE.PUBLIC_KEY, publicKey);
};

export const retrievePublicKey = async (): Promise<string | null> => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(KEY_STORE.PUBLIC_KEY);
  }

  return AsyncStorage.getItem(KEY_STORE.PUBLIC_KEY);
};

export const storePrivateKey = async (privateKeyHex: string, password: string) => {
  try {
    const encryptedPrivateKey = JSON.stringify(pbkdf2Encrypt(privateKeyHex, password));

    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(KEY_STORE.ENCRYPTED_PRIVATE_KEY, encryptedPrivateKey);
    } else {
      await AsyncStorage.setItem(KEY_STORE.ENCRYPTED_PRIVATE_KEY, encryptedPrivateKey);
    }

    return encryptedPrivateKey;
  } catch (error) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Error storing private key');
  }
};

export const storeValue = async (key: string, value: string) => {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

export const retrieveValue = async (key: string): Promise<string | null> => {
  if (isSecureStoreAvailable) {
    return await SecureStore.getItemAsync(key);
  } else {
    return await AsyncStorage.getItem(key);
  }
};

export const storeAuthData = async (data: {
  user: {
    id: string;
    userAddress: string;
    email: string | null;
    verified: boolean;
  };
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}) => {
  const dataString = JSON.stringify(data);

  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(KEY_STORE.AUTH_DATA, dataString);
  } else {
    await AsyncStorage.setItem(KEY_STORE.AUTH_DATA, dataString);
  }
};
export const getAuthData = async () => {
  let dataString;
  if (isSecureStoreAvailable) {
    dataString = await SecureStore.getItemAsync(KEY_STORE.AUTH_DATA);
  } else {
    dataString = await AsyncStorage.getItem(KEY_STORE.AUTH_DATA);
  }
  return dataString ? JSON.parse(dataString) : null;
};

export const retrieveAndDecryptPrivateKey = async (password: string): Promise<false | Buffer> => {
  try {
    const encryptedPrivateKey = isSecureStoreAvailable
      ? await SecureStore.getItemAsync(KEY_STORE.ENCRYPTED_PRIVATE_KEY)
      : await AsyncStorage.getItem(KEY_STORE.ENCRYPTED_PRIVATE_KEY);

    if (!encryptedPrivateKey) return false;

    let parsedEncryptedPrivateKey: PBKDF2EncryptedObject;
    try {
      parsedEncryptedPrivateKey = JSON.parse(encryptedPrivateKey);

      if (!('data' in parsedEncryptedPrivateKey)) throw new Error();
    } catch (e) {
      // If the encrypted private key is not in the expected format, we should remove it
      await AsyncStorage.removeItem(KEY_STORE.ENCRYPTED_PRIVATE_KEY);
      return false;
    }

    return pbkdf2Decrypt(parsedEncryptedPrivateKey, password);
  } catch (e) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Error retrieving and decrypting private key');
  }
};

/** TODO add security for password retrieve in Web view? */
export const storePassword = async (password: string) => {
  if (isSecureStoreAvailable) {
    return await SecureStore.setItemAsync(KEY_STORE.PASSWORD, password, {
      requireAuthentication: true,
    });
  } else {
    return await AsyncStorage.setItem(KEY_STORE.PASSWORD, password);
  }
};

/** TODO add security for password retrieve in Web view? */
export const retrievePassword = async () => {
  if (isSecureStoreAvailable) {
    return await SecureStore.getItemAsync(KEY_STORE.PASSWORD, {requireAuthentication: true});
  } else {
    return await AsyncStorage.getItem(KEY_STORE.PASSWORD);
  }
  return null;
};

/** no password atm */
export const storeCashuMnemonic = async (privateKeyHex: string, password: string) => {
  try {
    const encryptedCashuMnemonic = JSON.stringify(pbkdf2Encrypt(privateKeyHex, password));

    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(KEY_STORE.ENCRYPTED_CASHU_MNEMONIC, encryptedCashuMnemonic);
    } else {
      await AsyncStorage.setItem(KEY_STORE.ENCRYPTED_CASHU_MNEMONIC, encryptedCashuMnemonic);
    }

    return encryptedCashuMnemonic;
  } catch (error) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Error storing private key');
  }
};

// export const storeCashuMnemonic = async (privateKeyHex: string, password: string) => {
//   try {
//     const encryptedCashuMnemonic = JSON.stringify(pbkdf2Encrypt(privateKeyHex, password));

//     if (isSecureStoreAvailable) {
//       await SecureStore.setItemAsync('encryptedCashuMnemonic', encryptedCashuMnemonic);
//     } else {
//       await AsyncStorage.setItem('encryptedCashuMnemonic', encryptedCashuMnemonic);
//     }

//     return encryptedCashuMnemonic;
//   } catch (error) {
//     // We shouldn't throw the original error for security reasons
//     throw new Error('Error storing private key');
//   }
// };

export const retrieveAndDecryptCashuMnemonic = async (
  password: string,
): Promise<false | Buffer> => {
  try {
    const encryptedCashuMnemonic = isSecureStoreAvailable
      ? await SecureStore.getItemAsync(KEY_STORE.ENCRYPTED_CASHU_MNEMONIC)
      : await AsyncStorage.getItem(KEY_STORE.ENCRYPTED_CASHU_MNEMONIC);

    if (!encryptedCashuMnemonic) return false;

    let parsedEncryptedMnemonic: PBKDF2EncryptedObject;
    try {
      parsedEncryptedMnemonic = JSON.parse(encryptedCashuMnemonic);

      if (!('data' in parsedEncryptedMnemonic)) throw new Error();
    } catch (e) {
      // If the encrypted private key is not in the expected format, we should remove it
      await AsyncStorage.removeItem(KEY_STORE.ENCRYPTED_CASHU_MNEMONIC);
      return false;
    }

    return pbkdf2Decrypt(parsedEncryptedMnemonic, password);
  } catch (e) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Error retrieving and decrypting cashu mnemonic');
  }
};

/** no password atm */
export const storeCashuSeed = async (privateKeyHex: string, password: string) => {
  try {
    const encryptedCashuMnemonic = JSON.stringify(pbkdf2Encrypt(privateKeyHex, password));

    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(KEY_STORE.ENCRYPTED_CASHU_SEED, encryptedCashuMnemonic);
    } else {
      await AsyncStorage.setItem(KEY_STORE.ENCRYPTED_CASHU_SEED, encryptedCashuMnemonic);
    }

    return encryptedCashuMnemonic;
  } catch (error) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Error storing private key');
  }
};

export const retrieveAndDecryptCashuSeed = async (password: string): Promise<false | Buffer> => {
  try {
    const encryptedCashuMnemonic = isSecureStoreAvailable
      ? await SecureStore.getItemAsync(KEY_STORE.ENCRYPTED_CASHU_SEED)
      : await AsyncStorage.getItem(KEY_STORE.ENCRYPTED_CASHU_SEED);

    if (!encryptedCashuMnemonic) return false;

    let parsedEncryptedMnemonic: PBKDF2EncryptedObject;
    try {
      parsedEncryptedMnemonic = JSON.parse(encryptedCashuMnemonic);

      if (!('data' in parsedEncryptedMnemonic)) throw new Error();
    } catch (e) {
      // If the encrypted private key is not in the expected format, we should remove it
      await AsyncStorage.removeItem(KEY_STORE.ENCRYPTED_CASHU_SEED);
      return false;
    }

    return pbkdf2Decrypt(parsedEncryptedMnemonic, password);
  } catch (e) {
    // We shouldn't throw the original error for security reasons
    throw new Error('Error retrieving and decrypting cashu seed');
  }
};
