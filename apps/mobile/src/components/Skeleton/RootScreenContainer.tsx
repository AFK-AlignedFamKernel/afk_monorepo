import { Dimensions, Platform, View, ViewProps } from 'react-native';

import { WEB_MAX_WIDTH } from '../../constants/misc';
import { useStyles } from '../../hooks';
import { ThemedStyleSheet } from '../../styles';
import Sidebar from '../Layout/sidebar';

export const RootScreenContainer: React.FC<ViewProps> = ({ style, children, ...props }) => {
  const styles = useStyles(stylesheet);
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const shouldShowSidebar = isWeb && windowWidth >= 1024;
  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.content}>
        {shouldShowSidebar && <Sidebar></Sidebar>}
        {children}</View>
    </View>
  );
};

const stylesheet = ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    flexDirection: "row",
    width: '100%',

  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    flexDirection: "row",
    // width: '100%',
  },
}));
