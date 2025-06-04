"use client"
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { Icon } from "../small/icon-component";

import Link from "next/link";
import Image from "next/image";

export default function BrandPage({ slug_name }: { slug_name: string }) {



    const [brand, setBrand] = useState<any>(null)

    const [leaderboards, setLeaderboards] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isInitialLoading, setIsInitialLoading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [activePlatformLeaderboard, setActivePlatformLeaderboard] = useState<string>("twitter")


    const leaderboard = useMemo(() => {
        return leaderboards.find((leaderboard: any) => leaderboard.platform === activePlatformLeaderboard)
    }, [leaderboards, activePlatformLeaderboard])


    useEffect(() => {
        const fetchBrand = async () => {

            console.log("fetchBrand")
            try {
                setIsLoading(true)
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/brand/view-profile?slug_name=${slug_name}`)
                const data = await res.json()
                console.log("data", data)
                setBrand(data?.brand)
                setLeaderboards(data?.leaderboards || [])
                setLoading(false)
                setIsInitialLoading(true)
                setIsLoading(false)
            } catch (error) {
                console.log("error", error)
            } finally {
                setIsLoading(false)
            }

        }
        if (!isInitialLoading) {
            fetchBrand()
            setIsInitialLoading(true)
        }
    }, [isInitialLoading])



    if (!slug_name) {
        return <div>No slug</div>
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div>


            <button onClick={() => setIsInitialLoading(false)}><Icon name="RefreshIcon" size={20} /></button>
            {brand && (
                <div className="flex flex-col items-center gap-4">

                    <img src={brand.image_url ?? `/assets/icons/${brand.slug_name}.png`} alt={brand.name} className="w-20 h-20 object-cover rounded-full" />

                    <h2>{brand?.name}</h2>
                    <p>{brand?.description}</p>
                    <p>{brand?.slug_name}</p>
                    <p>{brand?.starknet_address}</p>
                    <p>{brand?.evm_address}</p>
                    <p>{brand?.is_verified}</p>

                    <div>

                        <div className="flex flex-row gap-2">
                            <Link href={`https://x.com/${brand.twitter_handle}`}>
                                <button className="flex flex-row items-center gap-2">
                                    <Image src={`/assets/icons/twitter.svg`} alt="Twitter" width={20} height={20} />
                                    Twitter
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}


            {leaderboards &&
                <div>
                    <h2>Leaderboard</h2>


                    <div className="flex flex-row gap-4 overflow-x-auto shadow-md rounded-md p-2 ">

                        {leaderboards?.map((leaderboard: any) => (
                            <div key={leaderboard.id}

                                className={`border border-gray-300 rounded-md p-2 ${activePlatformLeaderboard === leaderboard.platform ? "bg-blue-500" : "bg-gray-500"}`}
                                onClick={() => setActivePlatformLeaderboard(leaderboard.platform)}>
                                <p>{leaderboard.platform}</p>
                                <img src={`/assets/icons/${leaderboard.platform}.svg`} alt={leaderboard.platform} className="w-10 h-10 object-cover rounded-full" />
                            </div>
                        ))}

                    </div>
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {leaderboards?.map((leaderboard: any) => (
                            <div key={leaderboard.id}>
                                <h3>{leaderboard.platform}</h3>

                                <img src={`/assets/icons/${leaderboard.platform}.svg`} alt={leaderboard.platform} className="w-10 h-10 object-cover rounded-full" />
                                <p>{leaderboard.total_score}</p>
                                <p>{leaderboard.rank_position}</p>
                            </div>
                        ))}

                    </div> */}

                    {leaderboard && (
                        <div>
                            <h3>{leaderboard.platform}</h3>
                            <p>{leaderboard.total_score}</p>
                            <p>{leaderboard.rank_position}</p>
                        </div>
                    )}



                </div>
            }
        </div >
    )
}