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
    interval: "1D" | "1W"
): Promise<OHLCVData[]> => {

    console.log(`Generating mock data for ${symbol} @ ${interval}`);

    await new Promise(r => setTimeout(r, 300)); // simulate API delay

    const data: OHLCVData[] = [];

    // Start from 2 days ago at midnight UTC to ensure we never overlap with today's live candle
    let currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC
    currentDate.setDate(currentDate.getDate() - 2); // Start from 2 days ago
    currentDate.setFullYear(currentDate.getFullYear() - 1); // Go back 1 year from that point

    let currentPrice = 15000; // Nifty-like price

    const isDaily = interval === "1D";
    const daysToStep = isDaily ? 1 : 7;

    const iterations = isDaily ? 365 : 52;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < iterations; i++) {
        // Stop if we've reached today (live data handles today)
        if (currentDate.getTime() >= today.getTime()) break;

        // Skip weekends for daily data
        if (isDaily) {
            const day = currentDate.getDay();
            if (day === 0) currentDate.setDate(currentDate.getDate() + 1); // Sunday -> Monday
            else if (day === 6) currentDate.setDate(currentDate.getDate() + 2); // Saturday -> Monday
        }

        const volatility = isDaily ? 100 : 300; // Higher volatility for weekly
        const change = (Math.random() - 0.5) * volatility;

        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);
        const volume = Math.floor(Math.random() * 1_000_000) + 500_000;

        data.push({
            time: Math.floor(currentDate.getTime() / 1000), // Unix timestamp in seconds
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume
        });

        currentPrice = close;
        currentDate.setDate(currentDate.getDate() + daysToStep);
    }

    return data;
};

export type CandleCallback = (candle: OHLCVData) => void;

export const subscribeToLiveData = (
    symbol: string,
    interval: "1D" | "1W",
    onUpdate: CandleCallback
) => {
    console.log(`Live mock feed started for ${symbol} @ ${interval}`);

    // Create a candle for "today" (or current period)
    let candle = createNewCandle();

    const tickInterval = setInterval(() => {
        const tickChange = (Math.random() - 0.5) * 0.5;
        const newClose = candle.close + tickChange;

        candle.high = Math.max(candle.high, newClose);
        candle.low = Math.min(candle.low, newClose);
        candle.close = parseFloat(newClose.toFixed(2));
        candle.volume = (candle.volume || 0) + Math.floor(Math.random() * 100);

        // Emit a COPY of the candle
        onUpdate({ ...candle });
    }, 200); // Fast updates for demo purposes

    return () => clearInterval(tickInterval); // unsubscribe
};

const createNewCandle = (): OHLCVData => {
    const base = 15000; // Match the Nifty-like price from history
    const open = base + (Math.random() - 0.5) * 50;

    // Set time to start of today (midnight UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const time = Math.floor(today.getTime() / 1000); // Unix timestamp in seconds

    return {
        time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(open.toFixed(2)),
        low: parseFloat(open.toFixed(2)),
        close: parseFloat(open.toFixed(2)),
        volume: 0
    };
};
