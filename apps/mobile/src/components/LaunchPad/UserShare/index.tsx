import { FlatList, View } from 'react-native';

import { useStyles } from '../../../hooks';
import { UserShareInterface } from '../../../types/keys';
import { Text } from '../../Text';
import stylesheet from './styles';
import Loading from '../../Loading';

export type UserShareProps = {
  loading: boolean;
  shares?: UserShareInterface[];
};

export const UserShare: React.FC<UserShareProps> = ({ shares, loading }) => {
  const styles = useStyles(stylesheet);

  return loading ? (
    <Loading />
  ) : (
    <FlatList
      data={shares}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View style={[styles.container, styles.borderBottom]}>
          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Memecoin Address
            </Text>
            <Text fontSize={14}>{item.token_address}</Text>
          </View>

          <View style={styles.borderBottom}>
            <Text fontSize={14} weight="semiBold">
              Coin Recieved
            </Text>
            <Text fontSize={14}>{Number(item.total_supply)}</Text>
          </View>

         
        </View>
      )}
      ListEmptyComponent={<View style={{ paddingTop: 40 }}>
        <Text style={{ textAlign: 'center' }}>No user share available</Text>
      </View>
      }
    />
  );
};
