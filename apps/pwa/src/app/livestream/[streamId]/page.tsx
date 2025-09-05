'use client';
import { LivestreamMain } from '@/components/Livestream';
import { useParams } from 'next/navigation';
import CryptoLoading from '@/components/small/crypto-loading';

export default function LivestreamPage() {
  const { streamId } = useParams();
  
  console.log('🎬 LivestreamPage - streamId:', streamId);
  
  if (!streamId) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">No Stream ID Provided</h2>
            <p className="text-gray-600">Please provide a valid stream ID to view the livestream.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <LivestreamMain 
        streamId={streamId as string}
        isStreamer={false}
      />
    </div>
  );
}
