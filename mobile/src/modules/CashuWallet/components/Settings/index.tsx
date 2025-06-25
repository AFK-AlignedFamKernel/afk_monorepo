/* eslint-disable @typescript-eslint/no-non-null-assertion */
// import '../../../../../applyGlobalPolyfills';

import React, { useEffect, useState } from 'react';
import { Button, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CloseIcon } from '../../../../assets/icons';
import { useStyles, useTheme } from '../../../../hooks';
import stylesheet from './styles';
import Checkbox from 'expo-checkbox';
import { useSignerTypeStorage } from '../../../../hooks/useStorageState';
import { useCashuStore } from 'afk_nostr_sdk';
import { Icon, Input } from 'src/components';
interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const styles = useStyles(stylesheet);
  const { theme } = useTheme();

  const { seed, setSeed, seedString } = useCashuStore();

  console.log("seed", seed)
  console.log("seedString", seedString)
  const [seedSelected, setSeedSelected] = useState(false);
  const [privKeySelected, setPrivKeySelected] = useState(false);

  const { value: signerType, setValue: setSignerType } = useSignerTypeStorage();

  const [showSeed, setShowSeed] = useState(false);
  const handleSelectSeed = () => {
    setPrivKeySelected(false);
    setSeedSelected(true);
    setSignerType('SEED');
  };



  const handleSelectPrivKey = () => {
    setPrivKeySelected(true);
    setSeedSelected(false);
    setSignerType('PRIVATEKEY');
  };

  useEffect(() => {
    if (signerType === 'PRIVATEKEY') {
      setPrivKeySelected(true);
      setSeedSelected(false);
    } else {
      setPrivKeySelected(false);
      setSeedSelected(true);
    }
  }, [signerType]);

  return (
    <View style={styles.modalTabContentContainer}>
      <TouchableOpacity
        onPress={onClose}
        style={{ position: 'absolute', top: 15, right: 15, zIndex: 2000 }}
      >
        <CloseIcon width={30} height={30} color={theme.colors.primary} />
      </TouchableOpacity>
      <Text style={styles.modalTabContentTitle}>Wallet Settings</Text>
      {/* <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Signer Type</Text>
        <View style={styles.checkboxContainer}>
          <Checkbox style={styles.checkbox} value={seedSelected} onValueChange={handleSelectSeed} />
          <Text style={styles.checkboxLabel}>Wallet Seed Phrase</Text>
        </View>
        <View style={styles.checkboxContainer}>
          <Checkbox
            style={styles.checkbox}
            value={privKeySelected}
            onValueChange={handleSelectPrivKey}
          />
          <Text style={styles.checkboxLabel}>Private Key</Text>
        </View>
      </View> */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Seed</Text>

        {seedString &&
          <>

            {/* <TouchableOpacity style={styles.showSeedButton} onPress={() => setShowSeed(!showSeed)}>Show</TouchableOpacity> */}
            <View style={styles.passwordInputContainer}
            >
              <TextInput
                onPress={() => setShowSeed(!showSeed)}

                value={seedString}
                // onChangeText={setPassword}
                secureTextEntry={showSeed == false}
                placeholder="Enter your password"
                style={styles.passwordInput}
              />
              <TouchableOpacity onPress={() => setShowSeed(!showSeed)}>

                <Icon
                  onPress={() => setShowSeed(!showSeed)}
                  name={'EyeIcon'} size={20} color={'grayInput'} style={styles.eyeIcon} />

              </TouchableOpacity>

            </View>
          </>

        }
        {/* {seed &&
        <Text>{Buffer.from(seed).toString('hex')}</Text>
        
        } */}
      </View>
    </View>
  );
};
