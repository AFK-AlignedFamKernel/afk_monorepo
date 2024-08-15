import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useAccount } from '@starknet-react/core';
import { forwardRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CallData, uint256 } from 'starknet';

import { Avatar, Button, Input, Modalize, Picker, Text } from '../../components';
import { ESCROW_ADDRESSES } from '../../constants/contracts';
import { CHAIN_ID } from '../../constants/env';
import { DEFAULT_TIMELOCK, Entrypoint } from '../../constants/misc';
import { TOKENS, TokenSymbol } from '../../constants/tokens';
import { useStyles, useTheme, useWaitConnection } from '../../hooks';
import { useProfile } from "afk_nostr_sdk"

import { useTransactionModal } from '../../hooks/modals';
import { useDialog } from '../../hooks/modals/useDialog';
import { useTransaction } from '../../hooks/modals/useTransaction';
import { useWalletModal } from '../../hooks/modals/useWalletModal';
import { TipSuccessModalProps } from '../TipSuccessModal';
import stylesheet from './styles';
import { FormTipStarknet } from './starknet/form';
import { TipModalStarknet } from './starknet';

export type TipModal = Modalize;

enum TipTypeMode {
    ZAP,
    STARKNET
}
export type TipModalProps = {
    event?: NDKEvent;

    show: (event: NDKEvent) => void;
    hide: () => void;
    showSuccess: (props: TipSuccessModalProps) => void;
    hideSuccess: () => void;
};

export const TipModal = forwardRef<Modalize, TipModalProps>(
    ({ event, hide: hideTipModal, showSuccess, hideSuccess, show, hide }, ref) => {
        const styles = useStyles(stylesheet);
        const [tipType, setTipType] = useState<TipTypeMode>(TipTypeMode.STARKNET);
        const theme = useTheme()
        return (
            <Modalize title="Tip"
                ref={ref}
                disableScrollIfPossible={false}
                modalStyle={{
                    ...styles.modal,
                    // flex: 1,
                    // justifyContent: 'center',
                    // alignItems: 'center'
                }}>
                <View style={{
                    flex: 1,
                    flexDirection: "row",
                    gap: 5,
                }}>
                    <Pressable
                        style={{
                            padding: 3,
                            borderRadius: 10,
                            // color: tipType == TipTypeMode.STARKNET ? theme.theme.colors.text : "",
                            backgroundColor: tipType == TipTypeMode.STARKNET ? theme.theme.colors.primary : ""
                        }}
                    >
                        <Text style={{ color: theme.theme.colors.text }}>
                            Starknet tip
                        </Text>
                    </Pressable>
                    <Pressable
                        style={{
                            padding: 3,
                            borderRadius: 10,
                            backgroundColor: tipType == TipTypeMode.ZAP ? theme.theme.colors.primary : "",
                        }}
                    >
                        <Text style={{ color: theme.theme.colors.text }}>
                            Zap coming soon
                        </Text>

                    </Pressable>
                </View>
                {
                    tipType == TipTypeMode.STARKNET &&
                    <FormTipStarknet
                        event={event}
                        show={show}
                        hide={hide}
                        showSuccess={showSuccess}
                        hideSuccess={hideSuccess}
                        ref={ref}

                    >
                    </FormTipStarknet>
                }

            </Modalize >
        );
    },
);
TipModal.displayName = 'TipModal';
