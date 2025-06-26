import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useCommunitiesStore } from "@/store/communities";

export default function CommunitiesList() {
  const { communities, setCommunities } = useCommunitiesStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/communities`);
      const data = await res.json();
      console.log("communities", data);
      setCommunities(data?.communities);
      return data?.communities;
    },
  });

  console.log(data);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto full-width full-height">
      <h1>Communities</h1>
      <div className="h-[60vh] overflow-y-auto flex flex-col gap-3">
        {data?.map((community: any) => (
          <div key={community.id} className="align-center items-center rounded-lg shadow p-3 flex flex-row gap-3 items-center">
            <div

            >
              {community.logo_url
                ? <Image src={community.logo_url} alt={community.name} width={40} height={40}

                  className="rounded-full bg-gray-200"
                />
                : <span className="text-xs text-gray-500">r/{community.slug_name}</span>
              }
            </div>
            <div className="flex flex-col">
              <h2 className="font-semibold text-base">{community.name}</h2>
              <p className="">{community.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}       