/**
 * @fileoverview Cards de Gerenciamento de Usuários
 * 
 * Componente que exibe cards de ações administrativas para gerenciamento de usuários:
 * - Cadastrar novo usuário
 * - Editar usuário existente
 * - Desativar usuário
 * - Recuperar senha
 * 
 * @module components/UserManagementCards
 * 
 * @example
 * ```tsx
 * <UserManagementCards />
 * ```
 * 
 * Features:
 * - Grid responsivo de cards (1/2/4 colunas)
 * - Modais integrados para cada ação
 * - Animações de hover
 * - Ícones descritivos Lucide
 * - Gerenciamento centralizado de formulários
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Gerencia apenas cards de ações administrativas
 * - Open/Closed: Extensível via configuração de cards
 * - Dependency Inversion: Formulários injetados como componentes
 * 
 * Nielsen Heuristics:
 * - #1: Visibilidade (ações administrativas destacadas)
 * - #4: Consistência (padrão visual uniforme)
 * - #6: Reconhecimento (ícones + texto)
 * - #7: Flexibilidade (atalhos para ações comuns)
 * - #8: Design minimalista (apenas ações essenciais)
 */

import React, { useState, useCallback } from 'react';
import { UserPlus, Edit, UserX, KeyRound, LucideIcon } from 'lucide-react';
import { CadastrarUsuarioForm } from './CadastrarUsuarioForm';
import { RecuperarSenhaForm } from './RecuperarSenhaForm';

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Textos da interface
 * @constant
 */
const UI_TEXT = Object.freeze({
  CARDS: {
    CADASTRAR: 'Cadastrar Usuário',
    EDITAR: 'Editar Usuário',
    DESATIVAR: 'Desativar Usuário',
    RECUPERAR: 'Recuperar Senha'
  }
});

/**
 * Tipos de ações disponíveis
 * @constant
 */
const ACTION_TYPES = Object.freeze({
  CADASTRAR: 'cadastrar' as const,
  EDITAR: 'editar' as const,
  DESATIVAR: 'desativar' as const,
  RECUPERAR: 'recuperar' as const
});

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Tipos de formulário disponíveis
 */
type FormType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES] | null;

/**
 * Tipo específico para modo do formulário de usuário
 */
type UserFormMode = 'cadastrar' | 'editar' | 'desativar';

/**
 * Configuração de um card de ação
 */
interface ActionCard {
  /** Título do card */
  title: string;
  /** Ícone Lucide a ser exibido */
  icon: LucideIcon;
  /** Tipo de ação do card */
  actionType: FormType;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * Grid de cards para gerenciamento de usuários
 * 
 * @returns {JSX.Element} Grid de cards interativos
 * 
 * @description
 * Nielsen Heuristic #1: Visibilidade do status do sistema
 * - Ações administrativas claramente destacadas
 * - Feedback visual no hover
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
 * - Atalhos rápidos para ações administrativas comuns
 * - Acesso direto aos formulários
 * 
 * Nielsen Heuristic #8: Design estético e minimalista
 * - Apenas ações essenciais
 * - Layout limpo e organizado
 */
export const UserManagementCards = (): JSX.Element => {
  // ==========================================
  // STATE
  // ==========================================

  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [motivoDesativacao, setMotivoDesativacao] = useState<string>('');

  // ==========================================
  // CONFIGURAÇÃO DOS CARDS
  // ==========================================

  /**
   * Configuração dos cards de ação
   * @constant
   */
  const cards: ActionCard[] = [
    {
      title: UI_TEXT.CARDS.CADASTRAR,
      icon: UserPlus,
      actionType: ACTION_TYPES.CADASTRAR
    },
    {
      title: UI_TEXT.CARDS.EDITAR,
      icon: Edit,
      actionType: ACTION_TYPES.EDITAR
    },
    {
      title: UI_TEXT.CARDS.DESATIVAR,
      icon: UserX,
      actionType: ACTION_TYPES.DESATIVAR
    },
    {
      title: UI_TEXT.CARDS.RECUPERAR,
      icon: KeyRound,
      actionType: ACTION_TYPES.RECUPERAR
    }
  ];

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Fecha o formulário ativo e reseta estados
   * 
   * @description
   * Nielsen Heuristic #3: Controle e liberdade do usuário
   * - Permite fechar formulário a qualquer momento
   */
  const closeForm = useCallback((): void => {
    setActiveForm(null);
    setMotivoDesativacao('');
  }, []);

  /**
   * Abre um formulário específico
   * 
   * @param {FormType} formType - Tipo do formulário a abrir
   */
  const openForm = useCallback((formType: FormType): void => {
    setActiveForm(formType);
  }, []);

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Verifica se deve exibir formulário de usuário
   * @returns {boolean} True se deve exibir
   */
  const shouldShowUserForm = (): boolean => {
    return (
      activeForm === ACTION_TYPES.CADASTRAR ||
      activeForm === ACTION_TYPES.EDITAR ||
      activeForm === ACTION_TYPES.DESATIVAR
    );
  };

  /**
   * Verifica se deve exibir formulário de recuperação
   * @returns {boolean} True se deve exibir
   */
  const shouldShowRecoverForm = (): boolean => {
    return activeForm === ACTION_TYPES.RECUPERAR;
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {cards.map((card) => (
          <button
            key={card.actionType}
            onClick={() => openForm(card.actionType)}
            className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-left w-full"
            type="button"
            aria-label={card.title}
          >
            <div className="flex items-center justify-between">
              {/* Texto */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-lg font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-300 break-words">
                  {card.title}
                </h3>
              </div>

              {/* Ícone */}
              <div className="bg-orange-100 p-2 md:p-3 rounded-lg group-hover:bg-orange-200 group-hover:scale-110 transition-all duration-300 flex-shrink-0 ml-2">
                <card.icon 
                  className="w-4 h-4 md:w-6 md:h-6 text-orange-500 group-hover:text-orange-600 transition-colors duration-300" 
                  aria-hidden="true"
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Formulário de Usuário (Cadastrar/Editar/Desativar) */}
      {shouldShowUserForm() && (
        <CadastrarUsuarioForm
          onClose={closeForm}
          mode={activeForm as UserFormMode}
          motivo={motivoDesativacao}
          onMotivoChange={setMotivoDesativacao}
        />
      )}

      {/* Formulário de Recuperação de Senha */}
      {shouldShowRecoverForm() && (
        <RecuperarSenhaForm onClose={closeForm} />
      )}
    </>
  );
};
