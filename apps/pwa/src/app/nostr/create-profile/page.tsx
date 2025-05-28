'use client';

import React, { useState } from 'react';
// import NostrCreateAccountComponent from '@/components/Nostr/login/NostrCreateAccount';
import dynamic from 'next/dynamic';
import CryptoLoading from '@/components/small/crypto-loading';

const NostrCreateAccountComponent = dynamic(() => import('@/components/Nostr/login/NostrCreateAccount').then(mod => mod.default                                             ), {
    ssr: false,
    loading: () => <div><CryptoLoading></CryptoLoading></div>
});

export default function NostrCreateProfile() {
    return (
        <div className="">
            <NostrCreateAccountComponent />
        </div>
    );
}
