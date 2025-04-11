'use client';

import Link from 'next/link';
import React, {useState} from 'react';
import {createPortal} from 'react-dom';

import {MobileNavBar} from './MobileNavBar';
import {NavigationLinks} from './NavigationLinks';
import { Box, Button, Text } from '@chakra-ui/react';

export function Navbar() {
  const [toggleNav, setToggleNav] = useState(false);
  const [toggleParamsNav, setToggleParamsNav] = useState(false);
  return (
    <Box className="desktop:py-[26px] py-3 px-6 desktop:px-[120px] flex justify-between items-center">
      <Box className="flex items-center gap-x-[10px] text">
        <img
          // src="/assets/pepe-logo.png"
          src="/assets/afk_logo_circle.png"
          className="desktop:h-[52px] w-9 h-9 desktop:w-[52px]"
          alt=""
        />
        <Link href="/">
          <Text className="desktop:text-2xl text-lg leading-7 font-bold text-white">AFK</Text>
        </Link>
      </Box>
      <NavigationLinks />

      {/* <button
        onClick={() => {
          setToggleParamsNav(true);
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }}
      >
        <img src="assets/hamburger-icon.svg" className="w-6 h-6" alt="" />
      </button> */}

      {/* <MenuNav></MenuNav> */}
      {/* {toggleParamsNav &&
        createPortal(<MenuNav setToggle={setToggleParamsNav} toggle={toggleParamsNav} />, document.body)
      } */}
      <Box className="desktop:flex hidden items-center gap-x-4 font-bold text-sm leading-[16px]">
        <Button className="py-[15px] px-[48px] bg-white">
          <a href="https://afk-community.xyz" target="_blank">
            Go AFK
          </a>
        </Button>
      </Box>

      <Button
        className="flex"
        onClick={() => {
          setToggleNav(true);
          window.scrollTo({top: 0, left: 0, behavior: 'smooth'});
        }}
      >
        <img src="assets/hamburger-icon.svg" className="w-6 h-6" alt="" />
      </Button>

      {toggleNav &&
        createPortal(<MobileNavBar setToggle={setToggleNav} toggle={toggleNav} />, document.body)}
    </Box>
  );
}
