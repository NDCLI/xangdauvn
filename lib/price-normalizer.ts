import { FuelPrice, FuelType } from './fuel-types';

export interface RawPriceData {
  ron95?: number;
  ron92?: number;
  e5?: number;
  e10?: number;
  diesel?: number;
  [key: string]: number | undefined;
}

export function normalizeFuelPrice(raw: RawPriceData): FuelPrice {
  const normalized: FuelPrice = {};
  const fuelTypes: FuelType[] = ['ron95', 'e10ron95', 'e5ron92', 'do005s', 'do001s'];
  
  for (const fuel of fuelTypes) {
    const value = (raw as any)[fuel];
    normalized[fuel] = value ? Math.round(value * 100) / 100 : null;
  }
  
  return normalized;
}

export function extractPriceFromText(text: string, fuelType: string): number | null {
  const patterns = [
    /[\d,]+[\.,]\d{2,}/g,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleanStr = match[0].replace(/[,.]/g, (m) => m === ',' ? '.' : '');
      const num = parseFloat(cleanStr);
      return isNaN(num) ? null : num;
    }
  }
  
  return null;
}
