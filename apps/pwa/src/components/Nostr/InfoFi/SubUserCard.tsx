'use client';
import { useState } from 'react';

import { UserProfile } from "@/types/infofi";
import styles from '@/styles/nostr/infofi-nostr.module.scss';
import { useVoteTip } from '@/hooks/infofi';
import { formatUnits } from 'viem';
import { useAccount } from '@starknet-react/core';
import { VoteParams } from '@/types/infofi';
import { useProfile } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';
import ProfileCardOverview from '../EventCard/ProfileCardOverview';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';
import Image from 'next/image';
import { feltToAddress } from '@/utils/format';

export const SubUserCard = ({ profile, contractAddress }: { profile: UserProfile, contractAddress: string }) => {

    const { data: profileNostr } = useProfile({ publicKey: profile?.nostr_id });


    const { showModal, showToast } = useUIStore();
    const { handleVoteStarknetOnly, isVotingStarknetOnly } = useVoteTip();
    const [isTipUser, setIsTipUser] = useState<boolean>(false);
    const { account } = useAccount();
    const [voteParams, setVoteParams] = useState<VoteParams>({
        nostr_address: profile?.nostr_id,
        // nostr_address: cairo.isTypeFelt(profileIndexer?.nostr_id ?? '') ? profileIndexer?.nostr_id?.toString(): `0x${profileIndexer?.nostr_id}`,
        vote: 'good',
        // is_upvote: true,
        upvote_amount: "0",
        downvote_amount: "0",
        amount: "0",
        amount_token: "0",
    });
    const handleTipUser = async () => {
        try {
            await handleVoteStarknetOnly(voteParams, contractAddress);
        } catch (error) {
            console.error('Tip failed:', error);
        }
    };
    return (
        <div className={styles.subUserCard} style={{ marginBottom: '10px' }}>

            <div className={styles.infoSection + "cursor-pointer"}

                onClick={() => {
                    showModal(<ProfileCardOverview profile={profileNostr as NDKUserProfile}
                        profilePubkey={profile?.nostr_id}
                    />)
                }}
            >


                <div className="flex flex-row">

                    {profileNostr?.picture && (
                        <Image 
                        unoptimized
                        src={profileNostr?.picture || ''} alt={profileNostr?.displayName || profileNostr?.name || 'Anonymous'} width={40} height={40} className="rounded-full" />
                    )}

                    {!profileNostr?.picture && (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            {profileNostr?.displayName?.[0] || profileNostr?.name?.[0] || 'A'}
                        </div>
                    )}
                    {/* <p className={styles.userId}>
                        {profile?.nostr_id}
                    </p> */}

                </div>


                <p className={styles.userId}>
                    {profile?.starknet_address}
                </p>


                <h3 className={styles.userName}>
                    {profileNostr?.displayName || profileNostr?.name || 'Anonymous'}
                </h3>



                {profileNostr?.nip05 && (
                    <p className={styles.userId}>
                        @{profileNostr.nip05}
                    </p>
                )}

                {profileNostr?.about && (
                    <p className={styles.userBio}>
                        {profileNostr.about}
                    </p>
                )}
            </div>



            <div className={"flex flex-row"}>
                <p className={styles.userId}>
                    AI Score: {profile?.total_ai_score}
                </p>

                <p className={styles.userId}>
                    Vote Score: {profile?.total_vote_score}
                </p>
            </div>

            {/* <h4 className={styles.subUserCardTitle}>{profile.amount_claimed}</h4>
            <p className={styles.epochCardTitle}>{profile.starknet_address}</p>
            <p className={styles.epochCardTitle}>{profile.total_ai_score}</p>
            <p className={styles.epochCardTitle}>{profile.total_tip}</p>
            <p className={styles.epochCardTitle}>{profile.total_vote_score}</p>
            <p className={styles.epochCardTitle}>{profile.created_at}</p>
            <p className={styles.epochCardTitle}>{profile.updated_at}</p> */}

            <div className={styles.tipForm}>
                <h4 className={styles.tipFormTitle}>Tip and boost user</h4>
                <input
                    type="number"
                    placeholder="Amount"
                    value={voteParams.amount}
                    onChange={(e) => {
                        const value = e.target.value;
                        setVoteParams({
                            ...voteParams,
                            amount: value,
                            amount_token: value,
                            upvote_amount: value,
                            downvote_amount: value
                        });
                    }}
                    className={styles.tipInput}
                />
                <button
                    onClick={handleTipUser}
                    className={styles.tipButton}
                    disabled={!voteParams.amount || voteParams.amount === "0" || isVotingStarknetOnly}
                >
                    {isVotingStarknetOnly ? 'Tipping...' : 'Tip'}
                </button>
            </div>
        </div>
    )
}   