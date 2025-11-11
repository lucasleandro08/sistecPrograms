/**
 * @fileoverview Página de Dashboard
 * 
 * Dashboard principal com estatísticas, gráficos e relatórios.
 * 
 * Heurísticas de Nielsen aplicadas:
 * - #1: Visibilidade do status (loading em relatórios, feedback visual)
 * - #2: Correspondência com mundo real (linguagem clara, ícones intuitivos)
 * - #3: Controle e liberdade (menu de relatórios, cancelar ações)
 * - #4: Consistência (design system mantido, padrões visuais)
 * - #5: Prevenção de erros (validação de permissões, confirmações)
 * - #6: Reconhecimento (ícones + texto, tooltips informativos)
 * - #7: Flexibilidade (atalhos, diferentes formatos de export)
 * - #8: Design minimalista (hierarquia visual clara, foco em dados)
 * - #9: Recuperação de erros (mensagens de erro claras em relatórios)
 * - #10: Ajuda (tooltips, indicadores de permissão)
 * 
 * Responsividade:
 * - Mobile: Cards stacked, sidebar colapsável
 * - Tablet: Layout 2 colunas
 * - Desktop: Layout 3 colunas, sidebar fixa
 * 
 * @module pages/Dashboard
 */

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardStats } from '@/components/DashboardStats';
import { DashboardCharts } from '@/components/DashboardCharts';
import { AnalystChart } from '@/components/AnalystChart';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, ChevronDown, BarChart3, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardReports } from '@/hooks/useDashboardReports';

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Textos da interface
 * @constant {Object}
 */
const UI_TEXT = Object.freeze({
  PAGE_TITLE: 'Dashboard',
  PAGE_SUBTITLE: 'Visão geral do sistema de chamados',
  REPORT_BUTTON: 'Relatório',
  GENERATING: 'Gerando...',
  EXPORT_AS: 'Exportar como',
  PDF_TITLE: 'PDF',
  PDF_DESCRIPTION: 'Relatório completo',
  EXCEL_TITLE: 'Excel',
  EXCEL_DESCRIPTION: 'Dados para análise',
  LIMITED_VIEW: 'Visualização limitada',
  LIMITED_VIEW_TOOLTIP: 'Usuários comuns têm acesso limitado ao dashboard'
});

/**
 * Níveis de acesso
 * @constant {Object}
 */
const ACCESS_LEVELS = Object.freeze({
  USUARIO: 1,
  ANALISTA: 2,
  GESTOR: 3,
  ADMIN: 4
});

// ==========================================
// SUBCOMPONENTES
// ==========================================

/**
 * Header do Dashboard com título e botão de relatório
 * 
 * Heurística #6: Reconhecimento (ícone + texto)
 * Heurística #10: Ajuda (tooltip para usuários comuns)
 */
interface DashboardHeaderProps {
  isUsuarioComum: boolean;
  isGenerating: boolean;
  showMenu: boolean;
  onToggleMenu: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isUsuarioComum,
  isGenerating,
  showMenu,
  onToggleMenu
}) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div className="animate-fade-in">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
        {UI_TEXT.PAGE_TITLE}
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-1">
        {UI_TEXT.PAGE_SUBTITLE}
      </p>
    </div>

    {!isUsuarioComum ? (
      <div className="relative">
        <Button
          onClick={onToggleMenu}
          disabled={isGenerating}
          style={{
            background: isGenerating
              ? '#ff9966'
              : 'linear-gradient(to right, #ff9966, #ff8855)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.background = 'linear-gradient(to right, #ff8855, #ff7744)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.background = 'linear-gradient(to right, #ff9966, #ff8855)';
            }
          }}
          className="text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 animate-fade-in"
          aria-label="Menu de relatórios"
          aria-expanded={showMenu}
          aria-haspopup="true"
        >
          {isGenerating ? (
            <>
              <div 
                className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                role="status"
                aria-label="Gerando relatório"
              />
              <span>{UI_TEXT.GENERATING}</span>
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              <span>{UI_TEXT.REPORT_BUTTON}</span>
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    ) : (
      <div 
        className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg animate-fade-in flex items-center gap-2"
        role="status"
        aria-label={UI_TEXT.LIMITED_VIEW_TOOLTIP}
        title={UI_TEXT.LIMITED_VIEW_TOOLTIP}
      >
        <Lock className="w-4 h-4" aria-hidden="true" />
        <span>{UI_TEXT.LIMITED_VIEW}</span>
      </div>
    )}
  </div>
);

/**
 * Menu dropdown de opções de export
 * 
 * Heurística #2: Correspondência com mundo real (ícones conhecidos)
 * Heurística #7: Flexibilidade (múltiplas opções de export)
 */
interface ReportMenuProps {
  show: boolean;
  isGenerating: boolean;
  onGeneratePDF: () => void;
  onGenerateExcel: () => void;
}

const ReportMenu: React.FC<ReportMenuProps> = ({
  show,
  isGenerating,
  onGeneratePDF,
  onGenerateExcel
}) => {
  if (!show || isGenerating) return null;

  return (
    <div 
      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slide-in-right"
      role="menu"
      aria-label="Opções de exportação"
    >
      <div className="py-2">
        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
          {UI_TEXT.EXPORT_AS}
        </div>

        <button
          onClick={onGeneratePDF}
          className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 transition-colors focus:outline-none focus:bg-red-50"
          role="menuitem"
          aria-label="Exportar como PDF"
        >
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{UI_TEXT.PDF_TITLE}</div>
            <div className="text-xs text-gray-500">{UI_TEXT.PDF_DESCRIPTION}</div>
          </div>
        </button>

        <button
          onClick={onGenerateExcel}
          className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 transition-colors focus:outline-none focus:bg-green-50"
          role="menuitem"
          aria-label="Exportar como Excel"
        >
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{UI_TEXT.EXCEL_TITLE}</div>
            <div className="text-xs text-gray-500">{UI_TEXT.EXCEL_DESCRIPTION}</div>
          </div>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * Página Dashboard
 * 
 * Dashboard principal com estatísticas, gráficos e funcionalidade de relatórios.
 * Adapta-se às permissões do usuário e responde a diferentes tamanhos de tela.
 * 
 * Responsividade:
 * - Mobile (< 768px): Sidebar colapsável, cards stacked, padding reduzido
 * - Tablet (768px - 1024px): Layout 2 colunas, sidebar visível
 * - Desktop (> 1024px): Layout 3 colunas, sidebar fixa, espaçamento completo
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { state, actions } = useDashboardReports();

  // Verificar permissões (Heurística #5: Prevenção de erros)
  const isUsuarioComum = user?.perfil?.nivel_acesso === ACCESS_LEVELS.USUARIO;

  return (
    <div className="min-h-screen bg-gray-50 flex" role="main">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-x-hidden">
          {/* Header com título e botão de relatório */}
          <DashboardHeader
            isUsuarioComum={isUsuarioComum}
            isGenerating={state.isGenerating}
            showMenu={state.showMenu}
            onToggleMenu={actions.toggleMenu}
          />

          {/* Menu de relatórios */}
          {!isUsuarioComum && (
            <div className="relative">
              <ReportMenu
                show={state.showMenu}
                isGenerating={state.isGenerating}
                onGeneratePDF={actions.generatePDF}
                onGenerateExcel={actions.generateExcel}
              />
            </div>
          )}

          {/* Cards de estatísticas */}
          <div className="animate-fade-in-up">
            <DashboardStats />
          </div>

          {/* Gráficos e analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up animation-delay-200">
            <DashboardCharts />
            <AnalystChart />
          </div>
        </main>
      </div>

      {/* Overlay para fechar menu (Heurística #3: Controle e liberdade) */}
      {state.showMenu && !state.isGenerating && (
        <div
          className="fixed inset-0 z-40"
          onClick={actions.closeMenu}
          role="button"
          aria-label="Fechar menu de relatórios"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape') actions.closeMenu();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
