import {useMemo, useState} from 'react';
import {TouchableOpacity, View, Image} from 'react-native';
import {useAccount} from 'wagmi';

import {Button, TextButton} from '../../components';
import {StarkConnectModal} from './StarkModal';
import {SignMessageModal} from './StarknetSigner';
import {useStyles, useWindowDimensions} from '../../hooks';
import stylesheet from './styles';

export const LoginStarknet = ({
  handleNavigation,
  btnText = 'Starknet Login',
  children,
  triggerConnect = true,
  useCustomBtn = false,
}: {
  handleNavigation: () => void;
  btnText?: string;
  children?: React.ReactNode;
  triggerConnect?: boolean;
  useCustomBtn?: boolean;
}) => {
  const styles = useStyles(stylesheet);
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

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  return (
    <View style={{width: '100%'}}>
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
      ) : useCustomBtn ? (
        <Button
          onPress={() => {
            setShow(true);
          }}
          style={[styles.loginMethodBtn, isDesktop && styles.loginMethodBtnDesktop]}
          textStyle={styles.loginMethodBtnText}
        >
          <View style={styles.btnInnerContainer}>
            <Image
              style={styles.loginMethodBtnImg}
              source={require('./../../assets/starknet.svg')}
            />
            {btnText}
          </View>
        </Button>
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
