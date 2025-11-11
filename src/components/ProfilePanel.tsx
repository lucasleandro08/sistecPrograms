/**
 * @fileoverview Painel de Perfil do Usuário
 * 
 * Componente dropdown que exibe informações do usuário logado e ações relacionadas
 * ao perfil (configurações, logout, etc). Aparece ao clicar no ícone de usuário
 * no header.
 * 
 * @module components/ProfilePanel
 * 
 * @example
 * ```tsx
 * <ProfilePanel 
 *   isOpen={showProfile} 
 *   onClose={() => setShowProfile(false)} 
 * />
 * ```
 * 
 * Features:
 * - Informações do usuário (nome, email, nível)
 * - Menu de ações (perfil, configurações)
 * - Logout com confirmação
 * - Overlay clicável
 * - Animação de entrada
 * - Integração com contexto de autenticação
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Gerencia apenas painel de perfil
 * - Open/Closed: Extensível via array de menu items
 * - Dependency Inversion: Usa useAuth() como abstração
 * 
 * Nielsen Heuristics:
 * - #1: Visibilidade (informações do usuário sempre visíveis)
 * - #3: Controle do usuário (confirmação antes de sair)
 * - #5: Prevenção de erros (modal de confirmação)
 * - #6: Reconhecimento (ícones + labels)
 * - #8: Design minimalista (apenas ações essenciais)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, Settings, LogOut, Shield, X, AlertTriangle, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Textos da interface
 * @constant
 */
const UI_TEXT = Object.freeze({
  MENU: {
    MY_PROFILE: 'Meu Perfil',
    SETTINGS: 'Configurações',
    LOGOUT: 'Sair'
  },
  LOGOUT_MODAL: {
    TITLE: 'Confirmar saída',
    MESSAGE: 'Tem certeza que deseja sair do sistema?',
    DESCRIPTION: 'Você precisará fazer login novamente para acessar.',
    CANCEL: 'Cancelar',
    CONFIRM: 'Sair'
  },
  ARIA: {
    CLOSE_PANEL: 'Fechar painel de perfil',
    CLOSE_MODAL: 'Fechar modal de confirmação'
  }
});

/**
 * Mapeamento de níveis de acesso para labels
 * @constant
 */
const ACCESS_LEVEL_LABELS: Record<number, string> = Object.freeze({
  1: 'Usuário',
  2: 'Analista',
  3: 'Gestor',
  4: 'Gerente',
  5: 'Administrador'
});

/**
 * Classes CSS reutilizáveis
 * @constant
 */
const STYLES = Object.freeze({
  OVERLAY: 'fixed inset-0 bg-black bg-opacity-20 z-40',
  PANEL: 'absolute top-16 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in',
  MENU_ITEM: 'w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 group',
  LOGOUT_ITEM: 'w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group',
  MODAL_OVERLAY: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'
});

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Props do componente ProfilePanel
 */
interface ProfilePanelProps {
  /** Se o painel está visível */
  isOpen: boolean;
  /** Callback ao fechar o painel */
  onClose: () => void;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * Painel dropdown de perfil do usuário
 * 
 * @param {ProfilePanelProps} props - Props do componente
 * @returns {JSX.Element | null} Painel de perfil ou null se fechado
 * 
 * @description
 * Nielsen Heuristic #1: Visibilidade do status do sistema
 * - Mostra informações do usuário logado
 * - Badge visual do nível de acesso
 * 
 * Nielsen Heuristic #3: Controle e liberdade do usuário
 * - Fechar clicando no overlay
 * - Confirmação antes de ações destrutivas
 * 
 * Nielsen Heuristic #5: Prevenção de erros
 * - Modal de confirmação antes do logout
 * - Mensagem clara das consequências
 * 
 * Nielsen Heuristic #6: Reconhecimento em vez de memorização
 * - Ícones descritivos para cada ação
 * - Labels claras e auto-explicativas
 */
export const ProfilePanel: React.FC<ProfilePanelProps> = ({ 
  isOpen, 
  onClose 
}): JSX.Element | null => {
  // ==========================================
  // STATE E HOOKS
  // ==========================================

  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const { user, logout } = useAuth();

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Handler para logout do sistema
   * 
   * @description
   * Nielsen Heuristic #1: Visibilidade do status do sistema
   * - Feedback claro ao sair
   */
  const handleLogout = useCallback((): void => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  /**
   * Handler para fechar painel ao pressionar ESC
   * 
   * @param {KeyboardEvent} e - Evento de teclado
   * @description
   * Nielsen Heuristic #3: Controle e liberdade do usuário
   * - Tecla ESC fecha o painel
   */
  const handleEscapeKey = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (showLogoutConfirm) {
        setShowLogoutConfirm(false);
      } else {
        onClose();
      }
    }
  }, [showLogoutConfirm, onClose]);

  /**
   * Handler para fechar ao clicar no overlay
   * 
   * @param {React.MouseEvent} e - Evento de clique
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ==========================================
  // EFFECTS
  // ==========================================

  /**
   * Effect: Adiciona listener de ESC
   */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Retorna o label do nível de acesso
   * @returns {string} Label do nível
   */
  const getAccessLevelLabel = (): string => {
    const nivel = user?.perfil?.nivel_acesso ?? 1;
    return ACCESS_LEVEL_LABELS[nivel] || 'Usuário';
  };

  /**
   * Retorna as iniciais do nome do usuário
   * @returns {string} Iniciais (ex: "JS" para "João Silva")
   */
  const getUserInitials = (): string => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={STYLES.OVERLAY}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Panel */}
      <div 
        className={STYLES.PANEL}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-panel-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div 
              className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md"
              aria-hidden="true"
            >
              <span className="text-white font-bold text-lg">
                {getUserInitials()}
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 
                id="profile-panel-title"
                className="font-semibold text-gray-900 truncate"
              >
                {user?.name || 'Usuário'}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                <span>{user?.email || 'email@exemplo.com'}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3 text-orange-500 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-orange-600 font-medium">
                  {getAccessLevelLabel()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <div className="space-y-1">
            {/* Meu Perfil */}
            <button 
              className={STYLES.MENU_ITEM}
              onClick={() => {
                // TODO: Navegar para página de perfil
                console.log('Navegar para perfil');
              }}
              type="button"
            >
              <User className="w-4 h-4 group-hover:text-orange-500 transition-colors" aria-hidden="true" />
              <span className="group-hover:text-gray-900">{UI_TEXT.MENU.MY_PROFILE}</span>
            </button>

            {/* Configurações */}
            <button 
              className={STYLES.MENU_ITEM}
              onClick={() => {
                // TODO: Navegar para configurações
                console.log('Navegar para configurações');
              }}
              type="button"
            >
              <Settings className="w-4 h-4 group-hover:text-orange-500 transition-colors" aria-hidden="true" />
              <span className="group-hover:text-gray-900">{UI_TEXT.MENU.SETTINGS}</span>
            </button>
          </div>

          {/* Divider + Logout */}
          <div className="border-t border-gray-200 mt-2 pt-2">
            <button
              className={STYLES.LOGOUT_ITEM}
              onClick={() => setShowLogoutConfirm(true)}
              type="button"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>{UI_TEXT.MENU.LOGOUT}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de logout */}
      {showLogoutConfirm && (
        <div 
          className={STYLES.MODAL_OVERLAY}
          onClick={(e) => e.target === e.currentTarget && setShowLogoutConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            {/* Modal Header */}
            <div className="bg-orange-600 text-white flex items-center justify-between p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                <span id="logout-modal-title" className="font-bold">
                  {UI_TEXT.LOGOUT_MODAL.TITLE}
                </span>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label={UI_TEXT.ARIA.CLOSE_MODAL}
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              <p className="text-gray-800 text-lg font-semibold mb-2">
                {UI_TEXT.LOGOUT_MODAL.MESSAGE}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {UI_TEXT.LOGOUT_MODAL.DESCRIPTION}
              </p>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  {UI_TEXT.LOGOUT_MODAL.CANCEL}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1"
                  type="button"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  {UI_TEXT.LOGOUT_MODAL.CONFIRM}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
