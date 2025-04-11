// 'use client';
import { List, ListItem, Box, Button, Text } from '@chakra-ui/react';
import Link from 'next/link';

export function NavigationLinks() {
  return (
    <List.Root
    className="items-center gap-x-[32px] font-normal text-lg leading-[21px] hidden desktop:flex"
    >
      {/* <ListItem>
        <Link href="/features">
          <Text>Features</Text>
        </Link>
      </ListItem> */}
      <List.Item>
        <Link href="/solutions">
          <Text>Solutions</Text>
        </Link>
      </List.Item>
      <List.Item>
        <Link href="/infofi">InfoFi </Link>
      </List.Item>
      <List.Item>
        <Box className="desktop:flex hidden items-center gap-x-4 font-bold text-sm leading-[16px]">
          <Button className="py-[15px] px-[48px] bg-white">
            <a href="https://afk-community.xyz" target="_blank">
              Go AFK
            </a>
          </Button>
        </Box>

      </List.Item>
      {/* <li>
        <Link href="/pixel">Pixel </Link>
      </li> */}
      {/* <li>
        <CustomConnectButtonWallet
        // width={ "100px" }
        ></CustomConnectButtonWallet>
      </li> */}
      {/* <ConnectButton></ConnectButton> */}
    </List.Root>
  );
}
