import {NDKKind} from '@nostr-dev-kit/ndk';
import useSearch from 'afk_nostr_sdk/src/hooks/search/useSearch'; // Import useSearch
import React, {useEffect, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {useStyles} from '../../hooks';
import FilterMenu from '../Filter';
import stylesheet from './styles';

interface ISearchComponent {
  searchQuery: string;
  setSearchQuery: (search: string) => void;
  kinds?: NDKKind[];
  setKinds?: (kinds: NDKKind[]) => void;
  contactList?: string[];
  setSortBy?: (sort:string) => void;
  sortBy?:string;

}

const SearchComponent: React.FC<ISearchComponent> = ({
  searchQuery,
  setSearchQuery,
  kinds = [],
  setKinds = () => {},
  contactList,
  sortBy,
  setSortBy
}) => {
  const styles = useStyles(stylesheet);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [activeSortBy, setActiveSortBy] = useState<string>(sortBy ?? "trending");

  const handleSortChange = (sortBy: string) => {
    setActiveSortBy(sortBy);
    setSortBy
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

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Svg
          height="20"
          width="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M17.5 17.5L13.5 13.5" />
          <Path d="M16 9.5C16 11.7091 15.2091 13.791 13.791 15.2091C12.3729 16.6271 10.291 17.4182 8.08191 17.4182C5.87282 17.4182 3.79094 16.6271 2.37286 15.2091C0.954781 13.791 0.163818 11.7091 0.163818 9.5C0.163818 7.29086 0.954781 5.20904 2.37286 3.79096C3.79094 2.37289 5.87282 1.58191 8.08191 1.58191C10.291 1.58191 12.3729 2.37289 13.791 3.79096C15.2091 5.20904 16 7.29086 16 9.5V9.5Z" />
        </Svg>
      </View>
      <TextInput
        style={styles.input}
        value={debouncedQuery}
        onChangeText={handleChangeText}
        placeholder="Search"
        clearButtonMode="always"
      />
      <Pressable onPress={() => setIsOpenFilter(true)}>
        <Text style={styles.input}>Filter</Text>
      </Pressable>

      <FilterMenu
        visible={isOpenFilter}
        onClose={() => setIsOpenFilter(false)}
        kinds={kinds}
        setKinds={setKinds}
        onSortChange={handleSortChange}
        activeSortBy={activeSortBy}
      />
    </View>
  );
};

export default SearchComponent;
