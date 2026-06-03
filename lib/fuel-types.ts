export type FuelType = 'ron95' | 'e10ron95' | 'e5ron92' | 'do005s' | 'do001s';

export type FuelPrice = Partial<Record<FuelType, number | null>>;

export interface FuelSnapshot {
  id?: string;
  source: 'petrolimex' | 'pvoil';
  region: string;
  effectiveDate: string;
  crawledAt: number;
  prices: FuelPrice;
}

export const FUEL_LABELS: Record<FuelType, string> = {
  ron95: 'Xăng RON 95-III',
  e10ron95: 'Xăng E10 RON 95-III',
  e5ron92: 'Xăng E5 RON 92-II',
  do005s: 'Dầu DO 0,05S-II',
  do001s: 'Dầu DO 0,001S-V',
};

export const FUEL_COLORS: Record<FuelType, string> = {
  ron95: '#FF6B6B',
  e10ron95: '#4ECDC4',
  e5ron92: '#45B7D1',
  do005s: '#FFA07A',
  do001s: '#98D8C8',
};

export const REGIONS: Record<string, string> = {
  'toan-quoc': 'Toàn quốc',
  'ha-noi': 'Hà Nội',
  'sai-gon': 'TP.HCM',
  'hai-phong': 'Hải Phòng',
  'da-nang': 'Đà Nẵng',
  'can-tho': 'Cần Thơ',
};
