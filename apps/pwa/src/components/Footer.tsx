import {Box, useColorModeValue} from '@chakra-ui/react';

export function Footer() {
  const bgColor = useColorModeValue('gray.300', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.300');

  return (
    <Box
      // className="mt-0 tab:mt-[140px] pt-[200px] tab:pt-[514px] tab:px-[73px] px-6 pb-[42px]"
      className="mt-0 tab:mt-[30px] pt-[50px] tab:pt-[30px] tab:px-[73px] px-6 pb-[42px]"
      bg={bgColor}
      color={textColor}
    >
      <Box
        // className="flex tab:flex-row flex-col items-center tab:items-start justify-between border-b-[1px] border-b-[#484040] border-b-solid pb-[30px]"
        className="flex tab:flex-row flex-col items-center tab:items-start justify-between border-b-solid pb-[30px]"
      >
        <Box className="flex flex-col items-center tab:items-start text-center tab:text-left">
          <img
            src="/assets/afkMascot.png"
            // src="/assets/pepe-logo.png"
            className="w-[50px] h-[50px] tab:h-auto tab:w-auto"
            alt="AFK Logo LFG"
          />
          <p className="text-base leading-[18px] font-normal mt-[15px] tab:mb-[66px] mb-6 w-[278px]">
            Free, open-source decentralized social media platform.
          </p>
          <Box className="flex items-center gap-x-5">
            <button>
              <img src="/assets/appStoreBtn.svg" className="w-[100px] tab:w-auto" alt="" />
            </button>
            <button>
              <img src="/assets/googlePlaybtn.svg" className="w-[100px] tab:w-auto" alt="" />
            </button>
          </Box>
        </Box>
        <Box className="flex gap-x-[40px] tab:gap-x-[122px] text-[14px] leading-[21px] font-normal pt-[46px]">
          <ul className="flex flex-col gap-y-10">
            <li className="font-bold text-base leading-6">Company</li>
            <li>DAO and Community owned</li>
            <li>Solutions</li>
          </ul>
          <ul className="flex flex-col gap-y-10">
            <li className="font-bold text-base leading-6">Product</li>
            <li>Nostr client</li>
            <li>SocialFi features</li>
          </ul>
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
      <h6 className="text-xs tab:text-sm leading-[14px] font-normal text-center mt-4">
        © {new Date()?.getFullYear()} AFK. All Rights Reserved.
      </h6>
    </Box>
  );
}
