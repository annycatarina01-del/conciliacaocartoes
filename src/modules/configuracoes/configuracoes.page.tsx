import React, { useState } from 'react';
import { SalesService } from '../../services/sales.service';
import { Company } from '../../types/sales';
import { UserPermissions, DEFAULT_USER_PERMISSIONS, ADMIN_PERMISSIONS } from '../../types/permissions';
import { COMPANIES } from '../../constants/companies';
import { Settings, Trash2, ShieldCheck, Info, Users, UserPlus, X, Save, LayoutDashboard, FileUp, SlidersHorizontal, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  permissions: UserPermissions;
  allowedCompanies: Company[];
}

interface ConfiguracoesPageProps {
  userRole?: 'admin' | 'user';
  company: Company;
}

const defaultPermissions = DEFAULT_USER_PERMISSIONS;
const adminPermissions = ADMIN_PERMISSIONS;

export default function ConfiguracoesPage({ userRole = 'user', company }: ConfiguracoesPageProps) {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Admin Principal', email: 'admin@conciliador.com', role: 'admin', status: 'active', permissions: adminPermissions, allowedCompanies: [...COMPANIES] },
    { id: 2, name: 'João Silva', email: 'joao@conciliador.com', role: 'user', status: 'active', permissions: defaultPermissions, allowedCompanies: ['SUPORTE MATRIZ'] },
    { id: 3, name: 'Maria Souza', email: 'maria@conciliador.com', role: 'user', status: 'inactive', permissions: defaultPermissions, allowedCompanies: ['SUPORTE MATRIZ'] },
  ]);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleClearData = () => {
    if (confirm(`ATENÇÃO: Isso apagará permanentemente todas as transações importadas da empresa ${company}. Deseja continuar?`)) {
      SalesService.clearAll(company);
      window.location.reload();
    }
  };

  const handlePermissionChange = (module: keyof UserPermissions, action: string, value: boolean) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      permissions: {
        ...editingUser.permissions,
        [module]: {
          ...editingUser.permissions[module],
          [action]: value
        }
      }
    });
  };

  const handleCompanyPermissionChange = (companyName: Company, value: boolean) => {
    if (!editingUser) return;
    
    let newAllowed = [...editingUser.allowedCompanies];
    if (value) {
      if (!newAllowed.includes(companyName)) newAllowed.push(companyName);
    } else {
      newAllowed = newAllowed.filter(c => c !== companyName);
    }

    setEditingUser({
      ...editingUser,
      allowedCompanies: newAllowed
    });
  };

  const handleSavePermissions = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 relative">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 font-medium">Gerencie as preferências do aplicativo e seus dados locais.</p>
      </header>

      {userRole === 'admin' && (
        <section className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Gerenciamento de Usuários</h2>
                <p className="text-xs text-slate-500 font-medium">Área exclusiva para administradores</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 text-sm">
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Função</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                      )}>
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit",
                        user.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", user.status === 'active' ? "bg-emerald-500" : "bg-rose-500")} />
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="flex items-center gap-1.5 ml-auto text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Permissões
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Privacidade e Dados</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex gap-4">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900/70 leading-relaxed font-medium">
                Seus dados são armazenados localmente no seu navegador. 
                Nenhuma informação de transação é enviada para nossos servidores, 
                exceto o texto do PDF que é processado temporariamente pela IA para extração.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Limpeza de Dados</h3>
              <p className="text-xs text-slate-500 mb-5 font-medium leading-relaxed">
                Remova todas as transações e configurações salvas neste dispositivo permanentemente.
              </p>
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all active:scale-95 text-xs uppercase tracking-wider"
              >
                <Trash2 className="w-4 h-4" />
                Apagar Todos os Dados
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sobre o App</h2>
          </div>
          
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-900">Suporte Agrícola - Conciliador v1.0</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ESTÁVEL • LOCAL-FIRST</p>
            </div>
            
            <p className="font-medium text-slate-500">
              Desenvolvido para facilitar a vida de pequenos empreendedores que precisam 
              organizar suas vendas de cartão e garantir que cada uma tenha sua nota fiscal emitida.
            </p>
            
            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                © 2026 Suporte Agrícola.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Permissões de Acesso</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{editingUser.name} ({editingUser.email})</p>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* EMPRESAS MODULE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-slate-900">Acesso às Empresas</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  {COMPANIES.map(companyName => (
                    <PermissionToggle 
                      key={companyName}
                      label={companyName} 
                      checked={editingUser.allowedCompanies.includes(companyName)} 
                      onChange={(v) => handleCompanyPermissionChange(companyName, v)} 
                    />
                  ))}
                </div>
              </div>

              {/* INICIO MODULE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <LayoutDashboard className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-900">Módulo: Início</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <PermissionToggle 
                    label="Visualizar Dashboard" 
                    checked={editingUser.permissions.inicio.view} 
                    onChange={(v) => handlePermissionChange('inicio', 'view', v)} 
                  />
                  <PermissionToggle 
                    label="Editar Nota Fiscal" 
                    checked={editingUser.permissions.inicio.editInvoice} 
                    onChange={(v) => handlePermissionChange('inicio', 'editInvoice', v)} 
                  />
                  <PermissionToggle 
                    label="Excluir Transação" 
                    checked={editingUser.permissions.inicio.deleteTransaction} 
                    onChange={(v) => handlePermissionChange('inicio', 'deleteTransaction', v)} 
                  />
                  <PermissionToggle 
                    label="Exportar Relatórios" 
                    checked={editingUser.permissions.inicio.export} 
                    onChange={(v) => handlePermissionChange('inicio', 'export', v)} 
                  />
                  <PermissionToggle 
                    label="Confirmar Conciliação" 
                    checked={editingUser.permissions.inicio.confirmReconciliation} 
                    onChange={(v) => handlePermissionChange('inicio', 'confirmReconciliation', v)} 
                  />
                </div>
              </div>

              {/* IMPORTAR MODULE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileUp className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-900">Módulo: Importar</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <PermissionToggle 
                    label="Visualizar Arquivos" 
                    checked={editingUser.permissions.importar.view} 
                    onChange={(v) => handlePermissionChange('importar', 'view', v)} 
                  />
                  <PermissionToggle 
                    label="Importar Novos Arquivos" 
                    checked={editingUser.permissions.importar.upload} 
                    onChange={(v) => handlePermissionChange('importar', 'upload', v)} 
                  />
                  <PermissionToggle 
                    label="Excluir Arquivos" 
                    checked={editingUser.permissions.importar.deleteFile} 
                    onChange={(v) => handlePermissionChange('importar', 'deleteFile', v)} 
                  />
                </div>
              </div>

              {/* CONFIGURACOES MODULE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <h4 className="font-bold text-slate-900">Módulo: Configurações</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <PermissionToggle 
                    label="Acessar Configurações" 
                    checked={editingUser.permissions.configuracoes.view} 
                    onChange={(v) => handlePermissionChange('configuracoes', 'view', v)} 
                  />
                  <PermissionToggle 
                    label="Limpar Dados do Sistema" 
                    checked={editingUser.permissions.configuracoes.clearData} 
                    onChange={(v) => handlePermissionChange('configuracoes', 'clearData', v)} 
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingUser(null)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSavePermissions} 
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for toggle switches
const PermissionToggle: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors">
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
      <div className={cn(
        "w-11 h-6 rounded-full transition-colors relative shrink-0",
        checked ? "bg-emerald-500" : "bg-slate-200"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
          checked ? "translate-x-6" : "translate-x-1"
        )} />
      </div>
    </label>
  );
};

