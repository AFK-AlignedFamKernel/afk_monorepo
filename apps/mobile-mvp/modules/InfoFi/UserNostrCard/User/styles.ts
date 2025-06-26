import {Spacing, ThemedStyleSheet} from 'src/styles';

export default ThemedStyleSheet((theme) => ({
  container: {},
  replyView: {
    padding: Spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xxsmall,
    paddingHorizontal: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    marginBottom: Spacing.small,
  },

  repost: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxsmall,
  },

  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  infoUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  infoProfile: {
    flex: 1,
  },
  infoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontWeight: 300,
  },
  infoDetailsDivider: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: theme.colors.textSecondary,
  },
  infoLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.xxxsmall,
  },

  content: {
    marginBottom: Spacing.medium,
    color: theme.colors.textTertiary,
  },
  // contentImage: {
  //   width: '100%',
  //   height: 'auto',
  //   resizeMode: 'cover',
  //   borderRadius: 8,
  //   overflow: 'hidden',
  //   marginTop: Spacing.small,
  // },
  contentImage: {
    width: '100%',
    height: '100%',
    // resizeMode: 'cover',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: Spacing.small,
  },

  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  hashTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  footerContent: {
    gap: 10,
  },
  footerComments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxxsmall,
  },
  seeMore: {
    color: theme.colors.primary,
    fontSize: 13,
    marginTop: Spacing.xsmall,
  },
}));
