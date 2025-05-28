"use client";

import dynamic from 'next/dynamic';

const StreamList = dynamic(() => import('./index').then(mod => mod.StreamList), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

export default function StreamListWrapper() {
  return <StreamList />;
} 