import { useStyles } from '../../hooks';
import { OnboardingWalletScreen } from '../../types';
import stylesheet from './styles';
import { OnboardingComponent } from '../../modules/Onboard';
import { View } from 'react-native';

export const Onboarding: React.FC<OnboardingWalletScreen> = ({ navigation }) => {
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.container}>
      <OnboardingComponent></OnboardingComponent>
    </View>
  );
};
