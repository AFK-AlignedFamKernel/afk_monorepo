import {useState} from 'react';
import {View} from 'react-native';

import {TextButton} from '../../components';
import {StarkConnectModal} from './StarkModal';

export const LoginStarknet = () => {
  const [showConnect, setShow] = useState(false);

  return (
    <View>
      {showConnect && <StarkConnectModal hide={() => setShow(false)} />}
      <TextButton
        onPress={() => {
          setShow(true);
        }}
      >
        Starknet Login
      </TextButton>
    </View>
  );
};
