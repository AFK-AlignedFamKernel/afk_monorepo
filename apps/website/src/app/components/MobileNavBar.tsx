'use client';
import { Box, List, ListItem, Button, Image as ImageChakra, Text } from '@chakra-ui/react';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';
import { ToggleColorMode } from './ToggleColorMode';
import Image from 'next/image';
type Props = { setToggle: any; toggle: boolean };


export function MobileNavBar({ setToggle, toggle }: Props) {
  const parentAnimationVariants = {
    init: {
      scale: 0,
    },
    animate: {
      scale: 1,
    },
  };
  const toggleNav = () => {
    setToggle((prev: any) => !prev);
  };

  useEffect(() => {
    if (toggle) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [toggle]);

  return (
    <Box className="absolute inset-0 z-[900] backdrop-blur-[30px]">
      <Box className={`list-none pt-[60px] text-center`}>
        <Box className="absolute right-[51px] top-[39px] h-fit w-fit" onClick={toggleNav}>
          <ImageChakra src="/assets/cancel-icon.svg" alt="" />
        </Box>

        <motion.div
          variants={parentAnimationVariants}
          initial="init"
          animate="animate"
          exit={'init'}
          transition={{
            ease: 'easeInOut',
            type: 'string',
          }}
          className="flex h-full w-full items-center justify-center rounded-md bg-redPrimary p-2 text-center"
        >
          <List className="flex w-[90%] flex-col gap-8 text-left">
            <ListItem className="">
              <Link href="/market">Features </Link>
            </ListItem>

            <ListItem>
              <Link href="/infofi">
              <Text>
                InfoFi: Market of Attention & Knowledge
                </Text>
              </Link>
            </ListItem>

            {/* <li className="">
              <Link href="/pixel">Pixel </Link>
            </li> */}
            <ListItem>
              <Button className="py-[12px] w-[145px] bg-[#8DAEF1]">
                {' '}
                <a href="https://afk-community.xyz" target="_blank">
                  {' '}
                  Sign up
                </a>
              </Button>
        

            </ListItem>
            <ListItem>
              <Button className="py-[12px] w-[145px] bg-[#8DAEF1]">
                {' '}
                <a href="https://docs.afk-community.xyz" target="_blank">
                  {' '}
                  Docs
                </a>
              </Button>
            </ListItem>
            <ListItem>
              <ToggleColorMode />
            </ListItem>
          </List>
        </motion.div>
      </Box>
    </Box>
  );
}
