'use client';

import Link from 'next/link';
import React, {useState} from 'react';
import {createPortal} from 'react-dom';

import {MobileNavBar} from './MobileNavBar';
import {NavigationLinks} from './NavigationLinks';
import {Box, Button, Text, Image as ImageChakra, Link as LinkChakra} from '@chakra-ui/react';
import Image from 'next/image';

export function Navbar() {
  const [toggleNav, setToggleNav] = useState(false);
  const [toggleParamsNav, setToggleParamsNav] = useState(false);
  return (
    <Box className="desktop:py-[26px] py-3 px-6 desktop:px-[120px] flex justify-between items-center">
      <Box className="flex items-center gap-x-[10px] text">
        <Image
          // src="/assets/pepe-logo.png"
          src="/assets/afk_logo_circle.png"
          className="desktop:h-[30px] w-9 h-9 desktop:w-[30px]"
          alt=""
          width={30}
          height={30}
        />
        <LinkChakra href="/" className="desktop:text-xl text-base leading-7 font-bold">
          AFK
          {/* <Text >AFK</Text> */}
        </LinkChakra>
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

      <Button
        className="flex"
        onClick={() => {
          if (toggleNav) {
            setToggleNav(false);
          } else {
            setToggleNav(true);
            window.scrollTo({top: 0, left: 0, behavior: 'smooth'});
          }
        }}
      >
        <Image
          src="assets/hamburger-icon.svg"
          className="w-6 h-6"
          alt=""
          width={24}
          height={24}
          // color="currentColor"
        />
      </Button>

      {toggleNav &&
        createPortal(<MobileNavBar setToggle={setToggleNav} toggle={toggleNav} />, document.body)}
    </Box>
  );
}
