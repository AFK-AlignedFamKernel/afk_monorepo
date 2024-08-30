import {useNavigation} from '@react-navigation/native';
import {useGetGroupList} from 'afk_nostr_sdk';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {PadlockIcon, SlantedArrowIcon} from '../../../assets/icons';
import {useStyles} from '../../../hooks';
import {MainStackNavigationProps} from '../../../types';
import stylesheet from './styles';

export default function AllGroupListComponent() {
  const {data, isPending} = useGetGroupList({});

  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  return (
    <SafeAreaView style={styles.groupContainers}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
      </View>

      {isPending ? (
        <ActivityIndicator></ActivityIndicator>
      ) : (
        data?.pages?.length == 0 && <ActivityIndicator></ActivityIndicator>
      )}
      <FlatList
        data={data.pages.flat()}
        renderItem={({item}: any) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('GroupChat', {
                groupId: item.originalGroupId,
                groupName: item.content,
                groupAccess: item?.tags.find((tag: any) => tag[0] === 'access')?.[1] || 'public',
              })
            }
            style={styles.groupItem}
          >
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.content || 'No Name'}</Text>
              <View style={styles.groupType}>
                <PadlockIcon stroke="gray" />
                <Text style={styles.groupTypeText}>
                  {item?.tags.find((tag: any) => tag[0] === 'access')?.[1]}
                </Text>
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
