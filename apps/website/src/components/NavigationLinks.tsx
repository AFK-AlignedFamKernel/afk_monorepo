// 'use client';
import { List, ListItem, Box, Text, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { logClickedEvent } from '@/services/analytics';
import { GRADIENT_STYLES } from '@/theme/variable';

export function NavigationLinks() {
  return (
    <List className="items-center gap-x-[32px] font-normal text-lg leading-[21px] hidden md:flex flex-row">
      {/* <ListItem>
        <Link href="/features">
          <Text>Features</Text>
        </Link>
      </ListItem> */}
      <ListItem>
        <Link href="/solutions"
          onClick={() => {
            logClickedEvent('solutions_page_click');
          }}
        >
          <Text>
            Solutions
          </Text>
        </Link>
      </ListItem>
      <ListItem>
        <Link href="/infofi"
          onClick={() => {
            logClickedEvent('infofi_page_click');
          }}
        >
          <Text>InfoFi</Text>
        </Link>
      </ListItem>
      <ListItem>
        <Box className="flex items-center gap-x-4 font-bold text-sm leading-[16px]">
          <Button 
            // bgGradient={GRADIENT_STYLES.basicLeft}
            // color="white"
            textDecoration="none"
            borderRadius="10px"
            padding="10px"
            textAlign="center"
            className="py-[15px] italic text-[18px] leading-[21px]"
          >
            <Link href="https://afk-community.xyz" target="_blank"

              className="px-[8px] italic text-[18px] leading-[21px]"
              onClick={() => {
                logClickedEvent('app_afk_navigation_link_click');
              }}
            >
              Go AFK
            </Link>
          </Button>
        </Box>
      </ListItem>
      {/* <li>
        <Link href="/pixel">Pixel </Link>
      </li> */}
      {/* <li>
        <CustomConnectButtonWallet
        // width={ "100px" }
        ></CustomConnectButtonWallet>
      </li> */}
      {/* <ConnectButton></ConnectButton> */}
    </List>
  );
}
