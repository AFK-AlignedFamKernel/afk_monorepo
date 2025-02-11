import { useState } from 'react';
import { LoginNostrModule } from '.';
import { CreateAccountModule } from '../CreateAccount';
import { ImportKeysModule } from '../ImportKeys';
import { View } from 'react-native';

interface ISharedAuthModal {
  handleSuccess?: () => void;
  handleSuccessCreateAccount?: () => void;
}
export const SharedAuthModalModule: React.FC<ISharedAuthModal> = ({
  handleSuccess,
}: ISharedAuthModal) => {
  const [currentModule, setCurrentModule] = useState('login');

  const handleGoToCreateAccount = () => {
    setCurrentModule('signup');
  };

  const handleGoToImportKeys = () => {
    setCurrentModule('importKeys');
  };

  const handleGoToLogin = () => {
    setCurrentModule('login');
  };

  return (
    <View style={{ 
      flex: 1,
      // height: '100%',
      // WebkitOverflowScrolling: 'touch',
      // flexDirection: 'column',
      // overflowX: 'hidden',
      // overflowY: 'auto',
    }}>
      {currentModule === 'login' ? (
        <LoginNostrModule
          handleSuccess={handleSuccess}
          handleNavigateCreateAccount={handleGoToCreateAccount}
          handleNavigateImportKeys={handleGoToImportKeys}
        />
      ) : currentModule === 'signup' ? (
        <CreateAccountModule
          handleSuccess={handleSuccess}
          handleNavigateLoginScreen={handleGoToLogin}
        />
      ) : currentModule === 'importKeys' ? (
        <ImportKeysModule 
          handleSuccess={handleSuccess} 
          handleNavigateLoginScreen={handleGoToLogin} 
        />
      ) : null}
    </View>
  );
};
