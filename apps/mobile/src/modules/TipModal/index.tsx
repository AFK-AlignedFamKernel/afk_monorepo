import {NDKEvent} from '@nostr-dev-kit/ndk';
import {forwardRef, useState} from 'react';
import {Pressable, View} from 'react-native';

import {Modalize, Text} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {TipSuccessModalProps} from '../TipSuccessModal';
import {FormLightningZap} from './lightning/form';
import {FormTipStarknet} from './starknet/form';
import stylesheet from './styles';

export type TipModal = Modalize;

enum TipTypeMode {
  ZAP,
  STARKNET,
}
export type TipModalProps = {
  event?: NDKEvent;

  show: (event: NDKEvent) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const TipModal = forwardRef<Modalize, TipModalProps>(
  ({event, hide: hideTipModal, showSuccess, hideSuccess, show, hide}, ref) => {
    const styles = useStyles(stylesheet);
    const [tipType, setTipType] = useState<TipTypeMode>(TipTypeMode.STARKNET);
    const theme = useTheme();
    return (
      <Modalize
        title="Tip"
        ref={ref}
        disableScrollIfPossible={false}
        modalStyle={{
          ...styles.modal,
          // flex: 1,
          // justifyContent: 'center',
          // alignItems: 'center'
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            gap: 5,
          }}
        >
          <Pressable
            onPress={() => setTipType(TipTypeMode.STARKNET)}
            style={[
              {
                padding: 3,
                backgroundColor: tipType == TipTypeMode.STARKNET ? theme.theme.colors.primary : '',
                ...styles?.option,
              },
              tipType == TipTypeMode.STARKNET && styles?.selected,
            ]}
          >
            <Text style={{color: theme.theme.colors.text}}>Starknet tip</Text>
          </Pressable>
          <Pressable
            onPress={() => setTipType(TipTypeMode.ZAP)}
            style={[
              {
                padding: 3,
                ...styles?.option,
              },

              tipType == TipTypeMode.ZAP && styles?.selected,
            ]}
          >
            <Text style={{color: theme.theme.colors.text}}>Zap</Text>
          </Pressable>
        </View>
        {tipType == TipTypeMode.STARKNET && (
          <FormTipStarknet
            event={event}
            show={show}
            hide={hide}
            showSuccess={showSuccess}
            hideSuccess={hideSuccess}
            ref={ref}
          ></FormTipStarknet>
        )}

        {tipType == TipTypeMode.ZAP && (
          <FormLightningZap
            event={event}
            show={show}
            hide={hide}
            showSuccess={showSuccess}
            hideSuccess={hideSuccess}
            ref={ref}
          ></FormLightningZap>
        )}
      </Modalize>
    );
  },
);
TipModal.displayName = 'TipModal';
