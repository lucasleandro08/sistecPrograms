/**
 * @fileoverview Cards de Ações Rápidas do Dashboard
 * 
 * Componente que exibe cards interativos para ações principais do sistema:
 * - Abrir novo chamado
 * - Visualizar meus chamados
 * - Aprovar chamados (apenas gestores/gerentes)
 * 
 * @module components/StatsCards
 * 
 * @example
 * ```tsx
 * <StatsCards />
 * ```
 * 
 * Features:
 * - Cards responsivos e interativos
 * - Animações de hover suaves
 * - Controle de acesso baseado em nível
 * - Modais integrados para cada ação
 * - Layout adaptativo (1/2/3 colunas)
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Gerencia apenas cards de ações rápidas
 * - Open/Closed: Extensível via configuração de stats
 * - Liskov Substitution: Todos os cards seguem mesmo contrato
 * - Interface Segregation: Props específicas por card
 * - Dependency Inversion: Usa contexto de autenticação via abstração
 * 
 * Nielsen Heuristics:
 * - #1: Visibilidade (ações principais sempre visíveis)
 * - #4: Consistência (mesmo padrão visual)
 * - #6: Reconhecimento vs recall (ícones + texto)
 * - #7: Flexibilidade (atalhos para ações comuns)
 * - #8: Design estético (visual limpo e profissional)
 */

import React, { useState } from 'react';
import { Plus, User, Check, LucideIcon } from 'lucide-react';
import { NovoChamadoPopup } from './NovoChamadoPopup';
import { MeusChamadosPopup } from './MeusChamadosPopup';
import { AprovarChamadosPopup } from './AprovarChamadosPopup';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Níveis de acesso do sistema
 * @constant
 */
const ACCESS_LEVELS = Object.freeze({
  USUARIO: 1,
  ANALISTA: 2,
  GESTOR: 3,
  GERENTE: 4,
  ADMIN: 5
});

/**
 * Configuração de cores dos cards
 * @constant
 */
const CARD_COLORS = Object.freeze({
  PRIMARY: {
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-500',
    iconBg: 'bg-white',
    hoverIconBg: 'bg-orange-200',
    hoverTextColor: 'text-orange-600',
    hoverBorderColor: 'border-orange-300'
  },
  SECONDARY: {
    bgColor: 'bg-white',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-100',
    hoverIconBg: 'bg-orange-200',
    hoverTextColor: 'text-orange-600',
    hoverBorderColor: 'border-orange-300'
  }
});

/**
 * Textos da interface
 * @constant
 */
const UI_TEXT = Object.freeze({
  NOVO_CHAMADO: 'Abrir Novo Chamado',
  MEUS_CHAMADOS: 'Meus Chamados',
  APROVAR_CHAMADOS: 'Aprovar Chamados'
});

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Configuração de um card de estatística
 */
interface StatCardConfig {
  /** Título do card */
  title: string;
  /** Ícone Lucide a ser exibido */
  icon: LucideIcon;
  /** Classe CSS para cor de fundo do card */
  bgColor: string;
  /** Classe CSS para cor do ícone */
  iconColor: string;
  /** Classe CSS para cor de fundo do ícone */
  iconBg: string;
  /** Classe CSS para cor de fundo do ícone no hover */
  hoverIconBg: string;
  /** Classe CSS para cor do texto no hover */
  hoverTextColor: string;
  /** Classe CSS para cor da borda no hover */
  hoverBorderColor: string;
  /** Callback ao clicar no card */
  onClick: () => void;
  /** Se o card deve ser exibido */
  show: boolean;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * Cards de ações rápidas do dashboard
 * 
 * @returns {JSX.Element} Grid de cards interativos
 * 
 * @description
 * Nielsen Heuristic #1: Visibilidade do status do sistema
 * - Ações principais sempre visíveis e acessíveis
 * - Feedback visual claro (hover, escala)
 * 
 * Nielsen Heuristic #4: Consistência e padrões
 * - Todos os cards seguem mesmo padrão visual
 * - Interações consistentes
 * 
 * Nielsen Heuristic #6: Reconhecimento em vez de memorização
 * - Ícones + texto descritivo
 * - Ações auto-explicativas
 * 
 * Nielsen Heuristic #7: Flexibilidade e eficiência de uso
 * - Atalhos para ações mais comuns
 * - Acesso rápido via cards clicáveis
 * 
 * Nielsen Heuristic #8: Design estético e minimalista
 * - Visual limpo e profissional
 * - Apenas informações essenciais
 */
export const StatsCards = (): JSX.Element => {
  // ==========================================
  // STATE
  // ==========================================

  const [showNovoChamadoPopup, setShowNovoChamadoPopup] = useState<boolean>(false);
  const [showMeusChamadosPopup, setShowMeusChamadosPopup] = useState<boolean>(false);
  const [showAprovarChamadosPopup, setShowAprovarChamadosPopup] = useState<boolean>(false);
  const { user } = useAuth();

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Verifica se usuário pode aprovar chamados
   * @returns {boolean} True se nível >= GERENTE
   */
  const canApproveTickets = (): boolean => {
    return (user?.perfil?.nivel_acesso ?? 0) >= ACCESS_LEVELS.GERENTE;
  };

  /**
   * Configuração dos cards de estatísticas
   * @returns {StatCardConfig[]} Array de configurações
   */
  const getStatsConfig = (): StatCardConfig[] => [
    {
      title: UI_TEXT.NOVO_CHAMADO,
      icon: Plus,
      ...CARD_COLORS.PRIMARY,
      onClick: () => setShowNovoChamadoPopup(true),
      show: true
    },
    {
      title: UI_TEXT.MEUS_CHAMADOS,
      icon: User,
      ...CARD_COLORS.SECONDARY,
      onClick: () => setShowMeusChamadosPopup(true),
      show: true
    },
    {
      title: UI_TEXT.APROVAR_CHAMADOS,
      icon: Check,
      ...CARD_COLORS.SECONDARY,
      onClick: () => setShowAprovarChamadosPopup(true),
      show: canApproveTickets()
    }
  ];

  const visibleStats = getStatsConfig().filter(stat => stat.show);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {visibleStats.map((stat, index) => (
          <button
            key={stat.title}
            onClick={stat.onClick}
            className={`
              ${stat.bgColor} 
              rounded-lg p-4 md:p-6 
              shadow-sm border border-gray-200 
              hover:shadow-lg hover:scale-105 hover:${stat.hoverBorderColor}
              transition-all duration-300 
              cursor-pointer group
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
              text-left w-full
            `}
            type="button"
            aria-label={stat.title}
          >
            <div className="flex items-center justify-between">
              {/* Texto */}
              <div className="flex-1 min-w-0">
                <h3 className={`
                  text-sm md:text-lg font-medium text-gray-900 
                  group-hover:${stat.hoverTextColor}
                  transition-colors duration-300 
                  break-words
                `}>
                  {stat.title}
                </h3>
              </div>

              {/* Ícone */}
              <div className={`
                ${stat.iconBg} p-2 md:p-3 rounded-lg 
                group-hover:${stat.hoverIconBg} group-hover:scale-110
                transition-all duration-300 
                flex-shrink-0 ml-2
              `}>
                <stat.icon 
                  className={`
                    w-4 h-4 md:w-6 md:h-6 
                    ${stat.iconColor} 
                    group-hover:${stat.hoverTextColor}
                  `} 
                  aria-hidden="true"
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modais */}
      {showNovoChamadoPopup && (
        <NovoChamadoPopup
          onClose={() => setShowNovoChamadoPopup(false)}
          onSuccess={() => setShowNovoChamadoPopup(false)}
        />
      )}

      {showMeusChamadosPopup && (
        <MeusChamadosPopup 
          onClose={() => setShowMeusChamadosPopup(false)} 
        />
      )}

      {showAprovarChamadosPopup && (
        <AprovarChamadosPopup 
          onClose={() => setShowAprovarChamadosPopup(false)} 
        />
      )}
    </>
  );
};