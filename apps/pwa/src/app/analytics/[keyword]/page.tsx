'use client';

import { useEffect, useState } from 'react';
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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendData {
  keyword: string;
  timeframe: string;
  geo: string;
  time_series: {
    dates: string[];
    values: number[];
    is_partial: boolean[];
  };
  related_queries: {
    top: Array<{ query: string; value: number }>;
    rising: Array<{ query: string; value: number }>;
  };
  timestamp: string;
}

export default function Analytics() {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_SCRAPER || 'http://localhost:8000';

        // Fetch trend data from database (cached)
        const trendResponse = await fetch(`${backendUrl}/google/trends/keyword/crypto?geo=US&timeframe=today%2012-m`);
        if (!trendResponse.ok) throw new Error('Failed to fetch trend data');
        const trendResult = await trendResponse.json();
        setTrendData(trendResult);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading analytics data...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!trendData) return <div className="p-4">No data available</div>;

  const chartData = {
    labels: trendData.time_series.dates,
    datasets: [
      {
        label: `Interest in ${trendData.keyword}`,
        data: trendData.time_series.values,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Trend Analysis for ${trendData.keyword}`,
      },
    },
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Content Analytics Dashboard</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Related Queries</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {trendData.related_queries.top.map((query, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <span>{query.query}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{query.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Rising Queries</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {trendData.related_queries.rising.map((query, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <span>{query.query}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{query.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}