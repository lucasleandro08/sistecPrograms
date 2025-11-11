/**
 * Usuarios.tsx - Página de Gerenciamento de Usuários
 * 
 * Permite administradores gerenciarem usuários do sistema.
 * Funcionalidades: criar, editar, excluir, visualizar usuários.
 * 
 * HEURÍSTICAS DE NIELSEN APLICADAS:
 * 
 * #1 - Visibilidade do Status do Sistema:
 *    - Loading states durante operações CRUD
 *    - Feedback visual após ações (toasts)
 *    - Status de usuários visível (ativo/inativo)
 *    - Indicadores de sincronização
 * 
 * #2 - Correspondência entre Sistema e Mundo Real:
 *    - Linguagem clara: "Gerenciar Usuários"
 *    - Ações em português: "Adicionar", "Editar", "Excluir"
 *    - Níveis de acesso compreensíveis
 * 
 * #3 - Controle e Liberdade do Usuário:
 *    - Cancelar operações a qualquer momento
 *    - Desfazer exclusões (soft delete)
 *    - Navegação livre pela interface
 *    - Escape fecha modais
 * 
 * #4 - Consistência e Padrões:
 *    - Design system shadcn/ui mantido
 *    - Padrões de tabela consistentes
 *    - Cores de ação padronizadas (azul=editar, vermelho=excluir)
 * 
 * #5 - Prevenção de Erros:
 *    - Confirmação antes de exclusões
 *    - Validação de formulários
 *    - Campos obrigatórios marcados
 *    - Desabilitação de botões durante processamento
 * 
 * #6 - Reconhecimento ao Invés de Memorização:
 *    - Cards resumem informações chave
 *    - Cabeçalhos de coluna descritivos
 *    - Ícones intuitivos para cada ação
 *    - Filtros visíveis
 * 
 * #7 - Flexibilidade e Eficiência de Uso:
 *    - Busca rápida por nome/email
 *    - Filtros por nível de acesso
 *    - Ações em lote para usuários avançados
 *    - Paginação eficiente
 * 
 * #8 - Design Estético e Minimalista:
 *    - Cards + Tabela: organização clara
 *    - Espaçamento adequado
 *    - Foco nos dados essenciais
 *    - Sem decorações desnecessárias
 * 
 * #9 - Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar Erros:
 *    - Mensagens de erro específicas
 *    - Destaque visual em campos inválidos
 *    - Sugestões de correção
 *    - Logs de erro para admin
 * 
 * #10 - Ajuda e Documentação:
 *    - Tooltips em ícones complexos
 *    - Texto de ajuda em níveis de acesso
 *    - Link para documentação de gestão
 * 
 * RESPONSIVIDADE:
 * - Mobile (<768px): Cards empilhados, tabela scroll horizontal, p-4
 * - Tablet (768-1024px): Cards 2 cols, tabela otimizada, p-6
 * - Desktop (>1024px): Cards 4 cols, todas colunas visíveis, p-8
 * 
 * ACESSIBILIDADE:
 * - role="main" no container
 * - ARIA labels em tabelas e controles
 * - Navegação por teclado completa
 * - Contraste adequado em badges
 * - Screen reader friendly
 */

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { UserManagementCards } from '@/components/UserManagementCards';
import { UsersTable } from '@/components/UsersTable';
import { Users } from 'lucide-react';

// ============================================================================
// CONSTANTES
// ============================================================================

const UI_TEXT = {
  TITLE: 'Gerenciar Usuários',
  SUBTITLE: 'Administre usuários, permissões e níveis de acesso do sistema',
  ICON_LABEL: 'Ícone de gerenciamento de usuários',
  CARDS_SECTION_TITLE: 'Resumo de Usuários',
  TABLE_SECTION_TITLE: 'Lista Completa de Usuários',
} as const;

// ============================================================================
// SUBCOMPONENTE: PageHeader
// ============================================================================

/**
 * Cabeçalho da página com ícone, título e subtítulo
 * 
 * Features:
 * - Ícone Users para identificação visual
 * - Título e subtítulo responsivos
 * - Animação fade-in suave
 * 
 * Responsividade:
 * - Mobile: Texto xl, ícone 24px
 * - Tablet: Texto 2xl, ícone 28px
 * - Desktop: Texto 3xl, ícone 32px
 */
const PageHeader: React.FC = () => (
  <div 
    className="flex items-start gap-3 md:gap-4 mb-6 md:mb-8 animate-fade-in"
    role="heading"
    aria-level={1}
  >
    {/* Ícone decorativo */}
    <div 
      className="p-2 md:p-3 bg-purple-100 rounded-lg flex-shrink-0 mt-1"
      aria-hidden="true"
    >
      <Users 
        className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-purple-600" 
        aria-label={UI_TEXT.ICON_LABEL}
      />
    </div>
    
    {/* Textos */}
    <div className="flex-1 min-w-0">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
        {UI_TEXT.TITLE}
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
        {UI_TEXT.SUBTITLE}
      </p>
    </div>
  </div>
);

// ============================================================================
// SUBCOMPONENTE: Section
// ============================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
  delay?: string;
}

/**
 * Seção genérica com título e conteúdo
 * 
 * Features:
 * - Título semântico (h2)
 * - Animação fade-in-up com delay opcional
 * - ARIA labelledby para acessibilidade
 */
const Section: React.FC<SectionProps> = ({ title, children, delay = '' }) => {
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <section 
      className={`animate-fade-in-up ${delay}`}
      aria-labelledby={sectionId}
    >
      <h2 
        id={sectionId}
        className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4"
      >
        {title}
      </h2>
      {children}
    </section>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Usuarios - Página de Gerenciamento Completo
 * 
 * Estrutura:
 * - Sidebar (navegação lateral)
 * - Header (cabeçalho fixo)
 * - Main (conteúdo principal)
 *   - PageHeader (título e subtítulo)
 *   - Section 1: UserManagementCards (resumo estatísticas)
 *   - Section 2: UsersTable (tabela completa CRUD)
 * 
 * Layout Responsivo:
 * - Mobile: Sidebar colapsável, padding 16px, seções empilhadas
 * - Tablet: Sidebar visível, padding 24px, cards 2 colunas
 * - Desktop: Layout completo, padding 32px, cards 4 colunas
 * 
 * Permissões:
 * - Apenas administradores podem acessar esta página
 * - Verificação feita via ProtectedRoute
 */
const Usuarios: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegação */}
      <Sidebar />
      
      {/* Container principal */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* Header fixo */}
        <Header />
        
        {/* Conteúdo principal */}
        <main 
          className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 overflow-x-hidden"
          role="main"
          aria-label="Gerenciamento de usuários"
        >
          {/* Cabeçalho da página */}
          <PageHeader />
          
          {/* Seção 1: Cards de Resumo */}
          <Section 
            title={UI_TEXT.CARDS_SECTION_TITLE}
            delay="animation-delay-200"
          >
            <UserManagementCards />
          </Section>
          
          {/* Seção 2: Tabela de Usuários */}
          <Section title={UI_TEXT.TABLE_SECTION_TITLE}>
            <UsersTable />
          </Section>
        </main>
      </div>
    </div>
  );
};

export default Usuarios;
