import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import stylesheet from './styles';
import { useStyles, useTheme } from '../../../hooks';
import { Icon } from '../../Icon';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps } from '../../../types';
// import { useAuth } from '../../../store/auth';
import { useAuth } from 'afk_nostr_sdk';

const Sidebar = () => {
    const styles = useStyles(stylesheet);

    const publicKey = useAuth((state) => state.publicKey);


    const navigation = useNavigation<MainStackNavigationProps>()
    const handleNavigateProfile = () => {
        navigation.navigate("Profile", { publicKey: publicKey });
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
        navigation.navigate("Home");
    };


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
                    Home
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



        </View>
    );
};

export default Sidebar;
