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
            <AddressComponent address={feltToAddress(BigInt(item.owner_address))} />
          </View>

          <View style={styles.borderBottom}>
            <Text weight="semiBold">Amount:</Text>
            <Text>{item._sum.amount}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={{paddingTop: 40}}>
          <Text style={{textAlign: 'center'}}>No holders available</Text>
        </View>
      }
    />
  );
};
