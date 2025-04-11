// 'use client';
import { List, ListItem, Box, Button, Text } from '@chakra-ui/react';
import Link from 'next/link';

export function NavigationLinks() {
  return (
        <List
    className="items-center gap-x-[32px] font-normal text-lg leading-[21px] hidden desktop:flex"
    >
      {/* <ListItem>
        <Link href="/features">
          <Text>Features</Text>
        </Link>
      </ListItem> */}
      <ListItem>
        <Link href="/solutions">
          <Text>Solutions</Text>
        </Link>
      </ListItem>
      <ListItem>
        <Link href="/infofi">
          <Text>InfoFi</Text>
        </Link>
      </ListItem>
      <ListItem>
        <Box className="desktop:flex hidden items-center gap-x-4 font-bold text-sm leading-[16px]">
          <Button className="py-[15px] px-[48px] bg-white">
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
