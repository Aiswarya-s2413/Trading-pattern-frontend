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
  const [lastPattern, setLastPattern] = useState<"bowl" | "nrb">("bowl");
  const [selectedNrbGroupId, setSelectedNrbGroupId] = useState<number | null>(
    null
  );

  const { currentSymbol, setPatternData, patternMarkers, nrbGroups } = useMarketStore();

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
    setLastPattern(data.pattern as "bowl" | "nrb");

    // Reset NRB selection when switching away from NRB
    if (data.pattern !== "nrb") {
      setSelectedNrbGroupId(null);
    }

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
        response.series_data_ema10, // 🆕 BLUE LINE
        response.total_nrb_duration_weeks ?? null, // 🆕 Total NRB duration for chart overlay
        response.nrb_groups ?? null // 🆕 NRB groups from backend
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
          <ChartContainer selectedNrbGroupId={selectedNrbGroupId} />
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

            {lastPattern === "nrb" && (
              <div className="bg-dark-card p-4 rounded-lg shadow-lg border border-slate-700">
                {(() => {
                  // ✅ NEW WAY - Use backend nrb_groups directly
                  const backendGroups = nrbGroups || [];

                  // Transform to GroupInfo format
                  type GroupInfo = {
                    id: number;
                    durationWeeks: number | null;
                    startTime: number | null;
                    endTime: number | null;
                    nrbCount: number;
                    avgRangeHigh: number | null;
                  };

                  const groupInfoList = backendGroups
                    .filter((g) => g.num_nrbs > 1) // Only groups with >1 NRB
                    .map((g) => ({
                      id: g.group_id,
                      durationWeeks: g.duration_weeks, // Use backend value
                      startTime: g.start_time,
                      endTime: g.end_time,
                      nrbCount: g.num_nrbs,
                      avgRangeHigh: g.avg_range_high ?? null,
                    }))
                    .sort((a, b) => {
                      const da = a.durationWeeks ?? 0;
                      const db = b.durationWeeks ?? 0;
                      return db - da;
                    });

                  console.log("[NRB Groups] Using backend groups:", groupInfoList);

                  if (groupInfoList.length === 0) {
                    return (
                      <div className="text-slate-500 text-sm">
                        No NRB groups available for {currentSymbol}.
                      </div>
                    );
                  }

                  const groups = groupInfoList;

                  const formatDate = (timestamp: number | null) => {
                    if (!timestamp) return "-";
                    const d = new Date(timestamp * 1000);
                    return d.toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    });
                  };

                  const formatWeeks = (weeks: number | null) => {
                    if (weeks == null) return null;
                    // If it's a whole number, show without decimals
                    if (Number.isInteger(weeks)) {
                      return weeks.toString();
                    }
                    // Otherwise, show up to 2 decimal places
                    return weeks.toFixed(2);
                  };

                  const groupCount = groups.length;

                  return (
                    <>
                      <div className="mb-3">
                        <div className="text-slate-400 text-sm">
                          Distinct NRB Groups ({currentSymbol})
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {groupCount} distinct NRB group
                          {groupCount === 1 ? "" : "s"} found
                        </div>
                      </div>

                      <div className="space-y-2">
                        {groups.map((group, index) => {
                          const isSelected =
                            selectedNrbGroupId != null &&
                            selectedNrbGroupId === group.id;

                          return (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() =>
                                setSelectedNrbGroupId(
                                  isSelected ? null : group.id
                                )
                              }
                              className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                                isSelected
                                  ? "border-brand-primary bg-slate-800 text-white"
                                  : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium">
                                  Group {index + 1}
                                </div>
                                {group.durationWeeks != null && (
                                  <div className="text-brand-accent font-semibold">
                                    {formatWeeks(group.durationWeeks)} weeks
                                  </div>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                {formatDate(group.startTime)} -{" "}
                                {formatDate(group.endTime)}
                              </div>
                              {group.nrbCount > 0 && (
                                <div className="mt-1 text-xs text-slate-500">
                                  {group.nrbCount} NRB{group.nrbCount !== 1 ? "s" : ""}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
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
