import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet, Typography} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: Spacing.pagePadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  cancelButton: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.xsmall,
  },

  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  form: {
    flex: 1,
  },
  input: {
    flex: 1,
    padding: Spacing.large,
    color: theme.colors.inputText,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
    ...Typography.medium,
    borderColor: theme.colors.divider,
    borderWidth: 1,
    borderRadius: 8,  
  },
  imageContainer: {
    padding: Spacing.pagePadding,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
    overflow: 'hidden',
  },

  buttons: {
    position: 'relative',
  },
  mediaButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.pagePadding,
    paddingVertical: Spacing.small,
    gap: Spacing.large,
    alignItems: 'center',
  },
  sendButton: {
    position: 'absolute',
    right: Spacing.pagePadding,
    bottom: '110%',
  },

  videoContainer: {
    padding: 10,
    overflow: 'hidden',
    width: '100%',
    height: 400,
  },

  // Rich text editor styles
  editorContainer: {
    flex: 1,
    minHeight: 300,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  editor: {
    height: '100%',
    backgroundColor: '#fff',
  },
  // Override Quill's default styles
  'quill-editor': {
    '.ql-toolbar': {
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottom: '1px solid #ccc',
    },
    '.ql-container': {
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      minHeight: 200,
    },
    '.ql-editor': {
      minHeight: 200,
      fontSize: 16,
      lineHeight: 1.5,
    },
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 4,
  },
  toolbarButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  toolbarButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    margin: 10,
  },
  summary: {
    color: theme.colors.text,
    fontSize: 16,
    margin: 10,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
}));
