'use client';

import { motion } from 'framer-motion';
import { Box, Text } from '@chakra-ui/react';
import { GRADIENT_STYLES } from '@/theme/variable';
const MotionBox = motion(Box);

export function About() {
  // const theme = useTheme();
  return (
    <Box className="py-[10px] tab:py-[140px] text-center text-base tab:text-[32px] leading-[32px] desktop:leading-[50px] font-normal z-[50] relative px-6">
      <MotionBox
        animate={{ x: [-100, 0] }}
        transition={{ ease: 'easeOut', duration: 1 }}
        // className="gradient-text"
        // color={GRADIENT_STYLES.basicLeft}
        bgGradient={GRADIENT_STYLES.basicLeftSimple}
        // bgGradient={`linear(to-l, ${theme.colors?.brand?.primary}, ${theme.colors?.brand?.complement})`}
        // bgGradient={`linear(to-l, ${theme.colors?.brand?.primary}, ${theme.colors?.brand?.complement})`}
        bgClip="text"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="desktop:flex"
      >
{/* 
        <motion.img
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

        <Box>
          <Text
            // bgGradient={`linear(to-l, ${theme.colors?.brand?.primary}, ${theme.colors?.brand?.complement})`}
            // bgGradient='linear(to-l, #7928CA, #FF0080)'
            bgClip="text"
            fontSize={"18"}
          // fontSize='6xl'
          // fontWeight='extrabold'
          // color={theme.colors.gradientLeft}
          // bgGradient={GRADIENT_STYLES.basicLeft}
          // bgClip="text"
          >
            The name &quot;Aligned Fam Kernel&quot; is inspired by our vision to align the web3 family
            together, in all-in-one app for your Ownership & Freedom.
          </Text>
          <Text className="text-[18px] leading-[21px]">
            We build a Freedom public good app for your Digital rights.
            Privacy, Ownership and Integrity for your data, identity, content and money.
          </Text>
        </Box>

      </MotionBox>
    </Box>
  );
}
