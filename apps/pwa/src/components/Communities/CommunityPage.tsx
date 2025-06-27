import { useQuery } from "@tanstack/react-query";
import { useCommunitiesStore } from "@/store/communities";
import MessageCard from "../Debate/MessageCard";
import { Icon } from "../small/icon-component";

interface ICommunityPageProps {
  communityId?: string;
  communityName?: string;
  community?: any;
  isViewCommunity?: boolean;
}

export default function CommunityPage({ communityId, communityName }: ICommunityPageProps) {
  const { community, setCommunity } = useCommunitiesStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ["community", communityId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/community/view?slug_name=${communityId}`);
      const data = await res.json();
      console.log("communities", data);
      setCommunity(data?.community);
      return data;
    },
  });

  console.log(data);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto full-width full-height">
      
      <div className="h-[80vh] overflow-y-auto flex flex-col gap-3">
        {data?.messages?.map((message: any, index: number) => (
          <div key={index} className="flex flex-col gap-4"  >
            <MessageCard message={message} />

            <div className="border-b border-gray-200">

            </div>

          </div>
        ))}
      </div>
    </div>
  );
}       