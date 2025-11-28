import type { FC } from 'react';
import type { AnalysisResult } from '../services/mockBackend';

interface ResultsPanelProps {
    results: AnalysisResult | null;
}

const ResultsPanel: FC<ResultsPanelProps> = ({ results }) => {
    if (!results) {
        return (
            <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-slate-700 h-full flex items-center justify-center text-slate-400">
                Select a pattern and click Analyze to see results.
            </div>
        );
    }

    return (
        <div className="bg-dark-card p-6 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-xl font-bold mb-6 text-brand-primary">Analysis Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800 p-4 rounded text-center">
                    <div className="text-sm text-slate-400 mb-1">Occurrences</div>
                    <div className="text-2xl font-bold text-white">{results.occurrences}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded text-center">
                    <div className="text-sm text-slate-400 mb-1">Success Rate</div>
                    <div className={`text-2xl font-bold ${results.successRate >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                        {results.successRate}%
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded text-center">
                    <div className="text-sm text-slate-400 mb-1">Avg Return</div>
                    <div className="text-2xl font-bold text-brand-accent">+{results.avgReturn.toFixed(2)}%</div>
                </div>
            </div>

            <h3 className="text-lg font-semibold mb-3 text-white">Recent History</h3>
            <div className="space-y-2">
                {results.history.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-800 p-3 rounded border-l-4 border-slate-600" style={{ borderColor: item.result === 'success' ? '#4ade80' : '#f87171' }}>
                        <span className="text-slate-300">{item.date}</span>
                        <span className={`font-bold ${item.result === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {item.result.toUpperCase()}
                        </span>
                        <span className="text-slate-300">+{item.return.toFixed(2)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultsPanel;
