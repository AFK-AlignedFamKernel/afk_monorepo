import { View, Text, TouchableOpacity } from 'react-native';
import { useStyles } from '../../../hooks';
import stylesheet from './styles';
import { formatUnits } from 'viem';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from 'src/types';

interface SubCardProps {
  subInfo?: {
    name?: string;
    main_tag?: string;
    total_ai_score?: string;
    total_vote_score?: string;
    total_tips?: string;
    total_amount_deposit?: string;
    contract_address?: string;
  },
  onPress?: () => void
}

export const AfkSubCard: React.FC<SubCardProps> = ({
  subInfo,
  onPress
}) => {
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  const formatDecimal = (value: any) => {
    if (!value) return '0';
    return formatUnits(BigInt(Math.floor(Number(value) * 1e18)), 18);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('SubPage', { subAddress: subInfo?.contract_address });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.subCard}
      onPress={handlePress}
    >
      <View style={styles.section}>

        <View>
          <Text style={styles.subCardTitle}>{subInfo?.name ?? "AFK"}</Text>
          <Text style={styles.subCardTag}>{subInfo?.main_tag ?? "cypherpunk"}</Text>
        </View>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total AI Score</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subInfo?.total_ai_score)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Vote Score</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subInfo?.total_vote_score)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Tips</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subInfo?.total_tips)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Deposits</Text>
            <Text style={styles.overviewValue}>
              {formatDecimal(subInfo?.total_amount_deposit)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
