"use client"
import { useQuery, } from "@tanstack/react-query";
import Image from "next/image";
import { useCommunitiesStore } from "@/store/communities";
// import { useRouter } from "next/router";
import { ICommunity } from "@/types";
import { useEffect, useState } from "react";
import CommunityPage from "./CommunityPage";
import { Icon } from "../small/icon-component";
import { useUIStore } from "@/store/uiStore";
import DebateCreateForm from "../Debate/DebateCreateForm";

export default function CommunitiesList() {
  const { communities, setCommunities, isInitialLoad, setIsInitialLoad } = useCommunitiesStore();
  // const router = useRouter();

  const { showModal, hideModal } = useUIStore();
  const [selectedCommunity, setSelectedCommunity] = useState<ICommunity | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const fetchCommunities = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/communities`);
    const data = await res.json();
    console.log("communities", data);
    setCommunities(data?.communities);
    setIsInitialLoad(true);
    return data?.communities;
  }
  const { data, isLoading, error } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      return fetchCommunities();
    },
  });

  useEffect(() => {
    if (!isInitialLoad && (!communities || communities.length === 0)) {
      setIsInitialLoad(false);
      fetchCommunities();
    }
  }, [isInitialLoad]);

  console.log(data);

  const handleCommunityClick = (communityId: string) => {
    // router.push(`/communities/${communityId}`);
    setSelectedCommunityId(communityId);
    setSelectedCommunity(data?.find((community: any) => community.slug_name === communityId));
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto full-width full-height">

      {!selectedCommunity && (
        <div className="h-[60vh] overflow-y-auto flex flex-col gap-3">
          {data?.map((community: any) => (
            <div key={community.id}
              onClick={() => handleCommunityClick(community.slug_name)}
              className="align-center items-center rounded-lg shadow p-3 flex flex-row gap-3 items-center cursor-pointer">

              {community?.logo_url
                ? <Image
                  src={community?.logo_url}
                  alt={community?.name}
                  width={40}
                  height={40}
                  // loading="lazy"
                  className="rounded-full bg-gray-200"
                />
                : <span className="text-sm">r/{community.slug_name}</span>
              }
              <div className="flex flex-col">
                <p className="font-semibold text-sm italic text-base text-gray-500">{community.name}</p>
                {/* <p className="">{community.description}</p> */}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedCommunity && (
        <div className="flex flex-col gap-3">
          <div> <Icon name="BackIcon" size={24} onClick={() => setSelectedCommunity(null)} /></div>
          <div className="flex flex-row gap-3 items-center">
            <div className="flex flex-row gap-3 items-center">
              <Image
                src={selectedCommunity.logo_url}
                alt={selectedCommunity.name}
                width={40}
                height={40}
                className="rounded-full bg-gray-200"
              />
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center">
            <h2 className="font-semibold text-base">{selectedCommunity.name}</h2>

            <button
              className="btn btn-primary"
              onClick={() => showModal(<DebateCreateForm community_id={selectedCommunity?.id}
                community_name={selectedCommunity?.slug_name}
              ></DebateCreateForm>)}>
              Create
            </button>
          </div>
          <p className="">{selectedCommunity.description}</p>
          <CommunityPage communityId={selectedCommunity?.slug_name} />
        </div>
      )}

    </div>
  );
}       