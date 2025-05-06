import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartProps {
  data: CandleData[];
  loading?: boolean;
}

export const Chart: React.FC<ChartProps> = ({ data, loading }) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1D');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Price',
        data: data.map(d => d.close),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Price Chart',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Price Chart</h3>
        <div className="flex space-x-2">
          {(['1D', '1W', '1M', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded ${
                timeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <Line data={chartData} options={options} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">24h High</h4>
          <p className="text-lg font-semibold">
            {Math.max(...data.map(d => d.high)).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">24h Low</h4>
          <p className="text-lg font-semibold">
            {Math.min(...data.map(d => d.low)).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">24h Volume</h4>
          <p className="text-lg font-semibold">
            {data.reduce((sum, d) => sum + d.volume, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">Current Price</h4>
          <p className="text-lg font-semibold">
            {data[data.length - 1]?.close.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
    </div>
  );
}; 