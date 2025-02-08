import {NDKKind} from '@nostr-dev-kit/ndk';
// Import useSearch
import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {useStyles, useWindowDimensions} from '../../hooks';
import {SORT_OPTION_EVENT_NOSTR, SORT_OPTIONS} from '../../types/nostr';
import FilterMenu from '../Filter';
import stylesheet from './styles';
import {Icon} from '../Icon';

interface ISearchComponent {
  searchQuery: string;
  setSearchQuery: (search: string) => void;
  kinds?: NDKKind[];
  setKinds?: (kinds: NDKKind[]) => void;
  contactList?: string[];
  setSortBy?: (sort: string) => void;
  sortBy?: string;
}

const SearchComponent: React.FC<ISearchComponent> = ({
  searchQuery,
  setSearchQuery,
  kinds = [],
  setKinds = () => {},
  contactList,
  sortBy,
  setSortBy = () => {},
}) => {
  const styles = useStyles(stylesheet);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [activeSortBy, setActiveSortBy] = useState<string>(sortBy ?? 'trending');
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
      <View style={styles.rowContainer}>
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.button,
              activeSortBy.toLowerCase() === option.label.toLowerCase() && styles.activeButton,
            ]}
            onPress={() => handleSortChange(option.label)}
          >
            <Text style={styles.buttonText}>{option.label}</Text>
          </Pressable>
        ))}
        {!isDesktop ? (
          <Pressable onPress={() => setIsOpenFilter(true)} style={{marginLeft: 'auto'}}>
            <Svg width="32" height="32" viewBox="0 0 24 24">
              <Path fill="currentColor" d="M10 18v-2h4v2zm-4-5v-2h12v2zM3 8V6h18v2z" />
            </Svg>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.searchContainer}>
        <View style={isDesktop ? styles.searchInputContainer : styles.searchInputContainerMobile}>
          <Icon name={'SearchIcon'} size={20} color={'textPrimary'} style={styles.searchIcon} />
          <TextInput
            style={isDesktop ? styles.input : styles.inputMobile}
            value={debouncedQuery}
            onChangeText={handleChangeText}
            placeholder="Search"
            clearButtonMode="always"
          />
        </View>
        {isDesktop ? (
          <Pressable onPress={() => setIsOpenFilter(true)}>
            <Svg width="32" height="32" viewBox="0 0 24 24">
              <Path fill="currentColor" d="M10 18v-2h4v2zm-4-5v-2h12v2zM3 8V6h18v2z" />
            </Svg>
          </Pressable>
        ) : null}
        <FilterMenu
          visible={isOpenFilter}
          onClose={() => setIsOpenFilter(false)}
          kinds={kinds}
          setKinds={setKinds}
          onSortChange={handleSortChange}
          activeSortBy={activeSortBy}
        />
      </View>
    </View>
  );
};

export default SearchComponent;
