import { Spacing, ThemedStyleSheet } from "../../../styles";

export default ThemedStyleSheet((theme) => ({
	commentInputContainer: {
    backgroundColor: theme.colors.surface,
  },
  commentInputContent: {
    gap: Spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xsmall,
    paddingHorizontal: Spacing.pagePadding,
    backgroundColor: theme.colors.surface,
  },
  commentInput: {
    flex: 1,
    width: 'auto',
  },
}));
