import { Dimensions, Platform, View, ViewProps } from 'react-native';

import { WEB_MAX_WIDTH } from '../../constants/misc';
import { useStyles } from '../../hooks';
import { ThemedStyleSheet } from '../../styles';
import Sidebar from '../Layout/sidebar';

export const RootScreenContainer: React.FC<ViewProps> = ({ style, children, ...props }) => {
  const styles = useStyles(stylesheet);
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const shouldShowSidebar = isWeb && windowWidth >= 768;
  return (
    <View style={[styles.container, style]} {...props}>
      {shouldShowSidebar && <Sidebar></Sidebar>}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const stylesheet = ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    flexDirection:"row",
    width: '100%',

  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
  },
}));
