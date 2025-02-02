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
      gap: 2,
      marginBottom: 5,
    },
    creationTime: {
      fontSize: 10,
      color: theme.colors.textPrimary,
      textAlign: 'right',
      position: 'absolute',
      right: 0,
      top: 0,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginVertical: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      flexWrap: 'wrap',
      gap: 8,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      minWidth: 100,
    },
    value: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: theme?.colors?.backgroundColor,
      borderWidth: 1,
      borderColor: theme.colors.grayInput,
      borderRadius: 4,
      marginVertical: 8,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme?.colors?.primary,
      borderRadius: 4,
    },
    progressBarFillWarn: {
      height: '100%',
      backgroundColor: theme?.colors?.errorDark,
      borderRadius: 4,
    },
    stats: {
      display: 'flex',
      flexDirection: 'row',
      gap: 15,
      marginTop: 15,
    },
    statContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
    },
    statValue: {
      color: theme.colors.textPrimary,
      fontSize: 14,
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
      fontWeight: 800,
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
      color: theme.colors.white,
    },
  });
