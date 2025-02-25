import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: Spacing.xlarge,
  },

  modal: {
    backgroundColor: theme.colors.surface,
    padding: Spacing.large,
    borderRadius: 24,
    paddingHorizontal: Spacing.xlarge,
    paddingVertical: Spacing.xxxlarge,
  },

  desktopModal: {
    // styles specific to desktop view
    width: '50%', // example width for desktop
    alignSelf: 'center',
  },
  mobileModal: {
    // styles specific to mobile view
    width: '100%', // example width for mobile
    alignSelf: 'center',
  },
}));
