import { useState, useEffect } from "react";
import { fetchAIPredictions, type PredictionData } from "../services/aiPredictionService";

export default function AISignalDashboard() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchAIPredictions()
      .then((data) => {
        console.log("Received AI Predictions:", data.slice(0, 5));
        setPredictions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch predictions:", err);
        setLoading(false);
      });
  }, []);

  // Filter by search query
  const filteredPredictions = predictions.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.symbol.toLowerCase().includes(query) ||
      p.sector.toLowerCase().includes(query)
    );
  });

  // Sorting: Maybe sort by date descending or probability ascending? Keeping simple for now.
  if (loading) {
    return <div className="p-8 text-center text-white">Loading AI Predictions...</div>;
  }

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              AI Signal Dashboard (2025)
            </h1>
            <p className="text-slate-400 mt-1">
              Deep Learning predictions for high-probability setups.
            </p>
          </div>
          
          {/* Search Input */}
          <div className="w-full md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
              </div>
              <input 
                type="text" 
                className="block w-full p-2 pl-10 text-sm text-slate-200 border border-slate-700 rounded-lg bg-slate-800/50 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 transition-colors" 
                placeholder="Search symbol or sector..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Prediction Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="px-6 py-4 font-semibold">Asset</th>
                  <th className="px-6 py-4 font-semibold text-center">AI Prediction</th>
                  <th className="px-6 py-4 font-semibold">AI Confidence</th>
                  <th className="px-6 py-4 font-semibold text-center">Historical Reliability</th>
                  <th className="px-6 py-4 font-semibold text-center">Actual Market Move</th>
                  <th className="px-6 py-4 font-semibold text-center">Was AI Correct?</th>
                  <th className="px-6 py-4 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredPredictions.length > 0 ? (
                  filteredPredictions.map((row, idx) => (
                    <tr 
                        key={`${row.symbol}-${idx}`} 
                        className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Asset */}
                      <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-base">{row.symbol}</span>
                          <span className="text-xs text-slate-500 font-normal mt-0.5">{row.sector}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        {row.predicted_label === 1 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                            BUY
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50">
                            AVOID
                          </span>
                        )}
                      </td>

                      {/* AI Confidence */}
                      <td className="px-6 py-4 min-w-[160px]">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex justify-between items-center text-sm">
                             <span className="font-semibold text-slate-200">
                               {(row.predicted_probability * 100).toFixed(0)}%
                             </span>
                             <span className={`text-xs font-medium ${
                               row.predicted_probability >= 0.75 ? "text-green-400" :
                               row.predicted_probability >= 0.50 ? "text-blue-400" : "text-slate-400"
                             }`}>
                               {row.predicted_probability >= 0.75 ? "Strong" :
                                row.predicted_probability >= 0.50 ? "Moderate" : "Weak"}
                             </span>
                           </div>
                           <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-500 ${
                                 row.predicted_probability >= 0.75 ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                                 row.predicted_probability >= 0.50 ? "bg-gradient-to-r from-blue-500 to-cyan-400" : 
                                 "bg-slate-500"
                               }`}
                               style={{ width: `${row.predicted_probability * 100}%` }}
                             />
                           </div>
                        </div>
                      </td>

                      {/* Historical Accuracy */}
                      <td className="px-6 py-4 text-center">
                         <div className="flex flex-col items-center">
                            <span className="text-sm text-slate-200 font-medium">
                              {(row.stock_accuracy * 100).toFixed(0)}%
                            </span>
                            {row.stock_accuracy >= 0.70 ? (
                                <span className="text-[11px] text-emerald-400/90 mt-0.5">Reliable</span>
                            ) : row.stock_accuracy >= 0.60 ? (
                                <span className="text-[11px] text-blue-400/90 mt-0.5">Average</span>
                            ) : (
                                <span className="text-[11px] text-amber-400/90 mt-0.5">Variable</span>
                            )}
                         </div>
                      </td>

                      {/* Actual Market Move */}
                      <td className="px-6 py-4 text-center">
                        {row.actual_success !== null && row.actual_success !== undefined ? (
                            Number(row.actual_success) === 1 ? (
                                <div className="flex items-center justify-center text-sm font-medium text-green-400">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                  Stock Went Up
                                </div>
                            ) : (
                                <div className="flex items-center justify-center text-sm font-medium text-red-400">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
                                  Stock Dropped
                                </div>
                            )
                        ) : (
                           <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                             Pending Data
                           </div>
                        )}
                      </td>

                      {/* Was AI Correct? */}
                      <td className="px-6 py-4 text-center">
                        {row.actual_success !== null && row.actual_success !== undefined ? (
                          row.predicted_label === 1 ? (
                              Number(row.actual_success) === 1 ? (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                    YES
                                  </span>
                                  <span className="text-[10px] text-green-500/80 mt-1 uppercase tracking-wider">Profitable Trade</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                    NO
                                  </span>
                                  <span className="text-[10px] text-red-500/80 mt-1 uppercase tracking-wider">Losing Trade</span>
                                </div>
                              )
                          ) : (
                              Number(row.actual_success) === 1 ? (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    NO
                                  </span>
                                  <span className="text-[10px] text-orange-400/80 mt-1 uppercase tracking-wider">Missed Rally</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    YES
                                  </span>
                                  <span className="text-[10px] text-emerald-500/80 mt-1 uppercase tracking-wider">Smart Avoid</span>
                                </div>
                              )
                          )
                        ) : (
                            <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-right text-sm text-slate-400 font-mono">
                        {row.date}
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No predictions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
