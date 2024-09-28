import React, {useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

const SearchInput = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
  };

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
        value={searchQuery}
        onChangeText={handleChangeText}
        placeholder="Search"
        clearButtonMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});

export default SearchInput;
