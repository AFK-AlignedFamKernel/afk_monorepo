import {Spacing, ThemedStyleSheet} from '../../styles';

// export default StyleSheet.create({
export default ThemedStyleSheet((theme) => ({
  // export default StyleSheet.create({
  container: {
    position: 'absolute',
    // top: 0,
    bottom: 45,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  content: {
    paddingTop: Spacing.pagePadding,
    paddingHorizontal: Spacing.pagePadding,
    gap: Spacing.xsmall,
  },
}));
