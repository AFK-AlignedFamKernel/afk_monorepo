import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: Spacing.large,
  },
  
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: Spacing.medium,
  },
  
  text: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: Spacing.medium,
  },
  
  title: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  
  faucetContainer: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.medium,
    borderRadius: 16,
    marginBottom: Spacing.large,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  
  faucetText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontSize: 14,
  },
  
  inputContainer: {
    marginBottom: Spacing.large,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: Spacing.large,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: Spacing.medium,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  
  buttonContainer: {
    gap: Spacing.medium,
  },
  
  button: {
    borderRadius: 16,
    padding: Spacing.medium,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  buttonInactive: {
    backgroundColor: theme.colors.surface,
    opacity: 0.7,
  },
  
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
}));