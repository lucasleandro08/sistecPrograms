/**
 * Chamados.tsx - Página de Listagem de Chamados
 * 
 * Exibe lista completa de todos os chamados do sistema.
 * Permite visualização, filtragem e ações sobre os chamados.
 * 
 * HEURÍSTICAS DE NIELSEN APLICADAS:
 * 
 * #1 - Visibilidade do Status do Sistema:
 *    - Tabela mostra status atualizado de cada chamado
 *    - Indicadores visuais de loading durante carregamento
 *    - Badges coloridos para status e prioridade
 * 
 * #2 - Correspondência entre Sistema e Mundo Real:
 *    - Linguagem clara: "Chamados", não "Tickets"
 *    - Termos familiares: "Aberto", "Em Andamento", "Resolvido"
 *    - Ícones intuitivos (lista, filtro, ações)
 * 
 * #3 - Controle e Liberdade do Usuário:
 *    - Navegação via breadcrumb e sidebar
 *    - Filtros para refinar visualização
 *    - Ações de edição e exclusão disponíveis
 * 
 * #4 - Consistência e Padrões:
 *    - Design system shadcn/ui mantido
 *    - Layout padrão com Sidebar + Header
 *    - Padrões de cores para status consistentes
 * 
 * #5 - Prevenção de Erros:
 *    - Validação antes de ações destrutivas
 *    - Estados de loading impedem múltiplos cliques
 *    - Confirmação para exclusões
 * 
 * #6 - Reconhecimento ao Invés de Memorização:
 *    - Cabeçalho descritivo em cada coluna
 *    - Ícones ajudam a identificar ações
 *    - Filtros visíveis e claros
 * 
 * #7 - Flexibilidade e Eficiência de Uso:
 *    - Atalhos de teclado na tabela
 *    - Filtros rápidos para usuários avançados
 *    - Paginação para grandes volumes
 * 
 * #8 - Design Estético e Minimalista:
 *    - Foco na tabela de dados
 *    - Espaçamento adequado
 *    - Sem elementos decorativos desnecessários
 * 
 * #9 - Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar Erros:
 *    - Mensagens claras quando não há dados
 *    - Erros de carregamento exibidos de forma amigável
 *    - Sugestões de ação em estados vazios
 * 
 * #10 - Ajuda e Documentação:
 *    - Subtítulo explica propósito da página
 *    - Tooltips em ícones de ação
 *    - Contador de registros visível
 * 
 * RESPONSIVIDADE:
 * - Mobile (<768px): Tabela com scroll horizontal, ações empilhadas, p-4
 * - Tablet (768-1024px): Tabela otimizada, filtros inline, p-6
 * - Desktop (>1024px): Todas colunas visíveis, sidebar fixa, p-8
 * 
 * ACESSIBILIDADE:
 * - role="main" no container principal
 * - ARIA labels em headings e controles
 * - Contraste adequado nos badges
 * - Navegação por teclado na tabela
 */

import React from 'react';
import { TicketsTable } from '@/components/TicketsTable';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { List } from 'lucide-react';

// ============================================================================
// CONSTANTES
// ============================================================================

const UI_TEXT = {
  TITLE: 'Todos os Chamados',
  SUBTITLE: 'Gerencie e acompanhe todos os chamados do sistema',
  ICON_LABEL: 'Ícone de lista de chamados',
} as const;

// ============================================================================
// SUBCOMPONENTE: PageHeader
// ============================================================================

/**
 * Cabeçalho da página com ícone, título e subtítulo
 * 
 * Features:
 * - Ícone de lista para identificação visual
 * - Título e subtítulo responsivos
 * - Animação fade-in para entrada suave
 * 
 * Responsividade:
 * - Mobile: Texto menor (xl), ícone 24px
 * - Tablet: Texto médio (2xl), ícone 28px
 * - Desktop: Texto grande (3xl), ícone 32px
 */
const PageHeader: React.FC = () => (
  <div 
    className="flex items-start gap-3 md:gap-4 mb-6 md:mb-8 animate-fade-in"
    role="heading"
    aria-level={1}
  >
    {/* Ícone decorativo */}
    <div 
      className="p-2 md:p-3 bg-blue-100 rounded-lg flex-shrink-0 mt-1"
      aria-hidden="true"
    >
      <List 
        className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-600" 
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
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Chamados - Página de Listagem Completa
 * 
 * Estrutura:
 * - Sidebar (navegação lateral)
 * - Header (cabeçalho fixo)
 * - Main (conteúdo principal)
 *   - PageHeader (título e subtítulo)
 *   - TicketsTable (tabela de chamados)
 * 
 * Layout Responsivo:
 * - Mobile: Sidebar colapsável, padding 16px
 * - Tablet: Sidebar visível, padding 24px
 * - Desktop: Layout completo, padding 32px
 */
const Chamados: React.FC = () => {
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
          className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-x-hidden"
          role="main"
          aria-label="Lista de chamados"
        >
          {/* Cabeçalho da página */}
          <PageHeader />
          
          {/* Tabela de chamados */}
          <div className="animate-fade-in-up animation-delay-200">
            <TicketsTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chamados;
