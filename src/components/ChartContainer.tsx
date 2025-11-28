import { useEffect, useRef, type FC } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

const ChartContainer: FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (containerRef.current && window.TradingView) {
                new window.TradingView.widget({
                    autosize: true,
                    symbol: "NASDAQ:AAPL",
                    interval: "D",
                    timezone: "Etc/UTC",
                    theme: "dark",
                    style: "1",
                    locale: "en",
                    toolbar_bg: "#f1f3f6",
                    enable_publishing: false,
                    allow_symbol_change: true,
                    container_id: containerRef.current.id,
                });
            }
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script if needed
        };
    }, []);

    return (
        <div className="h-full w-full bg-dark-card rounded-lg shadow-lg overflow-hidden border border-slate-700">
            <div id="tradingview_widget" ref={containerRef} className="h-full w-full" />
        </div>
    );
};

export default ChartContainer;
