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
  BarElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
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
  data?: CandleData[];
  loading?: boolean;
}

export const Chart: React.FC<ChartProps> = ({ data, loading }) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1D');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Process data for candlestick chart
  const candlestickData = data.map(d => ({
    x: new Date(d.timestamp).toLocaleDateString(),
    o: d.open,
    h: d.high,
    l: d.low,
    c: d.close,
  }));

  // Create candlestick chart data
  const candlestickChartData = {
    labels: candlestickData.map(d => d.x),
    datasets: [
      {
        label: 'Candlestick',
        data: candlestickData.map(d => ({
          x: d.x,
          o: d.o,
          h: d.h,
          l: d.l,
          c: d.c,
        })),
        borderColor: candlestickData.map(d => d.c >= d.o ? '#10B981' : '#EF4444'),
        backgroundColor: candlestickData.map(d => d.c >= d.o ? '#10B981' : '#EF4444'),
        borderWidth: 2,
        type: 'bar' as const,
      },
    ],
  };

  // Line chart data
  const lineChartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Close Price',
        data: data.map(d => d.close),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true,
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
        text: chartType === 'candlestick' ? 'Candlestick Chart' : 'Price Chart',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (chartType === 'candlestick') {
              const data = context.raw;
              return [
                `Open: $${Number(data.o)?.toFixed(2)}`,
                `High: $${Number(data.h)?.toFixed(2)}`,
                `Low: $${Number(data.l)?.toFixed(2)}`,
                `Close: $${Number(data.c)?.toFixed(2)}`,
              ];
            }
            return `Price: $${Number(context.parsed.y)?.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return Number(value)?.toFixed(2);
          },
        },
      },
      x: {
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
  };

  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Price Chart</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded ${
                chartType === 'line'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 rounded ${
                chartType === 'candlestick'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Candlestick
            </button>
          </div>
        </div>
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
        <Line 
          data={chartType === 'candlestick' ? candlestickChartData : lineChartData} 
          // data={lineChartData} 
          options={options} 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">Current Price</h4>
          <p className="text-lg font-semibold">
            ${Number(currentPrice)?.toFixed(5)}
          </p>
          <p className={`text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(5)} ({priceChangePercent.toFixed(2)}%)
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">24h High</h4>
          <p className="text-lg font-semibold">
            ${Math.max(...data.map(d => Number(d.high)))?.toFixed(5)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">24h Low</h4>
          <p className="text-lg font-semibold">
            ${Math.min(...data.map(d => Number(d.low)))?.toFixed(5)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">24h Volume</h4>
          <p className="text-lg font-semibold">
            {data.reduce((sum, d) => sum + Number(d.volume), 0)?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-sm text-gray-500">Open</h4>
          <p className="text-lg font-semibold">
            ${Number(data[0]?.open)?.toFixed(5) || '0.00'}
          </p>
        </div>
      </div>
    </div>
  );
}; 