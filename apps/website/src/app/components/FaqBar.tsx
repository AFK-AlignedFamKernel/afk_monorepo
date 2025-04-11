'use client';

import { Box, Button, Text } from '@chakra-ui/react';
import { useState } from 'react';
type Props = { answer: string; question: string };


export function FaqBar({ question, answer }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = () => {
    setIsOpen(!isOpen);
  };
  return (
    <Box className="w-full max-w-[871px] desktop:w-[871px]">
      <Button
        onClick={handleClick}
        className="w-full py-4 tab:py-[32px] px-3 tab:px-[25px] border-[1px] border-[#C9C9C9] rounded-xl"
      >
        <Box className="flex justify-between items-center w-full">
          <h2 className="desktop:text-[20px] text-xs leading-[28px]">{question}</h2>
          <img 
            src="/assets/down-cheveron.svg" 
            alt="Toggle answer"
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </Box>
      </Button>
      
      <Box
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <Text className="w-full text-start p-4">{answer}</Text>
      </Box>
    </Box>
  );
}

// export function FaqBar({ question, answer }: Props) {
//   const [isOpen, setIsOpen] = useState(false);
//   const handleClick = () => {
//     if (isOpen === true) {
//       setIsOpen(false);
//     } else {
//       setIsOpen(true);
//     }
//   };
//   return (
//     <>
//       <Button
//         onClick={handleClick}
//         className=" py-4 tab:py-[32px] px-3 tab:px-[25px] border-[1px] border-[#C9C9C9] rounded-xl max-w-[871px] desktop:w-[871px] w-full"
//       >
//         <Box className=" flex justify-between items-center">
//           <h2 className="desktop:text-[20px] text-xs leading-[28px]">{question}</h2>
//           <img src="/assets/down-cheveron.svg" alt="" />
//         </Box>

//         <Box>{isOpen ? <Text className=" w-full text-start mt-6">{answer}</Text> : ''}</Box>
//       </Button>
//     </>
//   );
// }
