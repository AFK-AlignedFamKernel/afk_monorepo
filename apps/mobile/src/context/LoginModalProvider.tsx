import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { Modalize } from '../components';
import { TipSuccessModal, TipSuccessModalProps } from '../modules/TipSuccessModal';
import { SharedAuthModalModule } from '../modules/Login/SharedModal';

export type LoginModalContextType = {
  show: () => void;
  hide: () => void;

  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const LoginModalContext = createContext<LoginModalContextType | null>(null);
export type LoginModal = Modalize;

export const LoginModalProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const loginModalRef = useRef<LoginModal>(null);

  const [successModal, setSuccessModal] = useState<TipSuccessModalProps | null>(null);

  const show = useCallback(() => {
    loginModalRef.current?.open();
  }, []);

  const hide = useCallback(() => {
    loginModalRef.current?.close();
  }, []);

  const showSuccess = useCallback((props: TipSuccessModalProps) => {
    setSuccessModal(props);
  }, []);

  const hideSuccess = useCallback(() => {
    setSuccessModal(null);
  }, []);

  const context = useMemo(
    () => ({ show, hide, showSuccess, hideSuccess }),
    [show, hide, showSuccess, hideSuccess],
  );

  return (
    <LoginModalContext.Provider value={context}>
      {children}

      <Modalize
        modalStyle={{
          height: '100%',
          width: '100%',
          borderRadius: 20,
        }}
        childrenStyle={{
          height: '100%',
          // flex: 1,
        }}
        modalTopOffset={0}
        adjustToContentHeight={true}
        ref={loginModalRef}
      >
        <SharedAuthModalModule handleSuccess={hide} />

        {/* <View 
          style={{ 
            flex: 1, 
            // height: 'auto',
            height: '100%',
            // minHeight: '100%',
            // padding: '8px 16px 16px',
            // overflow: 'auto'
          }}
        >
          <SharedAuthModalModule handleSuccess={hide} />
        </View> */}
      </Modalize>

      {successModal && <TipSuccessModal {...successModal} />}
    </LoginModalContext.Provider>
  );
};
