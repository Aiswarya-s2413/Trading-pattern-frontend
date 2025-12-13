// src/components/TradingViewChart.tsx
import React, { useRef, useEffect } from "react";
import {
    createChart,
    ColorType,
    CandlestickSeries,
    LineSeries,
    createSeriesMarkers,
} from "lightweight-charts";
import type {
    IChartApi,
    ISeriesApi,
    Time,
    SeriesMarker,
} from "lightweight-charts";
import type { PriceData, Marker, SeriesPoint } from "../../services/patternService";

interface TradingViewChartProps {
    priceData: PriceData[];
    markers: Marker[];
    chartTitle: string;
    parameterSeriesName?: string | null;
    parameterSeriesData?: SeriesPoint[];
    parameterSeriesDataEma5?: SeriesPoint[];  // 🆕 RED LINE
    parameterSeriesDataEma10?: SeriesPoint[]; // 🆕 BLUE LINE
    week52High?: number | null;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
    priceData,
    markers,
    chartTitle,
    parameterSeriesName,
    parameterSeriesData,
    parameterSeriesDataEma5,    // 🆕
    parameterSeriesDataEma10,   // 🆕
    week52High,
}) => {
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const parameterLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    
    // 🆕 Additional series for RSC30
    const parameterLineSeriesEma5Ref = useRef<ISeriesApi<"Line"> | null>(null);
    const parameterLineSeriesEma10Ref = useRef<ISeriesApi<"Line"> | null>(null);
    
    const week52HighSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    // Bowl curves: one line series per bowl pattern
    const bowlSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
    // NRB range lines: high/low per regime
    const nrbRangeSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

    // Markers plugin instances - one for each series type
    const candlestickMarkersRef = useRef<ReturnType<
        typeof createSeriesMarkers<Time>
    > | null>(null);
    const parameterLineMarkersRef = useRef<ReturnType<
        typeof createSeriesMarkers<Time>
    > | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // === 1. Create chart + base candlestick series once ===
        if (!chartRef.current) {
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
                layout: {
                    background: { type: ColorType.Solid, color: "#1e222d" },
                    textColor: "#d1d4dc",
                },
                grid: {
                    vertLines: { color: "#2B2B43" },
                    horzLines: { color: "#2B2B43" },
                },
                timeScale: {
                    borderColor: "#485c7b",
                },
                rightPriceScale: {
                    borderColor: "#485c7b",
                },
            });

            chartRef.current = chart;

            // Candlestick series
            candlestickSeriesRef.current = chart.addSeries(CandlestickSeries, {
                upColor: "#26a69a",
                downColor: "#ef5350",
                borderVisible: false,
                wickUpColor: "#26a69a",
                wickDownColor: "#ef5350",
            });

            // Primary parameter line series (gray for RSC ratio, or single line for EMA)
            parameterLineSeriesRef.current = chart.addSeries(LineSeries, {
                color: "#2962FF",
                lineWidth: 2,
                lineStyle: 0,
                crosshairMarkerVisible: true,
                priceLineVisible: false,
            });

            // 🆕 Additional RSC lines (EMA5 = RED, EMA10 = BLUE)
            parameterLineSeriesEma5Ref.current = chart.addSeries(LineSeries, {
                color: "rgba(255, 82, 82, 0.9)", // RED
                lineWidth: 2,
                lineStyle: 0,
                crosshairMarkerVisible: true,
                priceLineVisible: false,
                visible: false, // Hidden by default
            });

            parameterLineSeriesEma10Ref.current = chart.addSeries(LineSeries, {
                color: "rgba(33, 150, 243, 0.9)", // BLUE
                lineWidth: 2,
                lineStyle: 0,
                crosshairMarkerVisible: true,
                priceLineVisible: false,
                visible: false, // Hidden by default
            });

            // 52-week high line
            week52HighSeriesRef.current = chart.addSeries(LineSeries, {
                color: "#f59e0b",
                lineWidth: 2,
                lineStyle: 1,
                crosshairMarkerVisible: false,
                priceLineVisible: false,
            });

            // Create markers plugins
            if (candlestickSeriesRef.current && !candlestickMarkersRef.current) {
                candlestickMarkersRef.current = createSeriesMarkers(
                    candlestickSeriesRef.current,
                    []
                );
            }
            if (parameterLineSeriesRef.current && !parameterLineMarkersRef.current) {
                parameterLineMarkersRef.current = createSeriesMarkers(
                    parameterLineSeriesRef.current,
                    []
                );
            }
        }

        const chart = chartRef.current;
        const candlestickSeries = candlestickSeriesRef.current;
        const parameterLineSeries = parameterLineSeriesRef.current;
        const parameterLineSeriesEma5 = parameterLineSeriesEma5Ref.current;
        const parameterLineSeriesEma10 = parameterLineSeriesEma10Ref.current;
        const week52HighSeries = week52HighSeriesRef.current;

        if (
            !chart ||
            !candlestickSeries ||
            !parameterLineSeries ||
            !parameterLineSeriesEma5 ||
            !parameterLineSeriesEma10 ||
            !week52HighSeries
        )
            return;

        // === 2. Determine display mode ===
        const showParameterLine =
            parameterSeriesName &&
            parameterSeriesData &&
            parameterSeriesData.length > 0;

        // 🆕 Check if RSC30 (multi-line mode)
        const isRSC30 = parameterSeriesName === 'rsc30';

        // === 3. Update price data ===
        if (priceData.length > 0 || (showParameterLine && parameterSeriesData)) {
            // Show/hide series based on parameter selection
            if (showParameterLine) {
                // Hide candlesticks, show parameter line(s)
                candlestickSeries.applyOptions({ 
                    visible: false,
                    priceScaleId: '' // 🆕 Remove from price scale calculation
                });

                // 🆕 RSC30 Mode: Show 3 lines (Gray, Red, Blue)
                if (isRSC30) {
                    // GRAY LINE - RSC Ratio
                    parameterLineSeries.applyOptions({
                        visible: true,
                        color: "rgba(128, 128, 128, 0.8)",
                        lineWidth: 1,
                        priceScaleId: 'right', // 🆕 Ensure on right scale
                    });

                    if (parameterSeriesData && parameterSeriesData.length > 0) {
                        const formattedLineData = parameterSeriesData.map((item) => ({
                            time: item.time as Time,
                            value: item.value,
                        }));
                        parameterLineSeries.setData(formattedLineData);
                    }

                    // RED LINE - EMA5
                    if (parameterSeriesDataEma5 && parameterSeriesDataEma5.length > 0) {
                        parameterLineSeriesEma5.applyOptions({ 
                            visible: true,
                            priceScaleId: 'right' // 🆕 Ensure on right scale
                        });
                        const formattedEma5Data = parameterSeriesDataEma5.map((item) => ({
                            time: item.time as Time,
                            value: item.value,
                        }));
                        parameterLineSeriesEma5.setData(formattedEma5Data);
                    } else {
                        parameterLineSeriesEma5.applyOptions({ visible: false });
                        parameterLineSeriesEma5.setData([]);
                    }

                    // BLUE LINE - EMA10
                    if (parameterSeriesDataEma10 && parameterSeriesDataEma10.length > 0) {
                        parameterLineSeriesEma10.applyOptions({ 
                            visible: true,
                            priceScaleId: 'right' // 🆕 Ensure on right scale
                        });
                        const formattedEma10Data = parameterSeriesDataEma10.map((item) => ({
                            time: item.time as Time,
                            value: item.value,
                        }));
                        parameterLineSeriesEma10.setData(formattedEma10Data);
                    } else {
                        parameterLineSeriesEma10.applyOptions({ visible: false });
                        parameterLineSeriesEma10.setData([]);
                    }
                } else {
                    // Single-line mode (EMA21, EMA50, EMA200, etc.)
                    parameterLineSeriesEma5.applyOptions({ visible: false });
                    parameterLineSeriesEma10.applyOptions({ visible: false });
                    parameterLineSeriesEma5.setData([]);
                    parameterLineSeriesEma10.setData([]);

                    // Set color based on parameter type
                    const lineColors: Record<string, string> = {
                        ema21: "#00E5FF",
                        ema50: "#2962FF",
                        ema200: "#7C4DFF",
                        rsc500: "#FFD600",
                    };
                    const lineColor = lineColors[parameterSeriesName || ""] || "#2962FF";

                    parameterLineSeries.applyOptions({
                        visible: true,
                        color: lineColor,
                        lineWidth: 2,
                        priceScaleId: 'right', // 🆕 Ensure on right scale
                    });

                    if (parameterSeriesData && parameterSeriesData.length > 0) {
                        const formattedLineData = parameterSeriesData.map((item) => ({
                            time: item.time as Time,
                            value: item.value,
                        }));
                        parameterLineSeries.setData(formattedLineData);
                    }
                }
            } else {
                // Show candlesticks, hide parameter lines
                candlestickSeries.applyOptions({ 
                    visible: true,
                    priceScaleId: 'right' // 🆕 Add back to price scale
                });
                parameterLineSeries.applyOptions({ visible: false });
                parameterLineSeriesEma5.applyOptions({ visible: false });
                parameterLineSeriesEma10.applyOptions({ visible: false });

                // Update candlestick data
                const formattedPriceData = priceData.map((item) => ({
                    time: item.time as Time,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                }));
                candlestickSeries.setData(formattedPriceData);
            }

            // Data for bowl/marker calculations
            const dataForCalculations =
                showParameterLine && parameterSeriesData
                    ? parameterSeriesData.map((item) => ({
                        time: item.time as Time,
                        open: item.value,
                        high: item.value,
                        low: item.value,
                        close: item.value,
                    }))
                    : priceData.map((item) => ({
                        time: item.time as Time,
                        open: item.open,
                        high: item.high,
                        low: item.low,
                        close: item.close,
                    }));

            // === 4. Pattern logic: Bowl vs NRB ===
            const isBowlPattern = chartTitle.toLowerCase().includes("bowl");

            // Bowl markers
            const bowlMarkers = markers.filter((m) => {
                const mm: any = m;
                if (isBowlPattern && mm.pattern_id != null) return true;
                const hasBowlText = mm.text?.toUpperCase().includes("BOWL");
                return hasBowlText === true;
            });

            // Group bowl markers by pattern_id
            const bowls = new Map<number, Marker[]>();
            bowlMarkers.forEach((marker) => {
                const mm: any = marker;
                const id = mm.pattern_id != null ? Number(mm.pattern_id) : -1;
                if (!bowls.has(id)) bowls.set(id, []);
                bowls.get(id)!.push(marker);
            });

            // Fallback grouping
            if (bowls.size === 1 && bowls.has(-1) && bowlMarkers.length > 0) {
                bowls.clear();
                const sortedMarkers = [...bowlMarkers].sort(
                    (a, b) => Number((a as any).time) - Number((b as any).time)
                );

                const TIME_CLUSTER_THRESHOLD = 30 * 24 * 60 * 60;
                let clusterId = 0;
                let lastTime = 0;

                sortedMarkers.forEach((marker) => {
                    const markerTime = Number((marker as any).time);
                    if (
                        lastTime === 0 ||
                        markerTime - lastTime > TIME_CLUSTER_THRESHOLD
                    ) {
                        clusterId++;
                    }
                    if (!bowls.has(clusterId)) bowls.set(clusterId, []);
                    bowls.get(clusterId)!.push(marker);
                    lastTime = markerTime;
                });
            }

            // Clear old bowl series
            bowlSeriesRefs.current.forEach((series, key) => {
                const id = Number(key);
                if (!bowls.has(id)) {
                    series.setData([]);
                }
            });

            // Draw bowl curves
            const bowlColors = [
                "#2962FF",
                "#FF6D00",
                "#00BFA5",
                "#D500F9",
                "#FFD600",
                "#00E676",
                "#FF1744",
                "#FFFFFF",
                "#9C27B0",
                "#00BCD4",
            ];

            bowls.forEach((patternMarkers, patternId) => {
                if (patternMarkers.length === 0) return;

                patternMarkers.sort(
                    (a, b) => Number((a as any).time) - Number((b as any).time)
                );

                const numericPatternId = Number(patternId);
                const colorIndex = Math.abs(numericPatternId) % bowlColors.length;
                const color = bowlColors[colorIndex];

                const seriesKey = String(numericPatternId);
                let bowlSeries = bowlSeriesRefs.current.get(seriesKey);

                if (!bowlSeries) {
                    bowlSeries = chart.addSeries(LineSeries, {
                        color,
                        lineWidth: 3,
                        lineStyle: 0,
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                    });
                    bowlSeriesRefs.current.set(seriesKey, bowlSeries);
                } else {
                    bowlSeries.applyOptions({
                        color,
                        lineWidth: 3,
                        lineStyle: 0,
                    });
                }

                const firstTime = Number((patternMarkers[0] as any).time);
                const lastTime = Number(
                    (patternMarkers[patternMarkers.length - 1] as any).time
                );
                const EXTEND_DAYS = 30;
                const extendedFirstTime = firstTime - EXTEND_DAYS * 24 * 60 * 60;
                const extendedLastTime = lastTime + EXTEND_DAYS * 24 * 60 * 60;

                const spanCandles = dataForCalculations
                    .filter(
                        (c) =>
                            Number(c.time) >= extendedFirstTime &&
                            Number(c.time) <= extendedLastTime
                    )
                    .sort((a, b) => Number(a.time) - Number(b.time));

                if (spanCandles.length === 0) {
                    bowlSeries.setData([]);
                    return;
                }

                const minLow = Math.min(...spanCandles.map((c) => c.low));
                const minLowIndex = spanCandles.findIndex((c) => c.low === minLow);

                const startLow = spanCandles[0].low;
                const endLow = spanCandles[spanCandles.length - 1].low;
                const bottomPosition =
                    minLowIndex / Math.max(1, spanCandles.length - 1);

                const lineData = spanCandles.map((c, idx) => {
                    const t = idx / Math.max(1, spanCandles.length - 1);
                    const distanceFromBottom = t - bottomPosition;
                    const parabola = distanceFromBottom * distanceFromBottom;
                    const maxDistance = Math.max(bottomPosition, 1 - bottomPosition);
                    const maxParabola = maxDistance * maxDistance;
                    const normalizedParabola =
                        maxParabola > 0 ? parabola / maxParabola : 0;
                    const bowlDepth = 1 - normalizedParabola;
                    const edgeInterpolation = startLow * (1 - t) + endLow * t;
                    const curvedValue =
                        edgeInterpolation + (minLow - edgeInterpolation) * bowlDepth * 0.8;

                    return {
                        time: c.time,
                        value: 0.65 * curvedValue + 0.35 * c.low,
                    };
                });

                bowlSeries.setData(lineData);
            });

            // === 5. NRB range lines ===
            const nrbMarkersWithRange = markers.filter((m: any) => {
                const isBowlMarker =
                    (isBowlPattern && m.pattern_id != null) ||
                    m.text?.toUpperCase().includes("BOWL");
                const hasRange =
                    m.range_low != null &&
                    m.range_high != null &&
                    m.range_start_time != null &&
                    m.range_end_time != null;
                return !isBowlMarker && hasRange;
            });

            nrbRangeSeriesRefs.current.forEach((series) => {
                series.setData([]);
            });

            nrbMarkersWithRange.forEach((marker: any) => {
                const id =
                    marker.nrb_id != null ? String(marker.nrb_id) : String(marker.time);

                const highKey = `${id}-high`;
                let highSeries = nrbRangeSeriesRefs.current.get(highKey);
                if (!highSeries) {
                    highSeries = chart.addSeries(LineSeries, {
                        color: "#888888",
                        lineWidth: 1,
                        lineStyle: 1,
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                    });
                    nrbRangeSeriesRefs.current.set(highKey, highSeries);
                }
                highSeries.setData([
                    {
                        time: marker.range_start_time as Time,
                        value: marker.range_high as number,
                    },
                    {
                        time: marker.range_end_time as Time,
                        value: marker.range_high as number,
                    },
                ]);

                const lowKey = `${id}-low`;
                let lowSeries = nrbRangeSeriesRefs.current.get(lowKey);
                if (!lowSeries) {
                    lowSeries = chart.addSeries(LineSeries, {
                        color: "#888888",
                        lineWidth: 1,
                        lineStyle: 1,
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                    });
                    nrbRangeSeriesRefs.current.set(lowKey, lowSeries);
                }
                lowSeries.setData([
                    {
                        time: marker.range_start_time as Time,
                        value: marker.range_low as number,
                    },
                    {
                        time: marker.range_end_time as Time,
                        value: marker.range_low as number,
                    },
                ]);
            });

            // === 6. Other markers ===
            const otherMarkers: SeriesMarker<Time>[] = markers
                .filter((m: any) => {
                    const isBowlMarker =
                        (isBowlPattern && m.pattern_id != null) ||
                        m.text?.toUpperCase().includes("BOWL");
                    return !isBowlMarker;
                })
                .map((marker: any) => {
                    let color = marker.color || "#2196F3";
                    let shape: SeriesMarker<Time>["shape"] =
                        (marker.shape as any) || "circle";

                    const isNRBMarker =
                        marker.direction === "Bullish Break" ||
                        marker.direction === "Bearish Break";

                    if (marker.direction === "Bullish Break") {
                        color = "#00E5FF";
                        shape = "arrowUp";
                    } else if (marker.direction === "Bearish Break") {
                        color = "#FFD600";
                        shape = "arrowDown";
                    }

                    return {
                        time: marker.time as Time,
                        position: (marker.position || "aboveBar") as
                            | "aboveBar"
                            | "belowBar"
                            | "inBar",
                        color,
                        shape,
                        text: isNRBMarker ? "" : marker.text || "",
                    };
                });

            // 52-week high line
            if (week52High != null) {
                const spanData =
                    dataForCalculations.length > 0
                        ? dataForCalculations
                        : showParameterLine && parameterSeriesData
                            ? parameterSeriesData.map((item) => ({
                                time: item.time as Time,
                                value: item.value,
                            }))
                            : priceData.map((item) => ({
                                time: item.time as Time,
                                value: item.close,
                            }));

                if (spanData.length >= 2) {
                    const firstTime = spanData[0].time as Time;
                    const lastTime = spanData[spanData.length - 1].time as Time;
                    week52HighSeries.setData([
                        { time: firstTime, value: week52High },
                        { time: lastTime, value: week52High },
                    ]);
                    week52HighSeries.applyOptions({ visible: true });
                } else {
                    week52HighSeries.setData([]);
                    week52HighSeries.applyOptions({ visible: false });
                }
            } else {
                week52HighSeries.setData([]);
                week52HighSeries.applyOptions({ visible: false });
            }

            // Attach markers
            if (showParameterLine && parameterLineMarkersRef.current) {
                parameterLineMarkersRef.current.setMarkers(otherMarkers);
            } else if (!showParameterLine && candlestickMarkersRef.current) {
                candlestickMarkersRef.current.setMarkers(otherMarkers);
            }

            chart.timeScale().fitContent();
        } else {
            // No data: clear everything
            candlestickSeries.setData([]);
            parameterLineSeries.setData([]);
            parameterLineSeriesEma5.setData([]);
            parameterLineSeriesEma10.setData([]);
            week52HighSeries.setData([]);
            candlestickMarkersRef.current?.setMarkers([]);
            parameterLineMarkersRef.current?.setMarkers([]);
            bowlSeriesRefs.current.forEach((series) => series.setData([]));
            nrbRangeSeriesRefs.current.forEach((series) => series.setData([]));
        }

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [
        priceData,
        markers,
        chartTitle,
        parameterSeriesName,
        parameterSeriesData,
        parameterSeriesDataEma5,    // 🆕
        parameterSeriesDataEma10,   // 🆕
        week52High,
    ]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-full"
        />
    );
};

export default TradingViewChart;