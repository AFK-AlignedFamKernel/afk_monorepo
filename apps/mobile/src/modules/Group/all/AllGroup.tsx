import {useNavigation} from '@react-navigation/native';
import {FlatList, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';

import {GlobeIcon, PadlockIcon, SlantedArrowIcon} from '../../../assets/icons';
import {useStyles} from '../../../hooks';
import {MainStackNavigationProps} from '../../../types';
import stylesheet from './styles';

// Mock data for the groups
const groups = [
  {id: '1', name: 'Book Club', type: 'public'},
  {id: '2', name: 'Family', type: 'private'},
  {id: '3', name: 'Work Team', type: 'private'},
  {id: '4', name: 'Hiking Enthusiasts', type: 'public'},
  {id: '5', name: 'Local Community', type: 'public'},
];

export default function AllGroupListComponent() {
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  return (
    <SafeAreaView style={styles.groupContainers}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
      </View>
      <FlatList
        data={groups}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupChat', {groupId: item.id})}
            style={styles.groupItem}
          >
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.name}</Text>
              <View style={styles.groupType}>
                {item.type === 'private' ? (
                  <PadlockIcon stroke="gray" />
                ) : (
                  <GlobeIcon stroke="gray" />
                )}
                <Text style={styles.groupTypeText}>{item.type}</Text>
              </View>
            </View>
            <View>
              <SlantedArrowIcon stroke="gray" />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}
