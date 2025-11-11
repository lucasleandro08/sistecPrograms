/**
 * @fileoverview Hook de Notificações com Polling Inteligente
 * 
 * Hook customizado que gerencia notificações do usuário usando polling inteligente.
 * 
 * Features:
 * - Polling automático a cada 5 segundos
 * - Detecção de novas notificações por comparação de IDs
 * - Toast notifications apenas para notificações realmente novas
 * - Contagem de notificações não lidas
 * - Operações CRUD completas
 * - Auto-cleanup ao desmontar
 * - Compatível com autenticação customizada (não requer Supabase Auth)
 * 
 * Por que Polling e não Realtime?
 * - Sistema usa autenticação customizada via API REST
 * - Supabase Realtime requer autenticação via Supabase Auth
 * - Polling é mais confiável para este caso de uso
 * - 5 segundos de delay é imperceptível para o usuário
 * - Menos complexidade, menos bugs
 * 
 * @module hooks/useNotifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

// ==========================================
// VARIÁVEIS DE MÓDULO (SINGLETON)
// ==========================================

/**
 * Flag global para garantir apenas um polling ativo
 * Precisa ser variável de módulo (não useRef) para funcionar entre instâncias
 */
let isPollingActive = false;

/**
 * ID do intervalo ativo (para cleanup global)
 */
let activeIntervalId: NodeJS.Timeout | null = null;

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Tipos de notificação possíveis
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interface de uma notificação
 */
export interface Notification {
  id_notificacao: number;
  id_usuario: number;
  id_chamado: number;
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  lida: boolean;
  data_criacao: string;
}

/**
 * Retorno do hook useNotifications
 */
export interface UseNotificationsReturn {
  /** Lista de notificações do usuário */
  notifications: Notification[];
  /** Quantidade de notificações não lidas */
  unreadCount: number;
  /** Marca uma notificação como lida */
  markAsRead: (id: number) => Promise<void>;
  /** Marca todas as notificações como lidas */
  markAllAsRead: () => Promise<void>;
  /** Deleta uma notificação */
  deleteNotification: (id: number) => Promise<void>;
  /** Recarrega as notificações */
  loadNotifications: () => Promise<void>;
}

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Configurações do Supabase Realtime
 * @constant {Object}
 */
const REALTIME_CONFIG = Object.freeze({
  CHANNEL_NAME: 'notificacoes-changes',
  SCHEMA: 'public',
  TABLE: 'notificacoes',
  LIMIT: 50,
  POLLING_INTERVAL: 5000, // 5 segundos
  MAX_RETRIES: 3
});

/**
 * Configurações dos toasts
 * @constant {Object}
 */
const TOAST_CONFIG = Object.freeze({
  autoClose: 3000,
  position: 'top-right' as const,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
});

/**
 * Mensagens de log
 * @constant {Object}
 */
const LOG_MESSAGES = Object.freeze({
  SETUP_POLLING: '🔄 Configurando polling de notificações para usuário:',
  NEW_NOTIFICATION: '📩 Nova notificação detectada:',
  POLLING_ERROR: '❌ Erro no polling de notificações:',
  POLLING_SUCCESS: '✅ Polling executado com sucesso',
  STOPPING_POLLING: '🔌 Parando polling de notificações'
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Retorna o ícone apropriado para o tipo de notificação
 * @private
 * @param {NotificationType} type - Tipo da notificação
 * @returns {JSX.Element} Ícone React
 */
const getNotificationIcon = (type: NotificationType): JSX.Element => {
  const iconMap: Record<NotificationType, JSX.Element> = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  return iconMap[type];
};

/**
 * Cria componente de conteúdo do toast
 * @private
 * @param {Notification} notification - Notificação a exibir
 * @returns {JSX.Element} Componente do toast
 */
const createToastContent = (notification: Notification): JSX.Element => {
  // Garantir que há conteúdo visível
  const titulo = notification.titulo || `Chamado #${notification.id_chamado}`;
  const mensagem = notification.mensagem || 'Nova atualização no chamado';
  
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.tipo)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{titulo}</div>
        <div className="text-xs mt-1 line-clamp-2">{mensagem}</div>
      </div>
    </div>
  );
};

/**
 * Exibe toast com base no tipo de notificação
 * @private
 * @param {Notification} notification - Notificação a exibir
 */
const showToast = (notification: Notification): void => {
  const content = createToastContent(notification);
  const config = TOAST_CONFIG;

  const toastFunctionMap: Record<NotificationType, typeof toast.success> = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info
  };

  const toastFunction = toastFunctionMap[notification.tipo];
  toastFunction(content, config);
};

/**
 * Calcula quantidade de notificações não lidas
 * @private
 * @param {Notification[]} notifications - Array de notificações
 * @returns {number} Quantidade não lida
 */
const calculateUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(n => !n.lida).length;
};

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook que gerencia notificações do usuário com polling inteligente
 * 
 * Usa polling a cada 5 segundos para buscar novas notificações.
 * Compara IDs para detectar notificações realmente novas.
 * Exibe toasts automaticamente para novas notificações.
 * Gerencia contador de não lidas e operações CRUD.
 * 
 * @returns {UseNotificationsReturn} Objeto com notificações e funções
 * 
 * @example
 * // Uso básico
 * function NotificationBell() {
 *   const { notifications, unreadCount, markAsRead } = useNotifications();
 *   
 *   return (
 *     <div>
 *       <Badge count={unreadCount} />
 *       {notifications.map(notif => (
 *         <NotificationItem 
 *           key={notif.id_notificacao}
 *           notification={notif}
 *           onRead={() => markAsRead(notif.id_notificacao)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const previousNotificationsIdsRef = useRef<Set<number>>(new Set());
  const isFirstFetchRef = useRef<boolean>(true); // ✅ Flag para primeira busca
  const { user } = useAuth();

  /**
   * Carrega notificações do banco de dados
   */
  const loadNotifications = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from(REALTIME_CONFIG.TABLE)
        .select('*')
        .eq('id_usuario', user.id)
        .order('data_criacao', { ascending: false })
        .limit(REALTIME_CONFIG.LIMIT);

      if (error) throw error;

      const notificationData = data || [];
      setNotifications(notificationData);
      setUnreadCount(calculateUnreadCount(notificationData));
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
    }
  }, [user]);

  /**
   * Marca uma notificação como lida
   */
  const markAsRead = useCallback(async (id: number): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from(REALTIME_CONFIG.TABLE)
        .update({ lida: true })
        .eq('id_notificacao', id)
        .eq('id_usuario', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
    }
  }, [user]);

  /**
   * Marca todas as notificações como lidas
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from(REALTIME_CONFIG.TABLE)
        .update({ lida: true })
        .eq('id_usuario', user.id)
        .eq('lida', false);

      if (error) throw error;

      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
    }
  }, [user]);

  /**
   * Deleta uma notificação
   */
  const deleteNotification = useCallback(async (id: number): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from(REALTIME_CONFIG.TABLE)
        .delete()
        .eq('id_notificacao', id)
        .eq('id_usuario', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error);
    }
  }, [user]);

  // ==========================================
  // EFEITOS
  // ==========================================

  /**
   * Effect: Carrega notificações quando usuário autentica
   */
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  /**
   * Effect: Sistema de Polling para notificações em tempo real
   * 
   * Polling inteligente que:
   * - Busca novas notificações a cada 5 segundos
   * - Detecta novas notificações comparando IDs
   * - Exibe toast apenas para notificações realmente novas
   * - Limpa interval ao desmontar
   * 
   * Nielsen Heuristic #1: Visibilidade do status do sistema
   * - Notificações aparecem automaticamente sem F5
   * - Toast para feedback imediato
   * 
   * Nielsen Heuristic #2: Correspondência com o mundo real
   * - Comportamento similar a apps de mensagens (WhatsApp, Telegram)
   */
  useEffect(() => {
    if (!user?.id) return;

    // ⚡ CRÍTICO: Limpar interval anterior se existir (HMR ou re-renderização)
    if (activeIntervalId) {
      clearInterval(activeIntervalId);
      activeIntervalId = null;
      isPollingActive = false;
    }

    // ⚡ CRÍTICO: Prevenir múltiplos pollings simultâneos usando variável de módulo
    if (isPollingActive) return;

    isPollingActive = true;

    // Função de polling
    const pollNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from(REALTIME_CONFIG.TABLE)
          .select('*')
          .eq('id_usuario', user.id)
          .order('data_criacao', { ascending: false })
          .limit(REALTIME_CONFIG.LIMIT);

        if (error) {
          console.error('❌ Erro ao fazer polling:', error);
          return;
        }

        const newNotifications = data || [];
        const newIds = new Set(newNotifications.map(n => n.id_notificacao));

        // Se for a primeira busca, apenas inicializa o Set sem exibir toasts
        if (isFirstFetchRef.current) {
          previousNotificationsIdsRef.current = newIds;
          isFirstFetchRef.current = false;
        } else {
          // Detectar notificações realmente novas (não estava no set anterior)
          const brandNewNotifications = newNotifications.filter(
            n => !previousNotificationsIdsRef.current.has(n.id_notificacao)
          );

          // ⚡ CRÍTICO: Criar NOVO Set e atualizar IMEDIATAMENTE
          // Isso garante que a próxima execução do polling terá os IDs atualizados
          previousNotificationsIdsRef.current = new Set(newNotifications.map(n => n.id_notificacao));

          // Se tem notificações novas, exibir toast (máximo 3 por vez)
          if (brandNewNotifications.length > 0) {
            brandNewNotifications.slice(0, 3).forEach(notification => {
              showToast(notification);
            });
          }
        }

        // Atualizar state (sempre, independente de ser primeira busca)
        setNotifications(newNotifications);
        setUnreadCount(calculateUnreadCount(newNotifications));
        
      } catch (error) {
        console.error('❌ Erro no polling:', error);
      }
    };

    // Primeira busca imediata
    pollNotifications();

    // Configurar interval para polling
    const interval = setInterval(pollNotifications, REALTIME_CONFIG.POLLING_INTERVAL);
    activeIntervalId = interval; // Salvar referência global

    // Cleanup: limpar interval ao desmontar
    return () => {
      isPollingActive = false;
      if (interval) {
        clearInterval(interval);
      }
      if (activeIntervalId === interval) {
        activeIntervalId = null;
      }
    };
  }, [user?.id]);

  // ==========================================
  // RETORNO
  // ==========================================

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications
  };
};
