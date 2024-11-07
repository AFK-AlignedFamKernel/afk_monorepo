import {StyleSheet} from 'react-native';

export default (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 24,
    },
    createButton: {
      marginBottom: 24,
    },
    flatListContent: {
      gap: 16,
    },
    separator: {
      height: 16,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    }
  });
