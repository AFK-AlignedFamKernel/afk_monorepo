import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flexDirection: 'row',
    // flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    // marginHorizontal: 32,
    marginVertical: 30,
    // overflowX: 'auto',
  },
  containerMobile: {
    flexDirection: 'column',
    gap: 10,
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    marginHorizontal: 32,
    marginVertical: 30,
    overflowX: 'auto',
  },
  rowContainer: {
    // width: '100%',
    width: '80%',
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping if items overflow
    gap: 10,
  },
  sortContainer: {
    width: '80%',
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping if items overflow
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    justifyContent: "space-between",
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchInputContainerMobile: {
    position: 'relative',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: 8,
    top: 8
  },
  button: {
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors.textPrimary,
    opacity: 0.7
  },
  activeButton: {
    opacity: 1,
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.text,
    ...Typography.medium,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.textPrimary,
    borderWidth: 1,
    borderRadius: 10,
    color: theme.colors.text,
    paddingLeft: 35,
    paddingRight: 8,
    paddingVertical: 8,
    fontSize: 14,
    width: 300,
  },
  inputMobile: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.textPrimary,
    borderWidth: 1,
    borderRadius: 10,
    color: theme.colors.text,
    paddingLeft: 35,
    paddingRight: 8,
    paddingVertical: 8,
    fontSize: 14,
  }
}));
