import {useState} from 'react';
import {LoginNostrModule} from '.';
import {CreateAccountModule} from '../CreateAccount';
import {ImportKeysModule} from '../ImportKeys';

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

  return currentModule === 'login' ? (
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
    <ImportKeysModule handleSuccess={handleSuccess} handleNavigateLoginScreen={handleGoToLogin} />
  ) : null;
};
