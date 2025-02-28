import React, {useEffect, useRef} from 'react';
import {createChart, CandlestickSeries, ColorType, Time} from 'lightweight-charts';

interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: Time;
}

interface ChartProps {
  data: CandlestickData[];
}

const ChartComponent: React.FC<ChartProps> = ({data}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candlestickSeriesRef = useRef<ReturnType<typeof CandlestickSeries> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          textColor: 'white',
          background: {type: ColorType.Solid, color: 'black'},
        },
        grid: {
          vertLines: {
            color: 'rgba(255, 255, 255, 0.3)',
            style: 1,
            visible: true,
          },
          horzLines: {
            color: 'rgba(255, 255, 255, 0.3)',
            style: 1,
            visible: true,
          },
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        handleScale: {
          mouseWheel: true,
          axisDoubleClickReset: true,
          axisPressedMouseMove: true,
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
          timeVisible: true,
        },
      });

      candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
    }

    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(data);
      chartRef.current.timeScale().fitContent();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, [data]);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !data.length) return;
    const lastCandle = data[data.length - 1];
    candlestickSeriesRef.current.update(lastCandle);
  }, [data]);

  return <div ref={chartContainerRef} style={{width: '100%', height: '400px'}} />;
};

export default ChartComponent;
