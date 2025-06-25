import { StyleSheet } from 'react-native';
import { Theme, ThemedStyleSheet } from '@/styles';


// export default (theme: Theme) =>
export default ThemedStyleSheet((theme) => ({
    // StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    safeArea: {
        flex: 1,
        marginTop: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        // borderBottomColor: theme.colors.lightBorder,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructions: {
        fontSize: 16,
        textAlign: 'center',
        color: theme.colors.text,
        marginBottom: 30,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        color: theme.colors.error,
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 20,
    },
    actionButton: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    closeModalButton: {
        width: '100%',
        backgroundColor: theme.colors.lightBorder,
        padding: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    nfcIcon: {
        alignSelf: 'center',
        marginBottom: 24,
    },
    statusText: {
        fontSize: 14,
        color: theme.colors.text,
        textAlign: 'center',
        marginTop: 10,
    },
})); 