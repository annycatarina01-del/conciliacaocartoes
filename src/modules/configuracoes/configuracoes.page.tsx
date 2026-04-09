import React, { useState, useEffect } from 'react';
import { SalesService } from '../../services/sales.service';
import { UserService, Member, Organization } from '../../services/user.service';
import { Company } from '../../types/sales';
import { UserPermissions, DEFAULT_USER_PERMISSIONS, ADMIN_PERMISSIONS } from '../../types/permissions';
import { COMPANIES } from '../../constants/companies';
import { Settings, Trash2, ShieldCheck, Info, Users, UserPlus, X, Save, LayoutDashboard, FileUp, SlidersHorizontal, Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfiguracoesPageProps {
  userRole?: 'admin' | 'user';
  company: Company;
  permissions?: UserPermissions;
}

type Tab = 'geral' | 'permissoes';

export default function ConfiguracoesPage({ userRole = 'user', company, permissions }: ConfiguracoesPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [members, setMembers] = useState<Member[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'permissoes' && userRole === 'admin') {
      loadData();
    }
  }, [activeTab, userRole]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersData, orgsData] = await Promise.all([
        UserService.listAllMembers(),
        UserService.listOrganizations()
      ]);
      setMembers(membersData);
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    if (confirm(`ATENÇÃO: Isso apagará permanentemente todas as transações importadas da empresa ${company}. Deseja continuar?`)) {
      SalesService.clearAll(company);
      window.location.reload();
    }
  };

  const handlePermissionChange = (module: keyof UserPermissions, action: string, value: boolean) => {
    if (!editingMember) return;
    const currentPermissions = editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
    
    setEditingMember({
      ...editingMember,
      permissions: {
        ...currentPermissions,
        [module]: {
          ...currentPermissions[module],
          [action]: value
        }
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!editingMember) return;
    setIsLoading(true);
    setErrorMsg('');

    // Garante que as permissões nunca sejam nulas
    const resolvedPermissions = editingMember.permissions 
      || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);

    try {
      await UserService.updateMemberPermissions(editingMember.member_id, resolvedPermissions);
      // Fechar modal e mostrar sucesso ANTES de recarregar a lista
      setEditingMember(null);
      showSuccess('Permissões atualizadas com sucesso!');
      // Recarregar a lista em background (sem bloquear o UX)
      loadData().catch(e => console.warn('Erro ao recarregar lista:', e));
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error);
      setErrorMsg(error?.message || 'Erro desconhecido ao salvar. Verifique o console.');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const renderGeralTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            {permissions?.configuracoes?.clearData !== false ? (
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all active:scale-95 text-xs uppercase tracking-wider"
              >
                <Trash2 className="w-4 h-4" />
                Apagar Todos os Dados
              </button>
            ) : (
              <p className="text-xs text-slate-400 font-medium italic">Sem permissão para apagar dados.</p>
            )}
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ESTÁVEL • MULTI-USER READY</p>
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
  );

  const renderPermissoesTab = () => (
    <section className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Gerenciamento de Usuários</h2>
            <p className="text-xs text-slate-500 font-medium">Controle de acesso por empresa e módulo</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 text-sm opacity-50 cursor-not-allowed">
          <UserPlus className="w-4 h-4" />
          Convidar Usuário
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nome / Empresa</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                  Carregando usuários...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.member_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{member.name || 'Sem nome'}</div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                      {organizations.find(o => o.id === member.organization_id)?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      member.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                    )}>
                      {member.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setEditingMember(member)}
                      className="flex items-center gap-1.5 ml-auto text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Permissões
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 relative">
      {successMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">{successMsg}</span>
        </div>
      )}

      <header className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 font-medium">Gerencie o sistema e permissões de acesso.</p>
        </div>

        <nav className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('geral')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'geral' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Geral
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('permissoes')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'permissoes' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Usuários e Permissões
            </button>
          )}
        </nav>
      </header>

      {activeTab === 'geral' ? renderGeralTab() : renderPermissoesTab()}

      {/* Permissions Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Permissões de Acesso</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{editingMember.name || editingMember.email} ({editingMember.role})</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                  Empresa: {organizations.find(o => o.id === editingMember.organization_id)?.name}
                </p>
              </div>
              <button 
                onClick={() => setEditingMember(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Note about companies */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-amber-900 font-bold uppercase tracking-wider">Gestão Multi-Empresa</p>
                  <p className="text-[11px] text-amber-900/70 leading-relaxed font-medium">
                    As permissões abaixo aplicam-se exclusivamente à empresa selecionada acima. 
                    Para conceder acesso a outra empresa, utilize o recurso de "Convidar Usuário".
                  </p>
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
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).inicio.view} 
                    onChange={(v) => handlePermissionChange('inicio', 'view', v)} 
                  />
                  <PermissionToggle 
                    label="Editar Nota Fiscal" 
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).inicio.editInvoice} 
                    onChange={(v) => handlePermissionChange('inicio', 'editInvoice', v)} 
                  />
                  <PermissionToggle 
                    label="Excluir Transação" 
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).inicio.deleteTransaction} 
                    onChange={(v) => handlePermissionChange('inicio', 'deleteTransaction', v)} 
                  />
                  <PermissionToggle 
                    label="Exportar Relatórios" 
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).inicio.export} 
                    onChange={(v) => handlePermissionChange('inicio', 'export', v)} 
                  />
                  <PermissionToggle 
                    label="Confirmar Conciliação" 
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).inicio.confirmReconciliation} 
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
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).importar.view} 
                    onChange={(v) => handlePermissionChange('importar', 'view', v)} 
                  />
                  <PermissionToggle 
                    label="Importar Novos Arquivos" 
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).importar.upload} 
                    onChange={(v) => handlePermissionChange('importar', 'upload', v)} 
                  />
                  <PermissionToggle 
                    label="Excluir Arquivos" 
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).importar.deleteFile} 
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
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).configuracoes.view} 
                    onChange={(v) => handlePermissionChange('configuracoes', 'view', v)} 
                  />
                  <PermissionToggle 
                    label="Limpar Dados do Sistema" 
                    checked={(editingMember.permissions || (editingMember.role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)).configuracoes.clearData} 
                    onChange={(v) => handlePermissionChange('configuracoes', 'clearData', v)} 
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-3">
              {errorMsg && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  ⚠️ {errorMsg}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { setEditingMember(null); setErrorMsg(''); }} 
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSavePermissions} 
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Permissões
                </button>
              </div>
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
    <div
      className="flex items-center justify-between gap-3 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
      onClick={() => onChange(!checked)}
    >
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
      <div className={cn(
        "w-11 h-6 rounded-full transition-colors relative shrink-0 pointer-events-none",
        checked ? "bg-emerald-500" : "bg-slate-200"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
          checked ? "translate-x-6" : "translate-x-1"
        )} />
      </div>
    </div>
  );
};

