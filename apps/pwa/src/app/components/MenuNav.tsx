import { Button, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { CustomConnectButtonWallet } from './button/CustomConnectButtonWallet';
import AccountStarknet from './button/starknet/AccountStarknet';
import DynamicManagement from './dynamic';

interface IMenuParent {
  children?: React.ReactNode;
}
const MenuNav: React.FC<IMenuParent> = () => {
  return (
    <Menu closeOnSelect={false}>
      {({ isOpen, onClose, }) => (
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
            <MenuItem>
              <CustomConnectButtonWallet></CustomConnectButtonWallet>
            </MenuItem>
            <MenuItem>
              <DynamicManagement></DynamicManagement>
            </MenuItem>
            <MenuItem>
              <AccountStarknet></AccountStarknet>
            </MenuItem>
            {/* Dedicated Close Button */}
            <MenuItem onClick={onClose}
              color="red.500"
              fontWeight="bold">
              Close Menu
            </MenuItem>
          </MenuList>

        </>
      )}


    </Menu>
  );
};

export default MenuNav;
