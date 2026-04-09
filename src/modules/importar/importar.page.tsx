import React, { useState, useEffect, useMemo } from 'react';
import { SalesService } from '../../services/sales.service';
import { Sale, Provider, ImportedFile, Company } from '../../types/sales';
import { PdfUploader } from '../../components/sales/PdfUploader';
import { FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Trash2, CreditCard, FileText, Calendar, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface ImportarPageProps {
  company: Company;
}

export default function ImportarPage({ company }: ImportarPageProps) {
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
    setImportedFiles(SalesService.getImportedFiles(company));
  }, [company]);

  const handleTextExtracted = async (text: string, fileName: string) => {
    setIsProcessing(true);
    setError(null);
    setImportSuccess(false);
    setCurrentFileName(fileName);
    
    try {
      const result = await SalesService.extractSalesFromText(text, selectedProvider);
      if (result.error) {
        setError(result.error);
      } else {
        setTempSales(result.sales as Sale[]);
      }
    } catch (err) {
      setError("Erro ao processar o relatório. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!currentFileName) return;

    const fileId = crypto.randomUUID();
    const newFile: ImportedFile = {
      id: fileId,
      fileName: currentFileName,
      importDate: new Date().toISOString(),
      provider: selectedProvider,
      salesCount: tempSales.length
    };

    const salesToSave = tempSales.map(s => ({ ...s, fileId }));

    const existingFiles = SalesService.getImportedFiles(company);
    SalesService.saveImportedFiles(company, [newFile, ...existingFiles]);

    const existingSales = SalesService.getSales(company);
    SalesService.saveSales(company, [...existingSales, ...salesToSave]);

    setTempSales([]);
    setCurrentFileName(null);
    setImportSuccess(true);
    setImportedFiles(SalesService.getImportedFiles(company));
  };

  const handleRemoveTemp = (id: string) => {
    setTempSales(tempSales.filter(s => s.id !== id));
  };

  const handleDeleteFile = (fileId: string) => {
    setFileToDelete(fileId);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      SalesService.deleteImportedFile(company, fileToDelete);
      setImportedFiles(SalesService.getImportedFiles(company));
      setFileToDelete(null);
    }
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

  const formatMonth = (monthStr: string) => {
    if (monthStr === 'all') return 'Todos os meses';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Importar Relatório</h1>
        <p className="text-slate-500 font-medium">Selecione o provedor e envie o PDF para extração automática.</p>
      </header>

      <div className="space-y-8">
        {/* Provider Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['PagBank', 'Mulvi'] as Provider[]).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={cn(
                "p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden",
                selectedProvider === p
                  ? p === 'PagBank' 
                    ? "border-emerald-500 bg-emerald-50/30" 
                    : "border-emerald-600 bg-emerald-50/30"
                  : "border-slate-100 bg-white hover:border-slate-200"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm",
                p === 'PagBank' ? "bg-emerald-500 text-white" : "bg-emerald-600 text-white"
              )}>
                <CreditCard className="w-6 h-6" />
              </div>
              <p className={cn(
                "font-bold text-lg",
                selectedProvider === p ? "text-slate-900" : "text-slate-400"
              )}>{p}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium tracking-tight">Relatórios de vendas {p}</p>
              
              {selectedProvider === p && (
                <motion.div 
                  layoutId="active-provider"
                  className={cn(
                    "absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white",
                    p === 'PagBank' ? "bg-emerald-500" : "bg-emerald-600"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              )}
            </button>
          ))}
        </div>

        {/* Uploader Section */}
        <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <PdfUploader onTextExtracted={handleTextExtracted} isProcessing={isProcessing} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
          {importSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">Vendas importadas com sucesso! Veja-as na página de Início.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {tempSales.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Revisar Importação</h2>
                <p className="text-xs text-slate-500 font-medium">Confirme se os dados extraídos estão corretos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setTempSales([]);
                  setCurrentFileName(null);
                }}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Confirmar Importação
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Parcelas</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tempSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4 text-sm text-slate-500 font-mono">{sale.date}</td>
                    <td className="px-8 py-4">
                      <div className="text-sm font-bold text-slate-900">{sale.description}</div>
                      {sale.cardBrand && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sale.cardBrand}</span>}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                        {sale.installments && sale.installments > 1 ? `${sale.installments}x` : '1x'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                    </td>
                    <td className="px-8 py-4">
                      <button
                        onClick={() => handleRemoveTemp(sale.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {/* Imported Files List */}
      {importedFiles.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Arquivos Importados</h2>
            
            {/* Month Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <CalendarDays className="w-4 h-4 text-slate-400" />
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-10 pr-8 py-2 bg-white border border-slate-200/60 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm appearance-none cursor-pointer"
              >
                <option value="all">Todos os meses</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arquivo</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provedor</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data de Importação</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Vendas</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.fileName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          file.provider === 'PagBank' 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-emerald-100/50 text-emerald-800 border border-emerald-200"
                        )}>
                          {file.provider}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(file.importDate).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{file.salesCount}</span>
                      </td>
                      <td className="px-8 py-4">
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Excluir arquivo e vendas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-8 text-center text-sm text-slate-500 font-medium">
                        Nenhum arquivo encontrado para o mês selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      {/* Confirmation Modal */}
      <AnimatePresence>
        {fileToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Arquivo?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Tem certeza que deseja excluir este arquivo? Todas as vendas associadas a ele também serão removidas permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setFileToDelete(null)}
                  className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteFile}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-rose-100"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
