'use client';

import { Box, List, ListItem, Text, Button } from '@chakra-ui/react';
import Link from 'next/link';
import Image from 'next/image';
import { logClickedEvent } from '@/services/analytics';
export function Footer() {
  return (
    <Box className="bg-footerBg bg-no-repeat bg-contain mt-0 pt-[40px] tab:px-[73px] px-6 pb-[42px]">
      <Box className="flex tab:flex-row flex-col items-center tab:items-start justify-between border-b-[1px] border-b-[#484040] border-b-solid pb-[30px]">
        <Box className="flex flex-col items-center tab:items-start text-center tab:text-left">
          <Image
            unoptimized
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
          <List className="flex flex-col gap-y-2">
            <ListItem className="font-bold text-base leading-6">Product</ListItem>
            <ListItem
              borderRadius={"10px"}
              border={"1px solid white"}
              padding={"4px"}
              // margin={"10px"}
              textAlign={"center"}
              backgroundColor={"green"}
              color={"white"}
              textDecoration={"none"}
            >
              <Link href="https://afk-community.xyz"
                // className="border-b-2 border-transparent hover:border-white bg-green-500 border border-1 p-4"
                onClick={() => {
                  logClickedEvent('afk_client_click_footer');
                }}
              >App</Link>
            </ListItem>
            {/* <ListItem>
              <Link href="https://afk-community.xyz">SocialFi features</Link>
            </ListItem> */}
          </List>
          <List className="flex flex-col gap-y-2">
            <ListItem className="font-bold text-base leading-6">Explore</ListItem>
            <ListItem
              borderRadius={"10px"}
              border={"1px solid white"}
              padding={"4px"}
              textAlign={"center"}
              backgroundColor={"gray"}
              color={"white"}
              textDecoration={"none"}
            >
              <Link href="/solutions"
                onClick={() => {
                  logClickedEvent('solutions_page_click_footer');
                }}
              >Solutions</Link>
            </ListItem>
            <ListItem
              borderRadius={"10px"}
              border={"1px solid white"}
              padding={"4px"}
              textAlign={"center"}
              backgroundColor={"gray"}
              color={"white"}
              textDecoration={"none"}
            >
              <Link href="/infofi"
                onClick={() => {
                  logClickedEvent('infofi_page_click_footer');
                }}>Info Fi</Link>
            </ListItem>
          </List>
          <List className="flex flex-col gap-y-10">
            <ListItem className="font-bold text-base leading-6">Company </ListItem>
            <ListItem>
              <Text fontFamily="monospace" fontStyle={'italic'} fontSize="14px" lineHeight="21px">
                DAO and Community owned
              </Text>
            </ListItem>
            <ListItem>
              <Link href="/solutions"
                onClick={() => {
                  logClickedEvent('solutions_page_click_footer');
                }}
              >Solutions</Link>
            </ListItem>
          </List>
        </Box>
        <Box className="flex items-center gap-x-[14px] mt-5 tab:mt-0 self-center tab:self-end">
          <a href="https://x.com/AFK_AlignedFamK" target="_blank"
            onClick={() => {
              logClickedEvent('twitter_redirect');
            }}
          >
            <Image unoptimized src="/assets/twitterIcon.svg"
              width={30}
              height={30}
              alt="AFK Aligned Fam Community Twitter / X" className="w-[30px] h-[30px]" />
          </a>

          {/* <a
            href="https://t.me/AFKStarknet"
            target="_blank">
            <img src="/assets/telegramIcon.svg" alt="" />
          </a> */}
          <a href="https://t.me/afk_aligned_fam_kernel" target="_blank"
            onClick={() => {
              logClickedEvent('telegram_redirect');
            }}
          >
            <Image unoptimized  src="/assets/telegram.svg" alt="AFK Community Telegram "
              width={30}
              height={30}
              className="w-[30px] h-[30px]" />
          </a>
        </Box>
      </Box>
      <Text className="text-xs tab:text-sm leading-[14px] font-normal text-center mt-4">
        © {new Date().getFullYear()} AFK. All Rights Reserved.
      </Text>
    </Box>
  );
}
