import {Button, Menu, MenuButton, MenuItem, MenuList} from '@chakra-ui/react';

import AccountStarknet from './account/starknet/AccountStarknet';
import {CustomConnectButtonWallet} from './button/CustomConnectButtonWallet';
import {TelegramAccount} from './telegram';
// import DynamicManagement from './dynamic';

interface IMenuParent {
  children?: React.ReactNode;
}
const MenuNav: React.FC<IMenuParent> = () => {
  return (
    <Menu closeOnSelect={false}>
      {({isOpen, onClose}) => (
        <>
          <MenuButton
          //  as={Button}
          // rightIcon={<ChevronDownIcon />}
          />
          <MenuButton
            isActive={isOpen}
            as={Button}
            // rightIcon={<ChevronDownIcon />}
          >
            {isOpen ? 'Close' : 'Profile'}
          </MenuButton>
          <MenuList>
            <CustomConnectButtonWallet></CustomConnectButtonWallet>
            {/* <MenuItem>
              <DynamicManagement></DynamicManagement>
            </MenuItem> */}
            <AccountStarknet></AccountStarknet>
            {/* Dedicated Close Button */}

            {/* 
            {typeof window !== "undefined" && window?.Telegram?.WebApp &&

              <>
              </>
            } */}

            <TelegramAccount></TelegramAccount>

            <MenuItem onClick={onClose} color="red.500" fontWeight="bold">
              Close Menu
            </MenuItem>
          </MenuList>
        </>
      )}
    </Menu>
  );
};

export default MenuNav;
