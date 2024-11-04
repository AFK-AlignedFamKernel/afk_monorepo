'use client';

import Link from 'next/link';

export function NavigationLinks() {
  return (
    <ul className="items-center gap-x-[32px] font-normal text-lg leading-[21px] text-white hidden desktop:flex">
      <li>
        <Link href="/settings" className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700">
          Settings
        </Link>
      </li>
    </ul>
  );
}
