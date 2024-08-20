import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: Spacing.pagePadding,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    color: theme.colors.text,
    padding: Spacing.medium,
  },

  relaysSettings: {
    flex: 1,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: Spacing.medium,
  },
  coverButtons: {
    // position: 'relative',
    width: '100%',
    height: '100%',
  },

  backButton: {
    position: 'absolute',
    top: Spacing.pagePadding,
    left: Spacing.pagePadding,
  },
  themeButton: {
    // flex: 1,
    // flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    justifyItems: 'baseline',
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    marginBottom: 4,
  },
  text: {
    color: theme.colors.text,
  },
  buttons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.xsmall,
    paddingTop: Spacing.xsmall,
  },
}));
