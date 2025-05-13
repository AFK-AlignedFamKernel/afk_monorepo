'use client'

import { useParams } from 'next/navigation'
import { useNote } from 'afk_nostr_sdk'
import { ArticleEventCard } from '@/components/Nostr/EventCard/ArticleEventCard'
import { ShortEventCard } from '@/components/Nostr/EventCard'
export default function NotePage() {
  const { id } = useParams()
  const { data: note, isLoading: noteLoading, isError, isFetching } = useNote({
    noteId: id as string,
  })

  if (noteLoading) {
    return <div>Loading note...</div>
  }

  if (isError) {
    return <div>
      Error: {isError}
    </div>
  }

  // if (!profile && !profileLoading) {
  //   return <div>Profile not found</div>
  // }

  return (
    <div className="p-4">

      <div className="flex flex-col gap-4">

        {note && (
          <>
            {note.kind === 1 && (
              <div className="border rounded-lg p-4">
                <p className="text-lg">{note.content}</p>
              </div>
            )}

            {note.kind === 30023 && (
              <div className="border rounded-lg p-4">
                <ArticleEventCard event={note} isReadMore={false} />
              </div>
            )}

            {note.kind === 6 && (
              <div className="border rounded-lg p-4">
                <h2 className="font-bold text-xl mb-2">Repost</h2>
                <p>{note.content}</p>
              </div>
            )}

            {note.kind === 7 && (
              <div className="border rounded-lg p-4">
                <h2 className="font-bold text-xl mb-2">Reaction</h2>
                <p>{note.content}</p>
              </div>
            )}

            {![1, 30023, 6, 7].includes(note.kind) && (
              <div className="border rounded-lg p-4">
                <ShortEventCard event={note} />
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}

