import NDK, { NDKEvent, NDKRelay, NostrEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { AFK_RELAYS } from 'common';

console.log("AFK_RELAYS", AFK_RELAYS);

const initNDK = async (): Promise<NDK> => {
    const ndk = new NDK({
        explicitRelayUrls: AFK_RELAYS,
    });
    await ndk.connect();
    return ndk;
}

interface FetchEventsParams {
    kind?: NDKKind[];
    limit?: number;
    authors?: string[];
    kinds?: NDKKind[];
    until?: number;
    since?: number;
}


// Fetch a list of events
export async function fetchEvents({ kind, limit = 100, authors, kinds = [NDKKind.Text, NDKKind.Article, NDKKind.VerticalVideo, NDKKind.HorizontalVideo], until, since }: FetchEventsParams): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({ kinds, limit, authors, until, since });
    // console.log('Events', events);
    console.log('Events length', Array.from(events).length);
    return Array.from(events);
}

// Fetch reactions for a specific event
export async function fetchReactions(eventId: string): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({ kinds: [NDKKind.Reaction], '#e': [eventId] });
    // console.log('Reactions', events);
    console.log('Reactions length', Array.from(events).length);
    return Array.from(events);
}

// Fetch replies for a specific event
export async function fetchReplies(eventId: string): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({ kinds: [NDKKind.Repost], '#e': [eventId] });
    // console.log('Replies', events);
    console.log('Replies length', Array.from(events).length);
    return Array.from(events);
}

// Fetch replies for a specific event
export async function fetchReposts(eventId: string): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({ kinds: [NDKKind.Repost], '#e': [eventId] });
    // console.log('Reposts', events);
    console.log('Reposts length', Array.from(events).length);
    return Array.from(events);
}

// Fetch replies for a specific event
export async function fetchBookmarks(eventId: string): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({ kinds: [NDKKind.BookmarkList, NDKKind.BookmarkSet], '#e': [eventId] });
    // console.log('Bookmarks', events);
    console.log('Bookmarks length', Array.from(events).length);
    return Array.from(events);
}

export async function fetchFeed(isWeighted: boolean, ids: string[]): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({ '#e': ids });
    return Array.from(events);
}


export async function fetchFollowers(userId: string): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({
        kinds: [NDKKind.Contacts],
        authors: [userId]
    });
    return Array.from(events);
}

export async function fetchFollowings(userId: string): Promise<NDKEvent[]> {
    const ndk = await initNDK();
    const events = await ndk.fetchEvents({
        kinds: [NDKKind.Contacts],
        '#p': [userId]
    });
    return Array.from(events);
}

// Fetch a list of events
export async function fetchEventMetadata(id: string): Promise<NDKEvent | null> {
    const ndk = await initNDK();
    const metadata = await ndk.fetchEvent({ authors: [id] , kinds: [NDKKind.Metadata]});
    return metadata;
}
