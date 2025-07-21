'use client';

import { motion } from 'framer-motion';
import { Box, Button, Text } from '@chakra-ui/react';
import { logClickedEvent } from '@/services/analytics';
import { GRADIENT_STYLES } from '@/theme/variable';
export function HeroSection() {
  return (
    <>
      <Box className="w-full overflow-hidden relative pt-[98px] desktop:pt-[159px] flex justify-center desktop:bg-herobg bg-mobileHeroBg bg-no-repeat bg-bottom">
        <motion.img
          animate={{ x: [500, 0] }}
          transition={{
            x: { duration: 1 },
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          src="/assets/afkMascot.png"
          className="absolute top-5 desktop:top-[36px] right-[31px] desktop:right-[150px] w-[100px] h-[100px] desktop:w-auto"
          alt=""
        />
        <motion.div
          animate={{ y: [1200, 0] }}
          transition={{
            y: { duration: 1 },
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="desktop:w-[773px] w-[85%] flex flex-col items-center h-fit text-center relative z-[270]"
        >
          <h1 className="desktop:text-[52px] text-[36px] leading-[50px] desktop:leading-[50px] mb-3">
            Sovereignty for your digital life.
          </h1>
          {/* <h1 className="desktop:text-[52px] text-[36px] leading-[50px] desktop:leading-[50px] mb-3">
            Step into a New Era of Social Networking
          </h1> */}
         
          <Text className="desktop:text-[12px] text-base leading-8 mb-8">
            Own your data, identity, content and money.
          </Text>
          <Box className="flex desktop:flex-row flex-col items-center gap-y-4 gap-x-6 text-[18px] leading-[21px]">
          <Button
              onClick={() => {
                logClickedEvent('sign_up_click_afk_hero_section_social_network_page');
              }}
              borderRadius="10px"
              border="1px solid var(--chakra-colors-white)"
              padding="10px 20px"
              textAlign="center"
              color="white"
              fontWeight="bold"
              fontSize="18px"
              bg="brand.primary"
              _hover={{
                bgGradient: GRADIENT_STYLES.basicLeft,
                boxShadow: '0 4px 20px 0 rgba(79,168,155,0.25)',
                color: 'white',
              }}
              bgGradient={GRADIENT_STYLES.basicLeft}
              transition="all 0.2s"
              as="a"
              href="https://afk-community.xyz"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join us
            </Button>

            {/* <button className="desktop:py-5 text-sm text-black desktop:text-base py-3 px-4 bg-white w-[200px]">
            <a href="https://afk-community.xyz" target="_blank">
              Download App
            </a>
          </Button> */}
          </Box>
        </motion.div>
      </Box>
      {/* <motion.img
        src="/assets/afkMascot.png"
        // src="/assets/degen-logo.png"
        // className="absolute left-[-31px] desktop:left-2 bottom-[39px] desktop:bottom-[49px] z-[250] desktop:w-[380px] w-[210px]"
        className="left-[-31px] desktop:left-2 bottom-[39px] desktop:bottom-[49px] z-[250] desktop:w-[380px] w-[210px]"
        alt=""
        animate={{ x: [-500, 0] }}
        transition={{
          x: { duration: 1 },
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      /> */}
    </>
  );
}
