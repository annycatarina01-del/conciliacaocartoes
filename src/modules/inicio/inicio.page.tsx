import React, { useState, useEffect, useMemo } from 'react';
import { SalesService } from '../../services/sales.service';
import { Sale, Provider, Company } from '../../types/sales';
import { UserPermissions } from '../../types/permissions';
import { COMPANY_DATA } from '../../constants/companies';
import { SalesTable } from '../../components/sales/SalesTable';
import { LayoutDashboard, TrendingUp, CheckCircle, Clock, CreditCard, CalendarDays, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InicioPageProps {
  company: Company;
  permissions: UserPermissions;
}

export default function InicioPage({ company, permissions }: InicioPageProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<Provider>('PagBank');
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [showEmptyExportAlert, setShowEmptyExportAlert] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    setSales(SalesService.getSales(company));
  }, [company]);

  const handleUpdateInvoice = (id: string, invoice: string) => {
    SalesService.updateSaleInvoice(company, id, invoice);
    setSales(SalesService.getSales(company));
  };

  const handleUpdateObservation = (id: string, observation: string) => {
    SalesService.updateSaleObservation(company, id, observation);
    setSales(SalesService.getSales(company));
  };

  const handleUpdateStatus = (id: string, status: 'pending' | 'concilied') => {
    SalesService.updateSaleStatus(company, id, status);
    setSales(SalesService.getSales(company));
  };

  const handleDeleteSale = (id: string) => {
    setSaleToDelete(id);
  };

  const confirmDeleteSale = () => {
    if (saleToDelete) {
      SalesService.deleteSale(company, saleToDelete);
      setSales(SalesService.getSales(company));
      setSaleToDelete(null);
    }
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    // Sempre incluir o mês atual
    const d = new Date();
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);

    sales.forEach(s => {
      let dateObj;
      if (s.date.includes('/')) {
        const parts = s.date.split('/');
        if (parts.length === 3) {
          // Assuming DD/MM/YYYY
          dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        dateObj = new Date(s.date);
      }
      
      if (dateObj && !isNaN(dateObj.getTime())) {
        const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthStr);
      }
    });
    return Array.from(months).sort().reverse();
  }, [sales]);

  const filteredSales = sales.filter(s => {
    if (s.provider !== activeTab) return false;
    if (selectedMonth === 'all') return true;
    
    let dateObj;
    if (s.date.includes('/')) {
      const parts = s.date.split('/');
      if (parts.length === 3) {
        dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      dateObj = new Date(s.date);
    }
    
    if (dateObj && !isNaN(dateObj.getTime())) {
      const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      return monthStr === selectedMonth;
    }
    return false;
  });

  const linkedCount = filteredSales.filter(s => s.status === 'concilied').length;
  const totalAmount = filteredSales.reduce((acc, s) => acc + s.amount, 0);

  const formatMonth = (monthStr: string) => {
    if (monthStr === 'all') return 'Todos os meses';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const handleExportPDF = () => {
    if (filteredSales.length === 0) {
      setShowEmptyExportAlert(true);
      return;
    }

    const doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a4'
    });
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(company, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`CNPJ: ${COMPANY_DATA[company].cnpj}`, 14, 26);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Relatório de Transações - ${activeTab}`, 14, 36);
    
    // Subtitle / Filter info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Mês: ${formatMonth(selectedMonth)}`, 14, 44);
    doc.text(`Total de Transações: ${filteredSales.length}`, 14, 50);
    doc.text(`Volume Financeiro: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}`, 14, 56);

    const tableColumn = ["Data", "Descrição", "Bandeira", "Parcelas", "Valor Bruto", "Taxa", "Valor Líquido", "NF", "Observações"];
    const tableRows = filteredSales.map(s => [
      s.date,
      s.description,
      s.cardBrand || '-',
      s.installments ? `${s.installments}x` : '1x',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.amount),
      s.fee ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.fee) : '-',
      s.netAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.netAmount) : '-',
      s.invoiceNumber || '-',
      s.observation || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 62,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }, // Indigo 600
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      columnStyles: {
        0: { cellWidth: 25 }, // Data
        1: { cellWidth: 'auto' }, // Descrição
        2: { cellWidth: 25 }, // Bandeira
        3: { cellWidth: 20 }, // Parcelas
        4: { cellWidth: 30 }, // Valor Bruto
        5: { cellWidth: 25 }, // Taxa
        6: { cellWidth: 30 }, // Valor Líquido
        7: { cellWidth: 20 }, // NF
        8: { cellWidth: 40 }, // Observações
      }
    });

    doc.save(`relatorio_${company.replace(/\s+/g, '_')}_${activeTab.toLowerCase()}_${selectedMonth}.pdf`);
  };

  const primaryColor = activeTab === 'PagBank' ? 'emerald-500' : 'emerald-600';

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500 font-medium">Gerencie as transações e vincule Notas Fiscais.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Month Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <CalendarDays className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm appearance-none cursor-pointer"
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

          {/* Provider Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200/50">
            {(['PagBank', 'Mulvi'] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === p
                    ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  p === 'PagBank' ? "bg-emerald-500" : "bg-emerald-600"
                )} />
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI Cards for Active Tab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="kpi-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Transações {activeTab}</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{filteredSales.length}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>VOLUME TOTAL EXTRAÍDO</span>
          </div>
        </div>
        <div className="kpi-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Volume Financeiro</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500">
            <TrendingUp className="w-3 h-3" />
            <span>VALOR BRUTO</span>
          </div>
        </div>
        <div className="kpi-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status de Conciliação</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-emerald-600 tabular-nums">{linkedCount}</p>
            <p className="text-sm text-slate-400 font-medium">de {filteredSales.length} conciliadas</p>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(linkedCount / (filteredSales.length || 1)) * 100}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
              activeTab === 'PagBank' ? "bg-emerald-500 shadow-emerald-100" : "bg-emerald-600 shadow-emerald-100"
            )}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Listagem de Vendas</h2>
              <p className="text-xs text-slate-500 font-medium">Vincule o número da NF para cada transação</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              ÚLTIMA ATUALIZAÇÃO: AGORA
            </div>
          </div>
        </div>

        <div className="p-2">
          <SalesTable 
            sales={filteredSales} 
            onUpdateInvoice={handleUpdateInvoice} 
            onUpdateObservation={handleUpdateObservation}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteSale} 
            canConfirmReconciliation={permissions.inicio.confirmReconciliation}
          />
        </div>
      </section>

      {/* Confirmation Modal for Sale Delete */}
      <AnimatePresence>
        {saleToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Transação?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSaleToDelete(null)}
                  className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSale}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-rose-100"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty Export Alert */}
      <AnimatePresence>
        {showEmptyExportAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sem dados para exportar</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Não há transações para exportar com os filtros atuais. Tente mudar o mês ou o provedor.
              </p>
              <button
                onClick={() => setShowEmptyExportAlert(false)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-100"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
