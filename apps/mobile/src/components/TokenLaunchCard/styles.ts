import {Spacing, ThemedStyleSheet} from '../../styles';
export default ThemedStyleSheet((theme) => ({
  container: {
    // alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: Spacing.xsmall,
    borderRadius: 8,
    gap: Spacing.xsmall,
    overflowWrap: 'break-word',
    // width:Dimensions.get("window").width >= 1024 ? 300 : "100%"
    // width:"100%"
    width: 300,
  },
  imageContainer: {
    // position: 'relative',
    // display: 'flex',
    // alignItems: 'center',
    // justifyContent: 'center',
    borderRadius: 15,
  },
  text: {},
  image: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 15,
  },
  name: {
    paddingTop: Spacing.xxsmall,
  },
}));
