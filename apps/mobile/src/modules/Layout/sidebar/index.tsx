import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import stylesheet from './styles';
import { useStyles, useTheme } from '../../../hooks';
import { Icon } from '../../../components/Icon';
import { useNavigation } from '@react-navigation/native';
import { DrawerStackNavigationProps, MainStackNavigationProps } from '../../../types';
// import { useAuth } from '../../../store/auth';
import { useAuth, useNostrContext } from 'afk_nostr_sdk';
import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types';

interface SidebarInterface {
    // navigation:MainStackNavigationProps | DrawerNavigationHelpers
    navigation: any
}
const Sidebar = (
    { navigation }: SidebarInterface

) => {
    const styles = useStyles(stylesheet);
    const publicKey = useAuth((state) => state.publicKey);
    const ndk = useNostrContext()
    // const navigation = useNavigation<MainStackNavigationProps>()
    // const navigation = useNavigation<DrawerStackNavigationProps>()
    const handleNavigateProfile = () => {
        navigation.navigate("Profile", { publicKey: publicKey });
    };

    const handleAuth = () => {
        navigation.navigate("Auth");
    };
    const theme = useTheme()
    // const handleNavigateHome = () => {
    //     navigation.navigate("Home");
    // };
    const handleDefiScreen = () => {
        navigation.navigate("Defi");
    };
    const handleGameScreen = () => {
        navigation.navigate("Games");
    };
    const handleHomeScreen = () => {
        navigation.navigate("Feed");
    };

    const handleTipsScreen = () => {
        navigation.navigate("Tips");
    };
    useEffect(() => {
        const unsubscribe = navigation.addListener('drawerClose', () => {
            // Code to handle drawer closing
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.sidebar}>
            <Text style={styles.sidebarText}>AFK</Text>
            <Text style={[styles.title]}>Features coming soon</Text>
            {/* 
            <Text style={[styles.item]}>
                Launchpad
            </Text>
            <Text style={[styles.item,]}>
                Notifications
            </Text> */}
            {/* <Pressable style={[styles.item]}
            // onPress={handleNavigateToPostDetails}
            >
            </Pressable> */}
            {/* <Pressable
                // onPress={handleNavigateHome}
                style={styles.item}>
                <Text
                    style={styles.textItem}
                >
                    Home
                </Text>

            </Pressable> */}

            <Pressable
                onPress={handleHomeScreen}
                style={styles.item}>
                <Icon
                    name="HomeIcon"
                    size={24}
                    style={{ backgroundColor: theme.theme.colors.background }}
                />
                <Text style={styles.textItem}>
                    Feed
                </Text>

            </Pressable>

            <Pressable
                onPress={handleTipsScreen}
                style={styles.item}>
                <Icon
                    name="CoinIcon"
                    size={24}
                    style={{ backgroundColor: theme.theme.colors.background }}
                />
                <Text style={styles.textItem}>
                    Tips
                </Text>

            </Pressable>

            <Pressable
                onPress={handleGameScreen}
                style={styles.item}>
                <Icon
                    name="GameIcon"
                    size={24}
                    style={{ backgroundColor: theme.theme.colors.background }}
                />
                <Text style={styles.textItem}>
                    ?
                </Text>

            </Pressable>

            <Pressable
                onPress={handleDefiScreen}
                style={styles.item}>
                <Icon
                    name="CoinIcon"
                    size={24}
                />
                <Text style={styles.textItem}>
                    Onramp & DeFI
                </Text>
            </Pressable>

            {publicKey &&
                <Pressable
                    onPress={handleNavigateProfile}
                    style={styles.item}>
                    <Icon
                        name="UserIcon"
                        size={24}
                    />
                    <Text style={styles.textItem}>
                        Profile

                    </Text>
                </Pressable>
            }

            {!publicKey && !ndk?.ndk?.signer &&
                <Pressable
                    onPress={handleAuth}
                    style={styles.item}
                >
                    <Icon
                        name="UserIcon"
                        size={24}
                    />
                    <Text style={styles.textItem}>
                        Login
                    </Text>
                </Pressable>
            }

        </View>
    );
};

export default Sidebar;
