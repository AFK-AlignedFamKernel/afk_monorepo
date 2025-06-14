import React from 'react';

interface Holder {
  owner?: string;
  amount_owned?: string;
  percentage?: number;
}

interface HoldersProps {
  holders: Holder[];
  loading?: boolean;
  total_supply?: number;
}

export const Holders: React.FC<HoldersProps> = ({ holders, loading, total_supply }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate total amount for distribution percentage
  const totalAmount = holders?.reduce((sum, holder) => sum + (Number(holder.amount_owned) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Total Holders: {holders?.length}
        </h3>
        {total_supply && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Supply: {total_supply.toLocaleString()}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Distributed: {totalAmount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 min-h-[300px] max-h-[300px] overflow-y-auto">
            <thead className=" dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % of Total Supply
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % of Distribution
                </th>
              </tr>
            </thead>
            <tbody className="dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 min-h-[300px] max-h-[300px] overflow-y-auto">
              {holders && holders.length > 0 && holders?.map((holder, index) => {
                const amount = Number(holder.amount_owned) || 0;
                const supplyPercentage = total_supply ? (amount / total_supply) * 100 : 0;
                const distributionPercentage = totalAmount ? (amount / totalAmount) * 100 : 0;
                
                return (
                  <tr key={index} className=" transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      <span className="font-mono">{holder?.owner?.slice(0, 6)}...{holder?.owner?.slice(-4)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <span>{supplyPercentage.toFixed(2)}%</span>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                            style={{ width: `${supplyPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <span>{distributionPercentage.toFixed(2)}%</span>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 dark:bg-green-400 rounded-full"
                            style={{ width: `${distributionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
          <span>% of Total Supply: Percentage of tokens owned relative to the total token supply</span>
        </p>
        <p className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></span>
          <span>% of Distribution: Percentage of tokens owned relative to the total distributed tokens</span>
        </p>
      </div>
    </div>
  );
}; 