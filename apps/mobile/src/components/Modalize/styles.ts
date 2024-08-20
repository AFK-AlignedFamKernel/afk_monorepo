import {Platform} from 'react-native';

import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  modal: {
    backgroundColor: theme.colors.surface,
    // width:Dimensions.get("window").width >= 1024 ? 300 : "100%",
    // flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center'
  },

  header: {
    width: '100%',
    marginBottom: Spacing.medium,
  },
  title: {
    marginBottom: Spacing.xsmall,
  },

  content: {
    padding: Spacing.medium,
    paddingTop: Platform.OS === 'ios' ? Spacing.xlarge : Spacing.xsmall,
  },
}));
