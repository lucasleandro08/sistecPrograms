/**
 * @fileoverview Header Component - Barra de navegação superior
 * 
 * Componente responsável pela navegação principal do sistema, incluindo:
 * - Menu mobile responsivo
 * - Sistema de notificações em tempo real
 * - Painel de perfil do usuário
 * - Modal de confirmação de logout
 * 
 * @component
 * @example
 * ```tsx
 * <Header />
 * ```
 * 
 * Responsividade:
 * - Mobile (<768px): Menu hamburger, logo pequeno, ícones compactos
 * - Tablet (768-1024px): Transição para layout desktop
 * - Desktop (>1024px): Header full com todos os elementos visíveis
 * 
 * Nielsen Heuristics:
 * #1 - Visibility of system status: Contador de notificações não lidas
 * #2 - Match between system and real world: Ícones intuitivos
 * #3 - User control and freedom: Confirmação de logout
 * #5 - Error prevention: Modal de confirmação antes de sair
 * #6 - Recognition rather than recall: Nome e perfil do usuário visíveis
 * #7 - Flexibility and efficiency: Click fora fecha dropdowns
 * #8 - Aesthetic and minimalist design: Interface limpa
 * #9 - Help users recognize errors: Feedback visual de ações
 * #10 - Help and documentation: Labels descritivos em botões
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Menu, User, LogOut, AlertTriangle, X, CheckCheck, 
  CheckCircle, XCircle, Info, Clock
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MobileMenu } from './MobileMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Configuração do Toast Container
 */
const TOAST_CONFIG = Object.freeze({
  POSITION: 'top-right' as const,
  AUTO_CLOSE: 3000,
  HIDE_PROGRESS_BAR: false,
  NEWEST_ON_TOP: true,
  CLOSE_ON_CLICK: true,
  PAUSE_ON_HOVER: true,
  THEME: 'light' as const,
  STACKED: true
});

/**
 * Timing para logout
 */
const LOGOUT_DELAY_MS = 500;

/**
 * Mapeamento de tipos de notificação para ícones
 */
const NOTIFICATION_ICONS = Object.freeze({
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
});

/**
 * Cores dos ícones por tipo
 */
const ICON_COLORS = Object.freeze({
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-orange-600',
  info: 'text-blue-600'
});

/**
 * Classes de fundo por tipo (quando não lida)
 */
const BG_COLORS = Object.freeze({
  success: 'bg-green-50 border-l-4 border-green-500',
  error: 'bg-red-50 border-l-4 border-red-500',
  warning: 'bg-orange-50 border-l-4 border-orange-500',
  info: 'bg-blue-50 border-l-4 border-blue-500'
});

// ============================================================================
// HELPER FUNCTIONS (PRIVADAS)
// ============================================================================

/**
 * Retorna o ícone apropriado para o tipo de notificação
 * @private
 * @param {string} tipo - Tipo da notificação (success, error, warning, info)
 * @returns {JSX.Element} Ícone React
 */
const getTipoIcon = (tipo: string): JSX.Element => {
  const IconComponent = NOTIFICATION_ICONS[tipo as keyof typeof NOTIFICATION_ICONS] || Info;
  const colorClass = ICON_COLORS[tipo as keyof typeof ICON_COLORS] || ICON_COLORS.info;
  
  return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
};

/**
 * Retorna a classe de fundo apropriada para a notificação
 * @private
 * @param {string} tipo - Tipo da notificação
 * @param {boolean} lida - Se a notificação foi lida
 * @returns {string} Classes CSS
 */
const getTipoBgColor = (tipo: string, lida: boolean): string => {
  if (lida) return '';
  return BG_COLORS[tipo as keyof typeof BG_COLORS] || BG_COLORS.info;
};

/**
 * Formata o contador de notificações (max 99+)
 * @private
 * @param {number} count - Número de notificações
 * @returns {string} Contador formatado
 */
const formatUnreadCount = (count: number): string => {
  return count > 99 ? '99+' : count.toString();
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Header - Componente de navegação superior
 * 
 * Gerencia a navegação principal, notificações e perfil do usuário.
 * Responsivo para mobile, tablet e desktop.
 */
export const Header = () => {
  // ========== STATES ==========
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [processando, setProcessando] = useState(false);
  
  // ========== HOOKS ==========
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // ========== REFS ==========
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ========== EFFECTS ==========
  
  /**
   * Fecha dropdowns quando clicar fora
   * Nielsen Heuristic #7: Flexibility and efficiency of use
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fecha notificações se clicar fora
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      
      // Fecha perfil se clicar fora
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfilePanelOpen(false);
      }
    };

    // Só adiciona listener se algum dropdown estiver aberto
    if (isNotificationOpen || isProfilePanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen, isProfilePanelOpen]);

  // ========== HANDLERS ==========
  
  /**
   * Handler para clique em notificação
   * Marca como lida sem abrir modal
   */
  const handleNotificationClick = (notification: any) => {
    console.log('🔔 Notificação clicada:', notification);
    
    // Apenas marca como lida, sem abrir modal
    if (!notification.lida) {
      markAsRead(notification.id_notificacao);
    }
  };

  /**
   * Inicia processo de logout
   * Nielsen Heuristic #3: User control and freedom
   */
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  /**
   * Confirma e executa logout
   * Nielsen Heuristic #5: Error prevention (confirmação)
   */
  const handleLogoutConfirm = () => {
    setProcessando(true);
    
    setTimeout(() => {
      logout();
      setIsProfilePanelOpen(false);
      setShowLogoutConfirm(false);
      setProcessando(false);
    }, LOGOUT_DELAY_MS);
  };

  /**
   * Cancela logout e fecha modais
   */
  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
    setIsProfilePanelOpen(false);
  };

  // ========== RENDER ==========
  
  return (
    <>
      {/* Toast Container - Nielsen Heuristic #9: Help users recognize errors */}
      <ToastContainer
        position={TOAST_CONFIG.POSITION}
        autoClose={TOAST_CONFIG.AUTO_CLOSE}
        hideProgressBar={TOAST_CONFIG.HIDE_PROGRESS_BAR}
        newestOnTop={TOAST_CONFIG.NEWEST_ON_TOP}
        closeOnClick={TOAST_CONFIG.CLOSE_ON_CLICK}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={TOAST_CONFIG.PAUSE_ON_HOVER}
        theme={TOAST_CONFIG.THEME}
        stacked={TOAST_CONFIG.STACKED}
      />

      {/* Header fixo - Responsivo para mobile e desktop */}
      {/* Nielsen Heuristic #8: Aesthetic and minimalist design */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 md:left-64 z-50 w-full md:w-[calc(100%-16rem)]">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          {/* Logo e Menu Mobile - Nielsen Heuristic #2: Match between system and real world */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-orange-500 transition-colors"
              aria-label="Abrir menu móvel"
            >
              <Menu className="w-6 h-6" />
            </button>
            <img
              src="/lovable-uploads/d3655855-204d-4a0f-a98d-2d80537273b9.png"
              alt="Sistec"
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="hidden md:block"></div>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Notificações"
                type="button"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600 hover:text-orange-500 transition-colors" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1 animate-pulse">
                    <span className="text-xs text-white font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                )}
              </button>

              {/* Dropdown de Notificações */}
              {isNotificationOpen && (
                <div 
                  className="absolute top-14 right-0 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] animate-fade-in max-h-[500px] flex flex-col"
                  style={{ zIndex: 9999 }}
                >
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg sticky top-0 z-10">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notificações {unreadCount > 0 && `(${unreadCount})`}
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllAsRead();
                          }}
                          className="text-xs text-white hover:text-orange-100 flex items-center gap-1 font-medium bg-white/20 px-2 py-1 rounded"
                          title="Marcar todas como lidas"
                          type="button"
                        >
                          <CheckCheck className="w-4 h-4" />
                          Marcar todas
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNotificationOpen(false);
                        }}
                        className="text-white hover:text-orange-100 ml-2"
                        type="button"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de Notificações */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="font-medium">Nenhuma notificação</p>
                        <p className="text-xs mt-1">Você está em dia!</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id_notificacao}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${
                            getTipoBgColor(notification.tipo, notification.lida)
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getTipoIcon(notification.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${notification.lida ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                                  {notification.titulo}
                                </p>
                                {!notification.lida && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5 animate-pulse"></div>
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${notification.lida ? 'text-gray-500' : 'text-gray-600'}`}>
                                {notification.mensagem}
                              </p>
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(notification.data_criacao), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfilePanelOpen(!isProfilePanelOpen)}
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-100 p-1 md:p-2 rounded-lg transition-colors"
                aria-haspopup="true"
                aria-expanded={isProfilePanelOpen}
                aria-label="Abrir painel de perfil"
                type="button"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.perfil?.nome || 'Usuário'}</p>
                </div>
              </button>

              {isProfilePanelOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black bg-opacity-20 z-40"
                    onClick={() => setIsProfilePanelOpen(false)}
                    aria-hidden="true"
                  />

                  <div className="absolute top-16 right-0 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{user?.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                          <p className="text-xs text-orange-600 font-medium">{user?.perfil?.nome || 'Usuário'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                        type="button"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair do Sistema</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in">
            <div className="bg-orange-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Confirmar Saída</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-orange-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Tem certeza que deseja sair do sistema?
                </h4>
                <p className="text-sm text-gray-600">
                  Você precisará fazer login novamente para acessar o sistema.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setIsProfilePanelOpen(false);
                  }}
                  disabled={processando}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  disabled={processando}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  type="button"
                >
                  {processando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saindo...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Sim, Sair
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
