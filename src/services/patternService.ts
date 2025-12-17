import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PriceData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

// Extra series point type for EMA/RSC line
export interface SeriesPoint {
  time: number;
  value: number;
}

export interface Marker {
  time: number; // Unix timestamp
  position: "aboveBar" | "belowBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string;
  pattern_id?: number;
  score?: number;

  // NRB RANGE-LINE FIELDS (OPTIONAL)
  range_low?: number | null;
  range_high?: number | null;
  range_start_time?: number | null;
  range_end_time?: number | null;
  nrb_id?: number | null;

  // Direction info for arrows
  direction?: "Bullish Break" | "Bearish Break" | string;
}

export interface PatternScanResponse {
  scrip: string;
  pattern: string;
  price_data: PriceData[];
  markers: Marker[];
  // 🆕 Total NRB regime duration (in weeks) when pattern is Narrow Range Break
  total_nrb_duration_weeks?: number | null;

  // Series info (for EMA/RSC)
  series?: string | null;
  series_data?: SeriesPoint[];
  series_data_ema5?: SeriesPoint[]; // 🆕 RED LINE
  series_data_ema10?: SeriesPoint[]; // 🆕 BLUE LINE
}

// Function to fetch pattern scan data from your backend
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

    if (nrbLookback !== null) {
      params.nrb_lookback = nrbLookback;
    }

    if (pattern === "Narrow Range Break" && weeks != null) {
      params.weeks = weeks;
    }

    // Only include cooldown_weeks parameter for Narrow Range Break pattern
    // Backend expects cooldown_weeks in weeks (no conversion needed)
    if (pattern === "Narrow Range Break" && cooldownWeeks != null) {
      params.cooldown_weeks = cooldownWeeks;
    }

    if (series) {
      params.series = series;
    }

    // Debug: Log the params being sent
    console.log("[API] Request params:", params);
    console.log("[API] Cooldown weeks value:", cooldownWeeks);

    const response = await axios.get<PatternScanResponse>(
      `${API_BASE_URL}/pattern-scan/`,
      { params }
    );

    console.log("[API] Raw response data:", response.data);
    console.log('[API] total_nrb_duration_weeks:', response.data.total_nrb_duration_weeks); // Add this
    console.log('[API] Response keys:', Object.keys(response.data));

    // Backward-compatible markers extraction
    let rawMarkers = response.data.markers;
    if (!rawMarkers && (response.data as any).triggers) {
      rawMarkers = (response.data as any).triggers;
      console.log("[API] Found markers in 'triggers' field");
    }
    if (!rawMarkers && Array.isArray(response.data)) {
      rawMarkers = response.data as any;
      console.log("[API] Response is array, treating as markers");
    }

    console.log("[API] Markers found:", rawMarkers);
    console.log("[API] Number of markers:", rawMarkers?.length || 0);

    const normalizedSeries = (response.data as any).series ?? series ?? null;
    const normalizedSeriesData: SeriesPoint[] =
      ((response.data as any).series_data as SeriesPoint[]) ?? [];
    const normalizedSeriesDataEma5: SeriesPoint[] = // 🆕
      ((response.data as any).series_data_ema5 as SeriesPoint[]) ?? [];
    const normalizedSeriesDataEma10: SeriesPoint[] = // 🆕
      ((response.data as any).series_data_ema10 as SeriesPoint[]) ?? [];

    const totalNrbDurationWeeks =
      (response.data as any).total_nrb_duration_weeks ??
      (response.data as any).debug?.total_nrb_duration_weeks ??
      null;

    // Normalize markers
    const normalizedData: PatternScanResponse = {
      scrip: response.data.scrip || scrip,
      pattern: response.data.pattern || pattern,
      price_data: response.data.price_data || [],
      markers: (rawMarkers || []).map((marker: any) => ({
        time: marker.time,
        pattern_id: marker.pattern_id,
        score: marker.score,
        position:
          (marker.position === "overlay" ? "aboveBar" : marker.position) ||
          "belowBar",
        color: marker.color || "#2196F3",
        shape: marker.shape || "circle",
        text: marker.text,
        range_low: marker.range_low ?? null,
        range_high: marker.range_high ?? null,
        range_start_time: marker.range_start_time ?? null,
        range_end_time: marker.range_end_time ?? null,
        nrb_id: marker.nrb_id ?? null,
        direction: marker.direction,
      })),

      total_nrb_duration_weeks: totalNrbDurationWeeks,

      series: normalizedSeries,
      series_data: normalizedSeriesData,
      series_data_ema5: normalizedSeriesDataEma5, // 🆕
      series_data_ema10: normalizedSeriesDataEma10, // 🆕
    };

    console.log(
      "[API] Normalized markers count:",
      normalizedData.markers.length
    );
    if (normalizedData.markers.length > 0) {
      console.log("[API] Sample normalized marker:", normalizedData.markers[0]);
    }
    console.log(
      "[API] Series:",
      normalizedData.series,
      "Points:",
      normalizedData.series_data?.length ?? 0,
      "EMA5:",
      normalizedData.series_data_ema5?.length ?? 0, // 🆕
      "EMA10:",
      normalizedData.series_data_ema10?.length ?? 0 // 🆕
    );

    return normalizedData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || "An unknown API error occurred"
      );
    }
    console.error("Network or other error:", error);
    throw new Error("Network or other error during API call");
  }
};

export interface Week52HighResponse {
  scrip: string;
  "52week_high": number | null;
  cutoff_date: string;
}

export const fetch52WeekHigh = async (
  scrip: string
): Promise<Week52HighResponse> => {
  try {
    const response = await axios.get<Week52HighResponse>(
      `${API_BASE_URL}/52week-high/`,
      { params: { scrip } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching 52-week high:", error);
    throw error;
  }
};
