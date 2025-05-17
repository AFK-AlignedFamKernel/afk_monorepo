import router from "next/router";
import React from "react";

const hashtagsRegex = /\B#\w*[a-zA-Z]+\w*/g;

const ClickableHashtag = ({ hashtag, onPress }: any) => {
  return (
    <div onClick={onPress}>
      <p>{hashtag}</p>
    </div>
  );
};


export const ContentWithClickableHashtags = ({ content, onHashtagPress, hashtagsRender }: any) => {
  const parts = content?.split(hashtagsRegex);
  const matches = content?.match(hashtagsRegex);

  const hashtags = hashtagsRender || matches;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {hashtags?.map((tag, index) => (
        <span
          onClick={() => {
            router.push(`/nostr/tags/${tag}`);
          }}
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
