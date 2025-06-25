import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TextButton} from '../../components';
import {useStyles} from '../../hooks';
import {CreatePostScreenProps} from '../../types';
import {FormCreatePost} from './FormPost';
import stylesheet from './styles';

export const CreatePost: React.FC<CreatePostScreenProps> = ({navigation}) => {
  const styles = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
          Cancel
        </TextButton>

        <TextButton
          // style={styles.cancelButton}
          onPress={() => navigation.navigate('CreateChannel')}
        >
          Channel
        </TextButton>
      </SafeAreaView>

      <FormCreatePost></FormCreatePost>
    </View>
  );
};
