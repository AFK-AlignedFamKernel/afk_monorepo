import { StyleSheet } from 'react-native';
import { Spacing, ThemedStyleSheet, Typography } from '../../styles';

export default ThemedStyleSheet((theme) => ({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    padding: Spacing.pagePadding,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    display: 'flex',
    height: '90%',
  },
  containerSort: {
    padding: Spacing.pagePadding,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    display: 'flex',
    height: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    flexBasis: '100%', // Default to 100% width (1 column)
    marginBottom: Spacing.small,
  },
  itemDesktop: {
    flexBasis: '45%', // 2 columns on desktop
    marginTop:10
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.divider,
    marginBottom: Spacing.small,
    marginRight: Spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.text,
    ...Typography.medium,
  },
  closeButton: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    borderRadius: 8,
    marginTop: Spacing.small,
    backgroundColor: theme.colors.background,
  },
  closeButtonText: {
    color: theme.colors.text,
    textAlign: 'center',
    ...Typography.medium,
  },
  sectionTitle: {
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.pagePadding,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontSize: 18,
    ...Typography.bold,
  },
}));