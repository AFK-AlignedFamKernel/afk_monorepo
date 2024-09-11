import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuItemOption,
    MenuGroup,
    MenuOptionGroup,
    MenuDivider,
    Button,
} from '@chakra-ui/react'
import { CustomConnectButtonWallet } from './button/CustomConnectButtonWallet'


interface IMenuParent {
    children?: React.ReactNode
}
const MenuNav: React.FC<IMenuParent> = () => {

    return (
        <Menu>
            {({ isOpen }) => (
                <>

                    <MenuButton
                    //  as={Button} 
                    // rightIcon={<ChevronDownIcon />}

                    />
                    <MenuButton isActive={isOpen} as={Button}
                    // rightIcon={<ChevronDownIcon />}
                    >
                        {isOpen ? 'Close' : 'Profile'}
                    </MenuButton>
                    <MenuList>
                        <MenuItem><CustomConnectButtonWallet></CustomConnectButtonWallet></MenuItem>
                    </MenuList>
                </>

            )


            }

        </Menu>
    )

}

export default MenuNav