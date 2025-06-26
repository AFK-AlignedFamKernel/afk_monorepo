import {ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.badgeBorder,
  },
  badgeText: {
    fontSize: 12,
    color: theme.colors.badgeText,
  },
  default: {
    backgroundColor: theme.colors.badge,
  },
}));
