import { create } from 'zustand';
import { fetchTrueDataHistory, type OHLCVData } from '../services/TrueDataService';

interface MarketState {
    currentSymbol: string;
    currentInterval: "1D" | "1W" | "1m";
    dataCache: Record<string, OHLCVData[]>; // Key: "symbol-interval"
    isLoading: boolean;
    error: string | null;

    setSymbol: (symbol: string) => void;
    setInterval: (interval: "1D" | "1W" | "1m") => void;
    loadData: () => Promise<void>;
    updateLiveCandle: (candle: OHLCVData) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
    currentSymbol: "SENSEX",
    currentInterval: "1D",
    dataCache: {},
    isLoading: false,
    error: null,

    setSymbol: (symbol) => {
        set({ currentSymbol: symbol });
        get().loadData();
    },

    setInterval: (interval) => {
        set({ currentInterval: interval });
        get().loadData();
    },

    loadData: async () => {
        const { currentSymbol, currentInterval, dataCache } = get();
        const cacheKey = `${currentSymbol}-${currentInterval}`;

        // If data is already in cache, don't fetch (or maybe just set loading false if we want to re-verify?)
        // For now, let's assume cache is valid for the session to avoid refetching on tab switch
        if (dataCache[cacheKey]) {
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const data = await fetchTrueDataHistory(currentSymbol, currentInterval);
            set((state) => ({
                dataCache: {
                    ...state.dataCache,
                    [cacheKey]: data
                },
                isLoading: false
            }));
        } catch (error) {
            console.error("Failed to load data", error);
            set({ isLoading: false, error: "Failed to load data" });
        }
    },

    updateLiveCandle: (candle) => {
        const { currentSymbol, currentInterval, dataCache } = get();
        const cacheKey = `${currentSymbol}-${currentInterval}`;
        const currentData = dataCache[cacheKey] || [];

        // We don't want to mutate the cache directly in a way that triggers full re-renders of everything if not needed,
        // but for lightweight charts we usually pass the full array or update via API.
        // Here we just update the cache so if we switch away and back, we have the latest.

        // Check if the last candle in data matches the live candle's time
        const lastIndex = currentData.length - 1;
        if (lastIndex >= 0) {
            const lastCandle = currentData[lastIndex];
            if (lastCandle.time === candle.time) {
                // Update existing candle
                const newData = [...currentData];
                newData[lastIndex] = candle;
                set((state) => ({
                    dataCache: {
                        ...state.dataCache,
                        [cacheKey]: newData
                    }
                }));
            } else if (candle.time > lastCandle.time) {
                // New candle
                set((state) => ({
                    dataCache: {
                        ...state.dataCache,
                        [cacheKey]: [...currentData, candle]
                    }
                }));
            }
        }
    }
}));
