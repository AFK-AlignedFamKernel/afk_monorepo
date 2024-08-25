import {useState} from 'react';
import {Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Picker} from '../../../components';
import {Button, Input} from '../../../components';
import {useStyles} from '../../../hooks';
import stylesheet from './styles';

export const CreateGroup: React.FC = () => {
  const styles = useStyles(stylesheet);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('');

  const handleSubmit = () => {
    // Here you would typically handle the form submission,
    // e.g., sending the data to an API
    console.log('Submitted:', {groupName, groupType});
  };

  return (
    <SafeAreaView style={styles.container}>
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
            value={groupName}
            onChangeText={setGroupName}
          />
          <Picker
            selectedValue={groupType}
            onValueChange={(itemValue) => setGroupType(itemValue)}
            label=""
          >
            <Picker.Item label="Public" value="public" />
            <Picker.Item label="Private" value="private" />
          </Picker>
        </View>
        <Button>Create Group</Button>
      </View>
    </SafeAreaView>
  );
};
