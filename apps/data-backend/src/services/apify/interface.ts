export type XKaitoParams = {
    min_retweets?: number;
    filter_blue_verified?: boolean;
    filter_consumer_video?: boolean;
    filter_has_engagement?: boolean;
    filter_hashtags?: boolean;
    filter_images?: boolean;
    filter_links?: boolean;
    filter_media?: boolean;
    filter_mentions?: boolean;
    filter_native_video?: boolean;
    filter_nativeretweets?: boolean;
    filter_news?: boolean;
    filter_pro_video?: boolean;
    filter_quote?: boolean;
    filter_replies?: boolean;
    filter_safe?: boolean;
    filter_spaces?: boolean;
    filter_twimg?: boolean;
    filter_videos?: boolean;
    filter_vine?: boolean;
    include_nativeretweets?: boolean;
    lang?: string;
    queryType?: "Top" | "Latest" | "Mixed";
    searchTerms?: string[];
    since?: string;
    until?: string;
}