// components/ColorModeToggle.tsx
import { IconButton, useColorMode } from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";

const ColorModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
    />
  );
};

export default ColorModeToggle;
