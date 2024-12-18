import {Spacing, ThemedStyleSheet} from '../../../styles';

export default ThemedStyleSheet((theme) => ({
  inputWithLabel: {
    width: '100%',
  },
  warning: {
    display: 'flex',
    gap: Spacing.xsmall,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.small,
    borderRadius: 99,
  },

  // create account
  formContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  inputLabel: {
    color: theme.colors.primary,
    textAlign: 'left',
    width: 550,
    fontSize: 14,
    marginBottom: 10,
  },
  passwordInputContainer: {
    position: 'relative',
    width: 556,
  },
  input: {
    paddingLeft: 16,
    paddingRight: 48,
    paddingVertical: 13,
    color: theme.colors.grayInput,
    backgroundColor: theme.colors.white,
    borderRadius: 32,
  },
  eyeIcon: {
    position: 'absolute',
    top: 10,
    right: 16,
  },
  formBtn: {
    width: 556,
  },
  divider: {
    width: 556,
    marginTop: 40,
    marginBottom: 40,
  },
  accountBtnContainer: {
    width: 556,
  },
  accountBtn: {
    width: 215,
    padding: 0,
    fontWeight: 500,
    fontSize: 12,
    color: theme.colors.primary,
    marginRight: 'auto',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'Arial'
  },
}));
