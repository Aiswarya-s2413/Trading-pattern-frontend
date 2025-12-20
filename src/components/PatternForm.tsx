import { useState, type FC, type FormEvent } from "react";
import type { PatternData } from "../services/mockBackend";

interface PatternFormProps {
  onAnalyze: (data: PatternData) => void;
  isLoading: boolean;
}

const PatternForm: FC<PatternFormProps> = ({ onAnalyze, isLoading }) => {
  const [pattern, setPattern] = useState("nrb");
  const [weeks, setWeeks] = useState(52);
  const [parameter, setParameter] = useState("rsc30");
  const [cooldownWeeks, setCooldownWeeks] = useState(20);
  const [cooldownWeeksInput, setCooldownWeeksInput] = useState("20");
  const [cooldownError, setCooldownError] = useState<string | null>(null);

  const validateCooldown = (value: number): string | null => {
    if (isNaN(value) || !Number.isInteger(value)) {
      return "Please enter a valid number";
    }
    if (value < 1) {
      return "Cooldown must be at least 1 week";
    }
    if (value > 100) {
      return "Cooldown cannot exceed 100 weeks";
    }
    return null;
  };

  const handleCooldownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCooldownWeeksInput(value);

    if (value === "") {
      setCooldownError(null);
      return;
    }

    // Parse as integer (remove decimals)
    const numValue = Math.floor(Number(value));
    const error = validateCooldown(numValue);
    setCooldownError(error);

    if (!error) {
      setCooldownWeeks(numValue);
    }
  };

  const handleCooldownBlur = () => {
    if (cooldownWeeksInput === "") {
      setCooldownWeeksInput("4");
      setCooldownWeeks(4);
      setCooldownError(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Validate cooldown before submit if NRB pattern
    if (pattern === "nrb") {
      const error = validateCooldown(cooldownWeeks);
      if (error) {
        setCooldownError(error);
        return;
      }
    }

    const submitData: PatternData = {
      pattern,
      weeks,
      parameter: parameter || null,
    };

    // Only include cooldownWeeks for NRB pattern
    if (pattern === "nrb") {
      submitData.cooldownWeeks = cooldownWeeks;
    }

    onAnalyze(submitData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-dark-card p-6 rounded-lg shadow-lg border border-slate-700"
    >
      <h2 className="text-xl font-bold mb-4 text-brand-primary">
        Pattern Configuration
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-slate-300">
          Pattern Type
        </label>
        <select
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none"
        >
          <option value="bowl">Bowl Pattern</option>
          <option value="nrb">NRB Pattern</option>
        </select>
      </div>

      {pattern === "nrb" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Weeks (1-100)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Cooldown Period (weeks)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={cooldownWeeksInput}
              onChange={handleCooldownChange}
              onBlur={handleCooldownBlur}
              placeholder="4"
              className={`w-full bg-slate-800 border rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none ${
                cooldownError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-600"
              }`}
            />
            {cooldownError && (
              <p className="mt-1 text-sm text-red-400">{cooldownError}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Minimum weeks between NRB signals
            </p>
          </div>
        </>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-slate-300">
          Parameter 
        </label>
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
            ? "bg-slate-600 cursor-not-allowed"
            : "bg-brand-primary hover:bg-blue-600"
        }`}
      >
        {isLoading ? "Analyzing..." : "Analyze Pattern"}
      </button>
    </form>
  );
};

export default PatternForm;
