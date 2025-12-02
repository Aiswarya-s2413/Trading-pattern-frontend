import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef, type FC } from 'react';
import type { OHLCVData } from '../services/TrueDataService';

interface LightweightChartProps {
    data: OHLCVData[];
    lastCandle?: OHLCVData | null;
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
}

// Helper function to convert OHLCVData to lightweight-charts format
const convertToChartData = (data: OHLCVData[]) => {
    return data.map(item => ({
        ...item,
        time: item.time as UTCTimestamp
    }));
};

export const LightweightChart: FC<LightweightChartProps> = ({ data, lastCandle, colors = {} }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const isFirstLoad = useRef(true);

    const {
        backgroundColor = '#1e222d',
        textColor = '#d1d4dc',
    } = colors;

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            grid: {
                vertLines: { color: '#2B2B43' },
                horzLines: { color: '#2B2B43' },
            },
        });

        chartRef.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        seriesRef.current = candlestickSeries;
        candlestickSeries.setData(convertToChartData(data));

        chart.timeScale().fitContent();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [backgroundColor, textColor]); // Re-create chart only if theme changes

    // Update data when history changes (full reload)
    useEffect(() => {
        if (seriesRef.current) {
            seriesRef.current.setData(convertToChartData(data));
            if (chartRef.current && isFirstLoad.current) {
                chartRef.current.timeScale().fitContent();
                isFirstLoad.current = false;
            }
        }
    }, [data]);

    // Update single candle when live data comes in
    useEffect(() => {
        if (seriesRef.current && lastCandle) {
            try {
                seriesRef.current.update({
                    ...lastCandle,
                    time: lastCandle.time as UTCTimestamp
                });
            } catch (e) {
                console.error("Chart update failed", e);
                console.log("Failed candle:", lastCandle);
                // We can't easily get the last bar from seriesRef without using data() which might be expensive or not available in this version directly as a simple getter for last bar.
                // But we can log what we have.
            }
        }
    }, [lastCandle]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-full"
        />
    );
};
