import { StyleSheet } from 'react-native';
import { Theme } from 'src/styles';
import { useTheme } from 'src/hooks';

export default function useStyles() {
  const { theme } = useTheme();

  return StyleSheet.create({

 
    subCard: {
      // backgroundColor: theme.colors.surface,
      backgroundColor: theme.colors.cardBg,
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
      // backgroundColor: theme.colors.cardBg,
      borderRadius: 8,
    },
    subCardText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
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
