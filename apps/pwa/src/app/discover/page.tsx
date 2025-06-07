import ListBrand from "@/components/Brand/ListBrand";
import DiscoveryComponent from "@/components/Discovery";
import AllCreators from "@/components/profile/AllCreators";

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-4 p-2">
      <h1>Discovery</h1>

      <h2 className="text-2xl font-bold">Brands</h2>
      <ListBrand />

      <h2 className="text-2xl font-bold">Creator</h2>
      <AllCreators />

      <p>
        More content creators coming soon
      </p>


      <h2 className="text-2xl font-bold">Topics</h2>
      <p>
        More topics coming soon
      </p>
    </div>
  );
}