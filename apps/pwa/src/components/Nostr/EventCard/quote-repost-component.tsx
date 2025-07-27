import { useUIStore } from "@/store/uiStore";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { useQueryClient } from "@tanstack/react-query";
import { useQuote, useRepost, useRepostRaw } from "afk_nostr_sdk";
import { useState } from "react";
import React from "react";
import { useNostrAuth } from "@/hooks/useNostrAuth";
import { ButtonPrimary } from "@/components/button/Buttons";
import { PostEventCard } from "./PostEventCard";
import { ArticleEventCard } from "./ArticleEventCard";


enum QuoteNostrTypeMode {
    QUOTE,
    REPOST,
}

interface QuoteRepostComponentProps {
    event?: NDKEvent;
}

export const QuoteRepostComponent = ({ event }: QuoteRepostComponentProps) => {

    const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
    const repostMutation = useRepost({ event: event ?? undefined });
    const [quoteContent, setQuoteContent] = useState<string>('');
    const queryClient = useQueryClient();

    const [type, setType] = useState<QuoteNostrTypeMode>(QuoteNostrTypeMode.REPOST);
    const quoteMutation = useQuote({ event: event ?? undefined, content: quoteContent, tags: [['e', event?.id ?? '', '', 'root', event?.pubkey ?? '']] });

    // console.log("event", event);
    const { showToast } = useUIStore()
    const handleRepost = async () => {
        if (!event || !event?.id) return;
        try {
            // @TODO fix
            // await handleCheckNostrAndSendConnectDialog();
            const isNostrConnected = handleCheckNostrAndSendConnectDialog();
            if (!isNostrConnected) return;
            await repostMutation.mutateAsync();
            showToast({ message: 'Post reposted successfully', type: 'success' });
        } catch (error) {
            console.error('Repost error:', error);
            showToast({ message: 'Failed to repost', type: 'error' });
        }
    };

    const handleSendQuote = async () => {
        if (!event || !event?.id) {
            showToast({ type: 'error', message: 'Event not found' });
            return;
        }
        if (!quoteContent || quoteContent?.trim().length == 0) {
            showToast({ type: 'error', message: 'Please write your comment' });
            return;
        }
        const isNostrConnected = handleCheckNostrAndSendConnectDialog();
        if (!isNostrConnected) return;
        quoteMutation.mutate(
            {
                // event, content: quoteContent, tags: [['e', event?.id ?? '', '', 'root', event?.pubkey ?? '']] 
                event, content: quoteContent, tags: [['e', event?.id ?? '', '', 'root', event?.pubkey ?? ''], ['q', event?.id ?? '', '', 'root', event?.pubkey ?? '']]
            },
            {
                onSuccess() {
                    showToast({ type: 'success', message: 'Comment sent successfully' });
                    queryClient.invalidateQueries({ queryKey: ['replyNotes', event?.id] });
                    // setComment('');
                },
                onError() {
                    showToast({
                        type: 'error',
                        message: 'Error! Comment could not be sent. Please try again later.',
                    });
                },
            },
        );
    };

    return (
        <div className="mb-2">
            <div className="flex flex-row gap-2 justify-center mb-4">
                <button
                    onClick={() => setType(QuoteNostrTypeMode.REPOST)}
                    style={{
                        border: 'none',
                        outline: 'none',
                        background: type === QuoteNostrTypeMode.REPOST
                            ? (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? '#18181b' : '#e5e7eb')
                            : (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? 'transparent' : 'transparent'),
                        color: type === QuoteNostrTypeMode.REPOST
                            ? (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? '#fff' : '#18181b')
                            : (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#334155'),
                        fontWeight: type === QuoteNostrTypeMode.REPOST ? 700 : 500,
                        fontFamily: 'var(--afk-font-primary, IBM Plex Sans, Arial, sans-serif)',
                        borderRadius: '999px',
                        padding: '0.5rem 1.25rem',
                        fontSize: '1rem',
                        transition: 'background 0.18s, color 0.18s',
                        cursor: 'pointer',
                        boxShadow: type === QuoteNostrTypeMode.REPOST ? '0 2px 8px 0 rgba(0,0,0,0.04)' : 'none',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    Repost
                </button>
                <button
                    onClick={() => setType(QuoteNostrTypeMode.QUOTE)}
                    style={{
                        border: 'none',
                        outline: 'none',
                        background: type === QuoteNostrTypeMode.QUOTE
                            ? (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? '#18181b' : '#e5e7eb')
                            : (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? 'transparent' : 'transparent'),
                        color: type === QuoteNostrTypeMode.QUOTE
                            ? (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? '#fff' : '#18181b')
                            : (typeof window !== 'undefined' && document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#334155'),
                        fontWeight: type === QuoteNostrTypeMode.QUOTE ? 700 : 500,
                        fontFamily: 'var(--afk-font-primary, IBM Plex Sans, Arial, sans-serif)',
                        borderRadius: '999px',
                        padding: '0.5rem 1.25rem',
                        fontSize: '1rem',
                        transition: 'background 0.18s, color 0.18s',
                        cursor: 'pointer',
                        boxShadow: type === QuoteNostrTypeMode.QUOTE ? '0 2px 8px 0 rgba(0,0,0,0.04)' : 'none',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    Quote
                </button>
            </div>

            <div
                className="flex flex-row sm:flex-row gap-2 items-center justify-center my-4"
            >
                {type === QuoteNostrTypeMode.QUOTE && (
                    <>
                        {/* <div className="mb-2 font-semibold text-base">Write a comment</div> */}
                        <textarea
                            // className="input-text w-full mb-4"
                            className="w-full mb-4 p-2"
                            placeholder="Write your comment"
                            value={quoteContent}
                            onChange={(e) => setQuoteContent(e.target.value)}
                            rows={3}
                        />
                        <div className="flex gap-2 justify-center"
                        >
                            <ButtonPrimary
                                // className="btn btn-primary"
                                onClick={handleSendQuote}
                            >
                                Quote
                            </ButtonPrimary>
                        </div>
                    </>

                )}
                {type === QuoteNostrTypeMode.REPOST && (
                    <div className="flex flex-col items-center justify-center py-4">
                        {/* <div className="mb-4 font-semibold text-base">Repost this event?</div> */}
                        <ButtonPrimary
                            className="btn btn-primary"
                            onClick={handleRepost}
                        >
                            Repost
                        </ButtonPrimary>
                    </div>
                )}
            </div>



            <div
                className="sm:max-h-[200px] lg:max-h-[300px] overflow-y-auto"
                style={{
                    overflowY: 'auto',
                    // maxHeight: '200px',
                }}
            >
                {event?.kind == NDKKind.Text &&
                    <PostEventCard event={event} profile={undefined} isClickableHashtags={false}
                    />
                }
                {event?.kind == NDKKind.Article &&
                    <ArticleEventCard event={event} profile={undefined} isClickableHashtags={false} isReadMore={false} />
                }
            </div>
        </div>
    );
}