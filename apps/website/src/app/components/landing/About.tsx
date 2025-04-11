'use client';

import { motion } from 'framer-motion';
import { Box, Text } from '@chakra-ui/react';
export function About() {
  return (
    <Box className="py-[40px] tab:py-[140px] text-center text-base tab:text-[32px] leading-[32px] desktop:leading-[50px] font-normal z-[50] relative px-6 desktop:px-[171px]">
      <motion.div
        animate={{ x: [-100, 0] }}
        transition={{ ease: 'easeOut', duration: 1 }}
        className="gradient-text"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >


        <Text>
          The name &quot;Aligned Fam Kernel&quot; is inspired by our vision to align the web3 family
          together, in one Social graph. We build and fight together, not against. What if the
          treasure are the friends we made along the way? Then A decentralized social network should
          be a treasure trove of memories and connections!
        </Text>
      </motion.div>
    </Box>
  );
}
