'use client';

import { useState } from 'react';
import Image from 'next/image';
type Props = {answer: string; question: string};

export function FaqBar({question, answer}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = () => {
    if (isOpen === true) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };
  return (
    <>
      <button
        onClick={handleClick}
        className=" py-4 tab:py-[32px] px-3 tab:px-[25px] border-[1px] border-[#C9C9C9]  text-white  bg-black rounded-xl max-w-[871px] desktop:w-[871px] w-full"
      >
        <div className=" flex justify-between items-center">
          <h2 className="desktop:text-[20px] text-xs leading-[28px]">{question}</h2>
          <Image src="/assets/down-cheveron.svg" alt="" 
          width={24}
          height={24}
          unoptimized
          />
        </div>

        <div>{isOpen ? <p className=" w-full text-start mt-6">{answer}</p> : ''}</div>
      </button>
    </>
  );
}
