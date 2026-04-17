import { GoogleGenAI, Type } from "@google/genai";
import { Sale, ExtractionResult, Provider, ImportedFile, Company } from "../types/sales";
import { supabase } from "../lib/supabase";

const getAI = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || 
              (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null);
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

export class SalesService {
  static async extractSalesFromText(text: string, provider: Provider): Promise<ExtractionResult> {
    const ai = getAI();
    if (!ai) {
      return { sales: [], error: "Configuração de IA (Gemini API Key) não encontrada." };
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Analise o seguinte texto extraído de um relatório de vendas da maquininha ${provider} e extraia uma lista de vendas estruturada.
        REGRAS IMPORTANTES:
        1. O campo "date" deve ser copiado EXATAMENTE como aparece no relatório original, incluindo data e hora se presentes (ex: "17/04/2026 14:35" ou "17/04/2026 14:35:22"). NÃO converta para formato ISO nem remova a hora.
        2. É fundamental extrair com precisão os valores de TAXA e VALOR LÍQUIDO de cada transação, conforme aparecem no relatório original.
        
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
                    date: { type: Type.STRING, description: "Data e hora da venda exatamente como aparece no relatório original (ex: 17/04/2026 14:35 ou 17/04/2026). NÃO converter para ISO." },
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

  static async getSales(organizationId: string): Promise<Sale[]> {
    if (!organizationId) return [];

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Erro ao buscar vendas:", error);
      return [];
    }

    return (data || []).map(s => ({
      id: s.id,
      date: s.date,
      amount: Number(s.amount),
      description: s.description,
      cardBrand: s.card_brand,
      lastFourDigits: s.last_four_digits,
      invoiceNumber: s.invoice_number,
      status: s.status as 'pending' | 'concilied',
      provider: s.provider as Provider,
      installments: s.installments,
      fileId: s.file_id,
      observation: s.observation,
      fee: s.fee ? Number(s.fee) : undefined,
      netAmount: s.net_amount ? Number(s.net_amount) : undefined
    }));
  }

  static async saveSales(organizationId: string, sales: Sale[]): Promise<void> {
    if (!organizationId || sales.length === 0) return;

    const salesToInsert = sales.map(s => ({
      id: s.id,
      organization_id: organizationId,
      date: s.date,
      amount: s.amount,
      description: s.description,
      card_brand: s.cardBrand,
      last_four_digits: s.lastFourDigits,
      invoice_number: s.invoiceNumber,
      status: s.status,
      provider: s.provider,
      installments: s.installments,
      file_id: s.fileId,
      observation: s.observation,
      fee: s.fee,
      net_amount: s.netAmount
    }));

    const { error } = await supabase
      .from('sales')
      .upsert(salesToInsert);

    if (error) {
      console.error("Erro ao salvar vendas:", error);
    }
  }

  static async getImportedFiles(organizationId: string): Promise<ImportedFile[]> {
    if (!organizationId) return [];

    const { data, error } = await supabase
      .from('imported_files')
      .select('*')
      .eq('organization_id', organizationId)
      .order('import_date', { ascending: false });

    if (error) {
      console.error("Erro ao buscar arquivos:", error);
      return [];
    }

    return (data || []).map(f => ({
      id: f.id,
      fileName: f.file_name,
      importDate: f.import_date,
      provider: f.provider as Provider,
      salesCount: f.sales_count
    }));
  }

  static async saveImportedFiles(organizationId: string, files: ImportedFile[]): Promise<void> {
    if (!organizationId || files.length === 0) return;

    const filesToInsert = files.map(f => ({
      id: f.id,
      organization_id: organizationId,
      file_name: f.fileName,
      import_date: f.importDate,
      provider: f.provider,
      sales_count: f.salesCount
    }));

    const { error } = await supabase
      .from('imported_files')
      .upsert(filesToInsert);

    if (error) {
      console.error("Erro ao salvar arquivos:", error);
    }
  }

  static async deleteImportedFile(organizationId: string, fileId: string): Promise<void> {
    if (!organizationId || !fileId) return;

    // Primeiro deletar vendas associadas (embora o banco possa ter cascata, garantimos aqui)
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .eq('file_id', fileId)
      .eq('organization_id', organizationId);

    if (salesError) {
      console.error("Erro ao deletar vendas do arquivo:", salesError);
    }

    const { error: fileError } = await supabase
      .from('imported_files')
      .delete()
      .eq('id', fileId)
      .eq('organization_id', organizationId);

    if (fileError) {
      console.error("Erro ao deletar arquivo:", fileError);
    }
  }

  static async updateSaleInvoice(organizationId: string, saleId: string, invoiceNumber: string): Promise<void> {
    if (!organizationId) return;
    const { error } = await supabase
      .from('sales')
      .update({ invoice_number: invoiceNumber })
      .eq('id', saleId)
      .eq('organization_id', organizationId);
    
    if (error) console.error("Erro ao atualizar NF:", error);
  }

  static async updateSaleStatus(organizationId: string, saleId: string, status: 'pending' | 'concilied'): Promise<void> {
    if (!organizationId) return;
    const { error } = await supabase
      .from('sales')
      .update({ status })
      .eq('id', saleId)
      .eq('organization_id', organizationId);

    if (error) console.error("Erro ao atualizar status:", error);
  }

  static async updateSaleObservation(organizationId: string, saleId: string, observation: string): Promise<void> {
    if (!organizationId) return;
    const { error } = await supabase
      .from('sales')
      .update({ observation })
      .eq('id', saleId)
      .eq('organization_id', organizationId);

    if (error) console.error("Erro ao atualizar observação:", error);
  }

  static async deleteSale(organizationId: string, saleId: string): Promise<void> {
    if (!organizationId) return;
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId)
      .eq('organization_id', organizationId);

    if (error) console.error("Erro ao deletar venda:", error);
  }

  static async clearAll(organizationId: string): Promise<void> {
    if (!organizationId) return;
    await supabase.from('sales').delete().eq('organization_id', organizationId);
    await supabase.from('imported_files').delete().eq('organization_id', organizationId);
  }

  // Helper para migrar dados do localStorage para o Supabase (executado uma vez se necessário)
  static async migrateFromLocalStorage(organizationId: string, company: Company): Promise<void> {
    const storageKey = `vendas_data_${company}`;
    const filesKey = `imported_files_data_${company}`;
    
    const localSales = localStorage.getItem(storageKey);
    const localFiles = localStorage.getItem(filesKey);

    if (localSales || localFiles) {
      console.log("Iniciando migração de dados locais para Supabase...");
      
      if (localFiles) {
        const files = JSON.parse(localFiles) as ImportedFile[];
        await this.saveImportedFiles(organizationId, files);
        localStorage.removeItem(filesKey);
      }

      if (localSales) {
        const sales = JSON.parse(localSales) as Sale[];
        await this.saveSales(organizationId, sales);
        localStorage.removeItem(storageKey);
      }
      
      console.log("Migração concluída com sucesso.");
    }
  }
}

