'use client';

import { Box, Text } from '@chakra-ui/react';
import {FaqBar} from '../FaqBar';

export function Faq() {
  return (
    <Box className="desktop:pt-[84px] pt-[40px] pb-[44px] px-[24px] desktop:px-[320px]text-center bg-gradientBg">
      <Text className="mb-[49px] text-xl desktop:text-[32px] leading-[38px]">
        Frequently asked Questions
      </Text>
      <Box className="flex flex-col gap-y-[24px] items-center w-full">
        <FaqBar
          question="What kind of contents can i post?"
          answer="Whatever, it's a Censorship resistant Social Network and Graph. Express yourself, discuss, debate, see others content based on your interests and friends!"
        />
        <FaqBar
          question="How can i contribute to the Aligned Fam Kernel project?"
          answer="Join us on AFK and Telegram! You can contribute in different way: as Content creator, Marketer, Dev or just a friend, it's a community project that collaborate for our vision!"
        />
        <FaqBar
          question="How can I join the Aligned Fam Kernel community?"
          answer="It's a Freedom place. Everyone can join and use our Social network, and be a part of the community and contributors!"
        />
        <FaqBar
          question="What kind of contents can i post?"
          answer="Whatever, it's a Censorship resistant Social Network and Graph. Express yourself, discuss, debate, see others content based on your interests and friends!"
        />
        <FaqBar
          question="How can i contribute to the Aligned Fam Kernel project?"
          answer="Join us on AFK and Telegram! You can contribute in different way: as Content creator, Marketer, Dev or just a friend, it's a community project that collaborate for our vision!"
        />
        <FaqBar
          question="How can I join the Aligned Fam Kernel community?"
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
