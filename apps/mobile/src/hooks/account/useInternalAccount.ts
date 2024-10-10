import { getEncodedToken, Proof, Token } from '@cashu/cashu-ts';
import { getProofs, useCashu, useCashuStore, useNostrContext } from 'afk_nostr_sdk';
import { useDialog, useToast } from '../modals';
import { PasskeyManager } from '../../utils/storage/passkey-manager';
import { WalletManager } from '../../utils/storage/wallet-manager';
import { useState } from 'react';
import { DEFAULT_PASSKEY_VALUES, GeneratePasskeyValues } from '../../types/storage';
import { NostrKeyManager } from '../../utils/storage/nostr-key-manager';
import { generateRandomKeypair } from 'afk_nostr_sdk/src/utils/keypair';
import {
  retrieveAndDecryptCashuMnemonic,
  storeCashuMnemonic,
  storePassword,
  storePrivateKey,
  storePublicKey,
} from '../../utils/storage';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { Platform } from 'react-native';
import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

export const useInternalAccount = () => {
  const { meltTokens, wallet, generateMnemonic } = useCashu();
  const { showDialog, hideDialog } = useDialog();
  const { ndk } = useNostrContext();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { showToast } = useToast()
  const [isConnected, setIsConnected] = useState(false);
  const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);
  const { setIsSeedCashuStorage } = useCashuStore();



  const handleGeneratePasskey = async (publicKey?: string) => {

    try {
      const isWalletSetup = await PasskeyManager.getIsWalletSetup()
      console.log("isWalletSetup", isWalletSetup)

      // if (isWalletSetup) return;

      if (isWalletSetup && isWalletSetup == "true") {
        // const result = await PasskeyManager.getDecryptedPrivateKey()
        // if (!result) {
        //   showToast({ title: "Authentification issue.", type: "error" })

        //   // return router.push("/onboarding")

        // } else {
        //   const { secretKey, mnemonic, publicKey, strkPrivateKey } = result
        //   console.log("result", result)
        //   showToast({ title: "Authentification succed.", type: "success" })

        //   setIsConnected(true)
        // }
        return undefined;

      } else if (!isWalletSetup) {
        const passkeyToGenerate = DEFAULT_PASSKEY_VALUES
        passkeyToGenerate.publicKey = publicKey
        showToast({ title: "Passkey in process", type: "info" })

        const result = await PasskeyManager.generatePasskeyAndSave(passkeyToGenerate)
        if (!result) {
          showToast({ title: "Passkey issue.", type: "error" })
          // return router.push("/onboarding")

        } else {
          showToast({ title: "Passkey generated", type: "success" })

          return result
        }
      }

      return undefined;
    } catch (error) {
      console.log("handleGeneratePasskey error", error)

    }


  }

  const handleGenerateWallet = async (passkey?: Credential | null) => {

    try {
      const isWalletSetup = await PasskeyManager.getIsWalletSetup()
      console.log("isWalletSetup", isWalletSetup)

      if (passkey) {
        const res = await WalletManager.getOrCreateKeyPairWithCredential(passkey)
        console.log("res", res)
        const { secretKey, mnemonic, publicKey, strkPrivateKey } = res
        showToast({ title: "Wallet generated successfully.", type: "success" })

        setIsConnected(true)
      }
      else if (!passkey) {
        const result = await PasskeyManager.generatePasskeyAndSave(DEFAULT_PASSKEY_VALUES)
        if (!result) {

          showToast({ title: "Authentification issue.", type: "error" })
          // return router.push("/onboarding")

        } else {
          const credential = result
          const res = await WalletManager.getOrCreateKeyPairWithCredential(passkey ?? result)
          console.log("res", res)
          const { secretKey, mnemonic, publicKey, strkPrivateKey } = res
          showToast({ title: "Wallet generated successfully.", type: "success" })

          setIsConnected(true)
        }
      }

    } catch (error) {
      console.log("handleGenerateWallet error", error)

    }


  }


  const handleGenerateNostrWallet = async (passkey?: Credential | null): Promise<{
    secretKey?: string,
    mnemonic?: string,
    publicKey?: string,
  } | undefined> => {

    let resultNostr: {
      secretKey?: string,
      mnemonic?: string,
      publicKey?: string,
    } = {};
    try {
      console.log("handleGenerateNostrWallet")


      if (passkey) {
        const res = await NostrKeyManager.getOrCreateKeyPair(passkey)
        console.log("res", res)
        const { secretKey, mnemonic, publicKey } = res
        showToast({ title: "Nostr wallet generated successfully.", type: "success" })
        resultNostr.secretKey = secretKey
        resultNostr.mnemonic = mnemonic
        resultNostr.publicKey = publicKey
        let resultNostrValue = {
          secretKey,
          mnemonic,
          publicKey,
        };
        console.log("resultNostrValue", resultNostrValue)
        setIsConnected(true)
        return resultNostr

      }
      else if (!passkey) {
        const result = await PasskeyManager.generatePasskeyAndSave(DEFAULT_PASSKEY_VALUES)
        if (!result) {

          showToast({ title: "Passkey issue.", type: "error" })
          // return router.push("/onboarding")

        } else {
          const credential = result
          const res = await NostrKeyManager.getOrCreateKeyPair(passkey ?? result)
          console.log("res", res)
          const { secretKey, mnemonic, publicKey } = res
          resultNostr.secretKey = secretKey
          resultNostr.mnemonic = mnemonic
          resultNostr.publicKey = publicKey
          let resultNostrValue = {
            secretKey,
            mnemonic,
            publicKey,
          };
          console.log("resultNostrValue", resultNostrValue)

          showToast({ title: "Nostr Wallet generated successfully.", type: "success" })
          setIsConnected(true)
          return resultNostrValue;
        }
      }
      console.log("resultNostr", resultNostr)

      return resultNostr;

    } catch (error) {
      console.log("Error handleGenerateNostrWallet", error)
      return resultNostr
    }


  }



  const handleGenerateNostrWalletOld = async (username: string, password: string, passkey?: Credential | null,) => {

    try {
      const { privateKey, publicKey } = generateRandomKeypair();
      await storePassword(password);
      await storePrivateKey(privateKey, password);
      await storePublicKey(publicKey);

      try {
        const mnemonicSaved = await retrieveAndDecryptCashuMnemonic(password);

        if (!mnemonicSaved) {
          const mnemonic = await generateMnemonic();
          await storeCashuMnemonic(mnemonic, password);
          setIsSeedCashuStorage(true);
        }
      } catch (e) {
        console.log('error cashu wallet', e);
      }


      try {
        ndk.signer = new NDKPrivateKeySigner(privateKey);
        const ndkUser = ndk.getUser({ pubkey: publicKey });
        ndkUser.profile = { nip05: username, displayName: username };
        await ndkUser.publish();
      } catch (e) {
        console.log("error ndk user setup")

      }


      const biometySupported = Platform.OS !== 'web' && canUseBiometricAuthentication();
      if (biometySupported) {
        showDialog({
          title: 'Easy login',
          description: 'Would you like to use biometrics to login?',
          buttons: [
            {
              type: 'primary',
              label: 'Yes',
              onPress: async () => {
                await storePassword(password);
                hideDialog();
              },
            },
            {
              type: 'default',
              label: 'No',
              onPress: hideDialog,
            },
          ],
        });
      }

      return { privateKey, publicKey }
    } catch (error) {
      console.log("handleGenerateNostrWalletOld error", error)
      return { privateKey: undefined, publicKey: undefined }

    }

  }


  const handleSavedNostrWalletOld = async (username: string,
    password: string,
    privateKey: string,
    publicKey: string,
    passkey?: Credential | null,) => {

    try {
      await storePassword(password);
      await storePrivateKey(privateKey, password);
      await storePublicKey(publicKey);

      try {
        const mnemonicSaved = await retrieveAndDecryptCashuMnemonic(password);

        if (!mnemonicSaved) {
          const mnemonic = await generateMnemonic();
          await storeCashuMnemonic(mnemonic, password);
          setIsSeedCashuStorage(true);
        }
      } catch (e) {
        console.log('error cashu wallet', e);
      }


      try {
        ndk.signer = new NDKPrivateKeySigner(privateKey);
        const ndkUser = ndk.getUser({ pubkey: publicKey });
        ndkUser.profile = { nip05: username, displayName: username };
        await ndkUser.publish();
      } catch (e) {
        console.log("error ndk user setup")

      }


      const biometySupported = Platform.OS !== 'web' && canUseBiometricAuthentication();
      if (biometySupported) {
        showDialog({
          title: 'Easy login',
          description: 'Would you like to use biometrics to login?',
          buttons: [
            {
              type: 'primary',
              label: 'Yes',
              onPress: async () => {
                await storePassword(password);
                hideDialog();
              },
            },
            {
              type: 'default',
              label: 'No',
              onPress: hideDialog,
            },
          ],
        });
      }

      return { privateKey, publicKey }
    } catch (error) {
      console.log("handleGenerateNostrWalletOld error", error)
      return { privateKey: undefined, publicKey: undefined }

    }

  }


  return {
    handleGeneratePasskey,
    handleGenerateWallet,
    handleGenerateNostrWallet,
    handleGenerateNostrWalletOld,
    handleSavedNostrWalletOld
  };
};
