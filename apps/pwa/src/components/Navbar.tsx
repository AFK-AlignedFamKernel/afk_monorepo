// 'use client';

// import {Box, useColorModeValue, useTheme} from '@chakra-ui/react';
// import Link from 'next/link';
// import React, {useState} from 'react';

// import MenuNav from './MenuNav';
// import MobileDrawerNavbar from './MobileDrawerNavbar';
// import {NavigationLinks} from './NavigationLinks';
// export function Navbar() {
//   const [toggleNav, setToggleNav] = useState(false);
//   const [toggleParamsNav, setToggleParamsNav] = useState(false);
//   const theme = useTheme();
//   const bgColor = useColorModeValue('gray.300', 'gray.700');
//   const textColor = useColorModeValue('gray.800', 'gray.300');

//   return (
//     <Box
//       className="desktop:py-[26px] py-3 px-6 desktop:px-[120px] flex justify-between items-center"
//       // background={"bg-black"}
//       bg={bgColor}
//       color={textColor}
//     >
//       <Box className="flex items-center gap-x-[10px] text">
//         <img
//           src="/assets/pepe-logo.png"
//           className="desktop:h-[52px] w-9 h-9 desktop:w-[52px]"
//           alt="AFK logo"
//         />
//         <Link href="/">
//           <h5 className="desktop:text-2xl text-lg leading-7 font-bold">AFK</h5>
//         </Link>
//       </Box>
//       <NavigationLinks />
//       {/* <button
//         onClick={() => {
//           setToggleParamsNav(true);
//           window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
//         }}
//       >
//         <img src="assets/hamburger-icon.svg" className="w-6 h-6" alt="" />
//       </button> */}

//       <MenuNav></MenuNav>

//       {/* <div className="desktop:flex hidden items-center gap-x-4 font-bold text-sm leading-[16px]">

//          <button className="py-[15px] px-[48px] bg-white">
//           <a href="https://afk-community.xyz" target="_blank">
//             Go AFK
//           </a>
//         </button>
//       </div> */}
//       <MobileDrawerNavbar></MobileDrawerNavbar>

//       {/* <button
//         className="flex desktop:hidden"
//         onClick={() => {
//           setToggleNav(true);
//           window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
//         }}
//       >
//         <img src="assets/hamburger-icon.svg" className="w-6 h-6" alt="" />
//       </button>

//       {toggleNav &&
//         createPortal(<MobileNavBar setToggle={setToggleNav} toggle={toggleNav} />, document.body)} */}
//     </Box>
//   );
// }

'use client';

import {Box, useColorModeValue, useTheme} from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react';

const MenuNav = dynamic(() => import('./MenuNav'), {ssr: false});
const MobileDrawerNavbar = dynamic(() => import('./MobileDrawerNavbar'), {ssr: false});
const NavigationLinks = dynamic(
  () => import('./NavigationLinks').then((mod) => mod.NavigationLinks),
  {ssr: false},
);

export function Navbar() {
  const theme = useTheme();
  const bgColor = useColorModeValue('gray.300', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.300');

  return (
    <Box
      className="desktop:py-[26px] py-3 px-6 desktop:px-[120px] flex justify-between items-center"
      bg={bgColor}
      color={textColor}
    >
      <Box className="flex items-center gap-x-[10px] text">
        <img
          src="/assets/pepe-logo.png"
          className="desktop:h-[52px] w-9 h-9 desktop:w-[52px]"
          alt="AFK logo"
        />
        <Link href="/">
          <h5 className="desktop:text-2xl text-lg leading-7 font-bold">AFK</h5>
        </Link>
      </Box>
      <NavigationLinks />
      <MenuNav />
      <MobileDrawerNavbar />
    </Box>
  );
}

export default dynamic(() => Promise.resolve(Navbar), {ssr: false});
