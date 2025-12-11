import { aggregateDailyToWeekly } from '../utils/dataUtils';

export interface OHLCVData {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

/** Generates historical OHLCV mock data */
/** Fetches historical OHLCV data from the API */
export const fetchTrueDataHistory = async (
    symbol: string,
    interval: "1D" | "1W" | "1m"
): Promise<OHLCVData[]> => {
    console.log(`Fetching real data for ${symbol} @ ${interval}`);

    try {
        const dailyData = await fetchPriceHistory(symbol);

        if (interval === "1W") {
            return aggregateDailyToWeekly(dailyData);
        }

        // Return daily data for 1D (and 1m for now if API only supports daily, 
        // though typically 1m would need a different endpoint or parameter)
        // Since the prompt purely requested using that specific endpoint which returns daily data usually,
        // we'll return what we get.
        return dailyData;

    } catch (error) {
        console.error(`Failed to fetch real data for ${symbol}`, error);
        throw error; // Re-throw to let the caller handle it (e.g. show error state)
    }
};

export type CandleCallback = (candle: OHLCVData) => void;

// export const subscribeToLiveData = (
//     symbol: string,
//     interval: "1D" | "1W" | "1m",
//     onUpdate: CandleCallback
// ) => {
//     console.log(`Live mock feed started for ${symbol} @ ${interval}`);

//     let candle = createNewCandle(interval);

//     const tickInterval = setInterval(() => {
//         const now = new Date();

//         // Check for rollover
//         let shouldRollover = false;
//         if (interval === "1m") {
//             // If current candle time is not in the same minute as now
//             const candleTime = new Date(candle.time * 1000);
//             shouldRollover = now.getMinutes() !== candleTime.getMinutes();
//         } else if (interval === "1D") {
//             const candleTime = new Date(candle.time * 1000);
//             shouldRollover = now.getUTCDate() !== candleTime.getUTCDate();
//         }

//         if (shouldRollover) {
//             // Start a new candle
//             const close = candle.close;
//             candle = {
//                 time: interval === "1m" ? Math.floor(now.setSeconds(0, 0) / 1000) : Math.floor(now.setUTCHours(0, 0, 0, 0) / 1000),
//                 open: close,
//                 high: close,
//                 low: close,
//                 close: close,
//                 volume: 0
//             };
//         }

//         const tickChange = (Math.random() - 0.5) * (interval === "1m" ? 0.2 : 0.5);
//         const newClose = candle.close + tickChange;

//         candle.high = Math.max(candle.high, newClose);
//         candle.low = Math.min(candle.low, newClose);
//         candle.close = parseFloat(newClose.toFixed(2));
//         candle.volume = (candle.volume || 0) + Math.floor(Math.random() * (interval === "1m" ? 10 : 100));

//         // Emit a COPY of the candle
//         onUpdate({ ...candle });
//     }, 200);

//     return () => clearInterval(tickInterval);
// };

// const createNewCandle = (interval: "1D" | "1W" | "1m"): OHLCVData => {
//     const base = 15000;
//     const open = base + (Math.random() - 0.5) * 50;

//     const now = new Date();
//     let time = 0;

//     if (interval === "1m") {
//         time = Math.floor(now.setSeconds(0, 0) / 1000);
//     } else {
//         time = Math.floor(now.setUTCHours(0, 0, 0, 0) / 1000);
//     }

//     return {
//         time,
//         open: parseFloat(open.toFixed(2)),
//         high: parseFloat(open.toFixed(2)),
//         low: parseFloat(open.toFixed(2)),
//         close: parseFloat(open.toFixed(2)),
//         volume: 0
//     };
// };

const fetchPriceHistory = async (symbol: string): Promise<OHLCVData[]> => {
    // const response = await fetch(`https://trading.aiswaryasathyan.space/api/price-history/?scrip=${symbol}.NS&years=10`);
    const response = await fetch(`http://127.0.0.1:8000/api/price-history/?scrip=${symbol}`);

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    const json = await response.json();

    // Map API response to OHLCVData
    // API format: { scrip: string, price_data: [{ time: number, open: number, high: number, low: number, close: number }, ...] }

    if (!json.price_data || !Array.isArray(json.price_data)) {
        throw new Error("Invalid API response format: price_data missing or not an array");
    }

    const data: OHLCVData[] = json.price_data.map((item: any) => ({
        // Backend returns timestamp for 00:00 IST, which is 18:30 UTC previous day.
        // We add 19800 seconds (5.5 hours) to align it to 00:00 UTC of the Trade Date.
        time: item.time + 19800,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: 0
    }));

    // Ensure data is sorted by time ascending
    data.sort((a, b) => a.time - b.time);

    return data;
};
