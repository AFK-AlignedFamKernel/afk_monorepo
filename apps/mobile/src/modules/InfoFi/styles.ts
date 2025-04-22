import { StyleSheet } from 'react-native';
import { Theme } from 'src/styles';
import { useTheme } from 'src/hooks';

export default function useStyles() {
  const { theme } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 16,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    actionsContainer: {
      padding: 16,
      gap: 16,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    actionButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    depositSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    depositInput: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    depositButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    depositButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    usersSection: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    userList: {
      marginTop: 8,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    errorText: {
      color: theme.colors.badgeText,
      fontSize: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.cardBorder,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    subscribeButton: {
      marginTop: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    subscribeButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    subCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    subCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    subCardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: 0.5,
    },
    subCardSymbol: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    subCardContent: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.colors.bg,
      borderRadius: 8,
    },
    subCardText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    border:{
      
    }
  });
}
