'use client';

import { IconButton, useColorMode } from "@chakra-ui/react";
import { SunIcon, MoonIcon, Icon } from "@chakra-ui/icons";

export function ToggleColorMode() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle color mode"
      // icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      size="md"
      variant="ghost"
      color="currentColor"
      // backgroundColor="currentColor"
    //   position="fixed"
    //   bottom="4"
    //   right="4"
    >

      <Icon as={colorMode === 'light' ? MoonIcon : SunIcon} width={25} height={25} />
    </IconButton>
  );
}
