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
        <div
            className="break-words px-2 sm:px-6 md:px-12 py-4 max-w-3xl mx-auto w-full"
        >
            <button onClick={() => setIsInitialLoading(false)} className="mb-4"><Icon name="RefreshIcon" size={20} /></button>
            {brand && (
                <div className="flex flex-col items-center gap-4 break-words whitespace-normal w-full">
                    <h2 className="text-2xl font-bold text-center break-words w-full">{brand?.name}</h2>

                    <img src={brand.image_url ?? `/assets/icons/${brand.slug_name}.png`} alt={brand.name} className="w-20 h-20 object-cover rounded-full border border-gray-200" />

                    <p className="break-words whitespace-normal text-center w-full px-2">{brand?.description}</p>
                    <p className="text-gray-500 text-sm">{brand?.slug_name}</p>
                    <p className="text-xs text-gray-600 break-all">Starknet: {brand?.starknet_address ? `${brand.starknet_address.slice(0, 6)}...${brand.starknet_address.slice(-4)}` : '-'}</p>
                    <p className="text-xs text-gray-600 break-all">EVM: {brand?.evm_address ? `${brand.evm_address.slice(0, 6)}...${brand.evm_address.slice(-4)}` : '-'}</p>
                    <p className="text-green-600 font-semibold">{brand?.is_verified ? 'Verified' : ''}</p>

                    <div className="w-full flex justify-center">
                        <div className="flex flex-row gap-2">
                            <Link href={`https://x.com/${brand.twitter_handle}`}>
                                <button className="flex flex-row items-center gap-2 px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 transition">
                                    <Image src={`/assets/icons/twitter.svg`} alt="Twitter" width={20} height={20} />
                                    <span className="truncate">Twitter</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {leaderboards &&
                <div className="mt-8 w-full">
                    <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>

                    <div className="flex flex-row gap-4 overflow-x-auto shadow-md rounded-md p-2 mb-4 w-full">
                        {leaderboards?.map((leaderboard: any) => (
                            <div key={leaderboard.id}
                                className={`border border-gray-300 rounded-md p-2 min-w-[100px] flex flex-col items-center cursor-pointer transition ${activePlatformLeaderboard === leaderboard.platform ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                                onClick={() => setActivePlatformLeaderboard(leaderboard.platform)}>
                                <p className="font-medium mb-1">{leaderboard.platform}</p>
                                <img src={`/assets/icons/${leaderboard.platform}.svg`} alt={leaderboard.platform} className="w-10 h-10 object-cover rounded-full" />
                            </div>
                        ))}
                    </div>

                    {leaderboard && (
                        <div className="overflow-x-auto w-full">
                            <h3 className="text-lg font-semibold mb-2">{leaderboard.platform}</h3>
                            <div className="flex flex-wrap gap-4 mb-2">
                                <p className="bg-gray-100 rounded px-2 py-1 text-sm">Total Score: <span className="font-bold">{leaderboard.total_score}</span></p>
                                <p className="bg-gray-100 rounded px-2 py-1 text-sm">Total Users: <span className="font-bold">{leaderboard.total_users}</span></p>
                                <p className="bg-gray-100 rounded px-2 py-1 text-sm">Rank Position: <span className="font-bold">{leaderboard.rank_position}</span></p>
                            </div>
                            <div className="overflow-x-auto rounded shadow border border-gray-200">
                                <table className="min-w-[500px] w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50 z-10">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Username</th>
                                            <th className="px-4 py-2 text-left">Handle</th>
                                            <th className="px-4 py-2 text-right">Mindshare</th>
                                            <th className="px-4 py-2 text-right">Engagement</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard?.users_scores && leaderboard?.users_scores?.length > 0 && leaderboard?.users_scores?.map((user: any) => {
                                            return (
                                                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="px-4 py-2 break-words max-w-[120px]">{user?.name}</td>
                                                    <td className="px-4 py-2 break-all max-w-[120px]">
                                                        {activePlatformLeaderboard === "twitter" && (
                                                            <Link href={`https://x.com/${user.handle ?? user?.userName}`} target="_blank" className="text-blue-600 hover:underline truncate inline-block max-w-[100px]">
                                                                {user.handle ?? user?.userName}
                                                            </Link>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">{user.totalMindshareScore / leaderboard.total_mindshare_score * 100}%</td>
                                                    <td className="px-4 py-2 text-right">{user.totalEngagementScore / leaderboard.total_engagement_score * 100}%</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            }
        </div >
    )
}