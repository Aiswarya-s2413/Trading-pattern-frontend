import axios from 'axios';

// Define the interface for the prediction data
export interface PredictionData {
  symbol: string;
  date: string;
  sector: string;
  predicted_label: number; // 1 = Buy, 0 = Avoid
  predicted_probability: number; // Raw AI Confidence (0.00 - 1.00)
  sector_confidence: number; // Sector Win Rate (0.00 - 1.00)
  sample_confidence: number; // Statistical Reliability (0.00 - 1.00)
  stock_accuracy: number; // Model Accuracy for THIS stock (0.00 - 1.00)
  actual_success?: number | null; // 1 = Success, 0 = Fail, null = Pending/Unknown
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch AI predictions from the backend API
export const fetchAIPredictions = async (): Promise<PredictionData[]> => {
  try {
    const response = await axios.get<PredictionData[]>(`${API_BASE_URL}/ai-predictions/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching AI predictions:', error);
    // Return empty array or throw error as needed
    return [];
  }
};



// Extensive Mock Data (Nifty 50 & Popular F&O Stocks)
export const mockPredictions: PredictionData[] = [
  // ENERGY & OIL
  { symbol: "RELIANCE", date: "2025-01-15", sector: "Energy", predicted_label: 1, predicted_probability: 0.42, sector_confidence: 0.65, sample_confidence: 1.0, stock_accuracy: 0.72 },
  { symbol: "ONGC", date: "2025-01-16", sector: "Energy", predicted_label: 1, predicted_probability: 0.78, sector_confidence: 0.65, sample_confidence: 0.92, stock_accuracy: 0.68 },
  { symbol: "NTPC", date: "2025-01-15", sector: "Energy", predicted_label: 0, predicted_probability: 0.30, sector_confidence: 0.60, sample_confidence: 0.88, stock_accuracy: 0.70 },
  { symbol: "POWERGRID", date: "2025-01-17", sector: "Energy", predicted_label: 1, predicted_probability: 0.55, sector_confidence: 0.65, sample_confidence: 0.85, stock_accuracy: 0.74 },
  { symbol: "BPCL", date: "2025-01-18", sector: "Energy", predicted_label: 0, predicted_probability: 0.22, sector_confidence: 0.55, sample_confidence: 0.80, stock_accuracy: 0.62 },
  { symbol: "COALINDIA", date: "2025-01-16", sector: "Energy", predicted_label: 1, predicted_probability: 0.85, sector_confidence: 0.68, sample_confidence: 0.95, stock_accuracy: 0.71 },
  { symbol: "TATAPOWER", date: "2025-01-19", sector: "Energy", predicted_label: 1, predicted_probability: 0.62, sector_confidence: 0.66, sample_confidence: 0.82, stock_accuracy: 0.69 },

  // IT SERVICES
  { symbol: "TCS", date: "2025-01-16", sector: "IT", predicted_label: 0, predicted_probability: 0.15, sector_confidence: 0.45, sample_confidence: 0.9, stock_accuracy: 0.68 },
  { symbol: "INFY", date: "2025-01-16", sector: "IT", predicted_label: 1, predicted_probability: 0.85, sector_confidence: 0.70, sample_confidence: 0.95, stock_accuracy: 0.75 },
  { symbol: "HCLTECH", date: "2025-01-17", sector: "IT", predicted_label: 1, predicted_probability: 0.72, sector_confidence: 0.70, sample_confidence: 0.88, stock_accuracy: 0.73 },
  { symbol: "WIPRO", date: "2025-01-15", sector: "IT", predicted_label: 0, predicted_probability: 0.35, sector_confidence: 0.45, sample_confidence: 0.91, stock_accuracy: 0.65 },
  { symbol: "TECHM", date: "2025-01-18", sector: "IT", predicted_label: 1, predicted_probability: 0.58, sector_confidence: 0.68, sample_confidence: 0.84, stock_accuracy: 0.67 },
  { symbol: "LTIM", date: "2025-01-19", sector: "IT", predicted_label: 1, predicted_probability: 0.92, sector_confidence: 0.75, sample_confidence: 0.78, stock_accuracy: 0.71 },

  // BANKING & FINANCE
  { symbol: "HDFCBANK", date: "2025-01-17", sector: "Finance", predicted_label: 1, predicted_probability: 0.60, sector_confidence: 0.55, sample_confidence: 0.85, stock_accuracy: 0.65 },
  { symbol: "ICICIBANK", date: "2025-01-16", sector: "Finance", predicted_label: 1, predicted_probability: 0.88, sector_confidence: 0.72, sample_confidence: 0.94, stock_accuracy: 0.78 },
  { symbol: "SBIN", date: "2025-01-15", sector: "Finance", predicted_label: 1, predicted_probability: 0.75, sector_confidence: 0.68, sample_confidence: 0.96, stock_accuracy: 0.72 },
  { symbol: "KOTAKBANK", date: "2025-01-18", sector: "Finance", predicted_label: 0, predicted_probability: 0.25, sector_confidence: 0.50, sample_confidence: 0.89, stock_accuracy: 0.69 },
  { symbol: "AXISBANK", date: "2025-01-17", sector: "Finance", predicted_label: 1, predicted_probability: 0.65, sector_confidence: 0.60, sample_confidence: 0.87, stock_accuracy: 0.70 },
  { symbol: "BAJFINANCE", date: "2025-01-19", sector: "Finance", predicted_label: 1, predicted_probability: 0.95, sector_confidence: 0.75, sample_confidence: 0.91, stock_accuracy: 0.76 },
  { symbol: "BAJAJFINSV", date: "2025-01-19", sector: "Finance", predicted_label: 1, predicted_probability: 0.80, sector_confidence: 0.72, sample_confidence: 0.88, stock_accuracy: 0.74 },
  { symbol: "INDUSINDBK", date: "2025-01-16", sector: "Finance", predicted_label: 0, predicted_probability: 0.40, sector_confidence: 0.52, sample_confidence: 0.82, stock_accuracy: 0.63 },

  // AUTOMOBILE
  { symbol: "TATAMOTORS", date: "2025-01-15", sector: "Auto", predicted_label: 1, predicted_probability: 0.68, sector_confidence: 0.62, sample_confidence: 0.90, stock_accuracy: 0.71 },
  { symbol: "MARUTI", date: "2025-01-17", sector: "Auto", predicted_label: 0, predicted_probability: 0.32, sector_confidence: 0.58, sample_confidence: 0.93, stock_accuracy: 0.74 },
  { symbol: "M&M", date: "2025-01-18", sector: "Auto", predicted_label: 1, predicted_probability: 0.82, sector_confidence: 0.70, sample_confidence: 0.89, stock_accuracy: 0.77 },
  { symbol: "EICHERMOT", date: "2025-01-16", sector: "Auto", predicted_label: 1, predicted_probability: 0.55, sector_confidence: 0.60, sample_confidence: 0.86, stock_accuracy: 0.69 },
  { symbol: "HEROMOTOCO", date: "2025-01-19", sector: "Auto", predicted_label: 0, predicted_probability: 0.28, sector_confidence: 0.55, sample_confidence: 0.88, stock_accuracy: 0.66 },
  { symbol: "BAJAJ-AUTO", date: "2025-01-15", sector: "Auto", predicted_label: 1, predicted_probability: 0.70, sector_confidence: 0.65, sample_confidence: 0.85, stock_accuracy: 0.72 },

  // PHARMA
  { symbol: "SUNPHARMA", date: "2025-01-16", sector: "Pharma", predicted_label: 1, predicted_probability: 0.76, sector_confidence: 0.68, sample_confidence: 0.92, stock_accuracy: 0.73 },
  { symbol: "DRREDDY", date: "2025-01-17", sector: "Pharma", predicted_label: 0, predicted_probability: 0.45, sector_confidence: 0.58, sample_confidence: 0.87, stock_accuracy: 0.68 },
  { symbol: "CIPLA", date: "2025-01-18", sector: "Pharma", predicted_label: 1, predicted_probability: 0.62, sector_confidence: 0.65, sample_confidence: 0.85, stock_accuracy: 0.70 },
  { symbol: "DIVISLAB", date: "2025-01-15", sector: "Pharma", predicted_label: 0, predicted_probability: 0.20, sector_confidence: 0.55, sample_confidence: 0.80, stock_accuracy: 0.66 },
  { symbol: "APOLLOHOSP", date: "2025-01-19", sector: "Pharma", predicted_label: 1, predicted_probability: 0.88, sector_confidence: 0.72, sample_confidence: 0.86, stock_accuracy: 0.75 },

  // FMCG
  { symbol: "ITC", date: "2025-01-15", sector: "FMCG", predicted_label: 1, predicted_probability: 0.50, sector_confidence: 0.60, sample_confidence: 0.98, stock_accuracy: 0.64 },
  { symbol: "HINDUNILVR", date: "2025-01-16", sector: "FMCG", predicted_label: 0, predicted_probability: 0.42, sector_confidence: 0.58, sample_confidence: 0.95, stock_accuracy: 0.67 },
  { symbol: "NESTLEIND", date: "2025-01-17", sector: "FMCG", predicted_label: 1, predicted_probability: 0.60, sector_confidence: 0.62, sample_confidence: 0.90, stock_accuracy: 0.69 },
  { symbol: "BRITANNIA", date: "2025-01-18", sector: "FMCG", predicted_label: 1, predicted_probability: 0.74, sector_confidence: 0.65, sample_confidence: 0.88, stock_accuracy: 0.72 },
  { symbol: "TATACONSUM", date: "2025-01-19", sector: "FMCG", predicted_label: 1, predicted_probability: 0.68, sector_confidence: 0.64, sample_confidence: 0.85, stock_accuracy: 0.70 },

  // METALS
  { symbol: "TATASTEEL", date: "2025-01-15", sector: "Metals", predicted_label: 1, predicted_probability: 0.82, sector_confidence: 0.75, sample_confidence: 0.94, stock_accuracy: 0.76 },
  { symbol: "JSWSTEEL", date: "2025-01-16", sector: "Metals", predicted_label: 1, predicted_probability: 0.78, sector_confidence: 0.72, sample_confidence: 0.91, stock_accuracy: 0.73 },
  { symbol: "HINDALCO", date: "2025-01-17", sector: "Metals", predicted_label: 1, predicted_probability: 0.90, sector_confidence: 0.78, sample_confidence: 0.89, stock_accuracy: 0.75 },
  { symbol: "VEDL", date: "2025-01-18", sector: "Metals", predicted_label: 0, predicted_probability: 0.35, sector_confidence: 0.65, sample_confidence: 0.85, stock_accuracy: 0.68 },

  // OTHERS
  { symbol: "LT", date: "2025-01-16", sector: "Infra", predicted_label: 1, predicted_probability: 0.70, sector_confidence: 0.65, sample_confidence: 0.92, stock_accuracy: 0.74 },
  { symbol: "ULTRACEMCO", date: "2025-01-17", sector: "Cement", predicted_label: 1, predicted_probability: 0.65, sector_confidence: 0.60, sample_confidence: 0.88, stock_accuracy: 0.71 },
  { symbol: "ADANIENT", date: "2025-01-15", sector: "Diversified", predicted_label: 1, predicted_probability: 0.55, sector_confidence: 0.50, sample_confidence: 0.80, stock_accuracy: 0.60 },
  { symbol: "ADANIPORTS", date: "2025-01-18", sector: "Infra", predicted_label: 1, predicted_probability: 0.72, sector_confidence: 0.65, sample_confidence: 0.85, stock_accuracy: 0.68 },
  { symbol: "TITAN", date: "2025-01-16", sector: "Cons. Dur.", predicted_label: 0, predicted_probability: 0.45, sector_confidence: 0.55, sample_confidence: 0.90, stock_accuracy: 0.73 },
  { symbol: "ASIANPAINT", date: "2025-01-17", sector: "Cons. Dur.", predicted_label: 0, predicted_probability: 0.40, sector_confidence: 0.52, sample_confidence: 0.92, stock_accuracy: 0.75 },
  { symbol: "BEL", date: "2025-01-19", sector: "Defense", predicted_label: 1, predicted_probability: 0.96, sector_confidence: 0.85, sample_confidence: 0.80, stock_accuracy: 0.79 },
  { symbol: "HAL", date: "2025-01-19", sector: "Defense", predicted_label: 1, predicted_probability: 0.94, sector_confidence: 0.84, sample_confidence: 0.78, stock_accuracy: 0.77 },
  { symbol: "IRCTC", date: "2025-01-15", sector: "Travel", predicted_label: 1, predicted_probability: 0.58, sector_confidence: 0.55, sample_confidence: 0.85, stock_accuracy: 0.65 },
  { symbol: "ZOMATO", date: "2025-01-18", sector: "Tech", predicted_label: 1, predicted_probability: 0.88, sector_confidence: 0.75, sample_confidence: 0.70, stock_accuracy: 0.62 },
];

export const fetchMockAIPredictions = async (): Promise<PredictionData[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockPredictions);
        }, 1000); // Simulate network delay
    });
};
