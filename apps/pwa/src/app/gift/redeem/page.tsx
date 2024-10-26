'use client';

import {Box, useColorModeValue} from '@chakra-ui/react';

import {Footer} from '@/app/components/Footer';
import ReceiveGift from '@/app/components/gift/ReceiveGift';
import {Navbar} from '@/app/components/Navbar';
const Redeem = () => {
  const bgColor = useColorModeValue('gray.300', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.300');

  return (
    <Box className="min-h-screen w-full relative" bg={bgColor} color={textColor}>
      <Navbar></Navbar>
      <ReceiveGift></ReceiveGift>
      <Footer></Footer>
    </Box>
  );
};

export default Redeem;
