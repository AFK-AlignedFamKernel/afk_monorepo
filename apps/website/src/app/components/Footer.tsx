import { Box, List, ListItem, Text, Button } from "@chakra-ui/react";

export function Footer() {
  return (
    <Box className="bg-footerBg bg-no-repeat bg-contain mt-0 pt-[200px] tab:px-[73px] px-6 pb-[42px]">
      <Box className="flex tab:flex-row flex-col items-center tab:items-start justify-between border-b-[1px] border-b-[#484040] border-b-solid pb-[30px]">
        <Box className="flex flex-col items-center tab:items-start text-center tab:text-left">
          <img
            src="/assets/pepe-logo.png"
            className="w-[80px] h-[80px] tab:h-auto tab:w-auto"
            alt=""
          />
          <Text className="text-base leading-[18px] font-normal mt-[15px] tab:mb-[66px] mb-6 w-[278px]">
            Free, open-source decentralized social media platform.
          </Text>
          <Box className="flex items-center gap-x-5">
            <Button>
              <img src="/assets/appStoreBtn.svg" className="w-[100px] tab:w-auto" alt="" />
            </Button>
            <Button>
              <img src="/assets/googlePlaybtn.svg" className="w-[100px] tab:w-auto" alt="" />
            </Button>
          </Box>
        </Box>
        <Box className="flex gap-x-[40px] tab:gap-x-[122px] text-[14px] leading-[21px] font-normal pt-[46px]">
              <List className="flex flex-col gap-y-10">
            <ListItem className="font-bold text-base leading-6">Company</ListItem>
            <ListItem>DAO and Community owned</ListItem>
            <ListItem>Solutions</ListItem>
          </List>
          <List className="flex flex-col gap-y-10">
            <ListItem className="font-bold text-base leading-6">Product</ListItem>
            <ListItem>Nostr client</ListItem>
            <ListItem>SocialFi features</ListItem>
          </List>
        </Box>
        <Box className="flex items-center gap-x-[14px] mt-5 tab:mt-0 self-center tab:self-end">
          <a href="https://x.com/AFK_AlignedFamK" target="_blank">
            <img src="/assets/twitterIcon.svg" alt="AFK Aligned Fam Community Twitter / X" />
          </a>

          {/* <a
            href="https://t.me/AFKStarknet"
            target="_blank">
            <img src="/assets/telegramIcon.svg" alt="" />
          </a> */}
          <a href="https://t.me/afk_aligned_fam_kernel" target="_blank">
            <img src="/assets/telegramIcon.svg" alt="AFK Community Telegram " />
          </a>
        </Box>
      </Box>
      <Text className="text-xs tab:text-sm leading-[14px] font-normal text-center mt-4">
        © 2024 AFK. All Rights Reserved.
      </Text>
    </Box>
  );
}
