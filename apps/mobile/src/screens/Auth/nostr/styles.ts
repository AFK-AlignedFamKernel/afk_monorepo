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
    width: '100%',
    maxWidth: 556,
  },
  inputLabel: {
    color: theme.colors.primary,
    textAlign: 'left',
    maxWidth: 550,
    width: '100%',
    fontSize: 14,
    marginBottom: 10,
  },
  passwordInputContainer: {
    position: 'relative',
    maxWidth: 556,
    width: '100%',
  },
  input: {
    paddingLeft: 16,
    paddingRight: 48,
    paddingVertical: 13,
    color: theme.colors.grayInput,
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    borderColor: theme.colors.grayInput,
    borderWidth: 1
  },
  eyeIcon: {
    position: 'absolute',
    top: 10,
    right: 16,
  },
  formBtn: {
    maxWidth: 556,
    width: '100%',
  },
  divider: {
    maxWidth: 556,
    width: '100%',
    marginTop: 40,
    marginBottom: 40,
  },
  accountBtnContainer: {
    maxWidth: 556,
    width: '100%'
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
    fontFamily: 'Arial',
    marginVertical: 16,
  },
}));
