import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Sistema de Chamados com IA - Sistec',
      version: '1.0.0',
      description: `
# Sistema de Gerenciamento de Chamados com Inteligência Artificial

Sistema completo de abertura, triagem e resolução de chamados de suporte técnico, 
com integração de IA (Gemini) para análise automatizada e sugestões de solução.

## Funcionalidades Principais

- **Abertura de Chamados**: Usuários podem criar chamados com categorias e prioridades
- **Triagem Automática com IA**: Sistema analisa e classifica chamados automaticamente
- **Resolução Assistida por IA**: Sugestões de solução geradas pela IA Gemini
- **Gestão de Aprovação**: Fluxo de aprovação/rejeição para gestores
- **Escalonamento**: Chamados complexos podem ser escalados para níveis superiores
- **Estatísticas**: Dashboard completo com métricas e relatórios
- **Gestão de Usuários**: CRUD completo com backup de usuários deletados

## Fluxo do Chamado

1. **Aberto** → Usuário cria o chamado
2. **Aprovado/Rejeitado** → Gestor analisa e aprova ou rejeita
3. **Triagem IA** → Sistema faz análise automática
4. **Aguardando Resposta** → IA gerou solução, aguarda feedback
5. **Com Analista** → Encaminhado para atendimento humano
6. **Escalado** → Problema complexo escalado para gerente
7. **Resolvido** → Chamado finalizado
8. **Fechado** → Chamado arquivado

## Autenticação

O sistema utiliza autenticação por **sessão** (não utiliza JWT). 
Após fazer login, o usuário mantém a sessão ativa até fazer logout.
      `,
      contact: {
        name: 'Equipe de Desenvolvimento Sistec',
        email: 'dev@sistec.com'
      },
      license: {
        name: 'Uso Interno',
        url: 'https://sistec.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.sistec.com',
        description: 'Servidor de Produção'
      }
    ],
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints para login e logout (sem JWT, apenas sessão)'
      },
      {
        name: 'Chamados',
        description: 'Gerenciamento de chamados (CRUD, visualização)'
      },
      {
        name: 'Chamados - Gestão',
        description: 'Aprovação, rejeição e gerenciamento de chamados (perfil Gestor)'
      },
      {
        name: 'Chamados - Analistas',
        description: 'Resolução e escalonamento de chamados (perfil Analista)'
      },
      {
        name: 'Chamados - IA',
        description: 'Endpoints relacionados à solução e feedback da IA Gemini'
      },
      {
        name: 'Usuários',
        description: 'Visualização de usuários e perfis'
      },
      {
        name: 'Usuários - Gestão',
        description: 'CRUD de usuários, backup e restauração (perfil Admin)'
      },
      {
        name: 'Estatísticas',
        description: 'Dashboard, métricas e relatórios do sistema'
      }
    ],
    components: {
      schemas: {
        // ===== USUÁRIOS =====
        Usuario: {
          type: 'object',
          properties: {
            id_usuario: { 
              type: 'integer', 
              example: 1,
              description: 'ID único do usuário (gerado automaticamente)'
            },
            matricula: { 
              type: 'integer', 
              example: 1001,
              description: 'Matrícula do usuário (única, gerada automaticamente)'
            },
            nome_usuario: { 
              type: 'string', 
              example: 'João Silva',
              description: 'Nome completo do usuário'
            },
            email: { 
              type: 'string', 
              format: 'email',
              example: 'joao.silva@sistec.com',
              description: 'Email corporativo (único)'
            },
            setor_usuario: { 
              type: 'string', 
              example: 'TI',
              description: 'Setor/departamento do usuário'
            },
            cargo_usuario: { 
              type: 'string', 
              example: 'Analista de Suporte',
              description: 'Cargo/função do usuário'
            },
            tel_usuarios: { 
              type: 'string', 
              example: '11987654321',
              description: 'Telefone de contato (único)'
            },
            id_perfil_usuario: { 
              type: 'integer', 
              example: 2,
              description: 'ID do perfil de acesso (1=Usuário, 2=Analista, 3=Gestor, 4=Admin)'
            },
            id_aprovador_usuario: {
              type: 'integer',
              example: 5,
              nullable: true,
              description: 'ID do gestor aprovador deste usuário'
            },
            nome_perfil: { 
              type: 'string', 
              example: 'Analista de Suporte',
              description: 'Nome descritivo do perfil'
            },
            nivel_acesso: { 
              type: 'integer', 
              example: 2,
              description: 'Nível de acesso no sistema (1-5, quanto maior mais permissões)'
            }
          }
        },
        
        PerfilUsuario: {
          type: 'object',
          properties: {
            id_perfil_usuario: {
              type: 'integer',
              example: 2,
              description: 'ID do perfil'
            },
            descricao_perfil_usuario: {
              type: 'string',
              example: 'Analista de Suporte',
              description: 'Nome do perfil'
            },
            nivel_acesso: {
              type: 'integer',
              example: 2,
              description: '1=Usuário, 2=Analista, 3=Gestor, 4=Gerente, 5=Admin'
            }
          }
        },

        CriarUsuario: {
          type: 'object',
          required: ['nome_usuario', 'email', 'senha', 'id_perfil_usuario'],
          properties: {
            nome_usuario: { type: 'string', example: 'Maria Santos' },
            setor_usuario: { type: 'string', example: 'RH' },
            cargo_usuario: { type: 'string', example: 'Analista de RH' },
            email: { type: 'string', example: 'maria.santos@sistec.com' },
            senha: { type: 'string', example: 'senha123' },
            tel_usuarios: { type: 'string', example: '11987654321' },
            id_perfil_usuario: { type: 'integer', example: 1, description: '1=Usuário, 2=Analista, 3=Gestor, 4=Admin' },
            matricula_aprovador: { type: 'integer', example: 5, description: 'Matrícula do gestor aprovador (opcional)' }
          }
        },

        // ===== CHAMADOS =====
        Chamado: {
          type: 'object',
          properties: {
            id_chamado: { 
              type: 'integer', 
              example: 123,
              description: 'ID único do chamado'
            },
            id_usuario_abertura: { 
              type: 'integer', 
              example: 42,
              description: 'ID do usuário que abriu o chamado'
            },
            id_usuario_resolucao: {
              type: 'integer',
              nullable: true,
              example: 2,
              description: 'ID do analista que resolveu o chamado'
            },
            prioridade_chamado: { 
              type: 'number',
              format: 'double',
              example: 3,
              description: '1=Baixa, 2=Média, 3=Alta, 4=Urgente'
            },
            descricao_categoria_chamado: { 
              type: 'string', 
              example: 'Hardware',
              description: 'Categoria do problema (hardware, software, rede, email, acesso, sistema)'
            },
            descricao_problema_chamado: { 
              type: 'string', 
              example: 'computador-nao-liga',
              description: 'Slug do problema específico'
            },
            descricao_status_chamado: { 
              type: 'string', 
              example: 'Aberto',
              description: 'Status atual (Aberto, Aprovado, Rejeitado, Triagem IA, Aguardando Resposta, Com Analista, Escalado, Resolvido, Fechado)'
            },
            titulo_chamado: { 
              type: 'string', 
              example: 'Computador não inicia',
              description: 'Título curto do chamado'
            },
            descricao_detalhada: { 
              type: 'string', 
              example: 'O computador não está ligando desde ontem. Tentei várias vezes mas não funciona.',
              description: 'Descrição completa do problema'
            },
            data_abertura: { 
              type: 'string', 
              format: 'date-time',
              example: '2025-11-03T14:30:00Z'
            },
            data_aprovacao_recusa: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-11-03T15:00:00Z'
            },
            data_encaminhamento: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-11-03T15:05:00Z'
            },
            data_resolucao: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-11-03T17:20:00Z'
            },
            data_fechamento: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            data_escala: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data em que o chamado foi escalado para gerente'
            },
            usuario_abertura: { 
              type: 'string', 
              example: 'João Silva',
              description: 'Nome do usuário que abriu'
            },
            email_usuario: {
              type: 'string',
              example: 'joao.silva@sistec.com'
            },
            usuario_resolucao: {
              type: 'string',
              nullable: true,
              example: 'Ana Costa',
              description: 'Nome do analista que resolveu'
            },
            motivo_reprovacao: {
              type: 'string',
              nullable: true,
              example: 'Faltam informações sobre o problema',
              description: 'Motivo da rejeição (quando status = Rejeitado)'
            }
          }
        },

       CriarChamado: {
  type: 'object',
  required: ['id_usuario_abertura', 'prioridade_chamado', 'descricao_categoria', 'descricao_problema'],
  properties: {
    id_usuario_abertura: { 
      type: 'integer', 
      example: 42,
      description: 'ID do usuário que está abrindo o chamado'
    },
    prioridade_chamado: { 
      type: 'string',  // ← Mude para string
      example: 'alta',  // ← Mude o exemplo
      enum: ['baixa', 'media', 'alta', 'urgente'],  // ← Adicione isso
      description: '1=Baixa, 2=Média, 3=Alta, 4=Urgente'
    },
    descricao_categoria: { 
      type: 'string', 
      example: 'hardware',
      description: 'Categoria: hardware, software, rede, email, acesso, sistema'
    },
    descricao_problema: { 
      type: 'string', 
      example: 'computador-nao-liga',
      description: 'Slug do problema'
    },
    descricao_detalhada: { 
      type: 'string', 
      example: '**Título:** Computador não liga\n\n**Descrição:** Descrição completa',
      description: 'Descrição completa em formato markdown'
    }
  }
},

        RespostaIA: {
          type: 'object',
          properties: {
            id_resposta_ia: { type: 'integer', example: 15 },
            fk_chamados_id_chamado: { type: 'integer', example: 123 },
            tipo_resposta: {
              type: 'string',
              example: 'SOLUCAO',
              description: 'SOLUCAO, ANALISTA_RESOLUCAO, ESCALONAMENTO, REPROVACAO'
            },
            analise_triagem: {
              type: 'object',
              description: 'JSON com análise da IA: complexidade, tags, recomendação, tempo estimado',
              example: {
                complexidade: 'BAIXA',
                recomendacao: 'IA',
                tags: ['hardware', 'monitor', 'cabo'],
                tempo_estimado_minutos: 30
              }
            },
            solucao_ia: {
              type: 'string',
              example: '**Solução:**\n1. Verifique se o cabo está conectado...'
            },
            feedback_usuario: {
              type: 'string',
              nullable: true,
              example: 'DEU_CERTO',
              description: 'DEU_CERTO ou DEU_ERRADO'
            },
            data_resposta: { type: 'string', format: 'date-time' },
            data_feedback: { type: 'string', format: 'date-time', nullable: true }
          }
        },

        // ===== REQUESTS/RESPONSES =====
        LoginRequest: {
          type: 'object',
          required: ['email', 'senha'],
          properties: {
            email: { 
              type: 'string', 
              example: 'admin@sistec.com',
              description: 'Email corporativo do usuário'
            },
            senha: { 
              type: 'string', 
              example: 'admin123',
              description: 'Senha do usuário'
            }
          }
        },

        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login realizado com sucesso' },
            usuario: { $ref: '#/components/schemas/Usuario' }
          }
        },

        RejeitarChamadoRequest: {
          type: 'object',
          required: ['motivo'],
          properties: {
            motivo: {
              type: 'string',
              example: 'Faltam informações sobre quando o problema começou e se afeta outros usuários',
              description: 'Motivo detalhado da rejeição'
            }
          }
        },

        EscalarChamadoRequest: {
          type: 'object',
          required: ['motivo'],
          properties: {
            motivo: {
              type: 'string',
              example: 'Problema complexo que requer aprovação gerencial para substituição de hardware',
              description: 'Justificativa do escalonamento'
            }
          }
        },

        FeedbackIARequest: {
          type: 'object',
          required: ['resolveu'],
          properties: {
            resolveu: {
              type: 'boolean',
              example: true,
              description: 'true se a solução da IA resolveu o problema, false caso contrário'
            },
            comentario: {
              type: 'string',
              example: 'A solução funcionou perfeitamente, obrigado!',
              description: 'Comentário adicional do usuário (opcional)'
            }
          }
        },

        DashboardStats: {
          type: 'object',
          properties: {
            total_chamados: { type: 'integer', example: 156 },
            chamados_abertos: { type: 'integer', example: 12 },
            chamados_em_andamento: { type: 'integer', example: 23 },
            chamados_resolvidos: { type: 'integer', example: 121 },
            taxa_resolucao_ia: { type: 'number', format: 'float', example: 68.5, description: 'Porcentagem de chamados resolvidos pela IA' },
            tempo_medio_resolucao_horas: { type: 'number', format: 'float', example: 4.2 }
          }
        },

        Error: {
          type: 'object',
          properties: {
            error: { 
              type: 'string', 
              example: 'Mensagem de erro' 
            },
            details: { 
              type: 'string', 
              example: 'Detalhes adicionais sobre o erro',
              nullable: true
            }
          }
        }
      }
    }
  },
    apis: [
    'src/swagger/routes/authRoutes.js',
    'src/swagger/routes/chamadosRoutes.js',
    'src/swagger/routes/userRoutes.js',
    'src/swagger/routes/estatisticasRoutes.js'
  ]

};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
