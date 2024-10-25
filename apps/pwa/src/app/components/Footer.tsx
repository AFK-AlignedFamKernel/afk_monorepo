import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <div className="bg-footerBg bg-no-repeat bg-contain bg-black mt-0 tab:mt-[140px] pt-[200px] tab:pt-[514px] tab:px-[73px] px-6 pb-[42px] text-white">
      <div className="flex tab:flex-row flex-col items-center tab:items-start justify-between border-b-[1px] border-b-[#484040] border-b-solid pb-[30px]">
        <div className="flex flex-col items-center tab:items-start text-center tab:text-left">
          <Image
            src="/assets/pepe-logo.png"
            className="tab:h-auto tab:w-auto"
            alt="pepe logo"
            width={80}
            height={80}
            loading="lazy"
          />
          <p className="text-base leading-[18px] font-normal mt-[15px] tab:mb-[66px] mb-6 w-[278px]">
            Free, open-source decentralized social media platform.
          </p>
          <div className="flex items-center gap-x-5">
            <Link href="#">
              <Image
                src="/assets/appStoreBtn.svg"
                className="tab:w-auto"
                width={100}
                height={40}
                alt="apple store logo"
                loading="lazy"
              />
            </Link>
            <Link href="#">
              <Image
                src="/assets/googlePlaybtn.svg"
                className="tab:w-auto"
                width={100}
                height={40}
                alt="google play logo"
                loading="lazy"
              />
            </Link>
          </div>
        </div>
        <div className="flex gap-x-[40px] tab:gap-x-[122px] text-[14px] leading-[21px] font-normal pt-[46px]">
          <ul className="flex flex-col gap-y-10">
            <li className="font-bold text-base leading-6">Company</li>
            <li>DAO and Community owned</li>
            <li>Solutions</li>
          </ul>
          <ul className="flex flex-col gap-y-10">
            <li className="font-bold text-base leading-6">Product</li>
            <li>Nostr client</li>
            <li>SocialFi features</li>
          </ul>
        </div>
        <div className="flex items-center gap-x-[14px] mt-5 tab:mt-0 self-center tab:self-end">
          <Link
            href="https://t.me/afk_aligned_fam_kernel"
            target="_blank"
            className="rounded-full border border-white/50 p-1 w-10 h-10 flex items-center justify-center"
          >
            <Image
              src="/assets/twitterIcon.svg"
              alt="AFK Aligned Fam Community Twitter / X"
              width={20}
              height={20}
              loading="lazy"
            />
          </Link>

          {/* <a
            href="https://t.me/AFKStarknet"
            target="_blank">
            <img src="/assets/telegramIcon.svg" alt="" />
          </a> */}
          <Link
            href="https://t.me/afk_aligned_fam_kernel"
            target="_blank"
            className="rounded-full border border-white/50 p-1 w-10 h-10 flex items-center justify-center"
          >
            <Image
              src="/assets/telegramIcon.svg"
              alt="AFK Community Telegram"
              width={20}
              height={20}
              loading="lazy"
            />
          </Link>
        </div>
      </div>
      <h6 className="text-xs tab:text-sm leading-[14px] font-normal text-center mt-4">
        © 2024 AFK. All Rights Reserved.
      </h6>
    </div>
  );
}
