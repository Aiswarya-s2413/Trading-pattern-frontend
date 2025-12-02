export interface OHLCVData {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

/** Generates historical OHLCV mock data */
export const fetchTrueDataHistory = async (
    symbol: string,
    interval: "1D" | "1W" | "1m"
): Promise<OHLCVData[]> => {

    console.log(`Generating mock data for ${symbol} @ ${interval}`);

    if (symbol === "RELIANCE" && interval === "1D") {
        try {
            return await fetchRelianceData();
        } catch (error) {
            console.error("Failed to fetch real data, falling back to mock", error);
        }
    }

    await new Promise(r => setTimeout(r, 300)); // simulate API delay

    const data: OHLCVData[] = [];

    // Start from 2 days ago at midnight UTC to ensure we never overlap with today's live candle
    let currentDate = new Date();

    let currentPrice = 15000; // Nifty-like price

    const isDaily = interval === "1D";
    const isMinute = interval === "1m";

    // For minute data, we want more points (e.g., last 24 hours = 1440 points)
    // For daily/weekly, we use the existing logic
    const iterations = isMinute ? 1440 : (isDaily ? 365 : 52);

    const today = new Date();
    // For 1D/1W, normalize to midnight. For 1m, we want up to the current minute.
    if (!isMinute) {
        today.setUTCHours(0, 0, 0, 0);
    } else {
        today.setSeconds(0, 0);
    }

    // Adjust start date based on interval
    if (isMinute) {
        // Start 24 hours ago
        currentDate = new Date(today.getTime() - (iterations * 60 * 1000));
    } else {
        // Existing logic for 1D/1W
        currentDate = new Date(today);
        currentDate.setUTCHours(0, 0, 0, 0);
        currentDate.setDate(currentDate.getDate() - 2);
        currentDate.setFullYear(currentDate.getFullYear() - 1);
    }

    // Reset price for minute data to be realistic
    if (isMinute) currentPrice = 15000;

    const daysToStep = isDaily ? 1 : 7;

    for (let i = 0; i < iterations; i++) {
        // Stop if we've reached the cutoff time
        if (currentDate.getTime() >= today.getTime()) break;

        // Skip weekends for daily data (not needed for minute data in this simple mock)
        if (isDaily) {
            const day = currentDate.getDay();
            if (day === 0) currentDate.setDate(currentDate.getDate() + 1);
            else if (day === 6) currentDate.setDate(currentDate.getDate() + 2);
        }

        const volatility = isMinute ? 5 : (isDaily ? 100 : 300);
        const change = (Math.random() - 0.5) * volatility;

        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);
        const volume = Math.floor(Math.random() * (isMinute ? 1000 : 1_000_000)) + (isMinute ? 500 : 500_000);

        data.push({
            time: Math.floor(currentDate.getTime() / 1000),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume
        });

        currentPrice = close;

        // Advance time
        if (isMinute) {
            currentDate.setTime(currentDate.getTime() + 60 * 1000);
        } else {
            currentDate.setDate(currentDate.getDate() + daysToStep);
        }
    }

    return data;
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

const fetchRelianceData = async (): Promise<OHLCVData[]> => {
    const response = await fetch('https://trading.aiswaryasathyan.space/api/price-history/?scrip=RELIANCE.NS&years=10');
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    const json = await response.json();

    // Map API response to OHLCVData
    // API format: { time: number, open: number, high: number, low: number, close: number }
    // Our format: same
    return json.price_data.map((item: any) => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: 0 // API doesn't seem to return volume in the snippet, defaulting to 0
    }));
};
