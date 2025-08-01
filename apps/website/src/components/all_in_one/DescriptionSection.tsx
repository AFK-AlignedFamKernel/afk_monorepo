'use client';

import {Text, Box} from '@chakra-ui/react';
import {motion} from 'framer-motion';

import {Feature} from './Feature';

export function DescriptionSection() {
  return (
    <div className="flex flex-col items-center text-center  px-6 desktop:px-[120px] bg-gradientBg bg-no-repeat bg-contain">
      <div className="desktop:py-[10px] py-[10px] flex flex-col items-center  gap-y-[8px]">
        <motion.div
          initial={{opacity: 0}}
          whileInView={{opacity: 1}}
          transition={{ease: 'easeOut', duration: 1}}
          className="max-w-[951px] mb-6 tab:mb-[72px]"
        >
          <h1 className="text-xl tab:text-[82px] leading-5 tab:leading-[82px] font-bold">
            The Sovereign App
          </h1>
          <p className="text-sm tab:text-base leading-[30px] mt-4 text-[#9D9797]">
            A decentralized and open app. Own your data, identity, content and money.
            Share what you think, debate, vote, make money.
            Your Digital Identity is your own.
            Uncensorable, censorship resistant.
            Be unstoppable.
          </p>
        </motion.div>
        <motion.div
          initial={{opacity: 0}}
          whileInView={{opacity: 1}}
          transition={{ease: 'easeOut', duration: 1}}
          className="flex desktop:flex-row flex-row items-center gap-1"
        >
          {/* <Feature
            img="/assets/key.svg"
            title="No Registration Required"
            description="No registration required. Use passkeys to log in and sign messages securely, ensuring your interactions remain private and effortless."
          />
          <Feature
            img="/assets/noAdIcon.svg"
            title="No Advertisement"
            description="No intrusive advertisements. Your privacy is preserved and the Data is owned by you, not the protocol."
          /> */}
          <Feature
            img="/assets/money-send.svg"
            title="Social Payment"
            description="Tip, pay, and gift your Friends in a Decentralized manner, bring with you a Social graph for Bitcoin & ETH."
          />
          <Feature
            img="/assets/money-send.svg"
            title="Freedom vision"
            description="Community project that aims to bring the Freedom and Integrity world. Own your Digital Identity & Money, Content, Data."
          />
           <Feature
            img="/assets/key.svg"
            title="Make money"
            description="Make more money from your content, insights and the attention your get."
          />
        </motion.div>
      </div>
      <div className="w-full my-8">
        <div className="flex desktop:flex-row items-center desktop:items-start flex-col-reverse justify-center gap-y-7 gap-x-[181px] mb-[100px] desktop:mb-[280px]">
          <motion.div
            animate={{x: [-1200, 0]}}
            transition={{
              x: {duration: 1},
              ease: 'easeOut',
              duration: 1,
            }}
            className="desktop:w-[788px] desktop:text-left text-center"
            initial={{opacity: 0}}
            whileInView={{opacity: 1}}
          >
            <h2 className="desktop:text-[82px] text-xl desktop:leading-[90px] desktop:mb-4 mb-3">
              Absolute Freedom
            </h2>
            <h5 className="desktop:text-[24px] text-base desktop:leading-10 text-[#9D9797] desktop:mb-6 mb-2">
              Freedom requires censorship resistance, and Nostr provides exactly that.
            </h5>
            <Text className="text-sm leading-7 desktop:leading-10">
              Freedom requires censorship resistance, and Nostr provides exactly that.
              AFK leverages Nostr&apos;s decentralized and open social network to give you a
              platform free from ads, toxic algorithms, and censorship. With Nostr, your social
              interactions are safeguarded from any centralized control, ensuring your voice is
              heard without interference.
            </Text>
          </motion.div>
        </div>
        {/* <div className="flex desktop:flex-row items-center desktop:items-start flex-col justify-center gap-y-7 gap-x-[181px]">
          <motion.img
            src="/assets/save-your-keys.png"
            alt=""
            animate={{x: [-1200, 0]}}
            transition={{
              x: {duration: 1},
              ease: 'easeOut',
              duration: 1,
            }}
            initial={{opacity: 0}}
            whileInView={{opacity: 1}}
          />
          <motion.div
            animate={{x: [1200, 0]}}
            transition={{
              x: {duration: 1},
              ease: 'easeOut',
              duration: 1,
            }}
            initial={{opacity: 0}}
            whileInView={{opacity: 1}}
            className="desktop:w-[788px] desktop:text-left text-center"
          >
       
          </motion.div>
        </div> */}
      </div>
    </div>
  );
}
