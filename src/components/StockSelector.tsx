import type { FC } from 'react';
import { useMarketStore } from '../store/marketStore';

const STOCKS = [
    // "NIFTY 50", 
    // "BANKNIFTY", 
    "RELIANCE",
    // "TCS", 
    // "INFY"
];

export const StockSelector: FC = () => {
    const { currentSymbol, setSymbol } = useMarketStore();

    return (
        <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-medium">Symbol:</span>
            <select
                value={currentSymbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-dark-bg text-slate-200 text-sm border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-brand-primary"
            >
                {STOCKS.map((stock) => (
                    <option key={stock} value={stock}>
                        {stock}
                    </option>
                ))}
            </select>
        </div>
    );
};
