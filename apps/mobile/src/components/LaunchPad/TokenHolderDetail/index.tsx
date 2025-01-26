import {feltToAddress} from 'common';
import {FlatList, View} from 'react-native';

import {useStyles} from '../../../hooks';
import {TokenHoldersInterface} from '../../../types/keys';
import {AddressComponent} from '../../AddressComponent';
import Loading from '../../Loading';
import {Text} from '../../Text';
import stylesheet from './styles';

export type HoldersProps = {
  loading: boolean;
  holders?: TokenHoldersInterface;
};

export const TokenHolderDetail: React.FC<HoldersProps> = ({holders, loading}) => {
  const styles = useStyles(stylesheet);

  if (loading) {
    return <Loading />;
  }

  return (
    <FlatList
      data={holders?.data}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => (
        <View style={styles.container}>
          <View style={styles.holderRow}>
            <Text style={styles.label}>Owner Address</Text>
            <View style={styles.addressContainer}>
              {/* <AddressComponent address={feltToAddress(BigInt(item?.owner_address))} /> */}
              <AddressComponent address={feltToAddress(BigInt(item?.owner))} />
            </View>
          </View>

          <View style={styles.holderRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{item?.amount_owned}</Text>

            {/* <Text style={styles.value}>{item._sum.amount}</Text> */}
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No holders available</Text>
        </View>
      }
    />
  );
};
