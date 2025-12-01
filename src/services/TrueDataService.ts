export interface OHLCVData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

/** Utility: Formats date to YYYY-MM-DD */
const formatDate = (date: Date): string => date.toISOString().split("T")[0];

/** Generates historical OHLCV mock data */
export const fetchTrueDataHistory = async (
    symbol: string,
    interval: "1D" | "1W"
): Promise<OHLCVData[]> => {

    console.log(`Generating mock data for ${symbol} @ ${interval}`);

    await new Promise(r => setTimeout(r, 300)); // simulate API delay

    const data: OHLCVData[] = [];
    let currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() - 1); // start 1 year ago

    let currentPrice = 15000; // Nifty-like price

    const isDaily = interval === "1D";
    const daysToStep = isDaily ? 1 : 7;

    const iterations = isDaily ? 365 : 52;

    for (let i = 0; i < iterations; i++) {
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
            time: formatDate(currentDate),
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
