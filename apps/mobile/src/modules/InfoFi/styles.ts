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
  });
}
