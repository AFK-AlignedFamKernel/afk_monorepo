"use client";
import BrandPage from "@/components/Brand/BrandPage";
import { useParams } from "next/navigation";

export default function BrandView() {
    const { slug } = useParams();
    console.log("slug", slug)
    if (!slug) {
        return <div>No slug</div>;
    }
    return (
        <div className="">
            <h1>Brand</h1>
            <BrandPage slug_name={slug as string} />
        </div>
    )



}