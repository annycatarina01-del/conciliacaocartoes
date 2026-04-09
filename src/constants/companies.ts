import { Company } from "../types/sales";

export const COMPANY_DATA: Record<Company, { cnpj: string }> = {
  'SUPORTE MATRIZ': { cnpj: '26.312.733/0001-55' },
  'SUPORTE FILIAL': { cnpj: '26.312.733/0003-17' },
  'SUPORTE INSUMOS': { cnpj: '54.084.509/0001-99' }
};

export const COMPANIES: Company[] = ['SUPORTE MATRIZ', 'SUPORTE FILIAL', 'SUPORTE INSUMOS'];
