import { useEffect, useState, type FC } from 'react';
import { LightweightChart } from './LightweightChart';
import { fetchTrueDataHistory, subscribeToLiveData, type OHLCVData } from '../services/TrueDataService';

const ChartContainer: FC = () => {
    const [data, setData] = useState<OHLCVData[]>([]);
    const [lastCandle, setLastCandle] = useState<OHLCVData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [interval, setInterval] = useState<"1D" | "1W">("1D");

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const loadData = async () => {
            setIsLoading(true);
            setLastCandle(null); // Reset live candle on interval change
            try {
                const history = await fetchTrueDataHistory('NIFTY 50', interval);
                setData(history);

                // Start live feed after history is loaded
                unsubscribe = subscribeToLiveData('NIFTY 50', interval, (candle) => {
                    setLastCandle(candle);
                });

            } catch (error) {
                console.error("Failed to load chart data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [interval]);

    return (
        <div className="h-full w-full bg-dark-card rounded-lg shadow-lg overflow-hidden border border-slate-700 relative flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b border-slate-700 bg-dark-bg">
                <span className="text-slate-400 text-sm font-medium px-2">Timeframe:</span>
                {(['1D', '1W'] as const).map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setInterval(tf)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${interval === tf
                                ? 'bg-brand-primary text-white'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                    >
                        {tf}
                    </button>
                ))}
                {lastCandle && (
                    <div className="ml-auto flex gap-4 text-xs font-mono text-slate-300 px-2">
                        <span>O: {lastCandle.open.toFixed(2)}</span>
                        <span>H: {lastCandle.high.toFixed(2)}</span>
                        <span>L: {lastCandle.low.toFixed(2)}</span>
                        <span>C: {lastCandle.close.toFixed(2)}</span>
                    </div>
                )}
            </div>
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        Loading Chart Data...
                    </div>
                ) : (
                    <LightweightChart data={data} lastCandle={lastCandle} />
                )}
            </div>
        </div>
    );
};

export default ChartContainer;
