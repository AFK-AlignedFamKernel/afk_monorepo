'use client';

import {  IconButton } from "@chakra-ui/react";
import { SunIcon, MoonIcon, useColorMode, Icon } from "@chakra-ui/icons";

export function ToggleColorMode() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle color mode"
      // icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      size="md"
      variant="ghost"
      color="current"
    //   position="fixed"
    //   bottom="4"
    //   right="4"
    >

      <Icon as={colorMode === 'light' ? MoonIcon : SunIcon} width={5} height={5}/>
    </IconButton>
  );
}
