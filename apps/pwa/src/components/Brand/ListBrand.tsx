"use client"
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../small/icon-component";

import Image from "next/image";
export default function ListBrand() {

    const [brands, setBrands] = useState<any[]>([])

    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isInitialLoading, setIsInitialLoading] = useState(false)

    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchBrand = async () => {

            console.log("fetchBrand")

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/brand`)
            console.log("res", res)
            const data = await res.json()
            console.log("data", data)
            setBrands(data?.brands || [])
            setLoading(false)
            setIsInitialLoading(true)
        }
        if (!isInitialLoading) {
            fetchBrand()
            setIsInitialLoading(true)
        }
    }, [isInitialLoading])

    return (
        <div>

            {loading && <div>Loading...</div>}

            <button onClick={() => setIsInitialLoading(false)}><Icon name="RefreshIcon" size={20} /></button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands?.map((brand, index) => (
                    <div key={brand.id} className="border border-gray-300 rounded-md p-4 shadow-md flex flex-col items-center gap-4">

                        <img src={brand.avatar_url ?? `/assets/icons/${brand.slug_name}.png`} alt={brand.name} className="w-10 h-10 object-cover rounded-full" />

                        <h2>{brand.name}</h2>
                        <p>{brand.description}</p>
                        <p>{brand.slug_name}</p>
                        {/* <p>{brand.starknet_address}</p> */}
                        {/* <p>{brand.evm_address}</p> */}

                        <div className="flex flex-row gap-2">
                            <Link href={`https://x.com/${brand.twitter_handle}`} target="_blank">
                                <button className="flex flex-row items-center gap-2">
                                    <Image src={`/assets/icons/twitter.svg`} alt="Twitter" width={20} height={20} />
                                    Twitter
                                </button>
                            </Link>
                        </div>


                        <div>

                            <Link href={`/brand/${brand.slug_name}`} className="w-50 center bg-blue-500 text-white p-2 rounded-md">
                                View
                            </Link>

                        </div>

                    </div>
                ))}
            </div>
        </div>
    )
}