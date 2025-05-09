import React from 'react';

interface OverviewProps {
  data: any; // Replace with your actual data type
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Token Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name</span>
              <span className="font-medium">{data?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Symbol</span>
              <span className="font-medium">{data?.symbol || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Supply</span>
              <span className="font-medium">{data?.total_supply || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Launch Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Liquidity Raised</span>
              <span className="font-medium">{data?.liquidity_raised || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium">
                {data?.is_liquidity_added ? 'Graduated' : 'In Progress'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created At</span>
              <span className="font-medium">
                {data?.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Description</h3>
        <p className="text-gray-700">{data?.description || 'No description available.'}</p>
      </div>
    </div>
  );
}; 