import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {
  AdminGroupPermission,
  useAddMember,
  useAddPermissions,
  useAuth,
  useGetGroupList,
} from 'afk_nostr_sdk';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
  const {data, isPending, isFetching, refetch, fetchNextPage} = useGetGroupList({});
  const {mutate: addMember} = useAddMember();
  const queryClient = useQueryClient();
  const {mutate: addPermission} = useAddPermissions();
  const {publicKey} = useAuth();
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  return (
    <SafeAreaView style={styles.groupContainers}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Groups</Text>
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
            onPress={() => {
              // Check if the group is pubic, if yes add the use to the group.
              if (
                (item?.tags.find((tag: any) => tag[0] === 'access')?.[1] || 'public') ===
                  'public' &&
                publicKey !== item?.tags.find((tag: any) => tag[0] === 'p')?.[1]
              ) {
                // Add the member to the group
                addMember(
                  {
                    groupId: item.originalGroupId,
                    pubkey: publicKey,
                  },
                  {
                    onSuccess() {
                      // After successfully adding external member by pubkey, give them default view access.
                      addPermission(
                        {
                          groupId: item.originalGroupId,
                          pubkey: publicKey,
                          permissionName: [AdminGroupPermission.ViewAccess],
                        },
                        {
                          onSuccess() {
                            queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
                            queryClient.invalidateQueries({
                              queryKey: ['getPermissionsByUserConnected', item.originalGroupId],
                            });

                            navigation.navigate('GroupChat', {
                              groupId: item.originalGroupId,
                              groupName: item.content,
                              groupAccess:
                                item?.tags.find((tag: any) => tag[0] === 'access')?.[1] || 'public',
                            });
                          },
                          onError() {
                            console.error('Something went wrong joining this group');
                          },
                        },
                      );
                    },
                  },
                );
              }
              navigation.navigate('GroupChat', {
                groupId: item.originalGroupId,
                groupName: item.content,
                groupAccess: item?.tags.find((tag: any) => tag[0] === 'access')?.[1] || 'public',
              });
            }}
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
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
        onEndReached={() => fetchNextPage()}
      />
    </SafeAreaView>
  );
}
