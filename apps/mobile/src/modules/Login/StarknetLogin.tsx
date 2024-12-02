import {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {useAccount} from 'wagmi';

import {TextButton} from '../../components';
import {StarkConnectModal} from './StarkModal';
import {SignMessageModal} from './StarknetSigner';

export const LoginStarknet = ({
  handleNavigation,
  btnText = 'Starknet Login',
  children,
  triggerConnect = true,
}: {
  handleNavigation: () => void;
  btnText?: string;
  children?: React.ReactNode;
  triggerConnect?: boolean;
}) => {
  const {address} = useAccount();
  const [showSignModal, setShowSignModal] = useState(false);
  const [showConnect, setShow] = useState(false);

  const handleCloseModals = () => {
    setShowSignModal(!showSignModal);
    setShow(false);
  };

  const handleOpenSigner = () => {
    setShowSignModal(!showSignModal);
  };

  const onPress = () => {
    if (triggerConnect) {
      setShow(true);
    }
  };

  return (
    <View>
      {showConnect && (
        <StarkConnectModal
          handleToggleSign={() => setShowSignModal(!showSignModal)}
          handleNavigation={handleNavigation}
          hide={() => setShow(false)}
        />
      )}

      {showSignModal && (
        <SignMessageModal
          handleToggleSign={handleOpenSigner}
          handleNavigation={handleNavigation}
          hide={handleCloseModals}
        />
      )}

      {children ? (
        triggerConnect ? (
          <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
        ) : (
          children
        )
      ) : (
        <TextButton
          onPress={() => {
            setShow(true);
          }}
        >
          {btnText}
        </TextButton>
      )}
    </View>
  );
};
