import { Spacing, ThemedStyleSheet } from '../../../styles';
export default ThemedStyleSheet((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        padding: Spacing.normal,
        borderRadius: 8,
        gap: Spacing.xsmall,
        overflowWrap: 'break-word',

    },
    imageContainer: {
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
}));
