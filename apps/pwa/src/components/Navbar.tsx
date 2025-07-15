'use client';

import {Box, useColorModeValue, useTheme} from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const MenuNav = dynamic(() => import('./MenuNav'), {ssr: false});
const MobileDrawerNavbar = dynamic(() => import('./MobileDrawerNavbar'), {ssr: false});
const NavigationLinks = dynamic(
  () => import('./NavigationLinks').then((mod) => mod.NavigationLinks),
  {ssr: false},
);

export function Navbar() {
  const theme = useTheme();
  const bgColor = useColorModeValue('gray.300', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.300');

  return (
    <Box
      className="desktop:py-[26px] hidden py-3 px-6 desktop:px-[120px]  justify-between items-center"
      bg={bgColor}
      color={textColor}
    >
      <Box className="flex items-center gap-x-[10px] text">
        <Image
          src="/assets/pepe-logo.png"
          className="desktop:h-[52px] w-9 h-9 desktop:w-[52px]"
          alt="AFK logo"
        />
        <Link href="/">
          <h5 className="desktop:text-2xl text-lg leading-7 font-bold">AFK</h5>
        </Link>
      </Box>
      <NavigationLinks />
      <MenuNav />
      <MobileDrawerNavbar />
    </Box>
  );
}

export default dynamic(() => Promise.resolve(Navbar), {ssr: false});
