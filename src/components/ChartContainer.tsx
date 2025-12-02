import { useEffect, type FC } from 'react';
import { LightweightChart } from './LightweightChart';
// import { subscribeToLiveData } from '../services/TrueDataService';
import { useMarketStore } from '../store/marketStore';
import { StockSelector } from './StockSelector';

const ChartContainer: FC = () => {
    const {
        currentSymbol,
        currentInterval,
        dataCache,
        isLoading,
        setInterval,
        loadData,
        // updateLiveCandle
    } = useMarketStore();

    const data = dataCache[`${currentSymbol}-${currentInterval}`] || [];
    const lastCandle = data.length > 0 ? data[data.length - 1] : null;

    // Load initial data when symbol or interval changes
    useEffect(() => {
        loadData();
    }, [currentSymbol, currentInterval, loadData]);

    // Subscribe to live data
    // Subscribe to live data
    // useEffect(() => {
    //     const unsubscribe = subscribeToLiveData(currentSymbol, currentInterval, (candle) => {
    //         updateLiveCandle(candle);
    //     });

    //     return () => {
    //         unsubscribe();
    //     };
    // }, [currentSymbol, currentInterval, updateLiveCandle]);

    return (
        <div className="h-full w-full bg-dark-card rounded-lg shadow-lg overflow-hidden border border-slate-700 relative flex flex-col">
            <div className="flex items-center gap-4 p-2 border-b border-slate-700 bg-dark-bg">
                <StockSelector />

                <div className="h-4 w-px bg-slate-700 mx-2" />

                <span className="text-slate-400 text-sm font-medium px-2">Timeframe:</span>
                {(['1m', '1D', '1W'] as const).map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setInterval(tf)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${currentInterval === tf
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
                {isLoading && data.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        Loading Chart Data...
                    </div>
                ) : (
                    <LightweightChart
                        key={`${currentSymbol}-${currentInterval}`}
                        data={data}
                        lastCandle={lastCandle}
                    />
                )}
            </div>
        </div>
    );
};

export default ChartContainer;
