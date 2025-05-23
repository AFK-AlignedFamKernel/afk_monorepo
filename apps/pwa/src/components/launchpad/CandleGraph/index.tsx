import React, { useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import {
  TitleComponent,
  GraphicComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CandlestickChart, LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// Register required components
echarts.use([
  TitleComponent,
  GraphicComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  CandlestickChart,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
]);

const ChartComponent = ({ candleData = [], tokenName = 'Token', theme = 'dark' }) => {

  const chartRef = useRef<ReactEChartsCore>(null);

  const processedData = useMemo(() => {
    if (!candleData || candleData.length === 0) {
      <div
        className="w-full border rounded-lg p-4 bg-white shadow flex items-center justify-center"
        style={{ background: theme === 'dark' ? '#181818' : '#ffffff', height: 500 }}
      >
        <p style={{ color: theme === 'dark' ? '#e0e0e0' : '#333333' }}>No candle data available.</p>
      </div>;
    }

    return {
      dates: candleData.map((item:any) => {
        const date = new Date(item?.timestamp);
        return date.toISOString();
      }),
      data: candleData.map((item:any) => [
        parseFloat(item?.open),
        parseFloat(item?.close),
        parseFloat(item?.low),
        parseFloat(item?.high),
      ]),
    };
  }, [candleData]);

  const ma7 = useMemo(() => {
    const result:any[] = [];
    const period = 7;

    for (let i = 0; i < processedData.data.length; i++) {
      if (i < period - 1) {
        result.push('-');
        continue;
      }

      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += parseFloat(processedData.data[i - j][1] as unknown as string);
      }
      result.push(sum / period);
    }

    return result;
  }, [processedData.data]);

  const options = useMemo(() => {
    const colors =
      theme === 'dark'
        ? {
            text: '#e0e0e0',
            background: '#181818',
            upColor: '#26a69a',
            downColor: '#ef5350',
            maLine: '#f9ce1d',
            grid: '#303030',
            tooltip: '#424242',
          }
        : {
            text: '#333333',
            background: '#ffffff',
            upColor: '#26a69a',
            downColor: '#ef5350',
            maLine: '#ff9800',
            grid: '#f0f0f0',
            tooltip: '#f5f5f5',
          };

    return {
      backgroundColor: colors.background,
      animation: true,
      title: {
        left: 'center',
        textStyle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: 'normal',
        },
      },
      legend: {
        data: ['K-Line', 'MA7'],
        top: 30,
        textStyle: {
          color: colors.text,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: colors.text,
            opacity: 0.5,
          },
        },
        backgroundColor: colors.tooltip,
        borderWidth: 0,
        textStyle: {
          color: colors.text,
        },
        formatter: (params) => {
          const candleParams = params[0];
          const maParams = params.find((p) => p.seriesName === 'MA7');

          console.log('candleprams data is', candleParams.data);

          const date = new Date(candleParams.axisValue);
          const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
          const [_, open, close, low, high] = candleParams.data;
          const color = close >= open ? colors.upColor : colors.downColor;

          let html = `<div style="padding: 8px;">
              <div style="margin-bottom: 5px; font-weight: bold; color: ${colors.text};">${formattedDate}</div>
              <div style="display: flex; justify-content: space-between; color: ${color};">
                <span>Open:</span>
                <span style="margin-left: 15px">${open.toFixed(8)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: ${color};">
                <span>Close:</span>
                <span style="margin-left: 15px">${close.toFixed(8)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: ${color};">
                <span>High:</span>
                <span style="margin-left: 15px">${high.toFixed(8)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: ${color};">
                <span>Low:</span>
                <span style="margin-left: 15px">${low.toFixed(8)}</span>
              </div>`;

          if (maParams && maParams.data !== '-') {
            html += `<div style="display: flex; justify-content: space-between; color: ${colors.maLine};">
                <span>MA7:</span>
                <span style="margin-left: 15px">${parseFloat(maParams.data).toFixed(8)}</span>
              </div>`;
          }

          html += '</div>';
          return html;
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        label: {
          backgroundColor: colors.grid,
        },
      },
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: [0],
          realtime: false,
          start: 0,
          end: 100,
          top: 65,
          height: 20,
          borderColor: colors.grid,
          textStyle: {
            color: colors.text,
          },
          handleStyle: {
            color: colors.text,
            borderColor: colors.text,
          },
          moveHandleStyle: {
            color: colors.text,
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0, // Start from the beginning of the data
          end: 100, // End at the last data point
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
      ],
      xAxis: [
        {
          type: 'category',
          data: processedData.dates,
          boundaryGap: true, // Set to false to reduce vacant space
          axisLine: { lineStyle: { color: colors.grid } },
          axisLabel: {
            formatter: (value) => {
              const date = new Date(value);
              return echarts.format.formatTime('MM-dd HH:mm', date); // Format as "MM-DD HH:mm"
            },
            rotate: 30,
            margin: 15,
            color: colors.text,
          },
          min: 'dataMin', // Ensure the axis starts at the minimum data point
          max: 'dataMax', // Ensure the axis ends at the maximum data point
          splitLine: {
            show: false,
          },
        },
      ],
      yAxis: [
        {
          scale: true,
          position: 'right',
          splitNumber: 6,
          axisLine: {
            show: true,
            lineStyle: { color: colors.grid },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: colors.grid,
              opacity: 0.3,
            },
          },
          axisTick: { show: false },
          axisLabel: {
            color: colors.text,
            formatter: (value) => value.toFixed(8),
            inside: false,
          },
        },
      ],
      grid: [
        {
          left: '5%',
          right: '5%',
          top: 130,
          bottom: 50,
          height: 'auto',
          containLabel: true,
        },
      ],
      visualMap: {
        show: false,
        seriesIndex: 0,
        dimension: 1,
        pieces: [
          {
            value: 1,
            color: colors.upColor,
          },
          {
            value: -1,
            color: colors.downColor,
          },
        ],
      },
      series: [
        {
          name: 'K-Line',
          type: 'candlestick',
          data: processedData.data,
          itemStyle: {
            color: colors.upColor,
            color0: colors.downColor,
            borderColor: colors.upColor,
            borderColor0: colors.downColor,
          },
          markPoint: {
            label: {
              formatter: function (param) {
                return param != null ? Math.round(param.value) + '' : '';
              },
            },
            data: [
              {
                name: 'highest value',
                type: 'max',
                valueDim: 'highest',
              },
              {
                name: 'lowest value',
                type: 'min',
                valueDim: 'lowest',
              },
            ],
            tooltip: {
              formatter: function (param) {
                return param.name + '<br>' + (param.data.coord || '');
              },
            },
          },
        },
        {
          name: 'MA7',
          type: 'line',
          data: ma7,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: colors.maLine,
          },
        },
      ],
    };
  }, [processedData, ma7, tokenName, theme]);

  return (
    <div
      className="w-full border rounded-lg m-4 p-4 bg-white shadow"
      style={{ background: theme === 'dark' ? '#181818' : '#ffffff' }}
    >
      {/* <ReactEChartsCore
        ref={chartRef}
        style={{ height: 470 }}
        echarts={echarts}
        option={options as any}
        notMerge
        lazyUpdate
        theme={theme}
      /> */}
    </div>
  );
};

export default ChartComponent;
