"use client";
import { useGetLiveEvents } from 'afk_nostr_sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import styles from './styles.module.css';

interface Stream {
    identifier: string;
    eventId: string;
    title: string;
    summary: string;
    status: 'live' | 'ended' | 'scheduled';
    startDate: Date;
    endDate: Date;
    hashtags: string[];
    participants: {
        role: 'Host' | 'Speaker' | 'Participant';
        pubkey: string;
    }[];
    recordingUrl?: string;
    streamingUrl?: string;
}

export function StreamList() {
    const router = useRouter();
    const { data, isFetching, refetch } = useGetLiveEvents({
        limit: 20,
    });
    const [streams, setStreams] = useState<Stream[]>([]);

    useEffect(() => {
        if (data?.pages) {
            setStreams(data.pages.flat());
        }
    }, [data]);

    const handleStreamClick = (streamId: string, recordingUrl?: string) => {
        if (recordingUrl) {
            router.push(`/stream/recorded/${streamId}`);
        } else {
            router.push(`/stream/${streamId}`);
        }
    };

    const formatDate = (date: Date) => {
        return format(new Date(date), 'MMM d, yyyy h:mm a');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live':
                return styles.statusLive;
            case 'ended':
                return styles.statusEnded;
            case 'scheduled':
                return styles.statusScheduled;
            default:
                return '';
        }
    };

    if (isFetching) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
            </div>
        );
    }

    if (streams.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h2>No streams available</h2>
                <p>Be the first to start streaming!</p>
                <button
                    className={styles.createButton}
                    onClick={() => router.push('/stream/create')}
                >
                    Create Stream
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Live Streams</h1>
                    <p className={styles.subtitle}>Join live streams or watch recordings</p>
                </div>
                <button
                    className={styles.refreshButton}
                    onClick={() => refetch()}
                >
                    <svg
                        className={styles.refreshIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M23 4v6h-6M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className={styles.streamGrid}>
                {streams.map((stream) => (
                    <div
                        key={stream.eventId}
                        className={styles.streamCard}
                        onClick={() => handleStreamClick(stream.identifier, stream.recordingUrl)}
                    >
                        <div className={styles.streamHeader}>
                            <span className={`${styles.status} ${getStatusColor(stream.status)}`}>
                                {stream.status}
                            </span>
                            <span className={styles.date}>
                                {formatDate(stream.startDate)}
                            </span>
                        </div>

                        <div className={styles.streamContent}>
                            <h3 className={styles.title}>{stream.title}</h3>
                            <p className={styles.summary}>{stream.summary}</p>

                            <div className={styles.tags}>
                                {stream.hashtags.map((tag) => (
                                    <span key={tag} className={styles.tag}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div className={styles.streamFooter}>
                                <div className={styles.participants}>
                                    <svg
                                        className={styles.participantIcon}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span className={styles.participantCount}>
                                        {stream.participants.length} participants
                                    </span>
                                </div>
                                <button className={styles.watchButton}>
                                    {stream.recordingUrl ? 'Watch Recording' : 'Join Stream'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 