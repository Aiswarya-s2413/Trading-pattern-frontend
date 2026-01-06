import { useState, type FC, type FormEvent } from "react";
import type { PatternData } from "../services/mockBackend";
import { getAiDipRecommendation } from "../services/patternService";

interface PatternFormProps {
  onAnalyze: (data: PatternData) => void;
  isLoading: boolean;
  showConsolidationZones: boolean;
  onToggleConsolidationZones: (show: boolean) => void;
  selectedSymbol?: string; 
}

const PatternForm: FC<PatternFormProps> = ({ 
  onAnalyze, 
  isLoading,
  showConsolidationZones,
  onToggleConsolidationZones,
  selectedSymbol
}) => {
  const [pattern, setPattern] = useState("nrb");
  const [weeks, setWeeks] = useState(52);
  const [parameter, setParameter] = useState("rsc30");
  
  // Cooldown State
  const [cooldownWeeks, setCooldownWeeks] = useState(5);
  const [cooldownWeeksInput, setCooldownWeeksInput] = useState("5");
  const [cooldownError, setCooldownError] = useState<string | null>(null);

  // Dip Threshold State
  const [dipThreshold, setDipThreshold] = useState(20);
  const [dipThresholdInput, setDipThresholdInput] = useState("20");
  const [dipThresholdError, setDipThresholdError] = useState<string | null>(null);

  // AI Loading State (No feedback text needed anymore)
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Validation Logic ---

  const validateCooldown = (value: number): string | null => {
    if (isNaN(value) || !Number.isInteger(value)) return "Please enter a valid number";
    if (value < 1) return "Cooldown must be at least 1 week";
    if (value > 100) return "Cooldown cannot exceed 100 weeks";
    return null;
  };

  const validateDipThreshold = (value: number): string | null => {
    if (isNaN(value)) return "Please enter a valid number";
    if (value < 0) return "Threshold cannot be negative";
    if (value > 100) return "Threshold cannot exceed 100%";
    return null;
  };

  // --- Handlers ---

  const handleCooldownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCooldownWeeksInput(value);
    if (value === "") {
      setCooldownError(null);
      return;
    }
    const numValue = Math.floor(Number(value));
    const error = validateCooldown(numValue);
    setCooldownError(error);
    if (!error) setCooldownWeeks(numValue);
  };

  const handleCooldownBlur = () => {
    if (cooldownWeeksInput === "") {
      setCooldownWeeksInput("5");
      setCooldownWeeks(5);
      setCooldownError(null);
    }
  };

  const handleDipThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDipThresholdInput(value);
    if (value === "") {
      setDipThresholdError(null);
      return;
    }
    const numValue = Number(value);
    const error = validateDipThreshold(numValue);
    setDipThresholdError(error);
    if (!error) setDipThreshold(numValue);
  };

  const handleDipThresholdBlur = () => {
    if (dipThresholdInput === "") {
      setDipThresholdInput("20");
      setDipThreshold(20);
      setDipThresholdError(null);
    }
  };

  // 🪄 The Silent Magic Handler
  const handleAutoDetectDip = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!selectedSymbol) return;

    setIsAiLoading(true);

    try {
      const data = await getAiDipRecommendation(selectedSymbol);
      
      if (data && data.recommended_dip_percentage) {
        // Just update the value silently
        const aiValue = data.recommended_dip_percentage;
        setDipThreshold(aiValue);
        setDipThresholdInput(String(aiValue));
        setDipThresholdError(null);
        // Reasoning is ignored as requested
      }
    } catch (error) {
      console.error(error);
      // Fail silently or just log to console, no UI error needed
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pattern === "nrb") {
      const cError = validateCooldown(cooldownWeeks);
      const dError = validateDipThreshold(dipThreshold);
      if (cError) { setCooldownError(cError); return; }
      if (dError) { setDipThresholdError(dError); return; }
    }

    const submitData: PatternData = {
      pattern,
      weeks,
      parameter: parameter || null,
    };

    if (pattern === "nrb") {
      submitData.cooldownWeeks = cooldownWeeks;
      submitData.dipThreshold = dipThreshold;
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

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                Cooldown (wks)
                </label>
                <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={cooldownWeeksInput}
                onChange={handleCooldownChange}
                onBlur={handleCooldownBlur}
                placeholder="5"
                className={`w-full bg-slate-800 border rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none ${
                    cooldownError ? "border-red-500 focus:ring-red-500" : "border-slate-600"
                }`}
                />
                {cooldownError && (
                <p className="mt-1 text-[10px] text-red-400 leading-tight">{cooldownError}</p>
                )}
            </div>

            <div>
                {/* 🗑️ REMOVED: Symbol Badge from Label */}
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  NRB Rate (%)
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={dipThresholdInput}
                    onChange={handleDipThresholdChange}
                    onBlur={handleDipThresholdBlur}
                    placeholder="20"
                    className={`w-full bg-slate-800 border rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none ${
                        dipThresholdError ? "border-red-500 focus:ring-red-500" : "border-slate-600"
                    }`}
                  />
                  
                  <button
                    type="button"
                    onClick={handleAutoDetectDip}
                    disabled={isAiLoading || !selectedSymbol}
                    className={`px-3 rounded border border-slate-600 flex items-center justify-center transition-colors ${
                      isAiLoading || !selectedSymbol
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
                      : "bg-slate-700 hover:bg-slate-600 text-brand-primary hover:text-white"
                    }`}
                    title="AI Auto-Detect"
                  >
                    {isAiLoading ? "..." : "Ask AI"}
                  </button>
                </div>

                {/* 🗑️ REMOVED: AI Feedback Text */}
                {dipThresholdError && (
                  <p className="mt-1 text-[10px] text-red-400 leading-tight">{dipThresholdError}</p>
                )}
            </div>
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
        </select>
      </div>

      {pattern === "nrb" && (
        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showConsolidationZones}
              onChange={(e) => onToggleConsolidationZones(e.target.checked)}
              className="w-4 h-4 text-brand-primary bg-slate-800 border-slate-600 rounded focus:ring-2 focus:ring-brand-primary"
            />
            <span className="text-sm font-medium text-slate-300">
              Display Consolidation Zones
            </span>
          </label>
          <p className="mt-1 ml-7 text-xs text-slate-400">
            Show detailed zone analysis with success rates
          </p>
        </div>
      )}

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