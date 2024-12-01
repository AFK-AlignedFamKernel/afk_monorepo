import { Spacing, ThemedStyleSheet, Typography } from "../../styles";


export default ThemedStyleSheet((theme) => ({
  // container: {
  //   // marginTop: 50,
  //   alignItems: 'center',
  // },
  container: {
    alignItems: 'center',

    width: '100%',
    maxWidth: 500,
    padding: Spacing.medium,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  profileButton: {
    // backgroundColor: '#6200ea',
    backgroundColor:theme.colors.background,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  profileButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    fontSize: 16,
  },
 
  content: {
    flex: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    backgroundColor: theme.colors.transparent,
    height: 56,
    marginBottom: Spacing.medium,

    // ...(error && {
    //   backgroundColor: theme.colors.errorLight,
    //   borderColor: theme.colors.errorDark,
    // }),

    // ...(left && {
    //   paddingLeft: Spacing.small,
    // }),

    // ...(right && {
    //   paddingRight: Spacing.small,
    // }),
  },

  input: {
    borderWidth: 1,
    borderRadius: 999,
    borderColor: theme.colors.inputBorder,
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.large,
    color: theme.colors.inputText,
    backgroundColor: theme.colors.inputBackground,
    fontSize: 15,
    ...Typography.semiBold,

    // ...(left && {
    //   paddingLeft: Spacing.none,
    // }),

    // ...(right && {
    //   paddingRight: Spacing.none,
    // }),
  },

  errorText: {
    marginTop: 3,
    color: theme.colors.errorDark,
  },
}));
