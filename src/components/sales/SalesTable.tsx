import React from 'react';
import { Sale } from '../../types/sales';
import { CheckCircle2, Circle, Trash2, Hash, CreditCard, MessageSquare } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';


interface SalesTableProps {
  sales: Sale[];
  onUpdateInvoice: (id: string, invoice: string) => void;
  onUpdateObservation: (id: string, observation: string) => void;
  onUpdateStatus: (id: string, status: 'pending' | 'concilied') => void;
  onDelete: (id: string) => void;
  canConfirmReconciliation?: boolean;
  canDelete?: boolean;
  canEditInvoice?: boolean;
}

export const SalesTable: React.FC<SalesTableProps> = ({ 
  sales, 
  onUpdateInvoice, 
  onUpdateObservation, 
  onUpdateStatus, 
  onDelete,
  canConfirmReconciliation = true,
  canDelete = true,
  canEditInvoice = true,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Parcelas</th>
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</th>
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nota Fiscal</th>
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observações</th>
            <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sales.map((sale) => (
            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <button 
                  onClick={() => canConfirmReconciliation && onUpdateStatus(sale.id, sale.status === 'pending' ? 'concilied' : 'pending')}
                  disabled={!canConfirmReconciliation}
                  className={cn(
                    "focus:outline-none transition-transform active:scale-90",
                    !canConfirmReconciliation && "opacity-50 cursor-not-allowed"
                  )}
                  title={!canConfirmReconciliation ? "Você não tem permissão para conciliar" : ""}
                >
                  {sale.status === 'concilied' ? (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Conciliado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md border border-amber-100">
                      <Circle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Pendente</span>
                    </div>
                  )}
                </button>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 font-mono">{formatDate(sale.date)}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-slate-900">{sale.description}</div>
                {sale.cardBrand && (
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {sale.cardBrand} {sale.lastFourDigits ? `**** ${sale.lastFourDigits}` : ''}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  sale.installments && sale.installments > 1 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : "bg-slate-100 text-slate-500"
                )}>
                  {sale.installments && sale.installments > 1 ? `${sale.installments}x` : 'À vista'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
              </td>
              <td className="px-6 py-4">
                <div className="relative flex items-center group/input">
                  <Hash className="absolute left-3 w-3.5 h-3.5 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Número da NF"
                    value={sale.invoiceNumber || ''}
                    onChange={(e) => canEditInvoice && onUpdateInvoice(sale.id, e.target.value)}
                    readOnly={!canEditInvoice}
                    className={cn(
                      "pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all w-32",
                      !canEditInvoice && "cursor-not-allowed opacity-60"
                    )}
                  />
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="relative flex items-center group/input">
                  <MessageSquare className="absolute left-3 w-3.5 h-3.5 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Observações..."
                    value={sale.observation || ''}
                    onChange={(e) => onUpdateObservation(sale.id, e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all w-40"
                  />
                </div>
              </td>
              <td className="px-6 py-4">
                {canDelete && (
                  <button
                    onClick={() => onDelete(sale.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    title="Excluir transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sales.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-slate-400 font-medium">Nenhuma transação encontrada.</p>
          <p className="text-xs text-slate-300 mt-1">Importe um relatório para começar.</p>
        </div>
      )}
    </div>
  );
};
