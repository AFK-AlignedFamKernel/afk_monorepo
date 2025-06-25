import React from 'react';
import {Image, View} from 'react-native';

import {Button} from '@/components/Button';
import {Modal} from '@/components/Modal';
import {Text} from '@/components/Text';
import {useStyles} from '@/hooks';
import stylesheet from './styles';

export type TipSuccessModalProps = {
  user?: string;
  symbol?: string;
  amount?: number;
  hide: () => void;
  children?: React.ReactNode;
};

export const TipSuccessModal: React.FC<TipSuccessModalProps> = ({
  user,
  symbol,
  amount,
  hide,
  children,
}) => {
  const styles = useStyles(stylesheet);

  return (
    <Modal>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Image
            style={styles.logoImage}
            // source={require('../../assets/tipping-modal.png')}
            source={require('../../assets/pepe-logo.png')}
            // source={require('../../assets/pepe-uhoh-unbg.png')}
            resizeMode="cover"
          />
        </View>
      </View>

      <View style={styles.content}>
        {children && children}
        {amount && symbol && (
          <>
            <Text
              color="text"
              weight="bold"
              fontSize={21}
              lineHeight={24}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              Tipped {user}
            </Text>
            <Text color="primary" weight="bold" fontSize={21} lineHeight={24}>
              {amount} {symbol}
            </Text>
          </>
        )}

        <Text color="textSecondary" weight="medium" fontSize={15} lineHeight={24}>
          Keep spreading love
        </Text>
      </View>

      <Button block variant="secondary" onPress={hide}>
        Continue
      </Button>
    </Modal>
  );
};
