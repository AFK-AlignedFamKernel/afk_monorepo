import {useNavigation} from '@react-navigation/native';
import {useAuth, useGetGroupList} from 'afk_nostr_sdk';
import {FlatList, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';

import {PadlockIcon, SlantedArrowIcon} from '../../../assets/icons';
import {useStyles} from '../../../hooks';
import {MainStackNavigationProps} from '../../../types';
import stylesheet from './styles';

export default function AllGroupListComponent() {
  const {publicKey: pubKey} = useAuth();
  const data = useGetGroupList({
    pubKey,
  });
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  return (
    <SafeAreaView style={styles.groupContainers}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
      </View>
      <FlatList
        data={data.data.pages.flat()}
        renderItem={({item}: any) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupChat', {groupId: item.id})}
            style={styles.groupItem}
          >
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.content || 'No Name'}</Text>
              <View style={styles.groupType}>
                <PadlockIcon stroke="gray" />
                <Text style={styles.groupTypeText}>Private</Text>
              </View>
            </View>
            <View>
              <SlantedArrowIcon stroke="gray" />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}
