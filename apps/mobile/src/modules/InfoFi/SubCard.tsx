import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { useStyles } from '../../hooks';
import stylesheet from './styles';
import { MainStackNavigationProps } from '../../types';

interface SubCardProps {
  subInfo: {
    contract_address: string;
    name: string;
    about: string;
    main_tag: string;
    total_amount_deposit: number;
  };
  onPress?: () => void;
}

export const SubCard: React.FC<SubCardProps> = ({ subInfo, onPress }) => {
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('SubPage', { subAddress: subInfo.contract_address });
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.subCard}>
      <View style={styles.subCardHeader}>
        <Text style={styles.subCardTitle}>{subInfo.name}</Text>
        <Text style={styles.subCardSymbol}>{subInfo.main_tag}</Text>
      </View>
      <View style={styles.subCardContent}>
        <Text style={styles.subCardText}>Address: {subInfo.contract_address}</Text>
        <Text style={styles.subCardText}>Total deposit to rewards: {subInfo.total_amount_deposit}</Text>
      </View>
    </Pressable>
  );
};
