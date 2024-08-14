import React, { useState } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import WebView from 'react-native-webview';
import { Button } from '../Button';
import EmbedWebsite from './EmbedWebsite';
import stylesheet from "./styles"
import { useStyles } from '../../hooks';
interface EmbedWebsiteInterface {
    uri?: string
    title?: string;
    twitter?: string;
    description?: string;
}
const EmbedCard = ({ uri, title, twitter, description }: EmbedWebsiteInterface) => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const styles = useStyles(stylesheet)
    const handleOpen = () => {
        setIsOpen(!isOpen)
    }
    return (

        <View>
            {title &&
                <Text>{title}</Text>
            }

            <Button onPress={handleOpen}>Open</Button>

            {isOpen &&
                <EmbedWebsite uri={uri}></EmbedWebsite>
            }


        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default EmbedCard;