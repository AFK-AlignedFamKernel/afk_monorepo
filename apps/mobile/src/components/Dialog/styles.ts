import {Spacing, ThemedStyleSheet} from '../../styles';

export default ThemedStyleSheet((theme) => ({
  modal: {
    padding: Spacing.large,
    height: '90vh', // 90% of the viewport height
    width: '70vw', // 70% of the viewport width
    maxWidth: '600', // Prevents it from being too wide on large screens
    maxHeight: '500px', // Prevents it from being too tall
    minWidth: '350px', // Ensures it doesn't get too small
    minHeight: '200px', // Ensures it remains readable
    paddingTop: 25px; // Choose a value that makes sense

  },

  content: {
    alignItems: 'center',
  },
  icon: {
    marginTop: Spacing.xsmall,
    marginBottom: Spacing.large,
  },
  title: {
    marginBottom: Spacing.medium,
  },

  buttons: {
    gap: Spacing.xsmall,
    marginTop: Spacing.xlarge,
  },
}));
