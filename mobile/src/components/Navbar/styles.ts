import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  // const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 15,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  burgerIcon: {
    padding: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: Spacing.xsmall,
  },
  profileContainer:{

  },
  profileButton:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatar:{

  },
  avatarContainer:{
    height: 30,
    width: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  rightContainer:{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listProfile:{
    position: 'absolute',
    top: 60,
    right: 0,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
  }
}));
