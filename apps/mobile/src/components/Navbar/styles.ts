import { Spacing, ThemedStyleSheet } from "../../styles";

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
        color:theme.colors.text,
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


}))