import {useQueryClient} from '@tanstack/react-query';
import {useCreateGroup} from 'afk_nostr_sdk';
import {Formik} from 'formik';
import {Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Picker} from '../../../components';
import {Button, Input} from '../../../components';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import stylesheet from './styles';

export const CreateGroup: React.FC = () => {
  const styles = useStyles(stylesheet);
  const {showToast} = useToast();
  const queryClient = useQueryClient();
  const {mutate} = useCreateGroup();

  const initialValues = {
    groupName: '',
    groupType: 'private',
  };

  return (
    <SafeAreaView style={styles.container}>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          mutate(
            {
              groupType: 'private',
              groupName: values.groupName,
            },
            {
              onSuccess() {
                showToast({type: 'success', title: 'Group Created successfully'});
                queryClient.invalidateQueries({queryKey: ['getAllGroups']});
              },
              onError() {
                showToast({
                  type: 'error',
                  title: 'Error! Group could not be created. Please try again later.',
                });
              },
            },
          );
        }}
      >
        {({handleChange, handleBlur, handleSubmit, values}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Create a New Group</Text>
              <Text style={styles.cardDescription}>Add a new group and set its privacy level.</Text>
            </View>
            <View style={styles.cardContent}>
              <Input
                style={styles.input}
                placeholderTextColor={styles.input as unknown as string}
                placeholder="Enter group name"
                value={values.groupName}
                onBlur={handleBlur('groupName')}
                onChangeText={handleChange('groupName')}
              />
              <Picker
                selectedValue={values.groupType}
                onValueChange={(itemValue) => handleChange('groupType')}
                label=""
              >
                <Picker.Item label="Public" value="public" />
                <Picker.Item label="Private" value="private" />
              </Picker>
            </View>
            <Button onPress={() => handleSubmit()}>Create Group</Button>
          </View>
        )}
      </Formik>
    </SafeAreaView>
  );
};
