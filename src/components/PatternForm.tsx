import { useState, type FC, type FormEvent } from 'react';
import type { PatternData } from '../services/mockBackend';

interface PatternFormProps {
    onAnalyze: (data: PatternData) => void;
    isLoading: boolean;
}

const PatternForm: FC<PatternFormProps> = ({ onAnalyze, isLoading }) => {
    const [pattern, setPattern] = useState('bowl');
    const [timeframe, setTimeframe] = useState('4h');
    const [target, setTarget] = useState(5);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onAnalyze({ pattern, timeframe, target });
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
                    <option value="cup_handle">Cup & Handle</option>
                    <option value="double_bottom">Double Bottom</option>
                    <option value="flag">Bull Flag</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-slate-300">Timeframe</label>
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                </select>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-slate-300">Target Uptrend (%)</label>
                <div className="flex gap-4">
                    {[2, 5, 10].map((val) => (
                        <label key={val} className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="target"
                                value={val}
                                checked={target === val}
                                onChange={() => setTarget(val)}
                                className="mr-2 text-brand-primary focus:ring-brand-primary"
                            />
                            {val}%
                        </label>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded font-bold transition-colors ${isLoading
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
