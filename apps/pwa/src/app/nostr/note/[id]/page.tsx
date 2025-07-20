'use client'

import { useParams } from 'next/navigation'
import {  useNote } from 'afk_nostr_sdk'
import { ArticleEventCard } from '@/components/Nostr/EventCard/ArticleEventCard'
import { PostEventCard, ShortEventCard } from '@/components/Nostr/EventCard'
import CryptoLoading from '@/components/small/crypto-loading'
import { VideoPlayer } from '@/components/Nostr/EventCard/NostrVideoPlayer'
export default function NotePage() {
  const { id } = useParams()
  console.log("id", id)
  const { data: note, isLoading: noteLoading, isError, isFetching } = useNote({
    noteId: id as string,
    // kinds: [1, 30023, 6, 7, NDKKind.Text],
  })
  // console.log("note", note)
  if (noteLoading) {
    return <div>
      <div className="flex justify-center items-center">
        <CryptoLoading />
      </div>
    </div>
  }

  // if (isError) {
  //   return <div>
  //     Error: {isError}
  //   </div>
  // }

  // if (!profile && !profileLoading) {
  //   return <div>Profile not found</div>
  // }

  return (
    <div className="p-4">

      <div className="flex flex-col gap-4">

        {note && (
          <>
            {note.kind === 1 && (
              <div className="rounded-lg p-4">
                {/* <p className="text-lg">{note.content}</p> */}
                <PostEventCard event={note} />
              </div>
            )}

            {note.kind === 30023 && (
              <div className="rounded-lg p-4">
                <ArticleEventCard event={note} isReadMore={false} />
              </div>
            )}

            {note.kind === 6 && (
              <div className="rounded-lg p-4">
                <h2 className="font-bold text-xl mb-2">Repost</h2>
                {/* <p>{note.content}</p> */}
                <PostEventCard event={note} />

              </div>
            )}

            {note.kind === 7 && (
              <div className="rounded-lg p-4">
                <h2 className="font-bold text-xl mb-2">Reaction</h2>
                {/* <p>{note.content}</p> */}
                <PostEventCard event={note} />
              </div>
            )}

            {![1, 30023, 6, 7].includes(note.kind) && (
              <div className="rounded-lg p-4">
                <VideoPlayer event={note} 
                className='rounded-lg max-h-[500px]'
                />
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}

