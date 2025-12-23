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
  const [showConsolidationZones, setShowConsolidationZones] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const { currentSymbol, setPatternData, consolidationZones } = useMarketStore();

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
    setHasAnalyzed(false); // Reset on new analysis

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
        response.total_consolidation_duration_weeks ?? null, // 🆕 Total consolidation duration for chart overlay
        response.consolidation_zones ?? null // 🆕 Consolidation zones from backend
      );
      
      setHasAnalyzed(true); // Mark as analyzed after successful response
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
            <PatternForm 
              onAnalyze={handleAnalyze} 
              isLoading={isLoading}
              showConsolidationZones={showConsolidationZones}
              onToggleConsolidationZones={setShowConsolidationZones}
            />

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

            {lastPattern === "nrb" && showConsolidationZones && hasAnalyzed && (
              <div className="bg-dark-card p-4 rounded-lg shadow-lg border border-slate-700">
                {(() => {
                  // ✅ NEW WAY - Use backend consolidation_zones directly
                  const backendZones = consolidationZones || [];

                  const zoneInfoList = backendZones
                    .filter((z) => z.num_nrbs > 0) // Only zones with NRBs
                    .map((z) => ({
                      id: z.zone_id,
                      durationWeeks: z.duration_weeks,
                      startTime: z.start_time,
                      endTime: z.end_time,
                      minValue: z.min_value,
                      maxValue: z.max_value,
                      avgValue: z.avg_value,
                      rangePct: z.range_pct,
                      nrbCount: z.num_nrbs,
                      successRate3m: z.success_rate_3m,
                      successRate6m: z.success_rate_6m,
                      successRate12m: z.success_rate_12m,
                    }))
                    .sort((a, b) => {
                      const da = a.durationWeeks ?? 0;
                      const db = b.durationWeeks ?? 0;
                      return db - da;
                    });

                  console.log("[Consolidation Zones] Using backend zones:", zoneInfoList);

                  if (zoneInfoList.length === 0) {
                    return (
                      <div className="text-slate-500 text-sm">
                        No consolidation zones available for {currentSymbol}.
                      </div>
                    );
                  }

                  const zones = zoneInfoList;

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

                  const formatSuccessRate = (rate: number | null | undefined) => {
                    if (rate == null) return "N/A";
                    const color = rate >= 0 ? "text-green-400" : "text-red-400";
                    const sign = rate >= 0 ? "+" : "";
                    return (
                      <span className={color}>
                        {sign}{rate.toFixed(1)}%
                      </span>
                    );
                  };

                  const zoneCount = zones.length;

                  return (
                    <>
                      <div className="mb-3">
                        <div className="text-slate-400 text-sm">
                          Consolidation Zones ({currentSymbol})
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {zoneCount} consolidation zone
                          {zoneCount === 1 ? "" : "s"} found
                        </div>
                      </div>

                      <div className="space-y-2">
                        {zones.map((zone, index) => {
                          const isSelected =
                            selectedNrbGroupId != null &&
                            selectedNrbGroupId === zone.id;

                          return (
                            <button
                              key={zone.id}
                              type="button"
                              onClick={() =>
                                setSelectedNrbGroupId(
                                  isSelected ? null : zone.id
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
                                  Zone {index + 1}
                                </div>
                                {zone.durationWeeks != null && (
                                  <div className="text-brand-accent font-semibold">
                                    {formatWeeks(zone.durationWeeks)} weeks
                                  </div>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                {formatDate(zone.startTime)} -{" "}
                                {formatDate(zone.endTime)}
                              </div>
                              
                              {zone.nrbCount > 0 && (
                                <div className="mt-1 text-xs text-slate-500">
                                  {zone.nrbCount} NRB{zone.nrbCount !== 1 ? "s" : ""}
                                </div>
                              )}

                              {/* Success Rates Display */}
                              <div className="mt-2 pt-2 border-t border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">
                                  Success Rates:
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <div className="text-slate-500">3M</div>
                                    <div className="font-semibold">
                                      {formatSuccessRate(zone.successRate3m)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500">6M</div>
                                    <div className="font-semibold">
                                      {formatSuccessRate(zone.successRate6m)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500">12M</div>
                                    <div className="font-semibold">
                                      {formatSuccessRate(zone.successRate12m)}
                                    </div>
                                  </div>
                                </div>
                              </div>
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