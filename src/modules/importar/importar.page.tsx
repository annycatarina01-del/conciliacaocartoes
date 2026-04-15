import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SalesService } from '../../services/sales.service';
import { Sale, Provider, ImportedFile, Company } from '../../types/sales';
import { UserPermissions } from '../../types/permissions';
import { 
  FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Trash2, 
  CreditCard, FileText, Calendar, CalendarDays, Upload, 
  History, Filter, X, ChevronRight, Loader2, Sparkles, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { PdfUploader } from '../../components/sales/PdfUploader';

interface ImportarPageProps {
  organizationId: string | null;
  company: Company;
  permissions: UserPermissions;
}

export default function ImportarPage({ organizationId, company, permissions }: ImportarPageProps) {
  const [tempSales, setTempSales] = useState<Sale[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('PagBank');
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (organizationId) {
        // Tentar migrar se houver dados locais
        await SalesService.migrateFromLocalStorage(organizationId, company);
        
        const files = await SalesService.getImportedFiles(organizationId);
        setImportedFiles(files);
      }
    };
    loadData();
  }, [organizationId, company]);

  const handlePdfExtracted = useCallback(async (text: string, fileName: string) => {
    setIsProcessing(true);
    setError(null);
    setImportSuccess(false);
    setCurrentFileName(fileName);

    try {
      const result = await SalesService.extractSalesFromText(text, selectedProvider);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      const sortedSales = [...result.sales].sort((a, b) => {
        const parseDate = (d?: string) => {
          if (!d) return 0;
          if (d.includes('/')) {
            const [day, month, year] = d.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
          }
          return new Date(d).getTime();
        };
        return parseDate(a.date) - parseDate(b.date);
      });

      setTempSales(sortedSales as Sale[]);

    } catch (err) {
      console.error("Erro no processamento:", err);
      setError("Erro ao processar o arquivo PDF. Verifique se o formato é legível.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedProvider]);

  const handleConfirmImport = async () => {
    if (!currentFileName || !organizationId) return;

    const fileId = crypto.randomUUID();
    const newFile: ImportedFile = {
      id: fileId,
      fileName: currentFileName,
      importDate: new Date().toISOString(),
      provider: selectedProvider,
      salesCount: tempSales.length
    };

    const salesToSave = tempSales.map(s => ({ ...s, fileId }));

    await SalesService.saveImportedFiles(organizationId, [newFile]);
    await SalesService.saveSales(organizationId, salesToSave);

    setTempSales([]);
    setCurrentFileName(null);
    setImportSuccess(true);
    
    const files = await SalesService.getImportedFiles(organizationId);
    setImportedFiles(files);

    setTimeout(() => setImportSuccess(false), 5000);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!organizationId) return;
    await SalesService.deleteImportedFile(organizationId, fileId);
    const files = await SalesService.getImportedFiles(organizationId);
    setImportedFiles(files);
  };

  const handleCancelExport = () => {
    setTempSales([]);
    setCurrentFileName(null);
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    importedFiles.forEach(f => {
      const dateObj = new Date(f.importDate);
      if (!isNaN(dateObj.getTime())) {
        const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthStr);
      }
    });
    return Array.from(months).sort().reverse();
  }, [importedFiles]);

  const filteredFiles = importedFiles.filter(f => {
    if (selectedMonth === 'all') return true;
    const dateObj = new Date(f.importDate);
    if (!isNaN(dateObj.getTime())) {
      const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      return monthStr === selectedMonth;
    }
    return false;
  });

  const providers: { id: Provider, name: string, icon: any }[] = [
    { id: 'PagBank', name: 'PagBank', icon: CreditCard },
    { id: 'Mulvi', name: 'Mulvi', icon: Sparkles },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header com Glassmorphism */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-2xl overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-50">Módulo de Conciliação</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Importar Relatórios</h1>
            <p className="text-emerald-100 max-w-md font-medium">Extraia transações de arquivos PDF instantaneamente usando nossa tecnologia de IA.</p>
          </div>
          <div className="flex gap-4">
            <div className="px-6 py-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 text-center min-w-[140px]">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-tighter">Total Mensal</p>
              <p className="text-2xl font-black mt-1">{importedFiles.length}</p>
              <p className="text-[9px] text-emerald-300/60 font-medium">Arquivos Processados</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Esquerda: Config e Upload */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Seletor de Provedor */}
          <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              1. Selecione o Provedor
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300",
                    selectedProvider === p.id 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-200/50" 
                      : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    selectedProvider === p.id ? "bg-emerald-500 text-white" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
                  )}>
                    <p.icon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">{p.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Área de Upload */}
          {permissions.importar.upload && !tempSales.length && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <PdfUploader 
                onTextExtracted={handlePdfExtracted}
                isProcessing={isProcessing}
              />
              
              <div className="flex items-center gap-2 justify-center px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-100">
                <FileText className="w-3.5 h-3.5" />
                SISTEMA OTIMIZADO PARA PDF
              </div>
            </motion.section>
          )}

          {/* Preview de Vendas */}
          {tempSales.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">Preview da Importação</h3>
                  <p className="text-xs text-slate-500 font-medium">{tempSales.length} transações encontradas em <span className="text-emerald-600 font-semibold">{currentFileName}</span></p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancelExport}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={handleConfirmImport}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    CONFIRMAR
                  </button>
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tempSales.map((sale) => (
                      <tr key={sale.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700">{new Date(sale.date).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Postado</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{sale.description}</p>
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            Extração por IA
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "text-sm font-black tracking-tight",
                            sale.amount < 0 ? "text-rose-600" : "text-emerald-600"
                          )}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Erro */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-2xl flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Falha no Processamento</p>
                <p className="text-xs opacity-75 font-medium">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Sucesso */}
          {importSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-2xl flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 shadow-sm" />
              </div>
              <div>
                <p className="text-sm font-bold">Importação Concluída!</p>
                <p className="text-xs opacity-75 font-medium">Os dados foram integrados com sucesso à sua conta.</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Coluna Direita: Histórico */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden sticky top-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Histórico Recente
              </h2>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">Todos os Meses</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {month.split('-')[1]}/{month.split('-')[0]}
                    </option>
                  ))}
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="p-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredFiles.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Nenhum histórico encontrado</p>
                    <p className="text-[10px] text-slate-300">Comece importando seu primeiro arquivo PDF.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="group p-4 rounded-3xl bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex items-center gap-4"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        file.provider === 'PagBank' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={file.fileName}>
                          {file.fileName}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(file.importDate).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                            {file.salesCount} vendas
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}