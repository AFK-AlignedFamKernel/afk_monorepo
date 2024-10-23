import { AuthLoginScreenProps, MainStackNavigationProps } from '../../../types';
import { LoginNostrModule } from '../../../modules/Login';
export const LoginNostr: React.FC<AuthLoginScreenProps> = ({ navigation }) => {
  return (
    <LoginNostrModule isNavigationAfterLogin={true} navigationProps={navigation}></LoginNostrModule>
  );
};
