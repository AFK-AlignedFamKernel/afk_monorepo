'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function NavigationLinks() {
  return (
    <ul className="items-center gap-x-[32px] font-normal text-lg leading-[21px] text-white hidden desktop:flex">
      <li>
        <Link href="/features">Features </Link>
      </li>
      <li>
        <Link href="/pixel">Pixel </Link>
      </li>
      <ConnectButton></ConnectButton>
    </ul>
  );
}
