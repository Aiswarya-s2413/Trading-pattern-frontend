import axios from "axios";

// const API_BASE_URL = "http://localhost:8000/api"; 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Define interfaces for data structure received from the backend
export interface PriceData {
    time: number; // Unix timestamp
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface Marker {
    time: number; // Unix timestamp
    position?: "aboveBar" | "belowBar" | "inBar"; // Optional - backend may not send this
    color?: string; // Optional - backend may not send this
    shape?: "arrowUp" | "arrowDown" | "circle" | "square"; // Optional - backend may not send this
    text?: string;
    pattern_id?: number; // Used for grouping bowl patterns
    score?: number; // Success score from backend
}

export interface PatternScanResponse {
    scrip: string;
    pattern: string;
    price_data: PriceData[];
    markers: Marker[];
}

// Function to fetch pattern scan data from your backend
export const fetchPatternScanData = async (
    scrip: string,
    pattern: string,
    nrbLookback: number | null, // Can be null if not applicable to the pattern
    successRate: number,
    weeks?: number
): Promise<PatternScanResponse> => {
    try {
        const params: any = {
            scrip,
            pattern,
            success_rate: successRate,
        };
        console.log("[API] Fetching data with params:", params);

        if (nrbLookback !== null) {
            params.nrb_lookback = nrbLookback;
        }

        if (pattern === "Narrow Range Break" && weeks != null) {
            params.weeks = weeks;
        }

        // Handle "Bowl" pattern specific logic if needed, or generic
        // The user mentioned "pattern is bowl or narrow range"

        const response = await axios.get<PatternScanResponse>(
            `${API_BASE_URL}/pattern-scan/`,
            { params }
        );

        // Debug: Log the raw response to see what backend is sending
        console.log("[API] Raw response data:", response.data);

        // Check for markers in various possible locations
        let rawMarkers = response.data.markers;
        if (!rawMarkers && (response.data as any).triggers) {
            // Backend might return triggers instead of markers
            rawMarkers = (response.data as any).triggers;
            console.log("[API] Found markers in 'triggers' field");
        }
        if (!rawMarkers && Array.isArray(response.data)) {
            // Backend might return markers as root array
            rawMarkers = response.data;
            console.log("[API] Response is array, treating as markers");
        }

        // Normalize markers - ensure they have the required structure
        const normalizedData: PatternScanResponse = {
            scrip: response.data.scrip || "",
            pattern: response.data.pattern || pattern,
            price_data: response.data.price_data || [],
            markers: (rawMarkers || []).map((marker: any) => ({
                time: marker.time,
                pattern_id: marker.pattern_id,
                score: marker.score,
                // Optional fields with defaults
                position: marker.position || "belowBar",
                color: marker.color || "#2196F3",
                shape: marker.shape || "circle",
                text: marker.text,
            })),
        };

        return normalizedData;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Access the error response from the backend
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

export const fetch52WeekHigh = async (scrip: string): Promise<Week52HighResponse> => {
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
