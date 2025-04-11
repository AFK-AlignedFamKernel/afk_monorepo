'use client';

import {motion} from 'framer-motion';

export function DownloadSection() {
  return (
    <div className="desktop:pt-[34px] pt-[40px]  desktop:pb-[180px] text-center bg-gradientBg bg-center">
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
          src="/assets/pepe-logo.png"
          className="desktop:h-[150px] desktop:w-[150px] h-[80px] w-[80px] mb-[13px]"
          alt=""
        />
        <h3 className="text-base desktop:text-[48px] font-bold mb-[21px] desktop:leading-[56px]">
          Download AFK
        </h3>
        <p className="text-sm desktop:text-[24px] desktop:leading-7 mb-6 tab:mb-[47px] desktop:w-[623px] w-[80%]">
          AFK is available on Android, iOS, iPadOS and macOS.
        </p>
        <p>Coming soon</p>
        <div className="flex items-center gap-x-5">
          <button>
            <img src="/assets/appStoreBtn.svg" className="w-[100px] desktop:w-auto" alt="" />
          </button>
          <button>
            <img src="/assets/googlePlaybtn.svg" className="w-[100px] desktop:w-auto" alt="" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
