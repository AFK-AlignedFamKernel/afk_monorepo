import { FlatList, View } from 'react-native';

import { useStyles } from '../../../hooks';
import { TokenTxInterface } from '../../../types/keys';
import { Text } from '../../Text';
import stylesheet from './styles';
import Loading from '../../Loading';

export type TokenTxProps = {
  loading: boolean;
  tx?: TokenTxInterface[];
};

export const TokenTx: React.FC<TokenTxProps> = ({ tx, loading }) => {
  const styles = useStyles(stylesheet);


  return (
    loading ? <Loading /> : 
    <FlatList
      data={tx}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">Total Supply</Text>
            <Text fontSize={14}>{item.total_supply}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">Amount:</Text>
            <Text fontSize={14}>{item.amount}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">Last Price:</Text>
            <Text fontSize={14}>{item.last_price}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text align='center'>No transactions available</Text>}
    />
  );
};
