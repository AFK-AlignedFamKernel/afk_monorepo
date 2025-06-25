import {Spacing, ThemedStyleSheet} from '../../styles';
export default ThemedStyleSheet((theme) => ({
  container: {
    // alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: Spacing.xsmall,
    borderRadius: 8,
    gap: 20,
    overflowWrap: 'break-word',
   padding: 20,
  },
  desktopContainer: {
    // styles specific to desktop view
    width: '50%', // example width for desktop
    alignSelf: 'center',
  },
  mobileContainer: {
    // styles specific to mobile view
    width: '95%', // example width for mobile
    alignSelf: 'center',
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
