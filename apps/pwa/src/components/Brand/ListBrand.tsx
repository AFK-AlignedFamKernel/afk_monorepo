"use client"
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../small/icon-component";

import Image from "next/image";
import BrandCard from "./BrandCard";
import { useBrandStore } from "@/store/brand";

interface IListBrandProps {
    brandsProps?: any[]
    setBrandsProps?: (brands: any[]) => void
    isRefreshButton?: boolean
}
export default function ListBrand({ brandsProps, setBrandsProps, isRefreshButton = false }: IListBrandProps) {
    const {brands:brandsStore, setBrands:setBrandsStore} = useBrandStore()

    const [brands, setBrands] = useState<any[]>(brandsStore || [])


    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    console.log("brands", brands);
    useEffect(() => {
        const fetchBrand = async () => {

            try {
                setLoading(true)
                console.log("fetchBrand")
    
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/brand`)
                console.log("res", res)
                const data = await res.json()
                console.log("data", data)
                setBrands(data?.brands || [])
                setBrandsStore(data?.brands || [])
                setLoading(false)
                setIsInitialLoading(true)
                setLoading(false)
            } catch (error) {
                setLoading(false)
            }finally{
                setLoading(false)
            }
        
        }
        if (!isInitialLoading || (!brands.length || brands.length === 0)) {
            console.log("fetchBrand")
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {brands?.map((brand, index) => (
                    <>
                        <BrandCard brandProps={brand}></BrandCard>
                        {/* <div key={brand.id} className="border border-gray-300 rounded-md py-4 px-2 shadow-md flex flex-col items-center gap-1">

                            <img src={brand.avatar_url ?? `/assets/icons/${brand.slug_name}.png`} alt={brand.name} className="w-10 h-10 object-cover rounded-full" />

                            <div className="flex flex-row gap-2">
                                <p>{brand.name}</p>
                                <p>{brand.slug_name}</p>
                            </div>

                            <p className="text-sm text-gray-500 line-clamp-2">{brand.description}</p>
                            <div className="flex flex-row gap-2">
                                <Link href={`https://x.com/${brand.twitter_handle}`} target="_blank">
                                    <button className="flex flex-row items-center gap-2">
                                        <Image src={`/assets/icons/twitter.svg`} alt="Twitter" width={20} height={20} className="bg-black dark:bg-white text-white dark:text-black rounded-full" />
                                        Twitter
                                    </button>
                                </Link>
                            </div>
                            <div className="my-4">
                                <Link href={`/brand/${brand.slug_name}`} className="w-50 center bg-blue-500 text-white p-2 rounded-md">
                                    View
                                </Link>
                            </div>
                        </div> */}
                    </>

                ))}
            </div>
        </div>
    )
}