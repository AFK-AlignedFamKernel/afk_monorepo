import {Spacing, ThemedStyleSheet} from '../../styles';

const LOGO_SIZE = 170;

export default ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
  },

  background: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },

  middle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE / 2,
    resizeMode: 'contain',
  },
  logoImage: {
    position: 'absolute',
    top: (LOGO_SIZE / 2) * -1,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderWidth: 5,
    borderColor: theme.colors.surface,
    borderRadius: 999,
  },
  title: {
    marginBottom: Spacing.xxxlarge,
    color: theme.colors.primary,
    width: '100%',
    maxWidth: 556,
    textAlign: 'left',
  },
  titleMobile: {
    paddingHorizontal: 15,
    marginBottom: Spacing.small,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    backgroundColor: theme.colors.surface,
  },
}));
