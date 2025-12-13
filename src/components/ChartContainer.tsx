import { useEffect, type FC } from 'react';
import { LightweightChart } from './LightweightChart';
import { useMarketStore } from '../store/marketStore';
import { SymbolSearch } from './SymbolSearch';
import TradingViewChart from './pattern/TradingViewChart';
import { Trash } from 'lucide-react';
import clsx from 'clsx';

const ChartContainer: FC = () => {
    const {
        currentSymbol,
        currentInterval,
        dataCache,
        isLoading,
        setInterval,
        loadData,
        patternPriceData: priceData,
        patternMarkers: markers,
        overlaySeries: seriesData,
        overlaySeriesName: seriesName,
        overlaySeriesEma5: seriesDataEma5,      // 🆕
        overlaySeriesEma10: seriesDataEma10,    // 🆕
        patternMode,
        resetPatternMode,
    } = useMarketStore();

    const data = dataCache[`${currentSymbol}-${currentInterval}`] || [];
    const lastCandle = data.length > 0 ? data[data.length - 1] : null;

    // Load initial data when symbol or interval changes
    useEffect(() => {
        loadData();
    }, [currentSymbol, currentInterval, loadData]);

    return (
        <div className="h-full w-full bg-dark-card rounded-lg shadow-lg overflow-hidden border border-slate-700 relative flex flex-col">
            <div className="flex items-center gap-4 p-2 border-b border-slate-700 bg-dark-bg">
                <SymbolSearch />

                <div className="h-4 w-px bg-slate-700 mx-2" />

                <span className="text-slate-400 text-sm font-medium px-2">Timeframe:</span>
                {(['1D', '1W'] as const).map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setInterval(tf)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                            currentInterval === tf
                                ? 'bg-brand-primary text-white'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                    >
                        {tf}
                    </button>
                ))}
                
                <button 
                    disabled={!patternMode} 
                    className={clsx(
                        "text-slate-400 cursor-not-allowed opacity-50", 
                        patternMode && "cursor-pointer hover:text-slate-200 hover:bg-slate-800"
                    )} 
                    onClick={resetPatternMode}
                >
                    <Trash className="h-4 w-4" />
                </button>

                {lastCandle && (
                    <div className="ml-auto flex gap-4 text-xs font-mono text-slate-300 px-2">
                        <span>O: {lastCandle.open.toFixed(2)}</span>
                        <span>H: {lastCandle.high.toFixed(2)}</span>
                        <span>L: {lastCandle.low.toFixed(2)}</span>
                        <span>C: {lastCandle.close.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {!patternMode && (
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
            )}

            {patternMode && (
                <div className="flex-1 relative">
                    <TradingViewChart
                        priceData={priceData || []}
                        markers={markers}
                        chartTitle={currentSymbol}
                        parameterSeriesName={seriesName}
                        parameterSeriesData={seriesData || []}
                        parameterSeriesDataEma5={seriesDataEma5 || []}    // 🆕
                        parameterSeriesDataEma10={seriesDataEma10 || []}  // 🆕
                    /> 
                </div>
            )}
        </div>
    );
};

export default ChartContainer;