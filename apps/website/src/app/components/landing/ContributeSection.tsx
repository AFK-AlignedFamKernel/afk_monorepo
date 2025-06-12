'use client';

import {motion} from 'framer-motion';

export function ContributeSection() {
  return (
    <div className="desktop:pt-[10px] pt-[10px] bg-contributeBg bg-contain tab:bg-cover bg-center bg-no-repeat h-auto">
      <motion.div
        animate={{x: [-1200, 0]}}
        transition={{
          x: {duration: 1},
        }}
        initial={{opacity: 0}}
        whileInView={{opacity: 1}}
        className="flex flex-col items-center"
      >
        <img
          src="/assets/githubLogo.svg"
          className="mb-4 desktop:h-[150px] desktop:w-[150px] h-[80px] w-[80px]"
          alt=""
        />
        <h3 className="text-base desktop:text-[48px] font-bold mb-[21px] desktop:leading-[56px]">
          Contribute to AFK - Aligned Fam Kernel{' '}
        </h3>
        <p className="desktop:text-[24px] text-sm mb-10 w-[80%] desktop:w-[623px]  text-center">
          AFK - Aligned Fam Kernel is a free and open source dApp multiplatform.
        </p>
        <a
          href="https://github.com/AFK-AlignedFamKernel/afk_monorepo"
          target="_blank"
          className="py-[15px] desktop:px-[42px] px-[24px] bg-white rounded-[5px] flex gap-x-[10px] items-center text-black"
        >
          <img src="/assets/githubLogoDark.svg" alt="" />
          See all issues on Github
          <img src="/assets/go-to.svg" alt="" />
        </a>


        <a
          href="https://afk-community.xyz"
          target="_blank"
          className="my-[8px] py-[15px] desktop:px-[42px] px-[24px] bg-white rounded-[5px] flex gap-x-[10px] items-center text-black"
        >
           Go AFK
        </a>
      </motion.div>
    </div>
  );
}
