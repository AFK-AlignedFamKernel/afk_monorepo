import {StyleSheet} from 'react-native';

export default (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.cardBg,
      borderRadius: 20,
      padding: 20,
      flex: 1,
      maxWidth: '100%',
      marginBottom: 20,
    },
    containerDesktop: {
      marginRight: 20,
    },
    header: {
      flexDirection: 'column',
      gap: 5,
      marginBottom: 5,
    },
    tokenName: {
      fontSize: 16,
      color: theme.colors.textPrimary,
      fontWeight: 'medium',
    },
    tokenSymbol: {
      fontSize: 10,
      color: theme.colors.grayInput,
      fontWeight: 'medium',
    },
    addressContainer: {
      backgroundColor: '#2A2A2A',
      padding: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    price: {
      color: theme.colors.textPrimary,
      fontSize: 30,
      fontWeight: 800
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
      padding: 6,
      borderRadius: 20,
      marginTop: 20,
    },
    actionButtonText: {
      textAlign: 'center',
      fontWeight: 800,
      fontSize: 15,
      color: theme.colors.white
    }
  });
