'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Box } from '@chakra-ui/react';
import { Button } from '@chakra-ui/react';
import { GRADIENT_STYLES } from '@/theme/variable';
import { logClickedEvent } from '@/services/analytics';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Navbar />
      <div className="px-8 py-10 max-w-md w-full text-center mt-10">
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
       

        <Box className="flex items-center justify-center gap-x-4 font-bold text-sm leading-[16px]">
          <Button 
            bgGradient={GRADIENT_STYLES.basicLeft}
            // color="white"
            textDecoration="none"
            borderRadius="10px"
            padding="10px"
            textAlign="center"
            className="py-[15px] italic text-[18px] leading-[21px]"
          >
            <Link href="/"

              className="px-[8px] italic text-[18px] leading-[21px]"
              onClick={() => {
                logClickedEvent('go_home_click_page_not_found');
              }}
            >
              Go home
            </Link>
          </Button>
        </Box>
      </div>
      <Footer />
    </div>
  );
} 