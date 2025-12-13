import { useState, type FC, type FormEvent } from 'react';
import type { PatternData } from '../services/mockBackend';

interface PatternFormProps {
    onAnalyze: (data: PatternData) => void;
    isLoading: boolean;
}

const PatternForm: FC<PatternFormProps> = ({ onAnalyze, isLoading }) => {
    const [pattern, setPattern] = useState('bowl');
    const [weeks, setWeeks] = useState(52);
    const [parameter, setParameter] = useState('ema21');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onAnalyze({ pattern, weeks, parameter: parameter || null });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-dark-card p-6 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-brand-primary">Pattern Configuration</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-slate-300">Pattern Type</label>
                <select
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    <option value="bowl">Bowl Pattern</option>
                    <option value="nrb">NRB Pattern</option>
                </select>
            </div>

            {pattern === 'nrb' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-slate-300">Weeks (1-100)</label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={weeks}
                        onChange={(e) => setWeeks(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-slate-300">Parameter (Optional)</label>
                <select
                    value={parameter}
                    onChange={(e) => setParameter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    <option value="">Closing Price</option>
                    <option value="ema21">EMA 21</option>
                    <option value="ema50">EMA 50</option>
                    <option value="ema200">EMA 200</option>
                    <option value="rsc30">RSC SENSEX (Ratio + EMAs)</option>
                    {/* 🔄 Removed RSC500 */}
                </select>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded font-bold transition-colors ${
                    isLoading
                        ? 'bg-slate-600 cursor-not-allowed'
                        : 'bg-brand-primary hover:bg-blue-600'
                }`}
            >
                {isLoading ? 'Analyzing...' : 'Analyze Pattern'}
            </button>
        </form>
    );
};

export default PatternForm;