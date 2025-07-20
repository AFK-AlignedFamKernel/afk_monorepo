'use client';

import {motion} from 'framer-motion';
import { logClickedEvent } from '@/services/analytics';
import { Button } from '@chakra-ui/react';

export function DownloadSection() {
  return (
    <div className="desktop:pt-[34px] pt-[10px]  desktop:pb-[8px] text-center bg-gradientBg bg-center">
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
        <p className="font-size-18 desktop:text-[24px] desktop:leading-7 mb-1 desktop:w-[623px] w-[80%]">
          AFK is available on Web now.
        </p>
        <p className="font-size-12 desktop:text-[24px] desktop:leading-7 mb-1 desktop:w-[623px] w-[80%]">Coming later on Android & iOS.</p>
        <Button
          onClick={() => {
            logClickedEvent('go_afk_click_download_section');
          }}
        >
          Join AFK
        </Button>
        {/* <div className="flex items-center gap-x-5">
          <button>
            <img src="/assets/appStoreBtn.svg" className="w-[100px] desktop:w-auto" alt="" />
          </button>
          <button>
            <img src="/assets/googlePlaybtn.svg" className="w-[100px] desktop:w-auto" alt="" />
          </button>
        </div> */}
      </motion.div>
    </div>
  );
}
