import {NDKEvent} from '@nostr-dev-kit/ndk';
import {createContext, useCallback, useMemo, useRef, useState} from 'react';
import {Pressable, View, Text, TouchableOpacity} from 'react-native';
import {Modalize} from 'react-native-modalize';
import {useStyles, useTheme} from '../../hooks';
import stylesheet from './styles';
import {TipSuccessModal} from '../../modules/TipSuccessModal';

export type Modal = Modalize;

export type ModalContextType = {
  show: (childrenShow: React.ReactNode) => void;
  hide: () => void;

  showSuccess: (props: any) => void;
  hideSuccess: () => void;
};

export const ModalContext = createContext<ModalContextType | null>(null);

export const ModalParentProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const modalRef = useRef<Modal>(null);
  const [successModal, setSuccessModal] = useState<any | null>(null);
  const [childrenShow, setChildrenShow] = useState<React.ReactNode | undefined>(null);

  const show = useCallback((childrenShow: React.ReactNode) => {
    modalRef.current?.open();
    setChildrenShow(childrenShow);
  }, []);

  const hide = useCallback(() => {
    modalRef.current?.close();
    setChildrenShow(undefined);
  }, []);

  const showSuccess = useCallback((props: any) => {
    setSuccessModal(props);
  }, []);

  const hideSuccess = useCallback(() => {
    setSuccessModal(null);
  }, []);

  const context = useMemo(
    () => ({show, hide, showSuccess, hideSuccess}),
    [show, hide, showSuccess, hideSuccess],
  );

  const theme = useTheme();
  const styles = useStyles(stylesheet);

  return (
    <ModalContext.Provider value={context}>
      {children}

      {childrenShow && (
        <Modalize
          // title="Modal"
          ref={modalRef}
          disableScrollIfPossible={false}
          modalStyle={{
            ...styles.modal,
          }}
        >
          <View
            style={{
              ...styles.modalOverlay,
              flex: 1,
              flexDirection: 'row',
              gap: 5,
            }}
          >
            <View style={styles.modalContent}>
              {childrenShow}

              <TouchableOpacity style={styles.closeButton} onPress={hide}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modalize>
      )}

      {successModal && <TipSuccessModal {...successModal} />}
    </ModalContext.Provider>
  );
};
