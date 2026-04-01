export type IncomeType = "Thumbnail" | "Ads" | "Banner" | "Other";

export interface Income {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  convertedAmount: number; // Base currency BDT
  client: string;
  type: IncomeType;
  date: string; // ISO date string
  notes?: string;
  createdAt: string;
}

export interface CurrencyRate {
  [key: string]: number;
}
