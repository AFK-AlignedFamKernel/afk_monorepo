import {Spacing, ThemedStyleSheet} from '../../styles';
export default ThemedStyleSheet((theme) => ({
  container: {
    gap: Spacing.small,
    paddingBottom: Spacing.normal,
  },
  codeBox: {
    backgroundColor: theme.colors.codeBoxBackground,
    padding: Spacing.medium,
    borderRadius: 6,
    fontFamily: 'Courier New, Courier, monospace',
    color: theme.colors.buttonText,
    maxHeight: 150,
    overflow: 'hidden',
    overflowX: 'auto',
  },
  editCodeBox: {
    backgroundColor: theme.colors.codeBoxBackground,
    padding: Spacing.medium,
    borderRadius: 6,
    fontFamily: 'Courier New, Courier, monospace',
    color: theme.colors.buttonText,
    overflowX: 'auto',
  },
  editCodeBoxRelays: {
    maxHeight: 150,
    overflow: 'hidden',
  },
  codeBoxText: {
    // marginVertical and marginHorizontal does not support with <pre> tag
    marginRight: 0,
    marginLeft: 0,
    marginTop: 6,
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relayInput: {
    height: 30,
    marginTop: Spacing.small,
  },
  relayButtonContainer: {
    gap: Spacing.small,
    justifyContent: 'center',
    marginTop: Spacing.small,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 18,
  },
  text: {
    color: theme.colors.text,
  },
  imageContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
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
