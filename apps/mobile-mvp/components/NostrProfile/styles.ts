import { Spacing, ThemedStyleSheet } from '../../styles';

export default ThemedStyleSheet((theme) => ({
  container: {
    width: '100%',
    padding: Spacing.medium,
    borderRadius: 10,
    flex: 1,
    // backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
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
    flex: 1,

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
  profileContainer: {

  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatar: {

  },
  avatarContainer: {
    height: 20,
    width: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  rightContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listProfile: {
    // position: 'absolute',
    height: '100%',
    top: 60,
    right: 0,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
  },
  item: {
    // padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  content: {
    overflow: "hidden",
    height: '100%',
    width: '100%',
  },
  modal: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    height: '100%',
    width: '80%',
    // padding: 10,
    // marginLeft: 'auto',
    // marginRight: 'auto',
  },

  modalContent: {
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    // maxWidth: 400,
    width: '100%',
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    maxHeight: '100%',
    overflow: 'scroll',
    // paddingBottom: 20,
    // position: 'relative',
    height: '100%',
  },
  text: {
    color: theme.colors.text,
    // width: '100%',
    textAlign: 'center',
  },
  profileItemRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
  }
}));
