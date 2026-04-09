import { supabase } from '../lib/supabase';
import { UserPermissions } from '../types/permissions';

export interface Member {
  member_id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'user';
  permissions: UserPermissions | null;
  email: string;
  name: string | null;
}

export interface Organization {
  id: string;
  name: string;
}

export class UserService {
  static async listOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async listAllMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('member_details')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  static async updateMemberPermissions(memberId: string, permissions: UserPermissions): Promise<void> {
    console.log('[UserService] updateMemberPermissions chamado:', { memberId, permissions });

    const { data, error } = await supabase
      .from('organization_members')
      .update({ permissions })
      .eq('id', memberId)
      .select();
    
    console.log('[UserService] Resultado do UPDATE:', { data, error });

    if (error) {
      console.error('[UserService] Erro detalhado:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(`Falha ao salvar: ${error.message} (${error.code})`);
    }

    if (!data || data.length === 0) {
      console.warn('[UserService] UPDATE não afetou nenhuma linha. memberId:', memberId);
      throw new Error('Nenhuma linha foi atualizada. Verifique se o ID do membro está correto.');
    }

    console.log('[UserService] Permissões salvas com sucesso:', data);
  }

  static async updateMemberRole(memberId: string, role: 'admin' | 'user'): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);
    
    if (error) throw error;
  }

  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);
    
    if (error) throw error;
  }

  static async addMemberToOrganization(email: string, organizationId: string, role: 'admin' | 'user' = 'user'): Promise<void> {
    // Nota: Em um sistema real, você buscaria o user_id pelo e-mail ou enviaria convite.
    // Como simplificação para o MVP baseado no manual, assumiremos que o administrador insere o ID do usuário
    // ou que existe um processo de convite externo.
    // Para fins de demonstração, vamos apenas reportar que a funcionalidade depende de auth admin.
    console.log(`Adicionando ${email} à organização ${organizationId}`);
  }
}
