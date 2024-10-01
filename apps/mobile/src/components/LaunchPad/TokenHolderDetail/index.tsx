import {FlatList, View} from 'react-native';

import {useStyles} from '../../../hooks';
import {TokenHoldersInterface} from '../../../types/keys';
import {Text} from '../../Text';
import stylesheet from './styles';
import Loading from '../../Loading';

export type HoldersProps = {
  loading: boolean;
  holders?: TokenHoldersInterface;
};

export const TokenHolderDetail: React.FC<HoldersProps> = ({holders, loading}) => {
  const styles = useStyles(stylesheet);

  console.log(holders, 'holders');

  return loading ? (
    <Loading />
  ) : (
    <FlatList
      data={holders?.data}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Owner address:</Text>
            <Text>{item.owner_address}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text weight="semiBold">Amount:</Text>
            <Text>{item._sum.amount}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text weight="semiBold">Number of owner address:</Text>
            <Text>{item._count.owner_address}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<View style={{ paddingTop: 40 }}>
      <Text style={{ textAlign: 'center' }}>No holders available</Text>
    </View>
    }
    />
  );
};
