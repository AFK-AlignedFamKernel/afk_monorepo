import {FlatList, View} from 'react-native';
import {useStyles} from '../../../hooks';
import {TokenTxInterface} from '../../../types/keys';
import {AddressComponent} from '../../AddressComponent';
import Loading from '../../Loading';
import {Text} from '../../Text';
import stylesheet from './styles';

export type TokenTxProps = {
  loading: boolean;
  tx?: TokenTxInterface[];
};

export const TokenTx: React.FC<TokenTxProps> = ({tx, loading}) => {
  const styles = useStyles(stylesheet);

  if (loading) {
    return <Loading />;
  }

  console.log('tx', tx);
  return (
    <FlatList
      data={tx}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => (
        <View style={styles.container}>
          <View style={styles.txRow}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Coin</Text>
              <View style={styles.addressContainer}>
                <AddressComponent address={item?.memecoin_address} />
              </View>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.label}>Owner</Text>
              <View style={styles.addressContainer}>
                <AddressComponent address={item?.owner_address} />
              </View>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.label}>Transaction Type</Text>
              <View style={[styles.txType, {backgroundColor: item?.transaction_type == 'buy' ? 'green' : 'red'}]}>
                <Text style={styles.txTypeText}>{item?.transaction_type}</Text>
              </View>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.label}>Quote paid</Text>
              <Text style={styles.value}>{item?.quote_amount}</Text>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>{item?.amount}</Text>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.label}>Liquidity raised at this moment</Text>
              <Text style={styles.value}>{item?.liquidity_raised}</Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions available</Text>
        </View>
      }
    />
  );
};
