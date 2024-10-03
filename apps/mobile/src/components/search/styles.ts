import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#f0f0f0',
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderRadius: 20,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingVertical: 20,
    overflowX: 'auto',
  },
  iconContainer: {
    marginRight: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping if items overflow
    justifyContent: 'space-between', // Adjust spacing between items
  },
  button: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.divider,
    // marginBottom: Spacing.small,
    marginRight: Spacing.small, // Add spacing between items
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: theme.colors.primary, // Active button background color
  },
  buttonText: {
    color: theme.colors.text,
    ...Typography.medium,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.background,

    color: theme.colors.text,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
}));
