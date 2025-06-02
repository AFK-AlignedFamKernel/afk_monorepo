import { useEffect } from "react";
import PageCreator from "@/components/profile/PageCreator";

export default function CreatorProfilePage({ params }: { params: { slug: string } }) {

    const { slug } = params;



    if (!slug) {
        return <div>No slug</div>;
    }

    return <div>Creator Profile

        {slug && <PageCreator slug={slug} />}

    </div>;
}