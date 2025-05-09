import { useNostrContext } from 'afk_nostr_sdk';
import { useEffect, useState } from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';

export const FeedNostr= () => {
  const { ndk } = useNostrContext();
  const [events, setEvents] = useState<NDKEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!ndk) return;

      const events = await ndk.fetchEvents({
        kinds: [1], // Regular notes
        limit: 50
      });

      setEvents(Array.from(events));
    };

    fetchEvents();
  }, [ndk]);

  return (
    <div>
      {events.map((event) => (
        <div key={event.id}>
          <p>{event.content}</p>
        </div>
      ))}
    </div>
  );
};