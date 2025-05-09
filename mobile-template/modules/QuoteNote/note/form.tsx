import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useLN, useProfile, useQuote, useRepost, useSendZapNote } from 'afk_nostr_sdk';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar, Button, Input, Modalize, Text } from '../../../components';
import { useStyles } from '../../../hooks';
import { useToast } from '../../../hooks/modals';
import { TipSuccessModalProps } from '../../TipSuccessModal';
import stylesheet from './styles';
import { useQuoteNoteModal } from '@/hooks/modals/useQuoteNoteModal';
import { useQueryClient } from '@tanstack/react-query';

export type QuoteNostrModal = Modalize;

export type FormQuoteNostrProps = {
  event?: NDKEvent;
  ref?: any;
  show: (event: NDKEvent) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const FormQuoteNostr: React.FC<FormQuoteNostrProps> = ({
  event,
  hide: hideTipModal,
  showSuccess,
  hideSuccess,
  ref,
}: FormQuoteNostrProps) => {
  const styles = useStyles(stylesheet);

  const { mutate: mutateSendZapNote } = useSendZapNote();

  const { show } = useQuoteNoteModal();
  const [quoteContent, setQuoteContent] = useState<string>('');
  const { handleZap, getInvoiceFromLnAddress, payInvoice } = useLN();
  const { data: profile } = useProfile({ publicKey: event?.pubkey });
  const { showToast } = useToast();
  const isActive = !!quoteContent;

  console.log('profile nip', profile);
  console.log('lud06', profile?.lud06);
  console.log('lud16', profile?.lud16);
  console.log('nip', profile?.nip05);

  const repostMutation = useRepost({ event });

  const queryClient = useQueryClient();
  const quoteMutation = useQuote({ event, content: quoteContent, tags: [['e', event?.id ?? '', '', 'root', event?.pubkey ?? '']] });
  const handleSendQuote = async () => {
    if (!quoteContent || quoteContent?.trim().length == 0) {
      showToast({ type: 'error', title: 'Please write your comment' });
      return;
    }
    // await handleCheckNostrAndSendConnectDialog();

    quoteMutation.mutate(
      {
        // event, content: quoteContent, tags: [['e', event?.id ?? '', '', 'root', event?.pubkey ?? '']] 
        event, content: quoteContent, tags: [['e', event?.id ?? '', '', 'root', event?.pubkey ?? ''], ['q', event?.id ?? '', '', 'root', event?.pubkey ?? '']]
      },
      {
        onSuccess() {
          showToast({ type: 'success', title: 'Comment sent successfully' });
          queryClient.invalidateQueries({ queryKey: ['replyNotes', event?.id] });
          // setComment('');
        },
        onError() {
          showToast({
            type: 'error',
            title: 'Error! Comment could not be sent. Please try again later.',
          });
        },
      },
    );
  };


  return (
    <View>
      <Text>Quote or Repost Note</Text>
      {/* <Text>Quote Note</Text> */}
      <ScrollView>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Input value={quoteContent} onChangeText={setQuoteContent} placeholder="Content" />


          </View>

          <View style={styles.cardContent}>

            {/* <View style={styles.cardContentText}> */}

            <Text
              fontSize={20}
              weight="medium"
              color="text"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.cardContentText}
            >
              {event?.content}
            </Text>
            {/* </View> */}





          </View>

          <View style={styles.cardInfo}>
            <Text
              fontSize={15}
              color="text"
              weight="bold"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {profile?.displayName ?? profile?.name ?? event?.pubkey}
            </Text>

            {profile?.nip05 && (
              <Text fontSize={11} color="textLight" weight="regular">
                @{profile?.nip05}
              </Text>
            )}
          </View>

          <View>
            {profile?.lud16 && (
              <Text fontSize={11} color="textLight" weight="regular">
                LN Address: {profile?.lud16}
              </Text>
            )}
          </View>

          <View></View>


        </View>


        <View style={styles.submitButton}>
          <Button variant="secondary" disabled={!isActive} onPress={handleSendQuote}>
            Quote
          </Button>
        </View>

        <Text
          weight="semiBold"
          color="inputPlaceholder"
          fontSize={13}
          align="center"
          style={styles.comment}
        >
          Quote or Repost Note
        </Text>
      </ScrollView>

    </View>
  );
};
// FormTipStarknet.displayName = 'FormTipStarknet';
