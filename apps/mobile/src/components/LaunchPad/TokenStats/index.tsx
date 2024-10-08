import {FlatList, View} from 'react-native';
import {useStyles} from '../../../hooks';
import {TokenStatsInterface} from '../../../types/keys';
import {Text} from '../../Text';
import stylesheet from './styles';
import {Fraction} from '@uniswap/sdk-core';
import {decimalsScale} from '../../../utils/helpers';
import Loading from '../../Loading';

export type TokenStatsProps = {
  loading: boolean;
  stats?: TokenStatsInterface;
};

export const TokenStats: React.FC<TokenStatsProps> = ({stats, loading}) => {
  const styles = useStyles(stylesheet);

  if (!stats && loading) {
    return <Loading />;
  }

  const {price, liquidity_raised} = stats || {};

  // const lastPrice = price ? new Fraction(String(price), decimalsScale(18)).toFixed(18) : '0';
  const lastPrice = price;
  // const liquidityRaised = liquidity_raised
  //   ? new Fraction(String(liquidity_raised), decimalsScale(18)).toFixed(18)
  //   : '0';

  const liquidityRaised = liquidity_raised;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Token Statistics</Text>
      <View style={styles.statContainer}>
        <Text style={styles.label}>Last Price:</Text>
        <Text style={styles.value}>${lastPrice}</Text>
      </View>
      <View style={styles.statContainer}>
        <Text style={styles.label}>Liquidity Raised:</Text>
        <Text style={styles.value}>${liquidityRaised}</Text>
      </View>
    </View>
  );
};
