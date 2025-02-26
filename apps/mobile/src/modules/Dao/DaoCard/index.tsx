import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '../../../components';
import { AddressComponent } from '../../../components/AddressComponent';
import { useStyles } from '../../../hooks';
import { useDimensions } from '../../../hooks/useWindowDimensions';
import { MainStackNavigationProps } from '../../../types';
import { feltToAddress } from '../../../utils/format';
import stylesheet from './styles';

export type DaoCardProps = {
  dao: {
    contractAddress: string;
    tokenAddress: string;
    creator: string;
    starknetAddress: string;
  };
};

export const DaoCard: React.FC<DaoCardProps> = ({ dao }) => {
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  const { isDesktop } = useDimensions();

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={styles.header}>
        <Text ellipsizeMode="tail" style={styles.tokenName}>
          DAO name
        </Text>
        <AddressComponent
          address={feltToAddress(BigInt(dao.contractAddress))}
          textStyle={styles.addressValue}
        />
      </View>
      <View style={styles.divider} />

      <TouchableOpacity
        onPress={() => {
          if (dao && dao.contractAddress) {
            navigation.navigate('DAOPage', {
              daoAddress: dao.contractAddress,
            });
          }
        }}
        style={styles.actionButton}
      >
        <Text style={styles.actionButtonText}>DAO page</Text>
      </TouchableOpacity>
    </View>
  );
};
