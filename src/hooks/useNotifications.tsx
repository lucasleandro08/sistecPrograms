import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface Notification {
  id_notificacao: number;
  id_usuario: number;
  id_chamado: number;
  titulo: string;
  mensagem: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
  lida: boolean;
  data_criacao: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    console.log('🎧 Configurando Supabase Realtime para usuário:', user.id);

    const realtimeChannel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `id_usuario=eq.${user.id}`
        },
        (payload) => {
          console.log('📩 Nova notificação recebida:', payload);
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          showToast(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
          filter: `id_usuario=eq.${user.id}`
        },
        (payload) => {
          console.log('📝 Notificação atualizada:', payload);
          const updatedNotif = payload.new as Notification;
          
          setNotifications(prev =>
            prev.map(n =>
              n.id_notificacao === updatedNotif.id_notificacao
                ? updatedNotif
                : n
            )
          );
          
          const oldNotif = payload.old as Notification;
          if (oldNotif && !oldNotif.lida && updatedNotif.lida) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notificacoes',
          filter: `id_usuario=eq.${user.id}`
        },
        (payload) => {
          console.log('🗑️ Notificação deletada:', payload);
          const deletedNotif = payload.old as Notification;
          
          setNotifications(prev =>
            prev.filter(n => n.id_notificacao !== deletedNotif.id_notificacao)
          );
          
          if (!deletedNotif.lida) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da conexão Realtime:', status);
      });

    setChannel(realtimeChannel);

    return () => {
      console.log('🔌 Desconectando Supabase Realtime');
      realtimeChannel.unsubscribe();
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('id_usuario', user.id)
        .order('data_criacao', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.lida).length || 0);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const showToast = (notification: Notification) => {
    const config = {
      autoClose: 3000,
      position: 'top-right' as const,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    const getIcon = () => {
      switch (notification.tipo) {
        case 'success':
          return <CheckCircle className="w-5 h-5" />;
        case 'error':
          return <XCircle className="w-5 h-5" />;
        case 'warning':
          return <AlertTriangle className="w-5 h-5" />;
        default:
          return <Info className="w-5 h-5" />;
      }
    };

    const ToastContent = () => (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{notification.titulo}</div>
          <div className="text-xs mt-1">{notification.mensagem}</div>
        </div>
      </div>
    );

    switch (notification.tipo) {
      case 'success':
        toast.success(<ToastContent />, config);
        break;
      case 'error':
        toast.error(<ToastContent />, config);
        break;
      case 'warning':
        toast.warning(<ToastContent />, config);
        break;
      default:
        toast.info(<ToastContent />, config);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id_notificacao', id)
        .eq('id_usuario', user!.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id_usuario', user.id)
        .eq('lida', false);

      if (error) throw error;

      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id_notificacao', id)
        .eq('id_usuario', user!.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications
  };
};
