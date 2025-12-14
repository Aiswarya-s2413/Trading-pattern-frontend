import { useState, useEffect } from "react";
import ChartContainer from "./components/ChartContainer";
import PatternForm from "./components/PatternForm";
import { type PatternData } from "./services/mockBackend";
import {
  fetch52WeekHigh,
  fetchPatternScanData,
} from "./services/patternService";
import { useMarketStore } from "./store/marketStore";
import { ScrollArea } from "./components/ui/scroll-area";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [week52High, setWeek52High] = useState<number | null | "unavailable">(
    null
  );

  const { currentSymbol, setPatternData } = useMarketStore();

  useEffect(() => {
    const load52WeekHigh = async () => {
      try {
        const data = await fetch52WeekHigh(currentSymbol);
        console.log("52-week high data:", data);
        setWeek52High(data["52week_high"] ?? "unavailable");
      } catch (error) {
        console.error("Failed to fetch 52-week high", error);
        setWeek52High("unavailable");
      }
    };

    if (currentSymbol) {
      load52WeekHigh();
    }
  }, [currentSymbol]);

  const handleAnalyze = async (data: PatternData) => {
    setIsLoading(true);
    try {
      // Call the real backend
      const response = await fetchPatternScanData(
        currentSymbol,
        data.pattern === "nrb" ? "Narrow Range Break" : "Bowl",
        null, // nrbLookback
        0, // successRate
        data.weeks,
        data.parameter, // series
        data.cooldownWeeks // cooldown_weeks (only used for NRB pattern)
      );

      console.log("Normalized Pattern Data:", response);

      // Update the store with all series data (including RSC EMA5 and EMA10)
      setPatternData(
        response.markers,
        response.price_data,
        response.series_data,
        response.series,
        "#2962FF", // Default overlay color
        response.series_data_ema5, // 🆕 RED LINE
        response.series_data_ema10 // 🆕 BLUE LINE
      );
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg px-2 py-3 flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
          Pattern Recognition Tool
        </h1>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[85vh]">
          <ChartContainer />
        </div>

        <ScrollArea className="h-full lg:h-[85vh]">
          <div className="flex flex-col gap-6">
            <PatternForm onAnalyze={handleAnalyze} isLoading={isLoading} />

            <div className="bg-dark-card p-4 rounded-lg shadow-lg border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">
                52 Week High ({currentSymbol})
              </div>
              <div className="text-2xl font-bold text-white">
                {week52High === "unavailable" ? (
                  <span className="text-slate-500 text-lg">Unavailable</span>
                ) : week52High !== null ? (
                  `₹${week52High.toLocaleString()}`
                ) : (
                  <span className="text-slate-500 text-lg">Loading...</span>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </main>

      <div className="fixed bottom-2 right-2 text-slate-400 text-sm">
        v0.0.3
      </div>
    </div>
  );
}

export default App;
