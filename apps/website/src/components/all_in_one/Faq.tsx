'use client';

import { Box, Text } from '@chakra-ui/react';
import { FaqBar } from '../FaqBar';

export function Faq() {
  return (
    <Box className="desktop:pt-[20px] pt-[20px] px-[8px] desktop:px-[320px] text-center bg-gradientBg">
      <Text className="mb-[49px] text-xl desktop:text-[32px] leading-[38px]">
        Frequently asked Questions
      </Text>
      <Box className="flex flex-col gap-y-[24px] items-center w-full">
        <FaqBar
          question="What is AFK?"
          answer="AFK is like WeChat & Signal but with real privacy, integrity and freedom. Fully open-source, don't trust, verify."
        />
        <FaqBar
          question="How use AFK?"
          answer="Discuss, create content, debate, tip, vote, make money and more!"
        />

        <FaqBar
          question="How AFK works?"
          answer="AFK uses Nostr protocol, Starknet combined with Bitcoin & Ethereum."
        />
        <FaqBar
          question="What's the benefit of using AFK - Aligned Fam Kernel?"
          answer="Make more money. Ownership of your data, content, money, and your Digital Identity."
        />

        <FaqBar
          question="What kind of contents can i post?"
          answer="Whatever, it's a Censorship resistant Social Network and Graph. Express yourself, discuss, debate, see others content based on your interests and friends!"
        />
        <FaqBar
          question="How can i contribute to the AFK - Aligned Fam Kernel project?"
          answer="Join us on AFK and Telegram! You can contribute in different way: as Content creator, Marketer, Dev or just a friend, it's a community project that collaborate for our vision!"
        />
        <FaqBar
          question="How can I join the AFK - Aligned Fam Kernel community?"
          answer="It's a Freedom place. Everyone can join and use our Social network, and be a part of the community and contributors!"
        />

        {/* <FaqBar question="How do i Join AFK?" answer="Visit our mobile app and website. Join the AFK Community on Telegram, debate, discuss, and contribute to the Freedom vision." />
        <FaqBar question="What kind of contents can i post?" answer="Whatever, it's a Censorship resistant Social Network and Graph. Express yourself, discuss, debate, see others content based on your interests and friends!" />
        <FaqBar question="How can i contribute to the AFK project?" answer="Join us on AFK and Telegram! You can contribute in different way: as Content creator, Marketer, Dev or just a friend, it's a community project that collaborate for our vision!" />
        <FaqBar question="How can I join the AFK community?" answer="It's a Freedom place. Everyone can join and use our Social network, and be a part of the community and contributors!" /> */}
      </Box>
    </Box>
  );
}
