export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      planos: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          preco_mensal: number;
          user_limit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          preco_mensal?: number;
          user_limit?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          preco_mensal?: number;
          user_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          nome_fantasia: string | null;
          razao_social: string | null;
          cnpj: string | null;
          plano_id: string | null;
          status: string;
          user_limit: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome_fantasia?: string | null;
          razao_social?: string | null;
          cnpj?: string | null;
          plano_id?: string | null;
          status?: string;
          user_limit?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome_fantasia?: string | null;
          razao_social?: string | null;
          cnpj?: string | null;
          plano_id?: string | null;
          status?: string;
          user_limit?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      perfis: {
        Row: {
          id: string;
          tenant_id: string | null;
          nome: string | null;
          email: string | null;
          foto_url: string | null;
          role: string;
          status: string | null;
          telefone: string | null;
          data_nascimento: string | null;
          data_inicio_vinculo: string | null;
          data_fim_vinculo: string | null;
          cnpj: string | null;
          razao_social: string | null;
          valor_hora: number | null;
          endereco: string | null;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id?: string | null;
          nome?: string | null;
          email?: string | null;
          foto_url?: string | null;
          role?: string;
          status?: string | null;
          telefone?: string | null;
          data_nascimento?: string | null;
          data_inicio_vinculo?: string | null;
          data_fim_vinculo?: string | null;
          cnpj?: string | null;
          razao_social?: string | null;
          valor_hora?: number | null;
          endereco?: string | null;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          nome?: string | null;
          email?: string | null;
          foto_url?: string | null;
          role?: string;
          status?: string | null;
          telefone?: string | null;
          data_nascimento?: string | null;
          data_inicio_vinculo?: string | null;
          data_fim_vinculo?: string | null;
          cnpj?: string | null;
          razao_social?: string | null;
          valor_hora?: number | null;
          endereco?: string | null;
          observacoes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          tenant_id: string | null;
          nome: string;
          categoria: string | null;
          status: string | null;
          responsavel: string | null;
          foto_url: string | null;
          telefone: string | null;
          endereco: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          nome: string;
          categoria?: string | null;
          status?: string | null;
          responsavel?: string | null;
          foto_url?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          nome?: string;
          categoria?: string | null;
          status?: string | null;
          responsavel?: string | null;
          foto_url?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      visitas: {
        Row: {
          id: string;
          tenant_id: string | null;
          cliente_id: string | null;
          usuario_id: string | null;
          status: string;
          data_visita: string;
          hora_inicio: string | null;
          check_in: string | null;
          check_in_local: string | null;
          check_out: string | null;
          check_out_local: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          status?: string;
          data_visita: string;
          hora_inicio?: string | null;
          check_in?: string | null;
          check_in_local?: string | null;
          check_out?: string | null;
          check_out_local?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          status?: string;
          data_visita?: string;
          hora_inicio?: string | null;
          check_in?: string | null;
          check_in_local?: string | null;
          check_out?: string | null;
          check_out_local?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      receitas: {
        Row: {
          id: string;
          tenant_id: string | null;
          cliente_id: string | null;
          usuario_id: string | null;
          descricao: string;
          valor: number;
          data_lancamento: string;
          categoria: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          descricao: string;
          valor: number;
          data_lancamento?: string;
          categoria?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          descricao?: string;
          valor?: number;
          data_lancamento?: string;
          categoria?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      custos: {
        Row: {
          id: string;
          tenant_id: string | null;
          usuario_id: string | null;
          descricao: string;
          valor: number;
          data_lancamento: string;
          categoria: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          usuario_id?: string | null;
          descricao: string;
          valor: number;
          data_lancamento?: string;
          categoria?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          usuario_id?: string | null;
          descricao?: string;
          valor?: number;
          data_lancamento?: string;
          categoria?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      requisicoes: {
        Row: {
          id: string;
          tenant_id: string | null;
          solicitante_id: string | null;
          status: string | null;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          solicitante_id?: string | null;
          status?: string | null;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          solicitante_id?: string | null;
          status?: string | null;
          observacoes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      itens_catalogo: {
        Row: {
          id: string;
          tenant_id: string | null;
          nome: string;
          categoria: string | null;
          unidade: string | null;
          preco_unitario: number | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          nome: string;
          categoria?: string | null;
          unidade?: string | null;
          preco_unitario?: number | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          nome?: string;
          categoria?: string | null;
          unidade?: string | null;
          preco_unitario?: number | null;
          ativo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      reembolsos: {
        Row: {
          id: string;
          tenant_id: string | null;
          usuario_id: string | null;
          data_solicitacao: string;
          valor: number;
          status: string | null;
          motivo: string | null;
          anexo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          usuario_id?: string | null;
          data_solicitacao?: string;
          valor: number;
          status?: string | null;
          motivo?: string | null;
          anexo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          usuario_id?: string | null;
          data_solicitacao?: string;
          valor?: number;
          status?: string | null;
          motivo?: string | null;
          anexo_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      validades: {
        Row: {
          id: string;
          tenant_id: string | null;
          cliente_id: string | null;
          titulo: string;
          data_validade: string;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          titulo: string;
          data_validade: string;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          titulo?: string;
          data_validade?: string;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      servicos: {
        Row: {
          id: string;
          tenant_id: string | null;
          cliente_id: string | null;
          usuario_id: string | null;
          titulo: string;
          descricao: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          titulo: string;
          descricao?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          titulo?: string;
          descricao?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chamados: {
        Row: {
          id: string;
          tenant_id: string | null;
          cliente_id: string | null;
          usuario_id: string | null;
          titulo: string;
          prioridade: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          titulo: string;
          prioridade?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          cliente_id?: string | null;
          usuario_id?: string | null;
          titulo?: string;
          prioridade?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ferias: {
        Row: {
          id: string;
          tenant_id: string;
          usuario_id: string;
          data_inicio: string;
          data_retorno: string;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          usuario_id: string;
          data_inicio: string;
          data_retorno: string;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          usuario_id?: string;
          data_inicio?: string;
          data_retorno?: string;
          observacoes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      atestados: {
        Row: {
          id: string;
          tenant_id: string;
          usuario_id: string;
          data_inicio: string;
          data_retorno: string;
          anexo_url: string | null;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          usuario_id: string;
          data_inicio: string;
          data_retorno: string;
          anexo_url?: string | null;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          usuario_id?: string;
          data_inicio?: string;
          data_retorno?: string;
          anexo_url?: string | null;
          observacoes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      epi_entregas: {
        Row: {
          id: string;
          tenant_id: string;
          usuario_id: string;
          item: string;
          quantidade: number;
          data_entrega: string;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          usuario_id: string;
          item: string;
          quantidade?: number;
          data_entrega: string;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          usuario_id?: string;
          item?: string;
          quantidade?: number;
          data_entrega?: string;
          observacoes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ativos_colaboradores: {
        Row: {
          id: string;
          tenant_id: string;
          usuario_id: string;
          item: string;
          data_entrega: string;
          data_devolucao: string | null;
          status: string;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          usuario_id: string;
          item: string;
          data_entrega: string;
          data_devolucao?: string | null;
          status?: string;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          usuario_id?: string;
          item?: string;
          data_entrega?: string;
          data_devolucao?: string | null;
          status?: string;
          observacoes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      convites_usuarios: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          email: string;
          role: string;
          status: string;
          token: string;
          invited_by: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          nome: string;
          email: string;
          role?: string;
          status?: string;
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          nome?: string;
          email?: string;
          role?: string;
          status?: string;
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
