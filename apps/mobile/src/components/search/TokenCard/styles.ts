import {StyleSheet} from 'react-native';

import {Spacing} from '../../../styles';

export default (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#1E1E1E',
      borderRadius: 16,
      padding: 20,
      margin: 8,
      borderWidth: 1,
      borderColor: '#2A2A2A',
      flex: 1,
      maxWidth: '100%',
    },
    header: {
      flexDirection: 'column',
      gap: 8,
      marginBottom: 20,
    },
    tokenName: {
      fontSize: 24,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    addressContainer: {
      backgroundColor: '#2A2A2A',
      padding: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceTag: {
      backgroundColor: '#2A2A2A',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
      marginVertical: 16,
    },
    statBox: {
      backgroundColor: '#2A2A2A',
      padding: 12,
      borderRadius: 8,
      width: '48%',
    },
    statLabel: {
      color: '#808080',
      marginBottom: 4,
    },
    statValue: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      padding: Spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: Spacing.small,
    },
  });
