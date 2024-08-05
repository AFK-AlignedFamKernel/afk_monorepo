import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import stylesheet from './styles';
import { useStyles } from '../../../hooks';

const Sidebar = () => {
    const styles = useStyles(stylesheet);

    return (
        <View style={styles.sidebar}>
            <Text style={styles.sidebarText}>AFK</Text>
            <Text style={[styles.title]}>Features coming soon</Text>
            <Text style={[styles.item]}>
                Launchpad
            </Text>
            <Text style={[styles.item,]}>
                Notifications
            </Text>
            <Text style={[styles.item]}>
                Communities
            </Text>
            <Text style={[styles.item]}>
                Art peace
            </Text>
            <Text style={[styles.item]}>
                Onramp & DeFI
            </Text>
        </View>
    );
};

export default Sidebar;
