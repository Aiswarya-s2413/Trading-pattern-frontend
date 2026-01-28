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

  // Cooldown State
  const [cooldownWeeks, setCooldownWeeks] = useState(52);
  const [cooldownWeeksInput, setCooldownWeeksInput] = useState("52");
  const [cooldownError, setCooldownError] = useState<string | null>(null);

  // Dip Threshold State (fixed default)
  const [dipThreshold] = useState(20);

  // 🆕 Whipsaw State (D1 & D2)
  const [whipsawD1, setWhipsawD1] = useState<number | "">("");
  const [whipsawD2, setWhipsawD2] = useState<number | "">("");

  // --- Validation Logic ---

  const validateCooldown = (value: number): string | null => {
    if (isNaN(value) || !Number.isInteger(value))
      return "Please enter a valid number";
    if (value < 1) return "Cooldown must be at least 1 week";
    if (value > 100) return "Cooldown cannot exceed 100 weeks";
    return null;
  };

  // Dip threshold validation no longer needed (input removed)

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
      setCooldownWeeksInput("52");
      setCooldownWeeks(52);
      setCooldownError(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pattern === "nrb") {
      const cError = validateCooldown(cooldownWeeks);
      if (cError) {
        setCooldownError(cError);
        return;
      }
    }

    const submitData: any = {
      pattern,
      weeks,
      parameter: parameter || null,
    };

    if (pattern === "nrb") {
      submitData.cooldownWeeks = cooldownWeeks;
      submitData.dipThreshold = dipThreshold;

      // 🆕 Pass D1/D2 only if selected
      if (whipsawD1 !== "") submitData.whipsawD1 = Number(whipsawD1);
      if (whipsawD2 !== "") submitData.whipsawD2 = Number(whipsawD2);
    }

    onAnalyze(submitData);
  };

  // Helper to generate range
  const generateWeekOptions = () => {
    const options = [];
    // 1-10 weeks
    for (let i = 1; i <= 10; i++) options.push(i);
    // 12-24 weeks (monthly steps)
    for (let i = 12; i <= 24; i += 4) options.push(i);
    // 26, 30, 40, 52 weeks
    options.push(26, 30, 40, 52);
    return options;
  };

  const weekOptions = generateWeekOptions();

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
                placeholder="52"
                className={`w-full bg-slate-800 border rounded p-2 text-white focus:ring-2 focus:ring-brand-primary outline-none ${
                  cooldownError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-600"
                }`}
              />
              {cooldownError && (
                <p className="mt-1 text-[10px] text-red-400 leading-tight">
                  {cooldownError}
                </p>
              )}
            </div>

            {/* <div>
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

                {dipThresholdError && (
                  <p className="mt-1 text-[10px] text-red-400 leading-tight">{dipThresholdError}</p>
                )}
            </div> */}
          </div>

          {/* 🆕 UPDATED WHIPSAW SECTION (D1 / D2 with extended range) */}
          <div className="mb-4 border-t border-slate-700 pt-4">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Whipsaw Detection (Optional)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-300">
                  Drop Duration 
                </label>
                <select
                  value={whipsawD1}
                  onChange={(e) =>
                    setWhipsawD1(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                >
                  <option value="">None</option>
                  {weekOptions.map((num) => (
                    <option key={num} value={num}>
                      {num} Weeks
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-300">
                  Recovery Duration
                </label>
                <select
                  value={whipsawD2}
                  onChange={(e) =>
                    setWhipsawD2(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                >
                  <option value="">None</option>
                  {weekOptions.map((num) => (
                    <option key={num} value={num}>
                      {num} Weeks
                    </option>
                  ))}
                </select>
              </div>
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

      {/* {pattern === "nrb" && (
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
      )} */}

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
