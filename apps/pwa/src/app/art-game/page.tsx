'use client';
import {Box, useColorModeValue} from '@chakra-ui/react';
import { ART_PEACE_ADDRESS } from 'common';
import { constants } from "starknet";

const AppRender = dynamic(() => import('pixel_ui').then((mod) => mod.AppRender), {
  ssr: false,
});

import dynamic from 'next/dynamic';

export default function App() {
  const bgColor = useColorModeValue('gray.300', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.300');
  return (
    <Box className="min-h-screen w-full relative" bg={bgColor} color={textColor}>
      <p>Hello</p>
      {/* <Navbar /> */}
      {/* <AppRender
        // artPeaceAddress={process.env.NEXT_PUBLIC_CANVAS_STARKNET_CONTRACT_ADDRESS ?? ART_PEACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]}
        artPeaceAddress={process.env.NEXT_PUBLIC_CANVAS_STARKNET_CONTRACT_ADDRESS ?? ART_PEACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]}

        nftCanvasAddress={process.env.NEXT_PUBLIC_CANVAS_NFT_CONTRACT_ADDRESS}
        usernameAddress={process.env.NEXT_PUBLIC_USERNAME_STORE_CONTRACT_ADDRESS}
      ></AppRender> */}
    </Box>
  );
}
