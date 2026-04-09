export type Provider = 'PagBank' | 'Mulvi';
export type Company = 'SUPORTE MATRIZ' | 'SUPORTE FILIAL' | 'SUPORTE INSUMOS';

export interface ImportedFile {
  id: string;
  fileName: string;
  importDate: string;
  provider: Provider;
  salesCount: number;
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  description: string;
  cardBrand?: string;
  lastFourDigits?: string;
  invoiceNumber?: string;
  status: 'pending' | 'concilied';
  provider: Provider;
  installments?: number;
  fileId?: string;
  observation?: string;
  fee?: number;
  netAmount?: number;
}

export interface ExtractionResult {
  sales: Partial<Sale>[];
  error?: string;
}
