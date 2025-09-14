
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CryptoLoading from '@/components/small/crypto-loading';
import { LivestreamMain } from '@/components/Livestream';

export default function LivestreamPage() {
  // const router = useRouter();
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   // For now, redirect to a test stream ID
  //   // In a real app, this would show a list of available streams
  //   // or redirect to a specific stream based on user selection
  //   const testStreamId = '0b928aa418b869f48761d10486abdb5b';
    
  //   setTimeout(() => {
  //     router.push(`/livestream/${testStreamId}`);
  //   }, 1000);
  // }, [router]);

  // if (isLoading) {
  //   return (
  //     <div className="container mx-auto p-4">
  //       <div className="flex justify-center items-center min-h-[400px]">
  //         <div className="text-center">
  //           <CryptoLoading />
  //           <p className="mt-4 text-gray-600">Loading livestream...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <LivestreamMain 
        isStreamer={false}
      />
  );
}