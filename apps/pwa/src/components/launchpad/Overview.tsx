import { useUIStore } from '@/store/uiStore';
import React from 'react';
import { Icon } from '../small/icon-component';
import Image from 'next/image';
import Link from 'next/link';
interface OverviewProps {
  data: any; // Replace with your actual data type
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  const { showToast } = useUIStore();
  return (
    <div className="space-y-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Token Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(data?.memecoin_address);
                showToast({
                  message: 'Address copied',
                  type: 'success',
                });
              }}
            >
              <span >Contract Address</span>
              <span className="font-medium">{data?.memecoin_address?.slice(0, 6) + '...' + data?.memecoin_address?.slice(-4) || 'N/A'}</span>

              <Icon
                onClick={() => {
                  navigator.clipboard.writeText(data?.memecoin_address);
                  showToast({
                    message: 'Address copied',
                    type: 'success',
                  });
                }}
                name="CopyIcon"
                size={16}
              //  className="w-4 h-4" 
              />
            </div>

            {data?.url && (
              <div className="flex justify-between">
                <Image src={data?.url} alt="URL" width={100} height={100} />
              </div>
            )}

            <div className="flex justify-between">
              <span >Name</span>
              <span className="font-medium">{data?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span >Symbol</span>
              <span className="font-medium">{data?.symbol || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span >Total Supply</span>
              <span className="font-medium">{Number(data?.total_supply)?.toFixed(2) || 'N/A'}</span>
            </div>

            {data?.description && (
              <div className="flex justify-between">
                <span >Description</span>
                <span className="font-medium">{data?.description || 'N/A'}</span>
              </div>
            )}

            {data?.website && (
              <div className="flex justify-between">
                <span >Website</span>
                <Link href={data?.website} target="_blank" rel="noopener noreferrer">
                  {data?.website}
                </Link>
              </div>
            )}

          </div>
        </div>

        <div className="rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Launch Information</h3>
          <div className="space-y-3">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div className="text-xs font-semibold text-shade-600">
                  Progress: {((Number(data?.liquidity_raised ?? 0) / Number(data?.threshold_liquidity)) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="relative w-full h-3 bg-shade-100 rounded-full overflow-hidden border border-shade-200 shadow-sm">
                <div
                  className={`absolute h-full transition-all duration-300 ease-in-out ${Number(data?.liquidity_raised) <= Number(data?.threshold_liquidity) - Number(data?.threshold_liquidity) * 0.02
                    ? 'bg-yellow-500'
                    : 'bg-primary-500'
                    }`}
                  style={{
                    width: `${Math.min(100, (Number(data?.liquidity_raised ?? 0) / Number(data?.threshold_liquidity)) * 100)}%`,
                    animation: 'slideProgress 1s ease-in-out'
                  }}
                />
              </div>
              <style jsx>{`
                @keyframes slideProgress {
                  from {
                    width: 0%;
                  }
                  to {
                    width: ${Math.min(100, (Number(data?.liquidity_raised ?? 0) / Number(data?.threshold_liquidity)) * 100)}%;
                  }
                }
              `}</style>

              <div className="text-xs text-shade-500 mt-1">
                {Number(data?.liquidity_raised)} / {Number(data?.threshold_liquidity)}
              </div>
            </div>
            <div className="flex justify-between">
              <span >Liquidity Raised</span>
              <span className="font-medium">{Number(data?.liquidity_raised)?.toFixed(6) || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span >Price</span>
              <span className="font-medium">{Number(data?.price)?.toFixed(6) || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span >Market Cap</span>
              <span className="font-medium">{Number(data?.market_cap)?.toFixed(6) || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span >Status</span>
              <span className="font-medium">
                {data?.is_liquidity_added ? 'Graduated' : 'In Progress'}
              </span>
            </div>
            <div className="flex justify-between">
              <span >Created At</span>
              <span className="font-medium">
                {data?.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span >Bonding Type</span>
              <span className="font-medium">
                {data?.bonding_type ? data?.bonding_type : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-6 shadow-sm">
        <p className="text-sm">{data?.description || 'No description available.'}</p>
      </div>
    </div>
  );
}; 