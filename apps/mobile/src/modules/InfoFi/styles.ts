import { StyleSheet } from 'react-native';
import { Theme } from 'src/styles';
import { useTheme } from 'src/hooks';

export default function useStyles() {
  const { theme } = useTheme();

  return StyleSheet.create({
    container: {
      position: 'relative',
      flex: 1,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },
    createTokenButton: {
      width: 200,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      margin: 16,
    },
    createTokenButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    section: {
      margin: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
    },
    overviewItem: {
      flex: 1,
      minWidth: '45%',
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      alignItems: 'center',
    },
    overviewLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    overviewValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    epochCard: {
      width: 280,
      marginRight: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
    },
    epochTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    epochStats: {
      gap: 8,
    },
    epochStat: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    epochStatLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    epochStatValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    depositContainer: {
      gap: 12,
    },
    depositInput: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      padding: 12,
    },
    depositButton: {
      marginTop: 8,
    },
    depositButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    userList: {
      marginTop: 16,
    },
  });
}
