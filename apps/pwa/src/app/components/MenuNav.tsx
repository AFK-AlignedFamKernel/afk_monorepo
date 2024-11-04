import {Button, Menu, MenuButton, MenuItem, MenuList} from '@chakra-ui/react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {CustomConnectButtonWallet} from './button/CustomConnectButtonWallet';

interface IMenuParent {
  children?: React.ReactNode;
}

const MenuNav: React.FC<IMenuParent> = () => {
  const router = useRouter();

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSettingsClick}
        style={{
          background: 'white',
          color: 'black',
          padding: '8px 16px',
          borderRadius: '4px',
        }}
      >
        Settings
      </Button>
      
      <Menu>
        {({isOpen}) => (
          <>
            <MenuButton
              isActive={isOpen}
              as={Button}
              style={{
                background: 'white',
                color: 'black',
                padding: '8px 16px',
                borderRadius: '4px',
              }}
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
    </div>
  );
};

export default MenuNav;
