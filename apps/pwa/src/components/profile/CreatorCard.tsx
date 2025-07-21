import React from "react";
import Link from "next/link";
import { IContentCreator } from "@/types/brand";
import Image from "next/image";
interface CreatorCardProps {
  creator: IContentCreator;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  return (
    <div className="border rounded-lg p-4 shadow flex flex-col items-center dark:bg-contrast-100">
      {creator.avatar_url ? (
        <Image  
          unoptimized
          width={80}
          height={80}
          src={creator.avatar_url}
          alt={creator.name}
          className="w-20 h-20 rounded-full object-cover mb-2"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-2 text-2xl font-bold">
          {creator.name?.slice(0, 2).toUpperCase()}
        </div>
      )}
      <h4 className="font-bold text-lg mb-1">{creator.name}</h4>
      {creator.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator.bio}</p>}
      {/* {creator.social_links && (
        <div className="flex gap-2 mt-2">
          {Object.entries(creator.social_links).map(([platformIndex , platform]) => {
            console.log("platform", platform)
            console.log("url", platform.url)
            return (
              <div key={platform + platform.url}>
                <p
                  key={platform + platform.url}
                  className="text-blue-500 hover:underline text-sm"
                >
                  {JSON.stringify(platform?.identity_data)}
                </p>
              </div>
            )
          })}
        </div>
      )} */}
      {creator.identities && (
        <div className="flex gap-2 mt-2">
          {Object.entries(creator.identities).map(([platformIndex, platform]) => {
            // console.log("platform", platform)
            // console.log("url", platform.url)
            return (
              <div key={platform + platform.url}>
                <p
                  key={platform + platform.url}
                  className="text-blue-500 hover:underline text-sm"
                >
                </p>
              </div>
            )
          })}
        </div>
      )}

      {creator.slug_name && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">{creator.slug_name}</p>

          <Link href={`/content-creator/profile/${creator.slug_name}`}>
            <button className="bg-blue-500 text-white p-2 rounded-md">
              View Profile
            </button>
          </Link>
        </>
      )}



    </div>
  );
};

export default CreatorCard; 