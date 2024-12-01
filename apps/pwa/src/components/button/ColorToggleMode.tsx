// components/ColorModeToggle.tsx
import {MoonIcon, SunIcon} from '@chakra-ui/icons';
import {IconButton, useColorMode} from '@chakra-ui/react';

const ColorModeToggle: React.FC = () => {
  const {colorMode, toggleColorMode} = useColorMode();

  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
    />
  );
};

export default ColorModeToggle;
