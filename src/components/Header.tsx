import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Menu, User, LogOut, AlertTriangle, X, CheckCheck, 
  CheckCircle, XCircle, Info, Calendar, Clock, AlertCircle, Eye
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MobileMenu } from './MobileMenu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChamadoDetalhes {
  id_chamado: number;
  descricao_categoria_chamado: string;
  descricao_problema_chamado: string;
  descricao_status_chamado: string;
  prioridade_chamado: number;
  data_abertura: string;
  data_resolucao?: string;
  usuario_abertura: string;
  email_usuario: string;
  descricao_detalhada?: string;
  titulo_chamado?: string;
}

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<ChamadoDetalhes | null>(null);
  const [processando, setProcessando] = useState(false);
  const [loadingChamado, setLoadingChamado] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfilePanelOpen(false);
      }
    };

    if (isNotificationOpen || isProfilePanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen, isProfilePanelOpen]);

  const fetchChamadoDetalhes = async (idChamado: number) => {
    try {
      setLoadingChamado(true);
      console.log('🔍 Buscando detalhes do chamado:', idChamado);

      const response = await fetch(`http://localhost:3001/api/chamados/${idChamado}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados do chamado recebidos:', data);
        setSelectedChamado(data);
        setShowDetalhes(true);
      } else {
        const errorData = await response.json();
        alert(`Erro ao buscar detalhes: ${errorData.message}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar chamado:', error);
      alert('Erro de conexão ao buscar chamado');
    } finally {
      setLoadingChamado(false);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    console.log('🔔 Notificação clicada:', notification);
    
    if (!notification.lida) {
      markAsRead(notification.id_notificacao);
    }
    
    setIsNotificationOpen(false);
    
    // Buscar detalhes do chamado e abrir modal
    await fetchChamadoDetalhes(notification.id_chamado);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setProcessando(true);
    setTimeout(() => {
      logout();
      setIsProfilePanelOpen(false);
      setShowLogoutConfirm(false);
      setProcessando(false);
    }, 500);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'success': 
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': 
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': 
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default: 
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTipoBgColor = (tipo: string, lida: boolean) => {
    if (lida) return '';
    switch (tipo) {
      case 'success': return 'bg-green-50 border-l-4 border-green-500';
      case 'error': return 'bg-red-50 border-l-4 border-red-500';
      case 'warning': return 'bg-orange-50 border-l-4 border-orange-500';
      default: return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Data não disponível';
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getPrioridadeTexto = (prioridade: number) => {
    const textos: Record<number, string> = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
    return textos[prioridade] || 'Não definida';
  };

  const getPrioridadeColor = (prioridade: number) => {
    switch (prioridade) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'aberto': return 'bg-blue-100 text-blue-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'triagem ia': return 'bg-purple-100 text-purple-800';
      case 'aguardando resposta': return 'bg-yellow-100 text-yellow-800';
      case 'com analista': return 'bg-orange-100 text-orange-800';
      case 'escalado': return 'bg-purple-100 text-purple-800';
      case 'resolvido': return 'bg-emerald-100 text-emerald-800';
      case 'fechado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <AlertCircle className="w-4 h-4" />;
    
    switch (status.toLowerCase()) {
      case 'aberto':
        return <Clock className="w-4 h-4" />;
      case 'aprovado':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejeitado':
        return <XCircle className="w-4 h-4" />;
      case 'aguardando resposta':
        return <Clock className="w-4 h-4" />;
      case 'resolvido':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        stacked
      />

      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 md:left-64 z-50 w-full md:w-[calc(100%-16rem)]">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
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
                  <p className="text-xs text-gray-500">{user?.role}</p>
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
                          <p className="text-xs text-orange-600 font-medium">{user?.role}</p>
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

      {/* Modal de Detalhes do Chamado (Igual ao MeusChamadosPopup) */}
      {showDetalhes && selectedChamado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* CABEÇALHO FIXO */}
            <div className="bg-gray-800 text-white p-4 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  Detalhes do Chamado #{selectedChamado.id_chamado}
                </h3>
                <Button
                  onClick={() => {
                    setShowDetalhes(false);
                    setSelectedChamado(null);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-gray-700"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* CONTEÚDO ROLÁVEL */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedChamado.descricao_status_chamado || '')}`}>
                    {getStatusIcon(selectedChamado.descricao_status_chamado || '')}
                    {selectedChamado.descricao_status_chamado || 'Status não informado'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(selectedChamado.prioridade_chamado)}`}>
                    {getPrioridadeTexto(selectedChamado.prioridade_chamado)}
                  </span>
                </div>
              </div>

              {selectedChamado.titulo_chamado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <p className="text-gray-600 font-medium">{selectedChamado.titulo_chamado}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <p className="text-gray-600">{selectedChamado.descricao_categoria_chamado || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problema</label>
                <p className="text-gray-600">{selectedChamado.descricao_problema_chamado || 'Não informado'}</p>
              </div>

              {selectedChamado.descricao_detalhada && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedChamado.descricao_detalhada}
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Abertura</label>
                <p className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedChamado.data_abertura)}
                </p>
              </div>
              
              {selectedChamado.data_resolucao && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Resolução</label>
                  <p className="text-gray-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {formatDate(selectedChamado.data_resolucao)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingChamado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600">Carregando detalhes do chamado...</p>
          </div>
        </div>
      )}

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
