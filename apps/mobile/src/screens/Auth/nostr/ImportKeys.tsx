import {ImportKeysModule} from '../../../modules/ImportKeys';
import {AuthImportKeysScreenProps} from '../../../types';
export const ImportKeys: React.FC<AuthImportKeysScreenProps> = ({navigation}) => {
  return <ImportKeysModule navigationProps={navigation}></ImportKeysModule>;
};
