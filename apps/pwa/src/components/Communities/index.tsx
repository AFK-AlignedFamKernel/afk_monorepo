import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

export default function CommunitiesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["communities"],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/communities`).then(res => res.json()),
  });

  console.log(data);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto full-width full-height">
      <h1>Communities</h1>
      {data.communities.map((community: any) => (
        <div key={community.id} className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">   
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {community.logo_url && <Image src={community.logo_url} alt={community.name} width={40} height={40} />}
                    {!community.logo_url && <div className="w-10 h-10 rounded-full bg-gray-200">r/{community.slug_name}</div>}
                </div>
                <div className="flex flex-col">
                    <h2>{community.name}</h2>
                    <p>{community.description}</p>
                </div>
            </div>
        </div>
      ))}   
    </div>
  );
}       