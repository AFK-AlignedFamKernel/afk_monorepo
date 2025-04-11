import {
  ChakraProvider,
  extendTheme,
  // theme,
  ThemeConfig,
  // createSystem,
  // defaultConfig,
  // defineConfig,
} from "@chakra-ui/react"
import {mode, StyleFunctionProps} from '@chakra-ui/theme-tools';

const colors ={
  theme: {
    breakpoints: {
      sm: "320px",
      md: "768px",
      lg: "960px",
      xl: "1200px",
    },
    tokens: {
      colors: {
        red: "#EE0F0F",
      },
    },
    semanticTokens: {
      colors: {
        danger: { value: "{colors.red}" },
      },
    },
    keyframes: {
      spin: {
        from: { transform: "rotate(0deg)" },
        to: { transform: "rotate(360deg)" },
      },
    },
  },
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
  
  semantic: {
    text: {
      primary: mode('gray.800', 'whiteAlpha.900'),
      secondary: mode('gray.600', 'whiteAlpha.700'),
      tertiary: mode('gray.500', 'whiteAlpha.500'),
    },
    bg: {
      primary: mode('white', 'gray.800'),
      secondary: mode('gray.50', 'gray.700'),
      tertiary: mode('gray.100', 'gray.600'),
    },
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
      fontFamily: 'Droid Sans, sans-serif',
      bg: '#153e75',
      // useColorMode("#153e75", "#153e75")
    }
  },
}

// 2. Add your color mode config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// const config: defineConfig  {
//   initialColorMode: 'dark',
//   useSystemColorMode: true,
// };

// const config = defineConfig({
//   theme: {
//     tokens: {
//       colors: {},
//     },
//   },
// })
// export const configChakra = defineConfig({

// })

const theme = extendTheme({
  colors,
  config,
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        color: mode('gray.800', 'whiteAlpha.900')(props),
        bg: mode('white', 'gray.800')(props),
        fontFamily: 'Droid Sans, sans-serif',
        lineHeight: 'base',
      },
      'h1, h2, h3, h4, h5, h6': {
        color: mode('gray.800', 'whiteAlpha.900')(props),
      },
      p: {
        color: mode('gray.700', 'whiteAlpha.700')(props),
      },
      li: {
        color: mode('gray.700', 'whiteAlpha.700')(props),
      },
      span: {
        color: mode('gray.700', 'whiteAlpha.700')(props),
      },
      a: {
        color: mode('blue.500', 'blue.300')(props),
        _hover: {
          color: mode('blue.600', 'blue.200')(props),
        },
      },
    }),
  },
  components: {
    Text: {
      baseStyle: (props: StyleFunctionProps) => ({
        color: mode('gray.800', 'whiteAlpha.900')(props),
        fontFamily: 'Droid Sans, sans-serif',
      }),
      variants: {
        primary: (props: StyleFunctionProps) => ({
          color: mode('gray.800', 'whiteAlpha.900')(props),
        }),
        secondary: (props: StyleFunctionProps) => ({
          color: mode('gray.600', 'whiteAlpha.700')(props),
        }),
        tertiary: (props: StyleFunctionProps) => ({
          color: mode('gray.500', 'whiteAlpha.500')(props),
        }),
      },
      defaultProps: {
        variant: 'primary',
      },
    },
    Heading: {
      baseStyle: (props: StyleFunctionProps) => ({
        color: mode('gray.800', 'whiteAlpha.900')(props),
        fontFamily: 'Droid Sans, sans-serif',
      }),
    },
  },
});

// export default createSystem(defaultConfig, configChakra)
export default theme;
