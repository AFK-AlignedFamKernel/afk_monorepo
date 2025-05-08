import { View } from 'react-native';

import { Text } from '../../../components';
import { AddressComponent } from '../../../components/AddressComponent';
import { useStyles } from '../../../hooks';
import stylesheet from './styles';

export type DaoDetailProps = {
  dao: any;
};

export const DaoDetail: React.FC<DaoDetailProps> = ({ dao }) => {
  const styles = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Contract address</Text>
          <AddressComponent address={dao.contractAddress} textStyle={styles.addressValue} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>Creator</Text>
          <AddressComponent address={dao.creator} textStyle={styles.addressValue} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>Token address</Text>
          <AddressComponent address={dao.tokenAddress} textStyle={styles.addressValue} />
        </View>
      </View>
    </View>
  );
};
