/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import InicioPage from './modules/inicio/inicio.page';
import ImportarPage from './modules/importar/importar.page';
import ConfiguracoesPage from './modules/configuracoes/configuracoes.page';
import LoginPage from './modules/auth/login.page';
import { LayoutDashboard, FileUp, Settings, CreditCard, Menu, X, LogOut, Building2, ChevronDown } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Company } from './types/sales';
import { COMPANIES, COMPANY_DATA } from './constants/companies';
import { UserPermissions, DEFAULT_USER_PERMISSIONS, ADMIN_PERMISSIONS } from './types/permissions';
import { supabase } from './lib/supabase';

type Tab = 'inicio' | 'importar' | 'configuracoes';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_USER_PERMISSIONS);
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<Company>('SUPORTE MATRIZ');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        const role = data.role as 'admin' | 'user';
        setUserRole(role);
        setPermissions(role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
      } else {
        setUserRole('user');
        setPermissions(DEFAULT_USER_PERMISSIONS);
      }
    };

    // Initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        fetchUserRole(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
    });

    // Listen to Auth State
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        fetchUserRole(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCompanyChange = (company: Company) => {
    setActiveCompany(company);
    setIsCompanyDropdownOpen(false);
  };

  const tabs = [
    { id: 'inicio', label: 'Início', icon: LayoutDashboard },
    { id: 'importar', label: 'Importar', icon: FileUp },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio': return <InicioPage company={activeCompany} permissions={permissions} />;
      case 'importar': return <ImportarPage company={activeCompany} />;
      case 'configuracoes': return <ConfiguracoesPage userRole={userRole} company={activeCompany} />;
      default: return <InicioPage company={activeCompany} permissions={permissions} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm border border-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=100&h=100" 
              alt="Suporte Agrícola"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-bold text-slate-900">Suporte Agrícola</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || true) && (
          <motion.nav 
            initial={false}
            animate={{ x: 0 }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 transition-transform md:translate-x-0 md:static",
              !isSidebarOpen && "translate-x-[-100%]"
            )}
          >
            <div className="hidden md:flex items-center gap-3 px-2 py-8 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-md border border-slate-100 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=100&h=100" 
                  alt="Suporte Agrícola"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 tracking-tight leading-none">Suporte Agrícola</h1>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Conciliador</p>
              </div>
            </div>

            {/* Company Selector */}
            <div className="relative mb-6">
              <button 
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className="w-full flex flex-col gap-0.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate">{activeCompany}</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isCompanyDropdownOpen && "rotate-180")} />
                </div>
                <p className="text-[9px] text-slate-400 font-mono ml-6">{COMPANY_DATA[activeCompany].cnpj}</p>
              </button>

              <AnimatePresence>
                {isCompanyDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden z-50"
                  >
                    {COMPANIES.map((company) => (
                      <button
                        key={company}
                        onClick={() => handleCompanyChange(company)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 transition-colors",
                          activeCompany === company 
                            ? "bg-emerald-50 text-emerald-700 font-bold" 
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <div className="text-xs font-bold">{company}</div>
                        <div className="text-[9px] font-mono text-slate-400">{COMPANY_DATA[company].cnpj}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as Tab);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100/50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-emerald-600" : "text-slate-400")} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 space-y-3">
              <div className="px-4 py-2 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessão Atual</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5 capitalize">{userRole === 'admin' ? 'Administrador' : 'Usuário Padrão'}</p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair da conta
              </button>
              
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-semibold text-slate-900">Suporte</p>
                <p className="text-[10px] text-slate-500 mt-1">Precisa de ajuda com a conciliação?</p>
                <button className="mt-3 w-full py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  CONTATAR SUPORTE
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activeCompany}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
