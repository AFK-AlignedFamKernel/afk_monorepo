import {Button, Menu, MenuButton, MenuList, MenuItem,} from '@chakra-ui/react';

import {CustomConnectButtonWallet} from './button/CustomConnectButtonWallet';

interface IMenuParent {
  children?: React.ReactNode;
}


const MenuNav: React.FC<IMenuParent> = () => {
  return (
    <Menu>
      {({isOpen}) => (
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
          </MenuList>
        </>
      )}
    </Menu>
  );
};

// const MenuNav: React.FC<IMenuParent> = () => {
//   return (
//     <Menu.Root>
//       <Menu.Trigger asChild>
//         <Button>
//           Profile
//         </Button>
//       </Menu.Trigger>
//       <Menu.Positioner>
//       <Menu.Content>
//         <Menu.Item value="connect-wallet">
//           <CustomConnectButtonWallet></CustomConnectButtonWallet>
//         </Menu.Item>
//       </Menu.Content>
//       </Menu.Positioner>

//     </Menu.Root>
//   );
// };

export default MenuNav;
