"use client"
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

    const [activeTab, setActiveTab] = useState<"leaderboard" | "feed">("leaderboard")

    const [activePlatformLeaderboard, setActivePlatformLeaderboard] = useState<string>("twitter")

    const [showFullDescription, setShowFullDescription] = useState(false);


    const leaderboard = useMemo(() => {
        return leaderboards.find((leaderboard: any) => leaderboard.platform === activePlatformLeaderboard)
    }, [leaderboards, activePlatformLeaderboard])


    useEffect(() => {
        const fetchBrandBySlugName = async () => {

            console.log("fetchBrand by slug_name", slug_name)
            try {
                setIsLoading(true)
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/brand/view-profile?slug_name=${slug_name}`)
                const data = await res.json()
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
            fetchBrandBySlugName()
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
        <div className="w-full flex justify-center items-start px-0 sm:px-2 py-2">
            <div className="w-full sm:max-w-2xl p-2 sm:p-4 mx-0 sm:mx-auto flex flex-col gap-2">
                {/* <button onClick={() => setIsInitialLoading(false)} className="mb-4"><Icon name="RefreshIcon" size={20} /></button> */}

                {brand && (
                    <div className="w-full max-w-lg mx-auto flex flex-col items-left gap-2 mb-1" aria-label="Brand summary card">
                        <div className="flex flex-row items-center gap-2">
                            <Image src={brand.avatar_url ?? `/assets/icons/${brand.slug_name}.png`} alt={brand.name} className="w-20 h-20 object-cover rounded-full" />
                            <h2 className="text-base font-semibold text-center truncate-ellipsis mb-1" title={brand?.name}>{brand?.name}</h2>
                            {/* <div className="flex justify-center">
                                {brand?.twitter_handle && (
                                    <Link href={`https://x.com/${brand.twitter_handle}`} target="_blank" aria-label={`Twitter for ${brand?.name}`}
                                        className="inline-block touch-target">
                                        <Image src={`/assets/icons/twitter.svg`} alt="Twitter" width={28} height={28} className="hover:opacity-80" />
                                    </Link>
                                )}
                            </div> */}
                        </div>
                        {brand?.description && (
                            brand?.description && brand.description.length > 40 ? (
                                <p className="break-words whitespace-normal text-center w-full px-2 text-gray-800 dark:text-gray-200 truncate-ellipsis relative" title={brand?.description}>
                                    {showFullDescription ? (
                                        <>
                                            {brand?.description}
                                            <button className="ml-1 text-xs text-blue-700 dark:text-blue-300 underline hover:text-blue-900 dark:hover:text-blue-400 focus:outline-none" onClick={() => setShowFullDescription(v => !v)}>
                                                Show less
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {brand?.description.slice(0, 40)}
                                            <span className="inline text-gray-500 dark:text-gray-400 font-bold">&hellip;</span>
                                            <button className="ml-1 text-xs text-blue-700 dark:text-blue-300 underline hover:text-blue-900 dark:hover:text-blue-400 focus:outline-none" onClick={() => setShowFullDescription(v => !v)}>
                                                View more
                                            </button>
                                        </>
                                    )}
                                </p>
                            ) : (
                                <p className="break-words whitespace-normal text-center w-full px-2 text-gray-800 dark:text-gray-200">{brand?.description}</p>
                            )
                        )}

                        <div className="w-full flex">
                            {brand?.twitter_handle && (
                                <Link href={`https://x.com/${brand.twitter_handle}`} target="_blank" aria-label={`Twitter for ${brand?.name}`}
                                    className="inline-block touch-target">
                                    <Image src={`/assets/icons/twitter.svg`} alt="Twitter" width={28} height={28} className="hover:opacity-80" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex flex-row gap-2 sm:gap-4 w-full my-2">
                    <button className={`text-md px-1 py-1 rounded-md w-1/3 sm:w-auto font-semibold transition-colors touch-target ${activeTab === "leaderboard" ? "bg-blue-700 text-white shadow" : "border border-gray-300 bg-[var(--card-bg)] dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900"}`} onClick={() => setActiveTab("leaderboard")} aria-label="Show leaderboard">Leaderboard</button>
                    <button className={`text-sm px-1 py-1 rounded-md w-1/3 sm:w-auto font-semibold transition-colors touch-target ${activeTab === "feed" ? "bg-blue-700 text-white shadow" : "border border-gray-300 bg-[var(--card-bg)] dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900"}`} onClick={() => setActiveTab("feed")} aria-label="Show feeds">Feeds</button>
                </div>
                <div className="px-0 sm:px-1 w-full">
                    {activeTab === "feed" && (
                        <div className="my-4 w-full">
                            <h2 className="text-lg font-semibold mb-2">Feeds</h2>
                            <p>Feeds is coming soon</p>
                        </div>
                    )}
                    {leaderboards && activeTab === "leaderboard" &&
                        <div className="my-2 w-full">
                            <div className="flex flex-row gap-2 sm:gap-4 overflow-x-auto shadow-md rounded-md p-1 mb-2 w-full scrollbar-hide">
                                {leaderboards?.map((leaderboard: any) => (
                                    <div key={leaderboard.id}
                                        className={`rounded-md p-1  flex flex-row items-center gap-1 cursor-pointer transition ${activePlatformLeaderboard === leaderboard.platform ? "ring-2 ring-blue-500" : ""}`}
                                        onClick={() => setActivePlatformLeaderboard(leaderboard.platform)}>
                                        <p className="font-medium mb-1 italic text-xs">{leaderboard.platform}</p>
                                        <Image src={`/assets/icons/${leaderboard.platform}.svg`} alt={leaderboard.platform} className="w-8 h-8 object-cover rounded-full" />
                                    </div>
                                ))}
                            </div>
                            {leaderboard && (
                                <div className="overflow-x-auto scrollbar-hide w-full">
                                    <div className="flex flex-wrap gap-2 sm:gap-4 mb-1 overflow-x-auto scrollbar-hide" >
                                        <p className="rounded px-2 py-1 text-xs ">Top Users: <span className="font-bold">{leaderboard.total_users}</span></p>
                                    </div>
                                    <div className="overflow-x-auto rounded w-full">
                                        <table className="min-w-full w-full text-xs rounded-lg">
                                            <thead className="sticky top-0 z-10 border-b border-gray-300 dark:border-gray-700 bg-[var(--card-bg)] dark:bg-[var(--background)]">
                                                <tr>
                                                    <th className="px-2 sm:px-3 py-2 text-left">User</th>
                                                    <th className="px-2 sm:px-3 py-2 text-left">Handle</th>
                                                    <th className="px-2 sm:px-3 py-2 text-right">Mindshare (%)</th>
                                                    <th className="px-2 sm:px-3 py-2 text-right">Engagement (%)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaderboard?.users_scores && leaderboard?.users_scores?.length > 0 && leaderboard?.users_scores?.map((user: any, idx: number) => {
                                                    return (
                                                        <tr key={user.id} className={`border-b transition ${idx % 2 === 0 ? 'bg-[var(--card-bg)] dark:bg-[var(--background)]' : 'bg-[var(--background)] dark:bg-[var(--card-bg)]'}`}>
                                                            {/* Avatar + Username */}
                                                            <td className="px-2 sm:px-3 py-2 flex items-center gap-2 max-w-[120px]">
                                                                {user?.avatar_url && (
                                                                    <Image src={user.avatar_url} alt={user.name} className="w-7 h-7 object-cover rounded-full" />
                                                                )}
                                                                <span className="truncate-ellipsis" title={user?.name}>
                                                                    {user?.name && user.name.length > 14 ? user.name.slice(0, 14) + '…' : user?.name}
                                                                </span>
                                                            </td>
                                                            {/* Handle as link */}
                                                            <td className="px-2 sm:px-3 py-2 max-w-[100px]">
                                                                {activePlatformLeaderboard === "twitter" && (
                                                                    <Link href={`https://x.com/${user.handle ?? user?.userName ?? user?.username}`} target="_blank" className="text-blue-600 hover:underline truncate inline-block max-w-[90px]" title={user.handle ?? user?.userName ?? user?.username} aria-label={`Twitter for ${user?.name}`}>
                                                                        {(user.handle ?? user?.userName ?? user?.username)?.length > 12 ? (user.handle ?? user?.userName ?? user?.username).slice(0, 12) + '…' : (user.handle ?? user?.userName ?? user?.username)}
                                                                    </Link>
                                                                )}
                                                            </td>
                                                            {/* Mindshare */}
                                                            <td className="px-2 sm:px-3 py-2 text-right">{(user.totalMindshareScore / leaderboard.total_mindshare_score * 100).toFixed(2)}%</td>
                                                            {/* Engagement */}
                                                            <td className="px-2 sm:px-3 py-2 text-right">{(user.totalEngagementScore / leaderboard.total_engagement_score * 100).toFixed(2)}%</td>
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
                </div>
            </div>
        </div >
    )
}