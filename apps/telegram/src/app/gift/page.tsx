'use client';
import {Box, useColorModeValue} from '@chakra-ui/react';

import {Footer} from '../../components/Footer';
import SendGiftForm from '../../components/gift/SendGiftForm';
import {Navbar} from '../../components/Navbar';

export default function Gift() {
  const bgColor = useColorModeValue('gray.300', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.300');

  return (
    <Box className="min-h-screen w-full relative" bg={bgColor} color={textColor}>
      <Navbar></Navbar>
      <SendGiftForm></SendGiftForm>

      <Footer />
    </Box>
  );
}
