import {View} from 'react-native';

import {useStyles} from '../../hooks';
import {OnboardingComponent} from '../../modules/Onboard';
import {OnboardingWalletScreen} from '../../types';
import stylesheet from './styles';

export const Onboarding: React.FC<OnboardingWalletScreen> = ({navigation}) => {
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.container}>
      <OnboardingComponent></OnboardingComponent>
    </View>
  );
};
