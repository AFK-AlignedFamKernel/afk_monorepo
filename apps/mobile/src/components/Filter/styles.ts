import { StyleSheet } from 'react-native';

import { Spacing, ThemedStyleSheet, Typography } from '../../styles';

export default ThemedStyleSheet((theme) => ({
  modalContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    padding: Spacing.pagePadding,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    display: 'flex',
    // gridTemplateRows: 'repeat(2, 1fr)', // Creates 2 equal-height rows
    // rowGap: 12, // Vertical gap between rows
    // columnGap: 12, // Horizontal gap between columns
    // alignItems: 'center',
  },
  // container: {
  //   padding: Spacing.pagePadding,
  //   backgroundColor: theme.colors.surface,
  //   borderRadius: 12,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.8,
  //   shadowRadius: 2,
  //   elevation: 5,
  //   gridTemplateColumns: 'repeat(2, 1fr)', // Creates 2 equal-width columns
  //   columnGap: 12, // Horizontal gap between columns
  //   rowGap: 12, // Vertical gap between rows
  //   alignItems: 'center',
  // },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping if items overflow
    justifyContent: 'space-between', // Adjust spacing between items
    // },
    // display: 'grid',
    // gridTemplateColumns: 'repeat(2, 1fr)', // Creates 2 equal-width columns
    // columnGap: 12, // Horizontal gap between columns
    // rowGap: 12, // Vertical gap between rows
    // alignItems: 'center',
  },
  // rowContainer: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap', // Allow wrapping if items overflow
  //   justifyContent: 'space-between', // Adjust spacing between items
  // },
  button: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.divider,
    marginBottom: Spacing.small,
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
  closeButton: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    // backgroundColor: theme.colors.primary,
    borderRadius: 8,
    marginTop: Spacing.small,
    backgroundColor:theme.colors.background
  },
  closeButtonText: {
    color: theme.colors.text,
    textAlign: 'center',
    ...Typography.medium,
  },
  sectionTitle: {
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.pagePadding,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontSize: 18,
    ...Typography.bold,
  },
}));
