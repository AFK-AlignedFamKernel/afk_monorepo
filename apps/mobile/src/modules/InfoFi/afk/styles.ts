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
    subCard: {
      backgroundColor: theme.colors.cardBg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    subCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    subCardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    subCardSymbol: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    subCardContent: {
      gap: 8,
    },
    subCardText: {
      fontSize: 14,
      color: '#CCCCCC',
    },
    subList: {
      flex: 1,
      padding: 16,
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
    activityItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    activityText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 4,
    },
    activityDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    subCardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },  
    subCardLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    subCardValue: {
      fontSize: 14,
      color: theme.colors.text,
    },      
    subCardTag: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    subCardGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    subCardImage: {
      width: 100,
      height: 100,
      borderRadius: 100,
    },
    
  });
}
