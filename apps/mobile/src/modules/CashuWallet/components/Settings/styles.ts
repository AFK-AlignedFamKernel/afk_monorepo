import {ThemedStyleSheet} from '../../../../styles';

export default ThemedStyleSheet((theme) => ({
  modalTabContentContainer: {
    backgroundColor: theme.colors.surface,
    width: '100%',
    alignItems: 'center',
    maxWidth: 400,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: '95%',
    overflow: 'scroll',
    paddingBottom: 20,
    position: 'relative',
  },
  modalTabContentTitle: {
    padding: 20,
    textTransform: 'uppercase',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.inputText,
  },
  settingsSection: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'medium',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    margin: 8,
  },
  checkboxLabel: {
    fontSize: 15,
    color: theme.colors.text,
  },
}));
