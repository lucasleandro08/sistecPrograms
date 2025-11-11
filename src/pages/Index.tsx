/**
 * Index.tsx - Landing Page
 * 
 * Página inicial do sistema após autenticação.
 * Exibe visão geral de estatísticas e chamados recentes.
 * 
 * HEURÍSTICAS DE NIELSEN APLICADAS:
 * 
 * #1 - Visibilidade do Status do Sistema:
 *    - Cards de estatísticas mostram status em tempo real
 *    - Indicadores visuais de loading nos componentes
 * 
 * #2 - Correspondência entre Sistema e Mundo Real:
 *    - Linguagem clara e objetiva em português
 *    - Ícones intuitivos para representar conceitos
 * 
 * #3 - Controle e Liberdade do Usuário:
 *    - Navegação clara via sidebar para outras seções
 *    - Filtros e ações rápidas na tabela de chamados
 * 
 * #4 - Consistência e Padrões:
 *    - Mantém design system do shadcn/ui
 *    - Layout consistente com outras páginas
 * 
 * #5 - Prevenção de Erros:
 *    - Componentes carregam dados com tratamento de erros
 *    - Estados de loading evitam cliques prematuros
 * 
 * #6 - Reconhecimento ao Invés de Memorização:
 *    - Cards com rótulos claros
 *    - Ícones descritivos para cada métrica
 * 
 * #7 - Flexibilidade e Eficiência de Uso:
 *    - Layout adaptável para diferentes níveis de usuário
 *    - Ações rápidas disponíveis diretamente nos cards
 * 
 * #8 - Design Estético e Minimalista:
 *    - Foco nos dados mais relevantes
 *    - Espaçamento adequado entre elementos
 *    - Sem informações desnecessárias
 * 
 * #9 - Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar Erros:
 *    - Componentes exibem mensagens claras em caso de erro
 *    - Estados de erro tratados individualmente
 * 
 * #10 - Ajuda e Documentação:
 *    - Títulos descritivos explicam cada seção
 *    - Tooltips disponíveis nos componentes
 * 
 * RESPONSIVIDADE:
 * - Mobile (<768px): Layout vertical, cards empilhados, p-4
 * - Tablet (768-1024px): Grid 2 colunas para cards, p-6
 * - Desktop (>1024px): Layout otimizado com sidebar fixa, p-8
 * 
 * ACESSIBILIDADE:
 * - Estrutura semântica com <main> e <section>
 * - ARIA labels nos headings
 * - Contraste adequado para leitura
 * - Animações suaves para feedback visual
 */

import React from 'react';
import { StatsCards } from '@/components/StatsCards';
import { TicketsTable } from '@/components/TicketsTable';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

// ============================================================================
// CONSTANTES
// ============================================================================

const UI_TEXT = {
  TITLE: 'Visão Geral',
  SUBTITLE: 'Acompanhe as métricas e chamados do sistema',
  STATS_SECTION_TITLE: 'Estatísticas',
  TICKETS_SECTION_TITLE: 'Chamados Recentes',
} as const;

// ============================================================================
// SUBCOMPONENTE: PageHeader
// ============================================================================

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Cabeçalho da página com título e subtítulo
 * Responsivo: Ajusta tamanhos de fonte por breakpoint
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => (
  <div 
    className="mb-6 md:mb-8 animate-fade-in"
    role="heading"
    aria-level={1}
  >
    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
      {title}
    </h1>
    <p className="text-sm md:text-base text-gray-600 mt-2">
      {subtitle}
    </p>
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
 * Animação: fade-in com delay opcional para efeito escalonado
 */
const Section: React.FC<SectionProps> = ({ title, children, delay = '' }) => (
  <section 
    className={`animate-fade-in-up ${delay}`}
    aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <h2 
      id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="text-lg md:text-xl font-semibold text-gray-800 mb-4"
    >
      {title}
    </h2>
    {children}
  </section>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Index - Landing Page Principal
 * 
 * Exibe visão geral do sistema com:
 * - Estatísticas em cards (StatsCards)
 * - Tabela de chamados recentes (TicketsTable)
 * 
 * Layout responsivo com sidebar e header
 */
const Index: React.FC = () => {
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
        >
          {/* Seção: Estatísticas - sem título */}
          <div className="animate-fade-in">
            <StatsCards />
          </div>
          
          {/* Seção: Chamados Recentes - sem título */}
          <div className="animate-fade-in-up animation-delay-200">
            <TicketsTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
