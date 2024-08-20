import { Spacing, ThemedStyleSheet } from '../../styles';
export default ThemedStyleSheet((theme) => ({
  container: {
    marginHorizontal: 10,
    alignItems:"center"
  },
  relayItem: {
    flex:1,
    flexDirection:"row",
    gap:3,
    alignItems:"center"
  },
  relayText: {
    width:"100%"
  },
  relayButton: {
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    marginBottom: 4,
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
  button: {
    marginVertical: 5 
  },

  name: {
    paddingTop: Spacing.xxsmall,
  },
}));
