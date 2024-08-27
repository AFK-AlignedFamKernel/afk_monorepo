import { useReposts, useRootNotes, useSearch, useSearchNotes } from 'afk_nostr_sdk';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { useStyles } from '../../hooks';
import { PostCard } from '../../modules/PostCard';
import { ProfileScreenProps } from '../../types';
import { ProfileInfo } from './Info';
import stylesheet from './styles';
import { useMemo, useState } from 'react';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { Button, Text } from '../../components';

export const Profile: React.FC<ProfileScreenProps> = ({ route }) => {
  const { publicKey } = route.params ?? {};
  const styles = useStyles(stylesheet);
  const [ndkKind, setNdkKind] = useState<NDKKind>(NDKKind.Text)

  const kindFilter = useMemo(() => {
    return ndkKind
  }, [ndkKind])

  const notesSearch = useRootNotes({ authors: [publicKey] });
  const search = useSearch({ authors: [publicKey], kind: kindFilter });
  const reposts = useReposts({ authors: [publicKey] });

  return (
    <View style={styles.container}>

      <FlatList
        ListHeaderComponent={
          <>
            <ProfileInfo publicKey={publicKey} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: 5,
                paddingHorizontal:5,
                flexDirection: 'row',
                rowGap: 3,
                gap: 3,
                columnGap: 3
              }}
              style={{
                paddingHorizontal:5,
                paddingVertical: 5,
                flexDirection: 'row',
                rowGap: 3,
                gap: 3,
                columnGap: 3
              }}
            >
              <Pressable onPress={() => setNdkKind(NDKKind.Text)}>
                <Text>Notes</Text>
              </Pressable>
              <Pressable onPress={() => setNdkKind(NDKKind.Repost)}>
                <Text>Repost</Text>
              </Pressable>
            </ScrollView>
          </>
        }
        data={search.data?.pages.flat()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (ndkKind == NDKKind.Repost) {
            const itemReposted = JSON.parse(item?.content)
            return <PostCard key={item?.id} event={itemReposted} isRepostProps={true} />
          }
          return <PostCard key={item?.id} event={item} />
        }}
        refreshControl={
          <RefreshControl refreshing={search.isFetching} onRefresh={() => search.refetch()} />
        }
      />

      {search?.isLoading && <ActivityIndicator />}
    </View>
  );
};
