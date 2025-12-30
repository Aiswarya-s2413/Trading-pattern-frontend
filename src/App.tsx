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
  const [selectedNrbLevelId, setSelectedNrbLevelId] = useState<number | null>(
    null
  );
  
  const [showConsolidationZones, setShowConsolidationZones] = useState(false);
  const [showSingleLevelNrbs, setShowSingleLevelNrbs] = useState(false);

  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const { currentSymbol, setPatternData, consolidationZones, nrbGroups } = useMarketStore();

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
    setHasAnalyzed(false);

    if (data.pattern !== "nrb") {
      setSelectedNrbGroupId(null);
      setSelectedNrbLevelId(null);
    }

    try {
      const response = await fetchPatternScanData(
        currentSymbol,
        data.pattern === "nrb" ? "Narrow Range Break" : "Bowl",
        null, 
        0, 
        data.weeks,
        data.parameter, 
        data.cooldownWeeks 
      );

      console.log("Normalized Pattern Data:", response);

      setPatternData(
        response.markers,
        response.price_data,
        response.series_data,
        response.series,
        "#2962FF", 
        response.series_data_ema5, 
        response.series_data_ema10, 
        response.total_consolidation_duration_weeks ?? null, 
        response.consolidation_zones ?? null,
        response.nrb_groups ?? null 
      );
      
      setHasAnalyzed(true);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return "-";
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  };

  const formatWeeks = (weeks: number | null | undefined) => {
    if (weeks == null) return null;
    if (Number.isInteger(weeks)) return weeks.toString();
    return weeks.toFixed(1);
  };

  const formatLevel = (val: number | null | undefined) => {
    if (val == null) return "-";
    return Math.abs(val) < 5 ? val.toFixed(5) : val.toFixed(2);
  };

  const formatSuccessRate = (rate: number | null | undefined) => {
    if (rate == null) return <span className="text-slate-600">-</span>;
    const color = rate >= 0 ? "text-green-400" : "text-red-400";
    const sign = rate >= 0 ? "+" : "";
    return <span className={color}>{sign}{rate.toFixed(1)}%</span>;
  };

  // Existing Clusters (> 1 NRB)
  const nrbClusters = nrbGroups ? nrbGroups.filter(g => (g.group_nrb_count || 0) > 1) : [];
  
  // Captures ANY level > 24 weeks (regardless of NRB count)
  const nrbSingles = nrbGroups ? nrbGroups.filter(g => (g.group_duration_weeks || 0) > 24) : [];

  const renderGroupCard = (group: any, isSelected: boolean) => {
    let countAbove98 = 0;
    let count95to98 = 0;
    let count90to95 = 0;

    if (group.near_touches) {
      group.near_touches.forEach((t: any) => {
        // 🆕 CHANGE 1: Use min_diff_pct (Closest point of the attempt)
        const diff = t.min_diff_pct; 
        
        // 🆕 CHANGE 2: Count Attempts (Increment by 1, NOT t.count)
        if (diff < 2.0) {
          countAbove98 += 1;
        } else if (diff < 5.0) {
          count95to98 += 1;
        } else if (diff < 10.0) {
          count90to95 += 1;
        }
      });
    }

    // Determine color: Cyan if it's a Long Level, Yellow if it's just a Cluster
    const isLevel = (group.group_duration_weeks || 0) > 24;

    return (
      <button
        key={group.group_id}
        type="button"
        onClick={() => setSelectedNrbLevelId(isSelected ? null : group.group_id)}
        className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
          isSelected
            ? "border-yellow-500 bg-slate-800 text-white"
            : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className={`font-medium ${isLevel ? "text-cyan-400" : "text-yellow-400"}`}>
            Level: {formatLevel(group.group_level)}
          </div>
          {group.group_duration_weeks != null && (
            <div className="text-slate-300 font-semibold text-xs bg-slate-800 px-2 py-0.5 rounded">
              {formatWeeks(group.group_duration_weeks)} wks
            </div>
          )}
        </div>
        
        <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{formatDate(group.group_start_time)} - {formatDate(group.group_end_time)}</span>
            <span>{group.group_nrb_count} NRB{group.group_nrb_count > 1 ? 's' : ''}</span>
        </div>

        {/* 🆕 CHANGE 3: Removed 'd' suffix from counts */}
        <div className="flex gap-2 mb-2 text-[10px] text-slate-300 flex-wrap">
            <span className="bg-green-900/50 px-1.5 py-0.5 rounded border border-green-800/50" title="Attempts >98% Close">
              &gt;98%: <span className="text-white font-bold">{countAbove98}</span>
            </span>
            <span className="bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-800/50" title="Attempts 95% - 98% Close">
              95-98%: <span className="text-white font-bold">{count95to98}</span>
            </span>
            <span className="bg-orange-900/50 px-1.5 py-0.5 rounded border border-orange-800/50" title="Attempts 90% - 95% Close">
              90-95%: <span className="text-white font-bold">{count90to95}</span>
            </span>
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">3 Mon</div>
              <div className="font-semibold mt-0.5">
                {formatSuccessRate(group.success_rate_3m)}
              </div>
            </div>
            <div className="border-x border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase">6 Mon</div>
              <div className="font-semibold mt-0.5">
                {formatSuccessRate(group.success_rate_6m)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">12 Mon</div>
              <div className="font-semibold mt-0.5">
                {formatSuccessRate(group.success_rate_12m)}
              </div>
            </div>
          </div>
        </div>
      </button>
    );
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
          <ChartContainer 
            selectedNrbGroupId={selectedNrbGroupId} 
            showConsolidationZones={showConsolidationZones}
            showSingleLevelNrbs={showSingleLevelNrbs}
          />
        </div>

        <ScrollArea className="h-full lg:h-[85vh]">
          <div className="flex flex-col gap-6">
            <PatternForm 
              onAnalyze={handleAnalyze} 
              isLoading={isLoading}
              showConsolidationZones={showConsolidationZones}
              onToggleConsolidationZones={setShowConsolidationZones}
            />

            {/* Extended Level Toggle */}
            {lastPattern === "nrb" && hasAnalyzed && (
              <div className="flex items-center justify-between bg-dark-card p-3 rounded-lg border border-slate-700">
                <span className="text-sm text-slate-300 font-medium">Show Historical Levels</span>
                <input 
                  type="checkbox" 
                  checked={showSingleLevelNrbs} 
                  onChange={(e) => setShowSingleLevelNrbs(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500 focus:ring-1"
                />
              </div>
            )}

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

            {/* Clusters (>1 NRB) */}
            {lastPattern === "nrb" && hasAnalyzed && nrbClusters.length > 0 && (
              <div className="bg-dark-card p-4 rounded-lg shadow-lg border border-slate-700">
                <div className="mb-3">
                  <div className="text-slate-400 text-sm">
                    Same Level NRB Groups ({currentSymbol})
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {nrbClusters.length} Level{nrbClusters.length === 1 ? "" : "s"} found
                  </div>
                </div>
                <div className="space-y-2">
                  {nrbClusters.map((group) => renderGroupCard(group, selectedNrbLevelId === group.group_id))}
                </div>
              </div>
            )}

            {/* 🆕 Extended Levels (>24 weeks) - Only visible if toggle is ON */}
            {lastPattern === "nrb" && hasAnalyzed && showSingleLevelNrbs && nrbSingles.length > 0 && (
              <div className="bg-dark-card p-4 rounded-lg shadow-lg border border-slate-700">
                <div className="mb-3">
                  <div className="text-slate-400 text-sm">
                    Historical Levels ({currentSymbol})
                  </div>
                  <div className="text-lg font-semibold text-cyan-400">
                    {nrbSingles.length} Level{nrbSingles.length === 1 ? "" : "s"} found
                  </div>
                </div>
                <div className="space-y-2">
                  {nrbSingles.map((group) => renderGroupCard(group, selectedNrbLevelId === group.group_id))}
                </div>
              </div>
            )}

            {/* Consolidation Zones */}
            {lastPattern === "nrb" && showConsolidationZones && hasAnalyzed && (
              <div className="bg-dark-card p-4 rounded-lg shadow-lg border border-slate-700">
                {(() => {
                  const backendZones = consolidationZones || [];
                  const zoneInfoList = backendZones
                    .filter((z) => z.num_nrbs > 0)
                    .map((z) => ({
                      id: z.zone_id,
                      durationWeeks: z.duration_weeks,
                      startTime: z.start_time,
                      endTime: z.end_time,
                      successRate3m: z.success_rate_3m,
                      successRate6m: z.success_rate_6m,
                      successRate12m: z.success_rate_12m,
                      nrbCount: z.num_nrbs,
                    }))
                    .sort((a, b) => (b.durationWeeks ?? 0) - (a.durationWeeks ?? 0));

                  if (zoneInfoList.length === 0) return <div className="text-slate-500 text-sm">No consolidation zones.</div>;

                  return (
                    <>
                      <div className="mb-3">
                        <div className="text-slate-400 text-sm">Consolidation Zones</div>
                        <div className="text-lg font-semibold text-white">{zoneInfoList.length} Zones</div>
                      </div>
                      <div className="space-y-2">
                        {zoneInfoList.map((zone, index) => {
                          const isSelected = selectedNrbGroupId === zone.id;
                          return (
                            <button
                              key={zone.id}
                              type="button"
                              onClick={() => setSelectedNrbGroupId(isSelected ? null : zone.id)}
                              className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                                isSelected ? "border-brand-primary bg-slate-800 text-white" : "border-slate-700 bg-slate-900 text-slate-200"
                              }`}
                            >
                              <div className="flex justify-between">
                                <div className="font-medium">Zone {index + 1}</div>
                                {zone.durationWeeks && <div className="text-brand-accent">{formatWeeks(zone.durationWeeks)} wks</div>}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">{formatDate(zone.startTime)} - {formatDate(zone.endTime)}</div>
                              <div className="mt-2 pt-2 border-t border-slate-700 grid grid-cols-3 gap-2 text-xs">
                                <div><div className="text-slate-500">3 Mon</div><div>{formatSuccessRate(zone.successRate3m)}</div></div>
                                <div><div className="text-slate-500">6 Mon</div><div>{formatSuccessRate(zone.successRate6m)}</div></div>
                                <div><div className="text-slate-500">12 Mon</div><div>{formatSuccessRate(zone.successRate12m)}</div></div>
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