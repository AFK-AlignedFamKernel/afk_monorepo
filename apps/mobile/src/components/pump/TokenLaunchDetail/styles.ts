import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    // alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: Spacing.normal,
    borderRadius: 8,
    gap: Spacing.xsmall,
    overflowWrap: 'break-word',
    // width:Dimensions.get("window").width >= 1024 ? 300 : "100%"
    // width:"100%"
    // width:300,
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
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#b5b5b5',
    paddingBottom: 10,
    marginBottom: 15,
  },
  marginBottom: {
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.small,
  },
}));
