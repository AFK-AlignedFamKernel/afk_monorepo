import React from 'react';
import { LightningNetworkScreenProps } from '../../types';
import { LightningNetworkWalletView } from '../../modules/Lightning';
import { View } from 'react-native';

export const LightningNetworkScreen: React.FC<LightningNetworkScreenProps> = () => {
    return (
        <View>
            <LightningNetworkWalletView></LightningNetworkWalletView>
        </View>
    )
};
