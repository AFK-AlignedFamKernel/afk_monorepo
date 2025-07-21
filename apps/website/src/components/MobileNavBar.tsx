'use client';
import { Box, List, ListItem, Button, Image as ImageChakra, Text } from '@chakra-ui/react';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';
import { ToggleColorMode } from './ToggleColorMode';
import { logClickedEvent } from '@/services/analytics';
import Image from 'next/image';
// import Image from 'next/image';
type Props = { setToggle: any; toggle: boolean };

export const MotionBox = motion(Box);
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
    <MotionBox
      className="absolute inset-0 z-[900] backdrop-blur-[30px]"
      maxWidth={{ sm: '100%', lg: '40%' }}
      as={motion.div}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    // onClick={(e) => e.stopPropagation()}
    >
      <Box className={`list-none pt-[60px] text-center`}>
        <Box
          className="absolute right-[51px] top-[39px] h-fit w-fit"
          onClick={toggleNav}
          cursor="pointer"
        >
          <Image 
          unoptimized
          src="/assets/cancel-icon.svg" alt="Cancel" 
          width={24}
          height={24}
          />
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
              <Link href="/solutions"
              className="text-[18px] leading-[21px]"
              onClick={() => {
                logClickedEvent('solutions_click');
              }}
              >Solutions </Link>
            </ListItem>

            <ListItem>
              <Link href="/infofi"
                className="text-[18px] leading-[21px]"
                onClick={() => {
                  logClickedEvent('infofi_click');
                }}
                >
                <Text>InfoFi</Text>
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
                <a href="https://docs.afk-community.xyz" target="_blank"
                onClick={() => {
                  logClickedEvent('docs_click');
                }}
                // className="text-[18px] leading-[21px]"
                >
                  {' '}
                  Docs
                </a>
              </Button>
            </ListItem>

            <ListItem>
              <div className="flex items-center gap-x-[10px]">
                
                <a href="https://x.com/AFK_AlignedFamK" target="_blank"
                onClick={() => {
                  logClickedEvent('twitter_redirect');
                }}
                >
                  <Image unoptimized src="/assets/twitterIcon.svg" alt="" 
                  width={30}
                  height={30}
                  />
                </a>
                <a href="https://t.me/afk_aligned_fam_kernel" target="_blank"
                onClick={() => {
                  logClickedEvent('telegram_redirect');
                }}
                >
                  <Image unoptimized  src="/assets/telegram.svg" alt=""
                  width={30}
                  height={30}
                  />
                </a>

              </div>
            </ListItem>
            <ListItem>
              <ToggleColorMode />
            </ListItem>
          </List>
        </motion.div>
      </Box>
    </MotionBox>
  );
}
