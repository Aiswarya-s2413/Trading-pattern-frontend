import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PriceData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SeriesPoint {
  time: number;
  value: number;
}

export interface Marker {
  time: number;
  position: "aboveBar" | "belowBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string;
  pattern_id?: number;
  score?: number;

  range_low?: number | null;
  range_high?: number | null;
  range_start_time?: number | null;
  range_end_time?: number | null;
  nrb_id?: number | null;

  consolidation_zone_id?: number | null;
  zone_duration_weeks?: number | null;
  zone_start_time?: number | null;
  zone_end_time?: number | null;
  zone_min_value?: number | null;
  zone_max_value?: number | null;
  zone_avg_value?: number | null;
  zone_range_pct?: number | null;
  
  nrb_group_id?: number | null;
  group_level?: number | null;
  group_start_time?: number | null;
  group_end_time?: number | null;
  group_nrb_count?: number | null;

  direction?: "Bullish Break" | "Bearish Break" | string;
}

export interface ConsolidationZone {
  zone_id: number;
  start_time: number;
  end_time: number;
  duration_weeks: number;
  first_value: number;
  min_value: number;
  max_value: number;
  avg_value: number;
  range_pct: number;
  num_nrbs: number;
  success_rate_3m: number | null;
  success_rate_6m: number | null;
  success_rate_12m: number | null;
}

// 🆕 UPDATED INTERFACE
export interface NrbGroup {
  group_id: number;
  group_level: number;
  group_start_time: number;
  group_end_time: number;
  group_nrb_count: number;
  nrb_ids: number[];
  // New fields
  group_duration_weeks?: number | null;
  success_rate_3m?: number | null;
  success_rate_6m?: number | null;
  success_rate_12m?: number | null;
}

export interface PatternScanResponse {
  scrip: string;
  pattern: string;
  price_data: PriceData[];
  markers: Marker[];
  total_consolidation_duration_weeks?: number | null;

  series?: string | null;
  series_data?: SeriesPoint[];
  series_data_ema5?: SeriesPoint[];
  series_data_ema10?: SeriesPoint[];

  consolidation_zones?: ConsolidationZone[];
  nrb_groups?: NrbGroup[];
}

export interface Week52HighResponse {
  scrip: string;
  "52week_high": number | null;
  cutoff_date: string;
}

export const fetchPatternScanData = async (
  scrip: string,
  pattern: string,
  nrbLookback: number | null,
  successRate: number | null,
  weeks?: number,
  series?: string | null,
  cooldownWeeks?: number
): Promise<PatternScanResponse> => {
  try {
    const params: any = {
      scrip,
      pattern,
      success_rate: successRate,
    };

    if (nrbLookback !== null) params.nrb_lookback = nrbLookback;
    if (pattern === "Narrow Range Break" && weeks != null) params.weeks = weeks;
    if (pattern === "Narrow Range Break" && cooldownWeeks != null) params.cooldown_weeks = cooldownWeeks;
    if (series) params.series = series;

    const response = await axios.get<PatternScanResponse>(
      `${API_BASE_URL}/pattern-scan/`,
      { params }
    );

    let rawMarkers = response.data.markers;
    if (!rawMarkers && (response.data as any).triggers) rawMarkers = (response.data as any).triggers;
    if (!rawMarkers && Array.isArray(response.data)) rawMarkers = response.data as any;

    const normalizedSeries = (response.data as any).series ?? series ?? null;
    const normalizedSeriesData: SeriesPoint[] = ((response.data as any).series_data as SeriesPoint[]) ?? [];
    const normalizedSeriesDataEma5: SeriesPoint[] = ((response.data as any).series_data_ema5 as SeriesPoint[]) ?? [];
    const normalizedSeriesDataEma10: SeriesPoint[] = ((response.data as any).series_data_ema10 as SeriesPoint[]) ?? [];

    const totalConsolidationDurationWeeks =
      (response.data as any).total_consolidation_duration_weeks ??
      (response.data as any).debug?.total_consolidation_duration_weeks ??
      null;

    const consolidationZones: ConsolidationZone[] = ((response.data as any).consolidation_zones || []).map(
      (g: any) => ({
        zone_id: g.zone_id ?? g.zoneId ?? null,
        start_time: g.start_time ?? g.startTime ?? null,
        end_time: g.end_time ?? g.endTime ?? null,
        duration_weeks: g.duration_weeks ?? g.durationWeeks ?? null,
        first_value: g.first_value ?? g.firstValue ?? null,
        min_value: g.min_value ?? g.minValue ?? null,
        max_value: g.max_value ?? g.maxValue ?? null,
        avg_value: g.avg_value ?? g.avgValue ?? null,
        range_pct: g.range_pct ?? g.rangePct ?? null,
        num_nrbs: g.num_nrbs ?? g.numNrbs ?? 0,
        success_rate_3m: g.success_rate_3m ?? g.successRate3m ?? null,
        success_rate_6m: g.success_rate_6m ?? g.successRate6m ?? null,
        success_rate_12m: g.success_rate_12m ?? g.successRate12m ?? null,
      })
    );

    // 🆕 UPDATED MAPPING Logic
    const nrbGroups: NrbGroup[] = ((response.data as any).nrb_groups || []).map((g: any) => ({
      group_id: g.group_id,
      group_level: g.group_level,
      group_start_time: g.group_start_time,
      group_end_time: g.group_end_time,
      group_nrb_count: g.group_nrb_count,
      nrb_ids: g.nrb_ids || [],
      // Map new fields from backend
      group_duration_weeks: g.group_duration_weeks,
      success_rate_3m: g.success_rate_3m,
      success_rate_6m: g.success_rate_6m,
      success_rate_12m: g.success_rate_12m,
    }));

    const normalizedData: PatternScanResponse = {
      scrip: response.data.scrip || scrip,
      pattern: response.data.pattern || pattern,
      price_data: response.data.price_data || [],
      markers: (rawMarkers || []).map((marker: any) => ({
        time: marker.time,
        pattern_id: marker.pattern_id,
        score: marker.score,
        position: (marker.position === "overlay" ? "aboveBar" : marker.position) || "belowBar",
        color: marker.color || "#2196F3",
        shape: marker.shape || "circle",
        text: marker.text,
        range_low: marker.range_low ?? null,
        range_high: marker.range_high ?? null,
        range_start_time: marker.range_start_time ?? null,
        range_end_time: marker.range_end_time ?? null,
        nrb_id: marker.nrb_id ?? null,
        consolidation_zone_id: marker.consolidation_zone_id ?? null,
        zone_duration_weeks: marker.zone_duration_weeks ?? null,
        zone_start_time: marker.zone_start_time ?? null,
        zone_end_time: marker.zone_end_time ?? null,
        zone_min_value: marker.zone_min_value ?? null,
        zone_max_value: marker.zone_max_value ?? null,
        zone_avg_value: marker.zone_avg_value ?? null,
        zone_range_pct: marker.zone_range_pct ?? null,
        nrb_group_id: marker.nrb_group_id ?? null,
        group_level: marker.group_level ?? null,
        group_start_time: marker.group_start_time ?? null,
        group_end_time: marker.group_end_time ?? null,
        group_nrb_count: marker.group_nrb_count ?? null,
        direction: marker.direction,
      })),
      total_consolidation_duration_weeks: totalConsolidationDurationWeeks,
      series: normalizedSeries,
      series_data: normalizedSeriesData,
      series_data_ema5: normalizedSeriesDataEma5,
      series_data_ema10: normalizedSeriesDataEma10,
      consolidation_zones: consolidationZones,
      nrb_groups: nrbGroups,
    };

    return normalizedData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "An unknown API error occurred");
    }
    throw new Error("Network or other error during API call");
  }
};

export const fetch52WeekHigh = async (scrip: string): Promise<Week52HighResponse> => {
  try {
    const response = await axios.get<Week52HighResponse>(`${API_BASE_URL}/52week-high/`, { params: { scrip } });
    return response.data;
  } catch (error) {
    console.error("Error fetching 52-week high:", error);
    throw error;
  }
};