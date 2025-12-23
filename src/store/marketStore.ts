import { create } from 'zustand';
import { fetchTrueDataHistory, type OHLCVData } from '../services/TrueDataService';
import type { Marker, SeriesPoint, PriceData, ConsolidationZone, NrbGroup } from '../services/patternService';

interface MarketState {
    currentSymbol: string;
    currentInterval: "1D" | "1W" | "1m";
    dataCache: Record<string, OHLCVData[]>; // Key: "symbol-interval"
    isLoading: boolean;
    error: string | null;

    // Pattern Mode State
    patternMode: boolean;
    patternMarkers: Marker[];
    patternPriceData: PriceData[] | null;
    overlaySeries: SeriesPoint[] | null;
    overlaySeriesName: string | null;
    overlayColor: string;
    
    overlaySeriesEma5: SeriesPoint[] | null;
    overlaySeriesEma10: SeriesPoint[] | null;

    totalConsolidationDurationWeeks: number | null;
    consolidationZones: ConsolidationZone[] | null;
    nrbGroups: NrbGroup[] | null; // 🆕 Added State

    setSymbol: (symbol: string) => void;
    setInterval: (interval: "1D" | "1W" | "1m") => void;
    loadData: () => Promise<void>;
    updateLiveCandle: (candle: OHLCVData) => void;

    // Pattern actions
    setPatternData: (
        markers: Marker[], 
        priceData: PriceData[], 
        series_data?: SeriesPoint[], 
        seriesName?: string | null, 
        overlayColor?: string,
        series_data_ema5?: SeriesPoint[],  
        series_data_ema10?: SeriesPoint[], 
        totalConsolidationDurationWeeks?: number | null, 
        consolidationZones?: ConsolidationZone[] | null,
        nrbGroups?: NrbGroup[] | null // 🆕 Added Argument
    ) => void;
    resetPatternMode: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
    currentSymbol: "TCS",
    currentInterval: "1D",
    dataCache: {},
    isLoading: false,
    error: null,

    patternMode: false,
    patternMarkers: [],
    patternPriceData: [],
    overlaySeries: null,
    overlaySeriesName: null,
    overlayColor: '#2962FF',
    overlaySeriesEma5: null,   
    overlaySeriesEma10: null,  
    totalConsolidationDurationWeeks: null,
    consolidationZones: null,
    nrbGroups: null, // 🆕 Initialize

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

        const lastIndex = currentData.length - 1;
        if (lastIndex >= 0) {
            const lastCandle = currentData[lastIndex];
            if (lastCandle.time === candle.time) {
                const newData = [...currentData];
                newData[lastIndex] = candle;
                set((state) => ({
                    dataCache: {
                        ...state.dataCache,
                        [cacheKey]: newData
                    }
                }));
            } else if (candle.time > lastCandle.time) {
                set((state) => ({
                    dataCache: {
                        ...state.dataCache,
                        [cacheKey]: [...currentData, candle]
                    }
                }));
            }
        }
    },

    setPatternData: (
        markers,
        priceData,
        seriesData = [],
        seriesName = null,
        overlayColor = "#2962FF",
        series_data_ema5 = [],   
        series_data_ema10 = [],  
        totalConsolidationDurationWeeks = null, 
        consolidationZones = null,
        nrbGroups = null // 🆕 Default to null
    ) => {
        set({
            patternMode: true,
            patternMarkers: markers,
            patternPriceData: priceData,
            overlaySeries: seriesData.length > 0 ? seriesData : null,
            overlaySeriesName: seriesName,
            overlayColor,
            overlaySeriesEma5: series_data_ema5.length > 0 ? series_data_ema5 : null,   
            overlaySeriesEma10: series_data_ema10.length > 0 ? series_data_ema10 : null, 
            totalConsolidationDurationWeeks,
            consolidationZones,
            nrbGroups, // 🆕 Set state
        });
    },

    resetPatternMode: () => {
        set({
            patternMode: false,
            patternMarkers: [],
            patternPriceData: [],
            overlaySeriesName: null, 
            overlaySeries: null,
            overlaySeriesEma5: null,   
            overlaySeriesEma10: null,  
            consolidationZones: null,
            nrbGroups: null, // 🆕 Reset
        });
    }
}));