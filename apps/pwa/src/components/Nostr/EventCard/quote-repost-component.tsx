import { useUIStore } from "@/store/uiStore";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { useQueryClient } from "@tanstack/react-query";
import { useQuote, useRepost } from "afk_nostr_sdk";
import { useState } from "react";


enum QuoteNostrTypeMode {
    QUOTE,
    REPOST,
}

interface QuoteRepostComponentProps {
    event: NDKEvent;
}

export const QuoteRepostComponent = ({ event }: QuoteRepostComponentProps) => {

    const repostMutation = useRepost({ event });
    const [quoteContent, setQuoteContent] = useState<string>('');
    const queryClient = useQueryClient();

    const [type, setType] = useState<QuoteNostrTypeMode>(QuoteNostrTypeMode.QUOTE);
    const quoteMutation = useQuote({ event, content: quoteContent, tags: [['e', event?.id ?? '', '', 'root', event?.pubkey ?? '']] });

    const { showToast } = useUIStore()
    const handleRepost = async () => {
        if (!event) return;
        try {
            // @TODO fix
            // await handleCheckNostrAndSendConnectDialog();

            await repostMutation.mutateAsync();
            showToast({ message: 'Post reposted successfully', type: 'success' });
        } catch (error) {
            console.error('Repost error:', error);
            showToast({ message: 'Failed to repost', type: 'error' });
        }
    };

    const handleSendQuote = async () => {
        if (!quoteContent || quoteContent?.trim().length == 0) {
            showToast({ type: 'error', message: 'Please write your comment' });
            return;
        }
        // await handleCheckNostrAndSendConnectDialog();

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

        <div>
            <p>Quote or Repost</p>

            <input type="text-area"
                className="input-text"
                placeholder="Write your comment or just repost"
                value={quoteContent} onChange={(e) => setQuoteContent(e.target.value)} />

            <div className="
            flex gap-2 justify-center items-center space-x-2" >
                <button
                    className="btn btn-primary"
                    onClick={handleRepost}>Repost</button>

                <button
                    className="btn btn-primary"
                    onClick={handleSendQuote}>Quote</button>

            </div>

        </div>
    )
}