import {CreateAccountModule} from '../../../modules/CreateAccount';
import {AuthCreateAccountScreenProps} from '../../../types';
export const CreateAccount: React.FC<AuthCreateAccountScreenProps> = ({navigation}) => {
  return <CreateAccountModule navigationProps={navigation}></CreateAccountModule>;
};
