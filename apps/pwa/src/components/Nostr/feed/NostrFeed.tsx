'use client';

import React, { useEffect, useState } from 'react';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useNostrContext } from 'afk_nostr_sdk';
import { NostrEventCard } from '../EventCard';
import { NostrEventKind } from '@/types/nostr';
import './feed.scss';

interface NostrFeedProps {
  kinds?: NDKKind[];
  limit?: number;
  className?: string;
}

export const NostrFeed: React.FC<NostrFeedProps> = ({ 
  kinds = [NDKKind.Text, 30023 as NDKKind], // Default to showing text posts and articles
  limit = 10,
  className = ''
}) => {
  const { ndk } = useNostrContext();
  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  console.log("events", events);
  useEffect(() => {
    const fetchEvents = async () => {
      if (!ndk) return;
      setLoading(true);

      try {
        const fetchedEvents = await ndk.fetchEvents({
          kinds: kinds,
          limit: limit
        });

        const eventsArray = Array.from(fetchedEvents);

        // Get all unique author pubkeys
        const pubkeys = [...new Set(eventsArray.map(event => event.pubkey))];
        
        // Fetch profiles for all unique authors
        const profilePromises = pubkeys.map(async (pubkey) => {
          try {
            const user = ndk.getUser({ pubkey });
            const profile = await user.fetchProfile();
            return { pubkey, profile };
          } catch (error) {
            console.error(`Failed to fetch profile for ${pubkey}:`, error);
            return { pubkey, profile: null };
          }
        });
        
        const profileResults = await Promise.all(profilePromises);
        
        const profilesMap = profileResults.reduce((acc, { pubkey, profile }) => {
          if (profile) {
            acc[pubkey] = profile;
          }
          return acc;
        }, {} as Record<string, any>);
        
        setProfiles(profilesMap);
        setEvents(eventsArray);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [ndk, JSON.stringify(kinds), limit]);

  if (loading && events.length === 0) {
    return (
      <div className={`nostr-feed__content ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={`skeleton-${index}`} className="nostr-feed__card nostr-feed__card--skeleton">
            <NostrEventCard 
              key={`skeleton-${index}`}
              event={{} as NDKEvent}
              isLoading={true}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`nostr-feed__content ${className}`}>
      {events.length === 0 ? (
        <div className="nostr-feed__empty-state">
          <p>No events found. Try following more users or changing filters.</p>
        </div>
      ) : (
        events.map((event) => (
          <div key={event.id} className="nostr-feed__card">
            <NostrEventCard 
              event={event}
              profile={profiles[event.pubkey]}
            />
          </div>
        ))
      )}
    </div>
  );
};

export default NostrFeed; 