import ListBrand from "@/components/Brand/ListBrand";
import DiscoveryComponent from "@/components/Discovery";
import AllCreators from "@/components/profile/AllCreators";

export default function Discovery() {
  return (
    <div>
      <h1>Discovery</h1>

      <h2 className="text-2xl font-bold">Brand</h2>
      <ListBrand />

      <h2 className="text-2xl font-bold">Creator</h2>
      <AllCreators />


      <p className="text-sm text-gray-500">Topics coming soon</p>
    </div>
  );
}