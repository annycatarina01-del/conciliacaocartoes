export interface UserPermissions {
  inicio: { 
    view: boolean; 
    editInvoice: boolean; 
    deleteTransaction: boolean; 
    export: boolean; 
    confirmReconciliation: boolean 
  };
  importar: { 
    view: boolean; 
    upload: boolean; 
    deleteFile: boolean 
  };
  configuracoes: { 
    view: boolean; 
    clearData: boolean 
  };
}

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  inicio: { view: true, editInvoice: true, deleteTransaction: false, export: true, confirmReconciliation: true },
  importar: { view: true, upload: true, deleteFile: false },
  configuracoes: { view: false, clearData: false }
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  inicio: { view: true, editInvoice: true, deleteTransaction: true, export: true, confirmReconciliation: true },
  importar: { view: true, upload: true, deleteFile: true },
  configuracoes: { view: true, clearData: true }
};
