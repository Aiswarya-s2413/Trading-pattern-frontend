import { useState, useEffect } from "react";
import { fetchAIPredictions, type PredictionData } from "../services/aiPredictionService";

export default function AISignalDashboard() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showHighConvictionOnly, setShowHighConvictionOnly] = useState<boolean>(false);

  useEffect(() => {
    fetchAIPredictions()
      .then((data) => {
        setPredictions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch predictions:", err);
        setLoading(false);
      });
  }, []);

  // Filter high conviction trades
  const filteredPredictions = showHighConvictionOnly
    ? predictions.filter(
        (p) =>
          p.predicted_label === 1 &&
          p.sector_confidence > 0.60 &&
          p.stock_accuracy > 0.70
      )
    : predictions;

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
          
          {/* Toggle Button for High Conviction */}
          <div className="flex items-center space-x-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
            <span className="text-sm font-medium text-slate-300">Show High Conviction Only</span>
             <button
                onClick={() => setShowHighConvictionOnly(!showHighConvictionOnly)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  showHighConvictionOnly ? "bg-green-500" : "bg-slate-600"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    showHighConvictionOnly ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
          </div>
        </div>

        {/* Prediction Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  <th className="px-6 py-4 font-semibold text-center">Signal</th>
                  <th className="px-6 py-4 font-semibold">AI Score</th>
                  <th className="px-6 py-4 font-semibold text-center">Sector Heat</th>
                  <th className="px-6 py-4 font-semibold text-center">Data Quality</th>
                  <th className="px-6 py-4 font-semibold text-center">Win Rate</th>
                  <th className="px-6 py-4 font-semibold text-center">Outcome</th>
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
                      {/* Stock Symbol */}
                      <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">
                        {row.symbol}
                        <div className="text-xs text-slate-500 font-normal mt-0.5">{row.sector}</div>
                      </td>

                      {/* Signal Badge */}
                      <td className="px-6 py-4 text-center">
                        {row.predicted_label === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                            BUY
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600">
                            AVOID
                          </span>
                        )}
                      </td>

                      {/* AI Probability Score */}
                      <td className="px-6 py-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-semibold text-slate-200">
                             {(row.predicted_probability * 100).toFixed(0)}%
                           </span>
                           <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${
                                 row.predicted_probability > 0.41 ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-slate-500"
                               }`}
                               style={{ width: `${row.predicted_probability * 100}%` }}
                             />
                           </div>
                        </div>
                         {row.predicted_probability > 0.41 && (
                             <div className="text-[10px] text-cyan-400 mt-1 font-medium">High Confidence</div>
                         )}
                      </td>

                      {/* Sector Confidence */}
                      <td className="px-6 py-4 text-center">
                        {row.sector_confidence > 0.60 ? (
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-orange-400 font-medium">Hot</span>
                            </div>
                        ) : (
                            <div className="text-slate-500 text-xs">-</div>
                        )}
                         <div className="text-[10px] text-slate-600 mt-1">{(row.sector_confidence * 100).toFixed(0)}% Win Rate</div>
                      </td>

                      {/* Sample Confidence */}
                      <td className="px-6 py-4 text-center">
                         {row.sample_confidence > 0.80 ? (
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-blue-400 font-medium">High Data</span>
                            </div>
                         ) : (
                            <div className="text-slate-500 text-xs">Low Data</div>
                         )} 
                         <div className="text-[10px] text-slate-600 mt-1">{(row.sample_confidence * 100).toFixed(0)}% Reliability</div>
                      </td>

                      {/* Stock Accuracy */}
                      <td className="px-6 py-4 text-center">
                         {row.stock_accuracy > 0.70 ? (
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-green-400 font-medium">Reliable</span>
                            </div>
                         ) : (
                             <div className="text-slate-500 text-xs">Volatile</div>
                         )}                         <div className="text-[10px] text-slate-600 mt-1">{(row.stock_accuracy * 100).toFixed(0)}% Hist. Acc.</div>
                      </td>

                      {/* Actual Outcome (Real 2025 Data) */}
                      <td className="px-6 py-4 text-center">
                        {row.actual_success !== undefined && row.actual_success !== null ? (
                          row.predicted_label === 1 ? (
                              row.actual_success === 1 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                  WIN
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                  LOSS
                                </span>
                              )
                          ) : (
                              row.actual_success === 1 ? (
                                <span className="text-slate-500 text-xs italic">Missed</span>
                              ) : (
                                <span className="text-slate-500 text-xs italic">Avoided</span>
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
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
