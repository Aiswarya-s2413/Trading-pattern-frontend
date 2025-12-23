
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
import type {
  PriceData,
  Marker,
  SeriesPoint,
  ConsolidationZone,
} from "../../services/patternService";

interface TradingViewChartProps {
  priceData: PriceData[];
  markers: Marker[];
  chartTitle: string;
  parameterSeriesName?: string | null;
  parameterSeriesData?: SeriesPoint[];
  parameterSeriesDataEma5?: SeriesPoint[];
  parameterSeriesDataEma10?: SeriesPoint[];
  week52High?: number | null;
  selectedNrbGroupId?: number | null;
  consolidationZones?: ConsolidationZone[] | null;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  priceData,
  markers,
  chartTitle,
  parameterSeriesName,
  parameterSeriesData,
  parameterSeriesDataEma5,
  parameterSeriesDataEma10,
  week52High,
  selectedNrbGroupId,
  consolidationZones,
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const parameterLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const parameterLineSeriesEma5Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const parameterLineSeriesEma10Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const week52HighSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bowlSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const nrbRangeSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const candlestickMarkersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);
  const parameterLineMarkersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

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

      candlestickSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });

      parameterLineSeriesRef.current = chart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        priceLineVisible: false,
      });

      parameterLineSeriesEma5Ref.current = chart.addSeries(LineSeries, {
        color: "rgba(255, 82, 82, 0.9)",
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        priceLineVisible: false,
        visible: false,
      });

      parameterLineSeriesEma10Ref.current = chart.addSeries(LineSeries, {
        color: "rgba(33, 150, 243, 0.9)",
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        priceLineVisible: false,
        visible: false,
      });

      week52HighSeriesRef.current = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        lineStyle: 1,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
      });

      if (candlestickSeriesRef.current && !candlestickMarkersRef.current) {
        candlestickMarkersRef.current = createSeriesMarkers(candlestickSeriesRef.current, []);
      }
      if (parameterLineSeriesRef.current && !parameterLineMarkersRef.current) {
        parameterLineMarkersRef.current = createSeriesMarkers(parameterLineSeriesRef.current, []);
      }
    }

    const chart = chartRef.current;
    const candlestickSeries = candlestickSeriesRef.current;
    const parameterLineSeries = parameterLineSeriesRef.current;
    const parameterLineSeriesEma5 = parameterLineSeriesEma5Ref.current;
    const parameterLineSeriesEma10 = parameterLineSeriesEma10Ref.current;
    const week52HighSeries = week52HighSeriesRef.current;

    if (!chart || !candlestickSeries || !parameterLineSeries || !parameterLineSeriesEma5 || !parameterLineSeriesEma10 || !week52HighSeries) return;

    const showParameterLine = parameterSeriesName && parameterSeriesData && parameterSeriesData.length > 0;
    const isRSC30 = parameterSeriesName === "rsc30";

    if (priceData.length > 0 || (showParameterLine && parameterSeriesData)) {
      if (showParameterLine) {
        candlestickSeries.applyOptions({
          visible: false,
          priceScaleId: "",
        });

        if (isRSC30) {
          chart.priceScale("right").applyOptions({
            autoScale: true,
          } as any);

          parameterLineSeries.applyOptions({
            visible: true,
            color: "rgba(128, 128, 128, 0.8)",
            lineWidth: 1,
            priceScaleId: "right",
            priceFormat: {
              type: "price",
              precision: 4,
              minMove: 0.0001,
            },
          } as any);

          if (parameterSeriesData && parameterSeriesData.length > 0) {
            const formattedLineData = parameterSeriesData.map((item) => ({
              time: item.time as Time,
              value: item.value,
            }));
            parameterLineSeries.setData(formattedLineData);
          }

          if (parameterSeriesDataEma5 && parameterSeriesDataEma5.length > 0) {
            parameterLineSeriesEma5.applyOptions({
              visible: true,
              priceScaleId: "right",
              priceFormat: {
                type: "price",
                precision: 4,
                minMove: 0.0001,
              },
            } as any);
            const formattedEma5Data = parameterSeriesDataEma5.map((item) => ({
              time: item.time as Time,
              value: item.value,
            }));
            parameterLineSeriesEma5.setData(formattedEma5Data);
          } else {
            parameterLineSeriesEma5.applyOptions({ visible: false });
            parameterLineSeriesEma5.setData([]);
          }

          if (parameterSeriesDataEma10 && parameterSeriesDataEma10.length > 0) {
            parameterLineSeriesEma10.applyOptions({
              visible: true,
              priceScaleId: "right",
              priceFormat: {
                type: "price",
                precision: 4,
                minMove: 0.0001,
              },
            } as any);
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
          chart.priceScale("right").applyOptions({
            autoScale: true,
          } as any);

          parameterLineSeriesEma5.applyOptions({ visible: false });
          parameterLineSeriesEma10.applyOptions({ visible: false });
          parameterLineSeriesEma5.setData([]);
          parameterLineSeriesEma10.setData([]);

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
            priceScaleId: "right",
            priceFormat: {
              type: "price",
              precision: 2,
              minMove: 0.01,
            },
          } as any);

          if (parameterSeriesData && parameterSeriesData.length > 0) {
            const formattedLineData = parameterSeriesData.map((item) => ({
              time: item.time as Time,
              value: item.value,
            }));
            parameterLineSeries.setData(formattedLineData);
          }
        }
      } else {
        chart.priceScale("right").applyOptions({
          autoScale: true,
        } as any);

        candlestickSeries.applyOptions({
          visible: true,
          priceScaleId: "right",
        });
        parameterLineSeries.applyOptions({ visible: false });
        parameterLineSeriesEma5.applyOptions({ visible: false });
        parameterLineSeriesEma10.applyOptions({ visible: false });

        const formattedPriceData = priceData.map((item) => ({
          time: item.time as Time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));
        candlestickSeries.setData(formattedPriceData);
      }

      const dataForCalculations = showParameterLine && parameterSeriesData
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

      const isBowlPattern = chartTitle.toLowerCase().includes("bowl");

      const bowlMarkers = markers.filter((m) => {
        const mm: any = m;
        if (isBowlPattern && mm.pattern_id != null) return true;
        const hasBowlText = mm.text?.toUpperCase().includes("BOWL");
        return hasBowlText === true;
      });

      const bowls = new Map<number, Marker[]>();
      bowlMarkers.forEach((marker) => {
        const mm: any = marker;
        const id = mm.pattern_id != null ? Number(mm.pattern_id) : -1;
        if (!bowls.has(id)) bowls.set(id, []);
        bowls.get(id)!.push(marker);
      });

      if (bowls.size === 1 && bowls.has(-1) && bowlMarkers.length > 0) {
        bowls.clear();
        const sortedMarkers = [...bowlMarkers].sort((a, b) => Number((a as any).time) - Number((b as any).time));
        const TIME_CLUSTER_THRESHOLD = 30 * 24 * 60 * 60;
        let clusterId = 0;
        let lastTime = 0;

        sortedMarkers.forEach((marker) => {
          const markerTime = Number((marker as any).time);
          if (lastTime === 0 || markerTime - lastTime > TIME_CLUSTER_THRESHOLD) {
            clusterId++;
          }
          if (!bowls.has(clusterId)) bowls.set(clusterId, []);
          bowls.get(clusterId)!.push(marker);
          lastTime = markerTime;
        });
      }

      bowlSeriesRefs.current.forEach((series, key) => {
        const id = Number(key);
        if (!bowls.has(id)) {
          series.setData([]);
        }
      });

      const bowlColors = ["#2962FF", "#FF6D00", "#00BFA5", "#D500F9", "#FFD600", "#00E676", "#FF1744", "#FFFFFF", "#9C27B0", "#00BCD4"];

      bowls.forEach((patternMarkers, patternId) => {
        if (patternMarkers.length === 0) return;

        patternMarkers.sort((a, b) => Number((a as any).time) - Number((b as any).time));

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
        const lastTime = Number((patternMarkers[patternMarkers.length - 1] as any).time);
        const EXTEND_DAYS = 30;
        const extendedFirstTime = firstTime - EXTEND_DAYS * 24 * 60 * 60;
        const extendedLastTime = lastTime + EXTEND_DAYS * 24 * 60 * 60;

        const spanCandles = dataForCalculations
          .filter((c) => Number(c.time) >= extendedFirstTime && Number(c.time) <= extendedLastTime)
          .sort((a, b) => Number(a.time) - Number(b.time));

        if (spanCandles.length === 0) {
          bowlSeries.setData([]);
          return;
        }

        const minLow = Math.min(...spanCandles.map((c) => c.low));
        const minLowIndex = spanCandles.findIndex((c) => c.low === minLow);

        const startLow = spanCandles[0].low;
        const endLow = spanCandles[spanCandles.length - 1].low;
        const bottomPosition = minLowIndex / Math.max(1, spanCandles.length - 1);

        const lineData = spanCandles.map((c, idx) => {
          const t = idx / Math.max(1, spanCandles.length - 1);
          const distanceFromBottom = t - bottomPosition;
          const parabola = distanceFromBottom * distanceFromBottom;
          const maxDistance = Math.max(bottomPosition, 1 - bottomPosition);
          const maxParabola = maxDistance * maxDistance;
          const normalizedParabola = maxParabola > 0 ? parabola / maxParabola : 0;
          const bowlDepth = 1 - normalizedParabola;
          const edgeInterpolation = startLow * (1 - t) + endLow * t;
          const curvedValue = edgeInterpolation + (minLow - edgeInterpolation) * bowlDepth * 0.8;

          return {
            time: c.time,
            value: 0.65 * curvedValue + 0.35 * c.low,
          };
        });

        bowlSeries.setData(lineData);
      });

      const nrbMarkersWithRange = markers.filter((m: any) => {
        const isBowlMarker = (isBowlPattern && m.pattern_id != null) || m.text?.toUpperCase().includes("BOWL");
        const hasRange = m.range_low != null && m.range_high != null && m.range_start_time != null && m.range_end_time != null;
        return !isBowlMarker && hasRange;
      });

      nrbRangeSeriesRefs.current.forEach((series) => {
        series.setData([]);
      });

      nrbMarkersWithRange.forEach((marker: any) => {
        const id = marker.nrb_id != null ? String(marker.nrb_id) : String(marker.time);

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
          { time: marker.range_start_time as Time, value: marker.range_high as number },
          { time: marker.range_end_time as Time, value: marker.range_high as number },
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
          { time: marker.range_start_time as Time, value: marker.range_low as number },
          { time: marker.range_end_time as Time, value: marker.range_low as number },
        ]);
      });

      nrbRangeSeriesRefs.current.forEach((series, key) => {
        if (key.startsWith("zone-")) {
          series.setData([]);
        }
      });

      if (consolidationZones && consolidationZones.length > 0) {
        const lineColor = "#22c55e";

        consolidationZones.forEach((zone) => {
          if (!zone.start_time || !zone.end_time || zone.min_value == null || zone.max_value == null) {
            return;
          }

          const startTime = Number(zone.start_time);
          const endTime = Number(zone.end_time);
          const maxValue = Number(zone.max_value);

          if (!(startTime < endTime)) {
            return;
          }

          const lineKey = `zone-${zone.zone_id}-line`;
          let lineSeries = nrbRangeSeriesRefs.current.get(lineKey);
          
          if (!lineSeries) {
            lineSeries = chart.addSeries(LineSeries, {
              color: lineColor,
              lineWidth: 2,
              lineStyle: 0,
              crosshairMarkerVisible: false,
              priceLineVisible: false,
            });
            nrbRangeSeriesRefs.current.set(lineKey, lineSeries);
          }
          
          lineSeries.setData([
            { time: startTime as Time, value: maxValue },
            { time: endTime as Time, value: maxValue },
          ]);
        });
      }

      const zoneColors = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#eab308", "#ef4444", "#14b8a6", "#6366f1"];

      const zoneColorMap = new Map<number, string>();
      markers.forEach((m: any) => {
        if (m.consolidation_zone_id != null && !zoneColorMap.has(m.consolidation_zone_id)) {
          const idx = Math.abs(Number(m.consolidation_zone_id)) % zoneColors.length;
          zoneColorMap.set(m.consolidation_zone_id, zoneColors[idx]);
        }
      });

      const otherMarkers: SeriesMarker<Time>[] = markers
        .filter((m: any) => {
          const isBowlMarker = (isBowlPattern && m.pattern_id != null) || m.text?.toUpperCase().includes("BOWL");
          return !isBowlMarker;
        })
        .map((marker: any) => {
          let color = marker.color || "#2196F3";
          let shape: SeriesMarker<Time>["shape"] = (marker.shape as any) || "circle";

          const isNRBMarker = marker.direction === "Bullish Break" || marker.direction === "Bearish Break";

          if (isNRBMarker) {
            const zoneId = marker.consolidation_zone_id as number | null;
            const baseColor = (zoneId != null ? zoneColorMap.get(zoneId) || color : color) || "#2196F3";

            if (selectedNrbGroupId != null && zoneId != null && zoneId === selectedNrbGroupId) {
              color = baseColor;
            } else if (selectedNrbGroupId != null) {
              color = "rgba(148, 163, 184, 0.6)";
            } else {
              color = baseColor;
            }

            if (marker.direction === "Bullish Break") {
              shape = "arrowUp";
            } else if (marker.direction === "Bearish Break") {
              shape = "arrowDown";
            }
          } else {
            if (marker.direction === "Bullish Break") {
              color = "#00E5FF";
              shape = "arrowUp";
            } else if (marker.direction === "Bearish Break") {
              color = "#FFD600";
              shape = "arrowDown";
            }
          }

          return {
            time: marker.time as Time,
            position: (marker.position || "aboveBar") as "aboveBar" | "belowBar" | "inBar",
            color,
            shape,
            text: isNRBMarker ? "" : marker.text || "",
          };
        });

      if (week52High != null) {
        const spanData = dataForCalculations.length > 0
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

      if (showParameterLine && parameterLineMarkersRef.current) {
        parameterLineMarkersRef.current.setMarkers(otherMarkers);
      } else if (!showParameterLine && candlestickMarkersRef.current) {
        candlestickMarkersRef.current.setMarkers(otherMarkers);
      }

      chart.timeScale().fitContent();
    } else {
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
    
    if (selectedNrbGroupId == null) {
      chart.timeScale().fitContent();
      window.removeEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const zonesLength = consolidationZones?.length ?? 0;
    if (zonesLength > 0 && consolidationZones != null) {
      const zones = consolidationZones!;
      const foundZone = zones.find((z) => z.zone_id === selectedNrbGroupId);

      if (foundZone) {
        const startTime = foundZone!.start_time;
        const endTime = foundZone!.end_time;
        
        if (startTime != null && endTime != null) {
          chart.timeScale().setVisibleRange({
            from: Number(startTime) as Time,
            to: Number(endTime) as Time,
          });
          window.removeEventListener("resize", handleResize);
          return () => {
            window.removeEventListener("resize", handleResize);
          };
        }
      }
    }
    
    const zoneMarkers = markers.filter((m: any) => m.consolidation_zone_id === selectedNrbGroupId);

    const times: number[] = [];
    zoneMarkers.forEach((m: any) => {
      if (m.time != null) times.push(Number(m.time));
      if (m.zone_start_time != null) times.push(Number(m.zone_start_time));
      if (m.zone_end_time != null) times.push(Number(m.zone_end_time));
      if (m.range_start_time != null) times.push(Number(m.range_start_time));
      if (m.range_end_time != null) times.push(Number(m.range_end_time));
    });

    if (times.length >= 2) {
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      chart.timeScale().setVisibleRange({
        from: minTime as Time,
        to: maxTime as Time,
      });
    } else {
      chart.timeScale().fitContent();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    priceData,
    markers,
    chartTitle,
    parameterSeriesName,
    parameterSeriesData,
    parameterSeriesDataEma5,
    parameterSeriesDataEma10,
    week52High,
    selectedNrbGroupId,
    consolidationZones,
  ]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default TradingViewChart;