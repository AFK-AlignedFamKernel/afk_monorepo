export const CommonColors = {
  // black, white and center variants may be used for gradients or other purposes
  transparent: 'transparent',
  blackTransparent: 'rgba(0, 0, 0, 0)',
  whiteTransparent: 'rgba(255, 255, 255, 0)',
  centerTransparent: 'rgba(127, 127, 127, 0)',

  black: '#000000',
  white: '#FFFFFF',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
};

export const LightTheme = {
  dark: false,
  colors: {
    ...CommonColors,

    // new branding - todo delete or replace all the other colors
    // below once everything is refactored with the new ui/ux

    primary: '#00AA9D',
    bg: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#0B0B0B',
    textTertiary: '#0B0B0B',
    overlay70: 'rgba(0, 0, 0, 0.7)',
    grayInput: '#697077',
    cardBorder: '#C4C3D3',
    greenLike: '#ADCF00',

    // here ends the new branding colors

    red: '#EC796B',

    badge: '#F2F2F2',
    badgeText: '#333333',
    badgeBorder: '#CCCCCC',

    messageCard: '#FFFFFF',
    messageCardText: '#14142C',

    messageReplyCard: '#E0E0E0',
    messageReplyCardText: '#14142C',

    // Stream Studio specific colors
    streamStudio_background: '#F4F9FF',
    streamStudio_surface: '#FFFFFF',
    streamStudio_cardBackground: '#F0F0F0',
    streamStudio_inputBackground: '#FFFFFF',
    streamStudio_text: '#14142C',
    streamStudio_text_dim: '#14142C',
    streamStudio_textSecondary: '#6B6B8C',
    streamStudio_primary: '#4FA89B',
    streamStudio_inputText: '#14142C',
    streamStudio_inputBorder: '#DDDDEE',
    streamStudio_inputPlaceholder: '#A1A1C7',
    streamStudio_buttonBackground: '#4FA89B',
    streamStudio_buttonText: '#FFFFFF',
    streamStudio_divider: '#e4e4e7',

    streamStudio_activeStatus: '#48BB78',
    streamStudio_pendingStatus: '#ECC94B',
    streamStudio_tagBackground: '#E2E8F0',
    streamStudio_tagText: '#4A5568',

    //Swap
    swap_background: '#F4F9FF',
    swap_surface: '#FFFFFF',
    swap_cardBackground: '#F0F0F0',
    swap_inputBackground: '#FFFFFF',
    swap_text: '#14142C',
    swap_text_dim: '#14142C',
    swap_textSecondary: '#6B6B8C',
    swap_primary: '#4FA89B',
    swap_inputText: '#14142C',
    swap_inputBorder: '#DDDDEE',
    swap_inputPlaceholder: '#A1A1C7',
    swap_buttonBackground: '#4FA89B',
    swap_buttonText: '#FFFFFF',
    swap_divider: '#e4e4e7',

    // primary: '#EC796B',
    // primary: '#4FA89B',
    primaryLight: 'rgba(236,185,107, 0.1)',

    secondary: '#0C0C4F',
    secondaryLight: 'rgba(12,12,79, 0.1)',

    background: '#F4F9FF',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(13, 13, 29, 0.2)',

    text: '#14142C',
    // textSecondary: '#6B6B8C',
    textLight: '#8F979E',
    textStrong: '#121212',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',

    divider: '#e4e4e7',
    sidebarDivider: '#e4e4e7',

    bottomBarActive: '#14142C',
    bottomBarInactive: 'rgba(30, 47, 61, 0.5)',

    inputBackground: '#FCFCFF',
    inputText: '#14142C',
    // inputText: '#8F979E',

    inputBorder: '#DDDDEE',
    inputPlaceholder: '#A1A1C7',

    buttonBackground: '#e7e7ed',
    buttonText: '#7d7d8c',
    buttonDisabledBackground: 'rgba(12, 12, 79, 0.1)',
    buttonDisabledText: 'rgba(20, 20, 44, 0.5)',

    codeBoxBackground: '#f0e9dd',

    successLight: '#E4E9FA',
    successDark: '#6B87EC',
    errorLight: '#FFEDEB',
    errorDark: '#EC796B',
    infoLight: '#E6E6FC',
    infoDark: '#6B6B8C',
  },
};

export const DarkTheme = {
  dark: true,
  colors: {
    ...CommonColors,

    // new branding - todo delete or replace all the other colors
    // below once everything is refactored with the new ui/ux

    primary: '#00AA9D',
    bg: '#0B0B0B',
    textPrimary: '#FFFFFF',
    textSecondary: '#E9F2EA',
    textTertiary: '#FBFBFB',
    overlay70: 'rgba(0, 0, 0, 0.7)',
    grayInput: '#697077',
    cardBorder: '#C4C3D3',
    greenLike: '#ADCF00',


    // here ends the new branding colors

    red: '#EC796B',

    badge: '#2C2C2C',
    badgeText: '#B3B3B3',
    badgeBorder: '#444444',

    messageCard: '#2C2C2C',
    messageCardText: '#FFFFFF',

    messageReplyCard: '#1F1F1F',
    messageReplyCardText: '#E0E0E0',

    // Stream Studio specific colors
    streamStudio_background: '#1A1A1A',
    streamStudio_surface: '#242424',
    streamStudio_cardBackground: '#242424',
    streamStudio_inputBackground: '#1F1F1F',
    streamStudio_text: '#FFFFFF',
    streamStudio_text_dim: '#EEEEEE',
    streamStudio_textSecondary: '#A1A1C7',
    streamStudio_primary: '#4FA89B',
    streamStudio_inputText: '#FFFFFF',
    streamStudio_inputBorder: '#3A3A3A',
    streamStudio_inputPlaceholder: '#6B6B8C',
    streamStudio_buttonBackground: '#4FA89B',
    streamStudio_buttonText: '#FFFFFF',
    streamStudio_divider: '#3A3A3A',

    streamStudio_activeStatus: '#48BB78',
    streamStudio_pendingStatus: '#ECC94B',
    streamStudio_tagBackground: '#4A5568',
    streamStudio_tagText: '#E2E8F0',

    //Swap
    swap_background: '#1A1A1A',
    swap_surface: '#242424',
    swap_cardBackground: '#2C2C2C',
    swap_inputBackground: '#1F1F1F',
    swap_text: '#FFFFFF',
    swap_text_dim: '#eeeeee',
    swap_textSecondary: '#A1A1C7',
    swap_primary: '#4FA89B',
    swap_inputText: '#FFFFFF',
    swap_inputBorder: '#3A3A3A',
    swap_inputPlaceholder: '#6B6B8C',
    swap_buttonBackground: '#4FA89B',
    swap_buttonText: '#FFFFFF',
    swap_divider: '#3A3A3A',

    // primary: '#EC796B',
    // primary: '#4FA89B',
    primaryLight: 'rgba(236,185,107, 0.1)',

    secondary: '#0C0C4F',
    secondaryLight: 'rgba(12,12,79, 0.1)',

    background: '#000000',
    surface: '#000000',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(13, 13, 29, 0.2)',

    text: '#FFFFFF',
    // textSecondary: '#FFFFFF',
    textLight: '#FFFFFF',
    textStrong: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',

    divider: '#1b1b18',
    sidebarDivider: '#FFFFFF',

    bottomBarActive: '#8F979E',
    bottomBarInactive: 'rgb(105,105,105, 0.5)',

    inputBackground: '#272727',
    inputText: '#8F979E',
    // inputText: '#14142C',

    inputBorder: '#222211',
    inputPlaceholder: '#A1A1C7',

    buttonBackground: '#202020',
    buttonText: '#FFFFFF',
    buttonDisabledBackground: 'rgba(150, 150, 150, 0.1)',
    buttonDisabledText: '#FFFFFF',

    codeBoxBackground: '#373737',

    successLight: '#E4E9FA',
    successDark: '#6B87EC',
    errorLight: '#FFEDEB',
    errorDark: '#EC796B',
    infoLight: '#E6E6FC',
    infoDark: '#6B6B8C',
  },
};

export type Theme = typeof LightTheme;
export type ThemeColorNames = keyof Theme['colors'];

export type ColorProp = ThemeColorNames | 'transparent' | `#${string}` | `rgb${string}`;
