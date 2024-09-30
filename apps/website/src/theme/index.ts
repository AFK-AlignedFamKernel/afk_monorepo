// 1. Import the extendTheme function
import {type ThemeConfig, extendTheme, StyleFunctionProps} from '@chakra-ui/react';
import {mode} from '@chakra-ui/theme-tools';
// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
  brand: {
    primary: '#4FA89B',
    secondary: '#4f89a8',
    complement: '#a84f5c',
    100: '#f7fafc',
    900: '#1a365d',
    800: '#008AFC',
    700: '#2a69ac',
    // green:"#baef73",
    red: '#FF4040',
    blue: '#008AFC',
    one: 'rgb(147,150,251)',
    blueDark: '#0d0889',
    // brown: "#A8672B",
    brown: 'rgba(168, 103, 43, 0.65)',
    green: '#CEFFB7',
    beige: '#F5F5DC',
    gold: '#FCC201',
    yellow: '#FFB62E',
    orange: '#FFB62E',
    greenTool: '#BAEF73',
    discord: '#5865F2',
  },

  gradient: {
    basic: 'linear(to-l, brand.primary, brand.complement)',
    green: 'linear-gradient(53deg, rgba(200, 237, 10, 1) 35%, rgba(253, 217, 13, 1) 100%)',
    primary: 'linear-gradient(53deg, #4FA89B 35%, #4f89a8 100%)',
  },
  green: {
    primary: '#baef73',
    one: '#baef73',
  },
  purple: {
    primary: 'rgb(147,150,251)',
    secondary: 'rgb(98 102 225)',
    analogous: '#4e0889',
  },
  blue: {
    primary: '#0d0889',
    secondary: '#084389',
    flash: '##120bb9',
  },
  button: {
    primary: 'rgba(168, 103, 43, 0.65)',
  },

  gray: {
    // 800: '#153e75',
    700: '#252627',
    basic: '#3c3c3c',
    one: '#F5F5F5',
    two: '#EEEEEE',
  },
  body: {
    body: {
      // bg: mode("#153e75","#153e75")
      fontFamily: 'monospace',
      bg: '#153e75',
      // useColorMode("#153e75", "#153e75")
    },
  },
};

// 2. Add your color mode config
// const config: ThemeConfig = {
//   initialColorMode: "light",
//   useSystemColorMode: false,
// };

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
};

const theme = extendTheme({
  colors,
  config,
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        // fontFamily: "body",
        // color: mode("gray.800", "whiteAlpha.900")(props),
        // color: mode("gray.800", "gray.900")(props),
        color: mode('gray.800', 'gray.900')(props),
        fontFamily: 'monospace',
        bg: mode('white', 'gray.700')(props),
        lineHeight: 'base',
      },
    }),
  },
  components: {
    Text: {
      // The styles all button have in common
      baseStyle: {
        fontFamily: 'monospace',
        // fontWeight: "bold",
        // textTransform: "uppercase",
        // borderRadius: "base", // <-- border radius is same for all variants and sizes
      },
      fontFamily: 'monospace',
      // fontFamily:"PressStart2P",

      // // The default size and variant values
      defaultProps: {
        // size: 'md',
        fontFamily: 'monospace',
        // variant: 'outline',
      },
      // Two sizes: sm and md
      sizes: {
        sm: {
          fontSize: '17px',
          px: 4, // <-- px is short for paddingLeft and paddingRight
          py: 3, // <-- py is short for paddingTop and paddingBottom
        },
        md: {
          fontSize: '21px',
          px: 6, // <-- these values are tokens from the design system
          py: 4, // <-- these values are tokens from the design system
        },
        lg: {
          fontSize: '25px',
          px: 6, // <-- these values are tokens from the design system
          py: 4, // <-- these values are tokens from the design system
        },
      },
      // // Two variants: outline and solid
      // variants: {
      //   outline: {
      //     border: '2px solid',
      //     borderColor: 'purple.500',
      //     color: 'purple.500',
      //   },
      //   solid: {
      //     bg: 'purple.500',
      //     color: 'white',
      //   },
      // },
      // fontFamily: "monospace",
    },
  },
});

export default theme;
