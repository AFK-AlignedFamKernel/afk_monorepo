import { NDKEvent } from '@nostr-dev-kit/ndk';
import { forwardRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Modalize, Text } from '../../components';
import { useNostrAuth, useStyles, useTheme } from '../../hooks';
import { TipSuccessModalProps } from '../TipSuccessModal';
import { FormQuoteNostr } from './note/form';
import stylesheet from './styles';
import { useRepost } from 'afk_nostr_sdk';
import { useToast } from '@/hooks/modals';

export type TipModal = Modalize;

enum QuoteNostrTypeMode {
  QUOTE,
  REPOST,
}
export type TipModalProps = {
  event?: NDKEvent;

  show: (event: NDKEvent) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const QuoteNostrModal = forwardRef<Modalize, TipModalProps>(
  ({ event, hide: hideTipModal, showSuccess, hideSuccess, show, hide }, ref) => {
    const styles = useStyles(stylesheet);
    const [tipType, setTipType] = useState<QuoteNostrTypeMode>(QuoteNostrTypeMode.QUOTE);
    const theme = useTheme();
    // const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();

    const { showToast } = useToast();
    const repostMutation = useRepost({ event });
    const handleRepost = async () => {
      if (!event) return;
      try {
        // @TODO fix
        // await handleCheckNostrAndSendConnectDialog();

        await repostMutation.mutateAsync();
        showToast({ title: 'Post reposted successfully', type: 'success' });
      } catch (error) {
        console.error('Repost error:', error);
        showToast({ title: 'Failed to repost', type: 'error' });
      }
    };
    return (
      <Modalize
        title="Quote Note"
        ref={ref}
        disableScrollIfPossible={false}
        modalStyle={{
          ...styles.modal,
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
            onPress={() => setTipType(QuoteNostrTypeMode.QUOTE)}
            style={[
              {
                padding: 3,
                backgroundColor: tipType == QuoteNostrTypeMode.QUOTE ? theme.theme.colors.primary : '',
                ...styles?.option,
              },
              tipType == QuoteNostrTypeMode.QUOTE && styles?.selected,
            ]}
          >
            <Text style={{ color: theme.theme.colors.text }}>Quote</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setTipType(QuoteNostrTypeMode.REPOST)
              handleRepost()
            }

            }
            style={[
              {
                padding: 3,
                ...styles?.option,
              },

              tipType == QuoteNostrTypeMode.REPOST && styles?.selected,
            ]}
          >
            <Text style={{ color: theme.theme.colors.text }}>Repost</Text>
          </Pressable>
        </View>

        {tipType == QuoteNostrTypeMode.QUOTE && (
          <FormQuoteNostr
            event={event}
            show={show}
            hide={hide}
            showSuccess={showSuccess}
            hideSuccess={hideSuccess}
            ref={ref}
          ></FormQuoteNostr>
        )}
      </Modalize>
    );
  },
);
QuoteNostrModal.displayName = 'QuoteNostrModal';
