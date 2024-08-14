import {StyleSheet} from 'react-native';

import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  content: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xxsmall,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: Spacing.xsmall,
  },

  title: {
    flex: 1,
    color:theme.colors.text,

  },
  text:{
    color:theme.colors.text
  },

  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}));
