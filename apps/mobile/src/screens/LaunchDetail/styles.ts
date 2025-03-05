import { Spacing, Theme, ThemedStyleSheet } from '../../styles';

export default ThemedStyleSheet((theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: Spacing.normal,
    paddingVertical: Spacing.small,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.normal,
    padding: Spacing.normal,
  },
  leftColumn: {
    width: '35%',
    maxWidth: 400,
    minWidth: 300,
  },
  rightColumn: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.divider,
    paddingLeft: Spacing.normal,
  },
  tabContent: {
    flex: 1,
    marginBottom: 50,
  },
  cancelButton: {
    alignSelf: 'flex-start',
  },
  overview: {
    flex: 1,
  },
  holdersTotal: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    marginBottom: 10,
  },
  mobileContent: {
    flex: 1,
    flexDirection: 'column',
  },
  mobileTabBar: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    paddingVertical: Spacing.small,
  },
  intervalContainer: {
    marginBottom: Spacing.small,
    alignItems: 'center',
  },
  intervalSelector: {
    flexDirection: 'row',
    marginTop: Spacing.small,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  intervalButton: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xxxsmall,
    marginRight: Spacing.small,
    marginBottom: Spacing.small,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  intervalButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
}));
