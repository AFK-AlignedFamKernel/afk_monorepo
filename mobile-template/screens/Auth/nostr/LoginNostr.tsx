import {LoginNostrModule} from '../../../modules/Login';
import {AuthLoginScreenProps} from '../../../types';
export const LoginNostr: React.FC<AuthLoginScreenProps> = ({navigation}) => {
  return (
    <LoginNostrModule isNavigationAfterLogin={true} navigationProps={navigation}></LoginNostrModule>
  );
};
