import { GoogleGenAI, Type } from "@google/genai";
import { Sale, ExtractionResult, Provider, ImportedFile, Company } from "../types/sales";

const getAI = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

export class SalesService {
  private static getStorageKey(company: Company): string {
    return `vendas_data_${company}`;
  }

  private static getFilesStorageKey(company: Company): string {
    return `imported_files_data_${company}`;
  }

  static async extractSalesFromText(text: string, provider: Provider): Promise<ExtractionResult> {
    const ai = getAI();
    if (!ai) {
      return { sales: [], error: "Configuração de IA (Gemini API Key) não encontrada." };
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: `Analise o seguinte texto extraído de um relatório de vendas da maquininha ${provider} e extraia uma lista de vendas estruturada. 
        É fundamental extrair com precisão os valores de TAXA e VALOR LÍQUIDO de cada transação, conforme aparecem no relatório original.
        
        Texto: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sales: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "Data da venda (ISO ou formato legível)" },
                    amount: { type: Type.NUMBER, description: "Valor da venda" },
                    description: { type: Type.STRING, description: "Descrição ou tipo de transação" },
                    cardBrand: { type: Type.STRING, description: "Bandeira do cartão (opcional)" },
                    lastFourDigits: { type: Type.STRING, description: "4 últimos dígitos do cartão (opcional)" },
                    installments: { type: Type.NUMBER, description: "Número de parcelas (ex: 1 para à vista, 2, 3, etc.)" },
                    fee: { type: Type.NUMBER, description: "Taxa da transação (opcional)" },
                    netAmount: { type: Type.NUMBER, description: "Valor líquido da transação (opcional)" }
                  },
                  required: ["date", "amount", "description"]
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{"sales": []}');
      return {
        sales: result.sales.map((s: any) => ({
          ...s,
          id: crypto.randomUUID(),
          status: 'pending',
          provider
        }))
      };
    } catch (error) {
      console.error("Erro na extração com Gemini:", error);
      return { sales: [], error: "Falha ao processar o conteúdo do PDF." };
    }
  }

  static getSales(company: Company): Sale[] {
    const data = localStorage.getItem(this.getStorageKey(company));
    return data ? JSON.parse(data) : [];
  }

  static saveSales(company: Company, sales: Sale[]): void {
    localStorage.setItem(this.getStorageKey(company), JSON.stringify(sales));
  }

  static getImportedFiles(company: Company): ImportedFile[] {
    const data = localStorage.getItem(this.getFilesStorageKey(company));
    return data ? JSON.parse(data) : [];
  }

  static saveImportedFiles(company: Company, files: ImportedFile[]): void {
    localStorage.setItem(this.getFilesStorageKey(company), JSON.stringify(files));
  }

  static deleteImportedFile(company: Company, fileId: string): void {
    const files = this.getImportedFiles(company);
    this.saveImportedFiles(company, files.filter(f => f.id !== fileId));

    const sales = this.getSales(company);
    this.saveSales(company, sales.filter(s => s.fileId !== fileId));
  }

  static updateSaleInvoice(company: Company, saleId: string, invoiceNumber: string): void {
    const sales = this.getSales(company);
    const updatedSales = sales.map(s =>
      s.id === saleId
        ? { ...s, invoiceNumber }
        : s
    );
    this.saveSales(company, updatedSales);
  }

  static updateSaleStatus(company: Company, saleId: string, status: 'pending' | 'concilied'): void {
    const sales = this.getSales(company);
    const updatedSales = sales.map(s =>
      s.id === saleId
        ? { ...s, status }
        : s
    );
    this.saveSales(company, updatedSales);
  }

  static updateSaleObservation(company: Company, saleId: string, observation: string): void {
    const sales = this.getSales(company);
    const updatedSales = sales.map(s =>
      s.id === saleId
        ? { ...s, observation }
        : s
    );
    this.saveSales(company, updatedSales);
  }

  static deleteSale(company: Company, saleId: string): void {
    const sales = this.getSales(company);
    this.saveSales(company, sales.filter(s => s.id !== saleId));
  }

  static clearAll(company: Company): void {
    localStorage.removeItem(this.getStorageKey(company));
    localStorage.removeItem(this.getFilesStorageKey(company));
  }
}
