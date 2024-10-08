import {FlatList, View} from 'react-native';

import {useStyles} from '../../../hooks';
import {TokenTxInterface} from '../../../types/keys';
import {Text} from '../../Text';
import stylesheet from './styles';
import Loading from '../../Loading';

export type TokenTxProps = {
  loading: boolean;
  tx?: TokenTxInterface[];
};

export const TokenTx: React.FC<TokenTxProps> = ({tx, loading}) => {
  const styles = useStyles(stylesheet);

  return loading ? (
    <Loading />
  ) : (
    <FlatList
      data={tx}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Memecoin Address
            </Text>
            <Text fontSize={14}>{item.memecoin_address}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Owner Address:
            </Text>
            <Text fontSize={14}>{item.owner_address}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Tx Type
            </Text>
            <Text fontSize={14}>{item.transaction_type}</Text>
          </View>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Coin Received
            </Text>
            <Text fontSize={14}>{item.amount}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={{paddingTop: 40}}>
          <Text style={{textAlign: 'center'}}>No transactions available</Text>
        </View>
      }
    />
  );
};
