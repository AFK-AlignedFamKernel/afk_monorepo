"use client"
import { useEffect, useState } from "react";
import { Icon } from "../small/icon-component";
import BrandCard from "./BrandCard";
import { useBrandStore } from "@/store/brand";
import Link from "next/link";
import Image from "next/image";
import BrandPage from "./BrandPage";
import CryptoLoading from "../small/crypto-loading";
import { logClickedEvent } from "@/lib/analytics";

interface ITableBrandProps {
    brandsProps?: any[]
    setBrandsProps?: (brands: any[]) => void
    isRefreshButton?: boolean;
    isRedirect?: boolean;
}
export default function TableBrand({ brandsProps, setBrandsProps, isRefreshButton = false, isRedirect = false }: ITableBrandProps) {
    const { brands: brandsStore, setBrands: setBrandsStore } = useBrandStore()

    const [brands, setBrands] = useState<any[]>(brandsStore || [])

    const [selectedBrand, setSelectedBrand] = useState<any>(null)


    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    // console.log("brands", brands);
    useEffect(() => {
        const fetchBrand = async () => {

            try {
                setLoading(true)
                console.log("fetchBrand")

                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/brand`)
                // console.log("res", res)
                const data = await res.json()
                // console.log("data", data)
                setBrands(data?.brands || [])
                setBrandsStore(data?.brands || [])
                setLoading(false)
                setIsInitialLoading(true)
                setLoading(false)
            } catch (error) {
                setLoading(false)
            } finally {
                setLoading(false)
            }

        }
        if (!isInitialLoading && (!brands.length || brands.length === 0)) {
            fetchBrand()
            setIsInitialLoading(true)
        }
    }, [isInitialLoading, brands, isLoading])

    return (
        <div>

            {loading && <div className="flex flex-row gap-2 items-center">
                Loading...
                <CryptoLoading />
            </div>}

            {isRefreshButton && (
                <button onClick={() => setIsInitialLoading(false)} className="touch-target" aria-label="Refresh brands"><Icon name="RefreshIcon" size={20} /></button>
            )}

            {!selectedBrand && (
                <div className="overflow-x-auto w-full gap-2">
                    <table 
                    // className="min-w-full divide-y divide-[var(--border)] bg-[var(--card-bg)] text-[var(--foreground)]"
                    className="min-w-full divide-y divide-[var(--border)] text-[var(--foreground)]"
                    >
                        <thead className="text-[var(--foreground)]">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--foreground)'}}>Brand</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--foreground)'}}>Social</th>
                                {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--foreground)'}}>Actions</th> */}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--foreground)'}}>Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {brands?.map((brand, index) => (
                                <tr key={index}
                                    onClick={() => {
                                        if (!isRedirect) {
                                            setSelectedBrand(brand)
                                            logClickedEvent(`brand_${brand?.slug_name}`, "click", `brand_${brand?.slug_name}`);
                                        }
                                    }}
                                    className={`cursor-pointer transition`}
                                    style={{
                                        // background: index % 2 === 0 ? 'var(--card-bg)' : 'var(--background)',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-color)'}
                                    onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? 'var(--card-bg)' : 'var(--background)'}
                                    aria-label={`View details for ${brand?.name}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                                        <Image
                                            src={brand?.avatar_url ?? `/assets/icons/${brand.slug_name}.png`}
                                            alt={brand.name}
                                            width={36} height={36}
                                            className="w-9 h-9 shadow-md rounded-full border-2 border-green-400 bg-white object-cover"
                                        />
                                        {brand?.name && brand.name.length > 13 ? (
                                            <span className="truncate-ellipsis font-semibold text-[var(--foreground)]" title={brand?.name}>
                                                {brand?.name.slice(0, 13)}<span className="inline text-gray-500 dark:text-gray-400 font-bold">&hellip;</span>
                                                <button
                                                    className="ml-1 text-xs underline focus:outline-none text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-400"
                                                    aria-label={`View full name for ${brand?.name}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        alert(brand?.name);
                                                    }}
                                                >View</button>
                                            </span>
                                        ) : (
                                            <span className="font-semibold text-[var(--foreground)]">{brand?.name}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {brand?.twitter_handle && (
                                            <Link href={`https://x.com/${brand.twitter_handle}`} target="_blank" aria-label={`Twitter for ${brand?.name}`}
                                                className="inline-block touch-target">
                                                <Image src="/assets/icons/twitter.svg" alt="Twitter" width={24} height={24} className="hover:opacity-80" />
                                            </Link>
                                        )}
                                    </td>
                                    {/* <td className="px-6 py-4 whitespace-nowrap">
                                        {isRedirect ? (
                                            <button onClick={() => setSelectedBrand(brand)} className="underline touch-target text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-400" aria-label={`View ${brand?.name}`}>View</button>
                                        ) : (
                                            <Link href={`/brand/${brand.slug_name}`} className="underline touch-target text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-400" aria-label={`Go to ${brand?.name} page`}>View</Link>
                                        )}
                                    </td> */}
                                    <td className="px-6 py-4 whitespace-nowrap ellipsis max-w-[180px]">
                                        {brand?.description && brand.description.length > 40 ? (
                                            <div className="text-sm truncate-ellipsis text-[var(--foreground)]" title={brand?.description}>
                                                {brand?.description.slice(0, 40)}<span className="inline text-gray-500 dark:text-gray-400 font-bold">&hellip;</span>
                                                <button
                                                    className="ml-1 text-xs underline focus:outline-none text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-400"
                                                    aria-label={`View full description for ${brand?.name}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        alert(brand?.description);
                                                    }}
                                                >View</button>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-[var(--foreground)]">{brand?.description}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedBrand && (
                <div
                // className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mt-4 flex flex-col items-center gap-4"
                >
                    <button onClick={() => setSelectedBrand(null)} className="text-blue-600 hover:text-blue-900 touch-target self-start mb-2" aria-label="Back to brand list">
                        <Icon name="BackIcon" size={16} />
                    </button>
                    {/* <Image
                        src={selectedBrand?.avatar_url ?? `/assets/icons/${selectedBrand.slug_name}.png`}
                        alt={selectedBrand.name}
                        width={64} height={64}
                        className="w-16 h-16 shadow-md rounded-full border-2 border-green-400 bg-white object-cover"
                    />
                    <h2 className="text-2xl font-bold text-center truncate-ellipsis" title={selectedBrand?.name}>{selectedBrand?.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-center truncate-ellipsis" title={selectedBrand?.description}>{selectedBrand?.description}</p>
                    {selectedBrand?.twitter_handle && (
                        <Link href={`https://x.com/${selectedBrand.twitter_handle}`} target="_blank" aria-label={`Twitter for ${selectedBrand?.name}`}
                            className="inline-block touch-target">
                            <Image src="/assets/icons/twitter.svg" alt="Twitter" width={28} height={28} className="hover:opacity-80" />
                        </Link>
                    )} */}
                    <div className="w-full">
                        <BrandPage slug_name={selectedBrand.slug_name} />
                    </div>
                </div>
            )}
        </div >

    )
}