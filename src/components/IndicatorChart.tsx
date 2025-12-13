import { createChart, ColorType, LineSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface SeriesData {
    time: number;
    value: number;
}

export interface SeriesConfig {
    data: SeriesData[];
    color: string;
    lineWidth?: number;
    title?: string;
}

export interface IndicatorChartProps {
    // Single series (backward compatible)
    data?: SeriesData[];
    color?: string;
    
    // Multi-series support (for RSC30)
    series?: SeriesConfig[];
    
    height?: number;
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
    };
}

export interface IndicatorChartHandle {
    api: () => IChartApi | null;
}

export const IndicatorChart = forwardRef<IndicatorChartHandle, IndicatorChartProps>(({
    data,
    color = '#2962FF',
    series,
    colors = {}
}, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRefs = useRef<ISeriesApi<"Line">[]>([]);
    const isFirstLoad = useRef(true);

    const {
        backgroundColor = '#1e222d',
        textColor = '#d1d4dc',
    } = colors;

    useImperativeHandle(ref, () => ({
        api: () => chartRef.current
    }));

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                const { clientWidth, clientHeight } = chartContainerRef.current;
                chartRef.current.applyOptions({ width: clientWidth, height: clientHeight });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(chartContainerRef.current);

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
            timeScale: {
                visible: true,
                timeVisible: true,
            }
        });

        chartRef.current = chart;

        // Clear previous series
        seriesRefs.current = [];

        // Multi-series mode (RSC30 with 3 lines)
        if (series && series.length > 0) {
            series.forEach((s) => {
                const lineSeries = chart.addSeries(LineSeries, {
                    color: s.color,
                    lineWidth: s.lineWidth || 2,
                    crosshairMarkerVisible: true,
                } as any);

                const chartData = s.data.map(d => ({
                    time: d.time as UTCTimestamp,
                    value: d.value
                }));

                lineSeries.setData(chartData);
                seriesRefs.current.push(lineSeries);
            });
        } 
        // Single-series mode (backward compatible for EMA21, EMA50, etc.)
        else if (data && data.length > 0) {
            const lineSeries = chart.addSeries(LineSeries, {
                color: color,
                lineWidth: 2,
                crosshairMarkerVisible: true,
            } as any);

            const chartData = data.map(d => ({
                time: d.time as UTCTimestamp,
                value: d.value
            }));

            lineSeries.setData(chartData);
            seriesRefs.current.push(lineSeries);
        }

        chart.timeScale().fitContent();

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [backgroundColor, textColor]);

    // Update data when it changes
    useEffect(() => {
        if (!chartRef.current) return;

        // Clear existing series
        seriesRefs.current.forEach(s => chartRef.current?.removeSeries(s));
        seriesRefs.current = [];

        // Multi-series mode
        if (series && series.length > 0) {
            series.forEach((s) => {
                const lineSeries = chartRef.current!.addSeries(LineSeries, {
                    color: s.color,
                    lineWidth: s.lineWidth || 2,
                    crosshairMarkerVisible: true,
                } as any);

                const chartData = s.data.map(d => ({
                    time: d.time as UTCTimestamp,
                    value: d.value
                }));

                lineSeries.setData(chartData);
                seriesRefs.current.push(lineSeries);
            });
        }
        // Single-series mode
        else if (data && data.length > 0) {
            const lineSeries = chartRef.current.addSeries(LineSeries, {
                color: color,
                lineWidth: 2,
                crosshairMarkerVisible: true,
            } as any);

            const chartData = data.map(d => ({
                time: d.time as UTCTimestamp,
                value: d.value
            }));

            lineSeries.setData(chartData);
            seriesRefs.current.push(lineSeries);
        }

        if (isFirstLoad.current && (data?.length || series?.some(s => s.data.length))) {
            chartRef.current.timeScale().fitContent();
            isFirstLoad.current = false;
        }
    }, [data, color, series]);

    return (
        <div ref={chartContainerRef} className="w-full h-full" />
    );
});

IndicatorChart.displayName = "IndicatorChart";