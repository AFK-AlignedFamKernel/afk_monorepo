import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  card_container: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.xsmall,
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.large,
    borderRadius: 16,
  },
  hashtagColor: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },

  //Video Card
  container: {},

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
    gap: Spacing.small,
  },
  infoDetailsDivider: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: theme.colors.textLight,
  },
  infoLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.xxxsmall,
  },

  content: {
    marginBottom: Spacing.medium,
    color: theme.colors.text,
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
  },
  hashTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingTop: 5,
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

  //Inner content
  innerContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    width: '100%',
  },
  innerContentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
}));
