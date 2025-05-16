import React from 'react';

interface OverviewProps {
  data: any; // Replace with your actual data type
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  return (
    <div className="space-y-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Token Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span >Contract Address</span>
              <span className="font-medium">{data?.memecoin_address || 'N/A'}</span>
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
              <span className="font-medium">{data?.total_supply || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Launch Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span >Liquidity Raised</span>
              <span className="font-medium">{data?.liquidity_raised || '0'}</span>
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