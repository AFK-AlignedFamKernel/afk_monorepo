import { NDKKind } from '@nostr-dev-kit/ndk';
// Import useSearch
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useStyles, useWindowDimensions } from '../../hooks';
import { SORT_OPTION_EVENT_NOSTR, SORT_OPTIONS } from '../../types/nostr';
import FilterMenu from '../Filter';
import stylesheet from './styles';
import { Icon } from '../Icon';

interface IArticleSearchComponent {
  searchQuery: string;
  setSearchQuery: (search: string) => void;
  kinds?: NDKKind[];
  setKinds?: (kinds: NDKKind[]) => void;
  contactList?: string[];
  setSortBy?: (sort: string) => void;
  sortBy?: string;
}

const ArticleSearchComponent: React.FC<IArticleSearchComponent> = ({
  searchQuery,
  setSearchQuery,
  kinds = [],
  setKinds = () => { },
  contactList,
  sortBy,
  setSortBy = () => { },
}) => {
  const styles = useStyles(stylesheet);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [activeSortBy, setActiveSortBy] = useState<string>(sortBy ?? 'recent');
  // const [activeSortBy, setActiveSortBy] = useState<string>(sortBy ?? 'trending');

  const handleSortChange = (sortBy: string) => {
    setActiveSortBy(sortBy);
    setSortBy(sortBy);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(debouncedQuery || '');
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [debouncedQuery, setSearchQuery]);

  const handleChangeText = (text: string) => {
    setDebouncedQuery(text);
  };

  // const {data, isLoading, isError} = useSearch({
  //   search: searchQuery,
  //   kinds,
  //   authors: contactList,
  //   sortBy: activeSortBy,
  // });

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  return (
    <View style={isDesktop ? styles.container : styles.containerMobile}>
      <ScrollView
      >
        <View style={styles.rowContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={styles.sortContainer}
          >
            {SORT_OPTIONS.map((option, index) => (
              <Pressable
                key={option.value}
                style={[
                  styles.button,
                  (activeSortBy?.toLowerCase() === option.label.toLowerCase() ||
                    activeSortBy?.toLowerCase() === option.value?.toLowerCase() ||
                    activeSortBy?.toLowerCase() === index?.toString()) && styles.activeButton,
                ]}
                onPress={() => handleSortChange(option.value?.toString())}
              // onPress={() => handleSortChange(index?.toString())}
              >
                <Text style={styles.buttonText}>{option.label}</Text>
              </Pressable>
            ))}

          </ScrollView>
       
       
        </View>

      </ScrollView>

    </View>
  );
};

export default ArticleSearchComponent;
