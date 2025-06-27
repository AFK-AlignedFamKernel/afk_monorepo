"use client"
import { useEffect, useState } from "react";
import { Icon } from "../small/icon-component";
import BrandCard from "./BrandCard";
import { useBrandStore } from "@/store/brand";
import Link from "next/link";
import Image from "next/image";
import BrandPage from "./BrandPage";

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

            {loading && <div>Loading...</div>}

            {isRefreshButton && (
                <button onClick={() => setIsInitialLoading(false)}><Icon name="RefreshIcon" size={20} /></button>
            )}

            {!selectedBrand && (
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
                        <tbody className="divide-y divide-gray-200"
                        >
                            {brands?.map((brand, index) => (
                                <tr key={index}
                                    onClick={() => {
                                        if (!isRedirect) {
                                            setSelectedBrand(brand)
                                        } else {
                                            // router.push(`/brand/${brand.slug_name}`)
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
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
                                        {isRedirect ? (
                                            <button onClick={() => setSelectedBrand(brand)} className="text-blue-600 hover:text-blue-900">
                                                View
                                            </button>
                                        ) : (
                                            <Link href={`/brand/${brand.slug_name}`} className="text-blue-600 hover:text-blue-900">
                                                View
                                            </Link>
                                        )}
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
            )}




            {(!isRedirect || selectedBrand) || isRedirect && (
                <div className="flex flex-row gap-2 items-center">
                    <button onClick={() => setSelectedBrand(null)} className="text-blue-600 hover:text-blue-900">
                        <Icon name="BackIcon" size={20} />
                    </button>
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
                            <tbody className="divide-y divide-gray-200"
                            >
                                {brands?.map((brand, index) => (
                                    <tr key={index}
                                        onClick={() => setSelectedBrand(brand)}
                                        className="cursor-pointer"
                                    >
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
                                            {isRedirect ? (
                                                <button onClick={() => setSelectedBrand(brand)} className="text-blue-600 hover:text-blue-900">
                                                    View
                                                </button>
                                            ) : (
                                                <Link href={`/brand/${brand.slug_name}`} className="text-blue-600 hover:text-blue-900">
                                                    View
                                                </Link>
                                            )}
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
                </div>
            )}
            {selectedBrand && (
                <div>
                    <button onClick={() => setSelectedBrand(null)} className="text-blue-600 hover:text-blue-900">
                        <Icon name="CloseIcon" size={20} />
                    </button>
                    <div className="px-2">
                        <BrandPage slug_name={selectedBrand.slug_name} />
                    </div>
                </div>
            )}
        </div >

    )
}