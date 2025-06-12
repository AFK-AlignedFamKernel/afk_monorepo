"use client"
import { useEffect, useState } from "react";
import { Icon } from "../small/icon-component";
import BrandCard from "./BrandCard";
import { useBrandStore } from "@/store/brand";
import Link from "next/link";
import Image from "next/image";

interface ITableBrandProps {
    brandsProps?: any[]
    setBrandsProps?: (brands: any[]) => void
    isRefreshButton?: boolean
}
export default function TableBrand({ brandsProps, setBrandsProps, isRefreshButton = false }: ITableBrandProps) {
    const { brands: brandsStore, setBrands: setBrandsStore } = useBrandStore()

    const [brands, setBrands] = useState<any[]>(brandsStore || [])


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

            {loading && <div>Loading...</div>}

            {isRefreshButton && (
                <button onClick={() => setIsInitialLoading(false)}><Icon name="RefreshIcon" size={20} /></button>
            )}

            <div className="overflow-x-auto w-full gap-2">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {brands?.map((brand, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                                    <Image
                                        src={brand?.avatar_url ?? `/assets/icons/${brand.slug_name}.png`}
                                        alt={brand.name} width={20} height={20}
                                        className="w-5 h-5 shadow-md rounded-full"
                                    />
                                    {brand?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {brand?.twitter_handle && (
                                        <Link href={`https://x.com/${brand.twitter_handle}`} target="_blank">
                                            <Image src="/assets/icons/twitter.svg" alt="Twitter" width={20} height={20} className="hover:opacity-80" />
                                        </Link>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/brand/${brand.slug_name}`} className="text-blue-600 hover:text-blue-900">
                                        View
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap ellipsis">
                                    <div className="text-sm text-gray-500">
                                        {brand?.description}
                                    </div>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >

    )
}