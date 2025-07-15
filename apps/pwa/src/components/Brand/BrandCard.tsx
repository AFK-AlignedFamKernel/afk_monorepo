"use client"
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../small/icon-component";

import Image from "next/image";
import CryptoLoading from "../small/crypto-loading";

interface IListBrandProps {
    brandProps?: any;
    setBrandProps?: (brand: any) => void
    leaderboardProps?: any[];
    setLeaderboardProps?: (leaderboard: any[]) => void
    isRefreshButton?: boolean;
}
export default function BrandCard({ brandProps, leaderboardProps, setLeaderboardProps, isRefreshButton = false }: IListBrandProps) {

    const [brand, setBrand] = useState<any>(brandProps)

    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isInitialLoading, setIsInitialLoading] = useState(false)

    const [isLoading, setIsLoading] = useState(false)


    if (!brand) {
        return <div>
            <p>Loading brand...</p>
            <CryptoLoading />
        </div>
    }

    return (
        <div>

            {isLoading && <div>Loading...</div>}

            {isRefreshButton && (
                <button onClick={() => setIsInitialLoading(false)}><Icon name="RefreshIcon" size={20} /></button>
            )}



            <div key={brand.id} className="border border-gray-300 rounded-md py-4 px-2 shadow-md flex flex-col items-center gap-1">

                <Image src={brand.avatar_url ?? `/assets/icons/${brand.slug_name}.png`} alt={brand.name} className="w-10 h-10 object-cover rounded-full" />

                <div className="flex flex-row gap-2">
                    <p className="text-lg font-bold">{brand.name}</p>
                    {/* <p>{brand.slug_name}</p> */}
                </div>

                {/* <p className="text-sm text-gray-500 line-clamp-2">{brand.description}</p> */}
                {/* <p>{brand.starknet_address}</p> */}
                {/* <p>{brand.evm_address}</p> */}

                <div className="flex flex-row gap-2">
                    <Link href={`https://x.com/${brand.twitter_handle}`} target="_blank">
                        <button className="flex flex-row items-center gap-2">
                            <Image src={`/assets/icons/twitter.svg`} alt="Twitter" width={20} height={20} className="bg-black dark:bg-white text-white dark:text-black rounded-full" />
                        </button>
                    </Link>
                </div>


                <div className="my-4">

                    <Link href={`/brand/${brand.slug_name}`} className="w-50 center bg-blue-500 text-white p-2 rounded-md">
                        View
                    </Link>

                </div>

            </div>

        </div>
    )
}