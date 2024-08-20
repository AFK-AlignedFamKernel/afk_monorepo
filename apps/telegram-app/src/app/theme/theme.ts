// theme.ts

// 1. import `extendTheme` function
import { extendTheme, useColorMode, useColorModePreference, useColorModeValue, type ThemeConfig } from '@chakra-ui/react'

// 2. Add your color mode config
const config: ThemeConfig = {
    initialColorMode: "dark",
    useSystemColorMode: false,
}

// 3. extend the theme
const theme = extendTheme({
    config,
    colors: {
        brand: {
            50: "#f5f5ff",
            100: "#ebebff",
            200: "#d7d7ff",
            300: "#c2c2ff",
            400: "#a8a8ff",
            500: "#8f8fff", // Primary brand color
            600: "#7f7fff",
            700: "#6f6fff",
            800: "#5f5fff",
            900: "#4f4fff",
        },
    },
    fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif",
    },
    styles: {
        // global: {
        //     body: {
        //         // bg:useColorModeValue("brand.50", "brand.500"),
        //         // bg:("brand.50", "brand.500"),
        //         // bg: "brand.50",
        //         // color: "brand.800",
        //     },
        // },
    },
})

export default theme