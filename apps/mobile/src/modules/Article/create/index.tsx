import {SafeAreaView} from 'react-native-safe-area-context';

import {Text} from '../../../components';
import {useStyles} from '../../../hooks';
import stylesheet from './styles';

export const CreateArticle: React.FC = () => {
  const styles = useStyles(stylesheet);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>New Article</Text>
    </SafeAreaView>
  );
};
