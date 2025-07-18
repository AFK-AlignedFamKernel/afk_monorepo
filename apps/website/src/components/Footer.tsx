'use client';

import {Box, List, ListItem, Text, Button} from '@chakra-ui/react';
import Link from 'next/link';
import Image from 'next/image';
export function Footer() {
  return (
    <Box className="bg-footerBg bg-no-repeat bg-contain mt-0 pt-[40px] tab:px-[73px] px-6 pb-[42px]">
      <Box className="flex tab:flex-row flex-col items-center tab:items-start justify-between border-b-[1px] border-b-[#484040] border-b-solid pb-[30px]">
        <Box className="flex flex-col items-center tab:items-start text-center tab:text-left">
          <Image
            src="/assets/afk_logo_circle.png"
            // src="/assets/pepe-logo.png"
            className="w-[30px] h-[30px] tab:h-auto tab:w-auto"
            alt=""
            width={30}
            height={30}
          />
          <Text className="text-base leading-[18px] font-normal mt-[15px] tab:mb-[66px] mb-6 w-[278px]">
            Free, open-source decentralized social media platform.
          </Text>
          {/* <Box className="flex items-center gap-x-5">
            <Box>
              <img src="/assets/appStoreBtn.svg" className="w-[100px] tab:w-auto" alt="" />
            </Box>
            <Box>
              <img src="/assets/googlePlaybtn.svg" className="w-[100px] tab:w-auto" alt="" />
            </Box>
          </Box> */}
        </Box>
        <Box className="flex gap-x-[30px] tab:gap-x-[70px] text-[14px] leading-[21px] font-normal pt-[46px]">
          <List className="flex flex-col gap-y-10">
            <ListItem className="font-bold text-base leading-6">Product</ListItem>
            <ListItem>
              <Link href="https://afk-community.xyz">Nostr client</Link>
            </ListItem>
            {/* <ListItem>
              <Link href="https://afk-community.xyz">SocialFi features</Link>
            </ListItem> */}
          </List>
          <List className="flex flex-col gap-y-10">
            <ListItem className="font-bold text-base leading-6">Explore</ListItem>
            <ListItem>
              <Link href="/solutions">Solutions</Link>
            </ListItem>
            <ListItem>
              <Link href="/infofi">Info Fi</Link>
            </ListItem>
          </List>
          <List className="flex flex-col gap-y-10">
            <ListItem className="font-bold text-base leading-6">Company</ListItem>
            <ListItem>
              <Text fontFamily="monospace" fontStyle={'italic'} fontSize="14px" lineHeight="21px">
                DAO and Community owned
              </Text>
            </ListItem>
            <ListItem>
              <Link href="/solutions">Solutions</Link>
            </ListItem>
          </List>
        </Box>
        <Box className="flex items-center gap-x-[14px] mt-5 tab:mt-0 self-center tab:self-end">
          <a href="https://x.com/AFK_AlignedFamK" target="_blank">
            <Image src="/assets/twitterIcon.svg" alt="AFK Aligned Fam Community Twitter / X" className="w-[30px] h-[30px]" />
          </a>

          {/* <a
            href="https://t.me/AFKStarknet"
            target="_blank">
            <img src="/assets/telegramIcon.svg" alt="" />
          </a> */}
          <a href="https://t.me/afk_aligned_fam_kernel" target="_blank">
            <Image src="/assets/telegram.svg" alt="AFK Community Telegram " className="w-[30px] h-[30px]" />
          </a>
        </Box>
      </Box>
      <Text className="text-xs tab:text-sm leading-[14px] font-normal text-center mt-4">
        © {new Date().getFullYear()} AFK. All Rights Reserved.
      </Text>
    </Box>
  );
}
