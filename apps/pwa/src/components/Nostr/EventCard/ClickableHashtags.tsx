import router from "next/router";
import React, { useMemo } from "react";

const hashtagsRegex = /\B#\w*[a-zA-Z]+\w*/g;
interface IContentWithClickableHashtagsProps {
  content: string;
  onHashtagPress: (hashtag: string) => void;
  hashtagsRender?: string[];
  tagsHash?: string[];
  tags?: string[][]
}


export const ContentWithClickableHashtags = ({ content, onHashtagPress, hashtagsRender, tagsHash, tags }: IContentWithClickableHashtagsProps) => {
  const parts = content?.split(hashtagsRegex);
  const matches = content?.match(hashtagsRegex);
  // const hashtags = hashtagsRender || matches;
  let hashtags = matches || tagsHash || [];
  const tagsEvent = useMemo(() => {
    return tags?.filter((tag) => tag[0] === 't').map((tag) => tag[1]) || [];
  }, [tags],);
  const matchesCleaned = matches?.map(tag => tag?.slice(1));
  hashtags = [...(matchesCleaned || []), ...(tagsHash || []), ...(tagsEvent || [])];

  hashtags = hashtags.filter(tag => tag && tag.length > 0);
  // Remove duplicate hashtags by converting to Set and back to array
  hashtags = [...new Set(hashtags)];
  return (
    <div
      className="mt-2 flex flex-wrap gap-1">

      {hashtags?.map((tag, index) => (
        <span
          onClick={() => onHashtagPress(tag)}
          key={index}
          className="cursor-pointer hashtag inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs"
        >
          {tag}
        </span>
      ))}
     
      {/* <p>
        {parts.map((part: string, index: number) => (
          <React.Fragment key={index}>
            {part}
            {matches && index < parts.length - 1 && (
              <ClickableHashtag hashtag={matches[index]} onPress={onHashtagPress} />
            )}
          </React.Fragment>
        ))}
      </p> */}
    </div>
  );
};

// export const ContentWithClickableHashtags = ({ content, onHashtagPress, hashtagsRender, tagsHash, tags }: IContentWithClickableHashtagsProps) => {
//   const parts = content?.split(hashtagsRegex);
//   const matches = content?.match(hashtagsRegex);

//   // const hashtags = hashtagsRender || matches;
//   let hashtags = matches || tagsHash || [];
//   const tagsEvent = useMemo(() => {
//     return tags?.filter((tag) => tag[0] === 't').map((tag) => tag[1]) || [];
//   }, [tags],);
//   hashtags = [...(matches || []), ...(tagsHash || []), ...(tagsEvent || [])];



//   return (
//     <div className="mt-2 flex flex-wrap gap-1">
//       {hashtags?.map((tag, index) => (
//         <span
//           onClick={() => {
//             router.push(`/nostr/tags/${tag}`);
//           }}
//           key={index}
//           className="cursor-pointer hashtag inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs"
//         >
//           {tag}
//         </span>
//       ))}
//       {matches?.map((tag, index) => (
//         <span
//           onClick={() => {
//             router.push(`/nostr/tags/${tag}`);
//           }}
//           key={index}
//           className="cursor-pointer hashtag inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs"
//         >
//           {tag}
//         </span>
//       ))}
//       {/* <p>
//         {parts.map((part: string, index: number) => (
//           <React.Fragment key={index}>
//             {part}
//             {matches && index < parts.length - 1 && (
//               <ClickableHashtag hashtag={matches[index]} onPress={onHashtagPress} />
//             )}
//           </React.Fragment>
//         ))}
//       </p> */}
//     </div>
//   );
// };
