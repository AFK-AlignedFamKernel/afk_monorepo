import { useUIStore } from '@/store/uiStore';
import React from 'react';
import { Icon } from '../small/icon-component';

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
          </div>
        </div>

        <div className="rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Launch Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span >Liquidity Raised</span>
              <span className="font-medium">{Number(data?.liquidity_raised)?.toFixed(6) || '0'}</span>
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