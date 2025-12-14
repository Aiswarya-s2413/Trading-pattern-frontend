export interface PatternData {
  pattern: string;
  weeks: number;
  parameter: string | null;
  cooldownWeeks?: number;
}

export interface AnalysisResult {
  occurrences: number;
  successRate: number;
  avgReturn: number;
  history: { date: string; result: "success" | "fail"; return: number }[];
}

export const analyzePattern = async (
  data: PatternData
): Promise<AnalysisResult> => {
  console.log("Analyzing pattern:", data);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate somewhat realistic dummy data based on inputs
      const baseSuccess = data.pattern === "bowl" ? 75 : 60;
      const randomVar = Math.floor(Math.random() * 10) - 5;

      resolve({
        occurrences: Math.floor(Math.random() * 50) + 20,
        successRate: Math.min(100, Math.max(0, baseSuccess + randomVar)),
        avgReturn: 10 + (Math.random() * 2 - 1),
        history: Array.from({ length: 5 }).map((_, i) => ({
          date: new Date(Date.now() - i * 86400000 * 10)
            .toISOString()
            .split("T")[0],
          result: Math.random() > 0.3 ? "success" : "fail",
          return: Math.random() * (10 + 2),
        })),
      });
    }, 1500);
  });
};
