import { useEffect } from "react";
import PageCreator from "@/components/profile/PageCreator";

export default function CreatorProfilePage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    return <PageCreator slug={slug} />;
}