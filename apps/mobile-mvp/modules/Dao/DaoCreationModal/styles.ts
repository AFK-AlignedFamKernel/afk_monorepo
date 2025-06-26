import { Platform } from 'react-native';

import { Spacing, ThemedStyleSheet } from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 'auto',
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.streamStudio_inputBorder,
    maxWidth: 500,
    backgroundColor: theme.colors.streamStudio_surface,
    borderRadius: 20,
    padding: 35,
    alignItems: 'stretch',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.streamStudio_text,
    marginBottom: 25,
  },
  input: {
    backgroundColor: theme.colors.streamStudio_inputBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: theme.colors.inputText,
    borderWidth: 1,
    borderColor: theme.colors.streamStudio_inputBorder,
  },
  inputLabel: {
    fontSize: 12,
    color: theme.colors.inputPlaceholder,
    marginBottom: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateLabel: {
    fontSize: 12,
    color: theme.colors.inputPlaceholder,
    marginBottom: 4,
  },
  modalButton: {
    backgroundColor: theme.colors.streamStudio_buttonBackground,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonDisabled: {
    backgroundColor: theme.colors.streamStudio_buttonBackground,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.streamStudio_buttonText,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.streamStudio_buttonBackground,
  },

  comment: {
    paddingTop: Spacing.small,
  },
}));
