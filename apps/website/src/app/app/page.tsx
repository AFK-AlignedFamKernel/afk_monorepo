'use client';

// import { NDKEvent } from 'afk_nostr_sdk';
import {NDKEvent, NDKFilter, NDKKind} from '@nostr-dev-kit/ndk';
import {useNostrContext} from 'afk_nostr_sdk/context/NostrContext';
import {useSearchNotes} from 'afk_nostr_sdk/hooks';
import {useEffect} from 'react';
import {useState} from 'react';

import {Footer} from '../components/Footer';
import {Navbar} from '../components/Navbar';

export default function AppHomepage() {
  const nostr = useNostrContext();

  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [isInitDone, setIsInitDone] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitDone) {
      fetch();
      setIsInitDone(true);
    }
  });
  const fetch = async () => {
    const filter: NDKFilter = {
      kinds: [NDKKind.Text, NDKKind.ChannelMetadata, NDKKind.Metadata],
    };
    const events_package = await nostr?.ndk?.fetchEvents(filter);
    // console.log("events_package", events_package)
    setEvents([
      ...events_package,
      // [...eventsSearch?.data?.pages]
    ]);
  };

  const eventsSearch = useSearchNotes({
    kinds: [
      NDKKind.Text,
      // NDKKind.ChannelMetadata
    ],
  });
  // const events = useRootNotes();
  console.log('events hooks', eventsSearch?.data?.pages);
  return (
    // <Providers>
    <div className="min-h-screen w-full relative bg-black text-white">
      <Navbar />

      <button onClick={() => fetch()}>Reload</button>
      <div className="md:grid-cols-2">
        {events?.length > 0 &&
          events.map((e: NDKEvent, i) => {
            return (
              <div className="text-white" key={i}>
                <p>{e?.id}</p>
                <p>{e?.content}</p>
                <p>{e?.created_at}</p>

                <a
                  href="#"
                  className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Noteworthy technology acquisitions 2021
                  </h5>
                  <p className="font-normal text-gray-700 dark:text-gray-400">
                    Here are the biggest enterprise technology acquisitions of 2021 so far, in
                    reverse chronological order.
                  </p>
                </a>
              </div>
            );
          })}
      </div>

      <div className="md:grid-cols-2">
        {eventsSearch?.data?.pages?.map((e: NDKEvent) => {
          console.log('e', e);
          return (
            <div key={e?.id} className="text-white">
              <p>{e?.id}</p>

              <a
                href="#"
                className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Noteworthy technology acquisitions 2021
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse
                  chronological order.
                </p>
              </a>
            </div>
          );
        })}
      </div>

      <Footer />
    </div>
    // </Providers>
  );
}
