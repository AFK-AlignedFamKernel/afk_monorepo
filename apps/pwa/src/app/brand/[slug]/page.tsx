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
        <div className="flex flex-col items-center gap-4">
            <h1>Brand</h1>
            <BrandPage slug_name={slug as string} />
        </div>
    )



}