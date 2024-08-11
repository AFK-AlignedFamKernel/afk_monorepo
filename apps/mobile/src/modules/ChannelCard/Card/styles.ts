import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    border:5,
    shadowRadius:5,
    shadowColor:theme.colors.surface,
    shadowOpacity:0.5,
    shadowOffset: {width: -2, height: 4},
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

  channelName: {
    fontSize: 15,
    lineHeight: 20,
    numberOfLines: 1,
  },
  channelText: {
    fontSize: 13,
    lineHeight: 10,
    numberOfLines: 1,
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
  contentImage: {
    width: '100%',
    height: 'auto',
    resizeMode: 'cover',
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
  footerComments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxxsmall,
  },
}));
