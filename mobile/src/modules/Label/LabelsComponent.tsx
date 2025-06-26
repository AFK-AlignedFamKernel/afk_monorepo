import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useAllProfiles, useGetLabels, useNostrContext, useProfile, useSearch, useSearchSince } from 'afk_nostr_sdk';
import { useAuth, useContacts } from 'afk_nostr_sdk';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View, Text, ScrollView } from 'react-native';

import { AddPostIcon } from '../../assets/icons';
import { BubbleUser } from '../../components/BubbleUser';
import SearchComponent from '../../components/search';
import { useNostrAuth, useStyles, useTheme } from '../../hooks';
import { ChannelComponent } from '../ChannelCard';
import { PostCard } from '../PostCard';
import { VideoPostCard } from '../VideoPostCard';
import { FeedScreenProps, MainStackNavigationProps } from '../../types';
import stylesheet from './styles';
import { SORT_OPTIONS, SORT_OPTION_EVENT_NOSTR } from '../../types/nostr';
import { RenderEventCard } from '../Studio';
import { Button } from '../../components';
import { useNavigation } from '@react-navigation/native';
import { ArticleCard } from '../ArticleCard';
import ArticleSearchComponent from 'src/components/search/ArticleSearch';
import { TagsComponent } from 'src/screens/Tags/TagsComponent';
import { TAGS_DEFAULT } from 'common';

interface ILabelComponentProps {
  labelsEventsProps?: NDKEvent[];
  labelsNamespacesProps?: string[];
  labelsNamesProps?: string[];
  myLabelsProps?: NDKEvent[];
  setLabelsNamespacesProps?: (namespaces: string[]) => void;
  setLabelsNamesProps?: (names: string[]) => void;
  setMyLabelsProps?: (labels: NDKEvent[]) => void;
  selectedLabelProps?: string;
  setSelectedLabelProps?: (label: string) => void;
  selectedLabelNamespaceProps?: string;
  setSelectedLabelNamespaceProps?: (labelNamespace: string) => void;
  isInternalLabelFeedProps?: boolean;
}

interface ILabelData {
  labelNamespace?: string;
  labelName?: string;
  label?: NDKEvent;
}
export const LabelsComponent: React.FC<ILabelComponentProps> = ({ labelsEventsProps, labelsNamespacesProps, labelsNamesProps, myLabelsProps, setLabelsNamespacesProps, setLabelsNamesProps, setMyLabelsProps, selectedLabelProps, setSelectedLabelProps, selectedLabelNamespaceProps, setSelectedLabelNamespaceProps, isInternalLabelFeedProps = false }) => {

  const navigation = useNavigation<MainStackNavigationProps>();
  const { theme } = useTheme();
  const { publicKey } = useAuth();
  const { ndk } = useNostrContext();
  const styles = useStyles(stylesheet);
  const myLabelsEvents = useGetLabels({
    authors: [publicKey],
    kinds: [NDKKind.Label],
    limit: 20,
  });
  const labels = useGetLabels({
    kinds: [NDKKind.Label],
    limit: 20,
  });

  const [labelsNamespaces, setLabelsNamespaces] = useState<string[]>(labelsNamespacesProps ?? []);
  const [labelsNames, setLabelsNames] = useState<string[]>(labelsNamesProps ?? []);
  const [myLabels, setMyLabels] = useState<NDKEvent[]>(myLabelsProps ?? []);

  console.log("labels", labels);
  const [activeSortBy, setSortBy] = useState<string | undefined>(SORT_OPTION_EVENT_NOSTR.TIME?.toString());
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [feedData, setFeedData] = useState(null);
  const [kinds, setKinds] = useState<NDKKind[]>([
    // NDKKind.Text,
    // NDKKind.ChannelMessage,
    // NDKKind.Metadata,
    // NDKKind.VerticalVideo,
    // NDKKind.HorizontalVideo,
    // 30311 as NDKKind,
    // NDKKind.ChannelCreation,
    // NDKKind.GroupChat,
    NDKKind.Article,
  ]);

  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(selectedLabelProps);
  const [selectedLabelNamespace, setSelectedLabelNamespace] = useState<string | undefined>(selectedLabelNamespaceProps);

  const [labelsData, setLabelsData] = useState<ILabelData[]>([]);

  const [isFetchtedOneTime, setIsFetchtedOneTime] = useState(false);
  const [isScrapingNeeded, setIsScrapingNeeded] = useState(false);
  const handleLabels = () => {
  
    try {
      const labelsNamespacesFind = labels?.data?.pages?.flat().map((label) => {
        return label?.tags?.find((tag: string[]) => tag[0] === 'L');
      });
  
      const newLabelsNamespaces = labelsNamespacesFind.map((item) => item?.[1]);
      const uniqueLabelsNamespaces = [...new Set([...labelsNamespaces, ...newLabelsNamespaces])];
      setLabelsNamespaces(uniqueLabelsNamespaces);
      if (setLabelsNamespacesProps) {
        setLabelsNamespacesProps(uniqueLabelsNamespaces);
      }
  
      const labelsNamesFind = labels?.data?.pages?.flat().map((label) => {
        return label?.tags?.find((tag: string[]) => tag[0] === 'l');
      });
      const newLabelsNames = labelsNamesFind.map((item) => item?.[1]);
      const uniqueLabelsNames = [...new Set([...labelsNames, ...newLabelsNames])];
      setLabelsNames(uniqueLabelsNames);
      if (setLabelsNamesProps) {
        setLabelsNamesProps(uniqueLabelsNames);
      }
  
      const myLabelsFind = myLabelsEvents?.data?.pages?.flat().map((label) => {
        return label?.tags?.find((tag: string[]) => tag[0] === 'l');
      });
      const newMyLabels = myLabelsFind.map((item) => item?.[1]);
      const uniqueMyLabels = [...new Set([...myLabels, ...newMyLabels])];
      setMyLabels(uniqueMyLabels);
      if (setMyLabelsProps) {
        setMyLabelsProps(uniqueMyLabels);
      }
      setIsFetchtedOneTime(true);
      setIsScrapingNeeded(false);
    } catch (error) {
      console.log("error", error);
    }
    finally {
      setIsFetchtedOneTime(true);
      setIsScrapingNeeded(false);
    }
  }


  useEffect(() => {


    if ((labels?.isFetched && !isFetchtedOneTime) || isScrapingNeeded) {
      // if ((labels?.isFetched && !isFetchtedOneTime) || isScrapingNeeded) {
      handleLabels();
    }
  }, [labels, myLabels, isFetchtedOneTime, isScrapingNeeded]);

  const handleAddLabel = (labelNamespace: string, labelName: string, label: NDKEvent) => {
    console.log("handleAddLabel")

    console.log("labelNamespace", labelNamespace);
    console.log("labelName", labelName);

    console.log("label", label);

    if (labelName && setSelectedLabelProps) {
      setSelectedLabelProps(labelName);
    }
    setSelectedLabel(labelName);
    setSelectedLabelNamespace(labelNamespace);
    if (labelNamespace && setSelectedLabelNamespaceProps) {
      setSelectedLabelNamespaceProps(labelNamespace);
    }
    if (labelsNamespacesProps) {
      setLabelsNamespacesProps([...labelsNamespacesProps, labelNamespace]);
    }

    if (labelsNamesProps) {
      setLabelsNamesProps([...labelsNamesProps, labelName]);
    }

    if (myLabelsProps) {
      setMyLabelsProps([...myLabelsProps, label]);
    }
  }

  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();

  return (
    <View style={styles.container}>
      {/* <ArticleSearchComponent
        setSearchQuery={setSearch}
        searchQuery={search ?? ''}
        kinds={kinds}
        setKinds={setKinds}
        setSortBy={setSortBy}
        sortBy={activeSortBy}
      /> */}

      <View style={styles.flatListContentLabel}>
        {/* {labels?.isFetching && (
          <ActivityIndicator color={theme.colors.primary} size={20}></ActivityIndicator>
        )} */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View >Selected Label: <Text style={styles.text}>#{selectedLabel}</Text></View>
          {/* <Text style={styles.text}>Selected Label Namespace: {selectedLabelNamespace}</Text> */}
        </View>
        <FlatList

          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}

          horizontal={true}
          contentContainerStyle={styles.flatListContentLabel}
          data={labelsNames}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {

            // const labelNamespaces: string[] = item?.label?.tags?.find((tag: string[]) => tag[0] === 'L');
            // const labelNamespace = labelNamespaces?.length > 0 ? labelNamespaces[1] : undefined;

            // const labelNames: string[] = item?.tags?.find((tag: string[]) => tag[0] === 'l');
            // const labelName = labelNames?.length > 0 ? labelNames[1] : undefined;
            // console.log("labelNamespace", labelNamespace);
            // console.log("labelName", labelName);

            const isLabelSelected = selectedLabel === item;
            return (
              <>
                <View style={{
                  backgroundColor: isLabelSelected ? theme.colors.primary : theme.colors.badge,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginHorizontal: 4,
                  marginVertical: 4,
                  // textAlign: 'center',
                  // flexWrap: 'wrap',
                  width: 100,
                  height: 75,
                  maxHeight: 75,
                }}
                // onPress={() => { handleAddLabel(labelNamespace, labelName, item) }}
                >
                  {item && (
                    <Text style={{
                      color: theme.colors.text,
                      fontSize: 14,
                      fontWeight: '600',
                      flexWrap: 'wrap',
                      textAlign: 'center',
                    }}>
                      {item}
                    </Text>
                  )}

                  <Pressable
                    style={{
                      backgroundColor: theme.colors.background,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                    }}
                    onPress={() => { handleAddLabel(item, item, undefined) }}
                  >
                    <Text>Add</Text>
                  </Pressable>
                </View>
              </>
            )
          }}
          refreshControl={
            <RefreshControl refreshing={labels.isFetching} onRefresh={() => labels.refetch()} />
          }
          onEndReached={() => {
       
            labels.fetchNextPage();
            labels.refetch();
            setIsFetchtedOneTime(false);
            setIsScrapingNeeded(true);
          }}
        />
        {/* <FlatList

          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}

          horizontal={true}
          contentContainerStyle={styles.flatListContentLabel}
          data={labels?.data?.pages?.flat() ?? []}
          keyExtractor={(item) => item?.id}
          renderItem={({ item }) => {

            const labelNamespaces: string[] = item?.tags?.find((tag: string[]) => tag[0] === 'L');
            const labelNamespace = labelNamespaces?.length > 0 ? labelNamespaces[1] : undefined;

            const labelNames: string[] = item?.tags?.find((tag: string[]) => tag[0] === 'l');
            const labelName = labelNames?.length > 0 ? labelNames[1] : undefined;
            console.log("labelNamespace", labelNamespace);
            console.log("labelName", labelName);

            return (
              <>
                <View style={{
                  backgroundColor: theme.colors.codeBoxBackground,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginHorizontal: 4,
                  marginVertical: 4,
                  width: 100,
                  height: 100,
                  maxHeight: 100,
                }}
                // onPress={() => { handleAddLabel(labelNamespace, labelName, item) }}
                >
                  {labelNamespace && labelNamespace != "#t" && (
                    <Text style={{
                      color: theme.colors.text,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {labelNamespace}
                    </Text>
                  )}

                  {labelName && (
                    <Text style={{
                      color: theme.colors.text,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {labelName}
                    </Text>
                  )}

                  <Pressable
                    style={{
                      backgroundColor: theme.colors.background,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                    }}
                    onPress={() => { handleAddLabel(labelNamespace, labelName, item) }}
                  >
                    <Text>Add</Text>
                  </Pressable>
                </View>
              </>
            )
          }}
          refreshControl={
            <RefreshControl refreshing={labels.isFetching} onRefresh={() => labels.refetch()} />
          }
          onEndReached={() => {
            labels.fetchNextPage();

          }}
        /> */}
      </View>

      {isInternalLabelFeedProps && (
        <TagsComponent tagName={selectedLabelProps ?? selectedLabel} />
      )}


    </View>
  );
};
