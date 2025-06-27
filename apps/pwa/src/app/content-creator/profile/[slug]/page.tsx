"use client";
import PageCreator from "@/components/ContentCreator/PageCreator";
import { useParams } from "next/navigation";

export default function CreatorProfilePage() {
    const { slug } = useParams();
    if (!slug) {
        return <div>No slug</div>;
    }
    return <PageCreator slug={slug as string} />;
}