import { useState } from 'react';
import ChartContainer from './components/ChartContainer';
import PatternForm from './components/PatternForm';
import ResultsPanel from './components/ResultsPanel';
import { analyzePattern, type PatternData, type AnalysisResult } from './services/mockBackend';

function App() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (data: PatternData) => {
    setIsLoading(true);
    try {
      const result = await analyzePattern(data);
      setResults(result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6 flex flex-col gap-6">
      <header className="flex justify-between items-center pb-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
          Pattern Recognition Tool
        </h1>
        <div className="text-slate-400 text-sm">V0.0.1</div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[600px]">
          <ChartContainer />
        </div>

        <div className="flex flex-col gap-6">
          <PatternForm onAnalyze={handleAnalyze} isLoading={isLoading} />
          <ResultsPanel results={results} />
        </div>
      </main>
    </div>
  );
}

export default App;
