'use client';
import {AppRender} from 'pixel_ui';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import SendGiftForm from '../components/gift/SendGiftForm';
import { Box } from '@chakra-ui/react';


export default function Gift() {
  return (
    <Box className="min-h-screen w-full relative">

      <Navbar></Navbar>
      <SendGiftForm></SendGiftForm>

      <Footer/>
    </Box>
  );
}
