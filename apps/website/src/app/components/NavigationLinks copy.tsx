'use client';
import { List, ListItem, Box, Button, Text } from '@chakra-ui/react';
import Link from 'next/link';

import { sendGAEvent } from '@next/third-parties/google'

export function NavigationLinks() {
  return (
    <List
      display={{ base: 'flex', }}
      className="flex items-center gap-x-[32px] font-normal text-lg leading-[21px] hidden desktop:flex">
      {/* <ListItem>
        <Link href="/features">
          <Text>Features</Text>
        </Link>
      </ListItem> */}
      <ListItem>
        <Link href="/solutions"
          onClick={() => sendGAEvent('click', 'Solutions')}
        >
          <Text>Solutions</Text>
        </Link>
      </ListItem>
      <ListItem>
        <Link href="/infofi"
          onClick={() => sendGAEvent('click', 'InfoFi')}
        >
          <Text>InfoFi </Text>
        </Link>
      </ListItem>
      <ListItem>
        <Box className="desktop:flex hidden items-center gap-x-4 font-bold text-sm leading-[16px]">
          <Button className="py-[15px] px-[48px] bg-white"
            onClick={() => sendGAEvent('click', 'click-afk-app')}
          >
            <a href="https://afk-community.xyz" target="_blank">
              Go AFK
            </a>
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
