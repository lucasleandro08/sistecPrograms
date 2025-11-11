/**
 * @file AprovarChamadosPopup.tsx
 * @description Modal para gestores aprovarem ou rejeitarem chamados pendentes.
 * Oferece fluxos de listagem, visualizacao detalhada, aprovacao e rejeicao
 * com feedback visual consistente via alertbox global.
 *
 * @module Components/AprovarChamadosPopup
 * @category Tickets
 * @subcategory Popups
 * @since 2024-01-20
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Calendar, AlertCircle, Clock, CheckCircle, XCircle, Eye, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * @interface ChamadoParaAprovacao
 * @description Estrutura retornada pela API para itens pendentes de aprovacao.
 */
interface ChamadoParaAprovacao {
  id_chamado: number;
  descricao_categoria_chamado: string;
  descricao_problema_chamado: string;
  descricao_status_chamado: string;
  prioridade_chamado: number;
  data_abertura: string;
  usuario_abertura: string;
  email_usuario: string;
  descricao_detalhada?: string;
  titulo_chamado?: string;
}

/**
 * @interface AprovarChamadosPopupProps
 * @description Props aceitas pelo componente principal.
 */
interface AprovarChamadosPopupProps {
  onClose: () => void;
}

/**
 * @interface PriorityConfig
 * @description Configuracao de estilo e rotulo das prioridades.
 */
interface PriorityConfig {
  className: string;
  label: string;
}

/**
 * @interface AlertConfig
 * @description Parametros utilizados pelo alertbox global.
 */
interface AlertConfig {
  alertIcon: AlertType;
  title: string;
  themeColor: string;
  btnColor: string;
}

/**
 * @constant API_ENDPOINTS
 * @description Endpoints REST utilizados pelos fluxos da popup.
 */
const API_ENDPOINTS = {
  list: 'http://localhost:3001/api/chamados/aprovacao',
  approve: (id: number) => `http://localhost:3001/api/chamados/${id}/aprovar`,
  reject: (id: number) => `http://localhost:3001/api/chamados/${id}/rejeitar`,
} as const;

const MIN_APPROVER_ACCESS_LEVEL = 3;
const MIN_REJECTION_REASON_LENGTH = 10;
const ALERTBOX_STYLE_ID = 'alertbox-force-zindex-aprovar';

const PRIORITY_CONFIG: Record<number, PriorityConfig> = {
  4: { className: 'bg-red-100 text-red-800', label: 'Urgente' },
  3: { className: 'bg-orange-100 text-orange-800', label: 'Alta' },
  2: { className: 'bg-yellow-100 text-yellow-800', label: 'Média' },
  1: { className: 'bg-blue-100 text-blue-800', label: 'Baixa' },
};

const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  className: 'bg-gray-100 text-gray-800',
  label: 'Não definida',
};

const ALERT_STYLES: Record<AlertType, AlertConfig> = {
  success: { alertIcon: 'success', title: 'Sucesso!', themeColor: '#16a34a', btnColor: '#22c55e' },
  error: { alertIcon: 'error', title: 'Erro!', themeColor: '#dc2626', btnColor: '#ef4444' },
  warning: { alertIcon: 'warning', title: 'Atenção!', themeColor: '#ea580c', btnColor: '#f97316' },
  info: { alertIcon: 'info', title: 'Informação', themeColor: '#3b82f6', btnColor: '#60a5fa' },
};

/**
 * @function getPriorityConfig
 * @description Retorna configuracao de estilos para a prioridade informada.
 * @param {number} priority - Nivel de prioridade (1-4).
 * @returns {PriorityConfig}
 */
const getPriorityConfig = (priority: number): PriorityConfig => {
  return PRIORITY_CONFIG[priority] || DEFAULT_PRIORITY_CONFIG;
};

/**
 * @function formatDateTime
 * @description Formata data ISO para o padrao pt-BR (data + hora).
 * @param {string} isoDate - Data em formato ISO.
 * @returns {string}
 */
const formatDateTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString('pt-BR');
};

/**
 * @function setupAlertBoxZIndex
 * @description Garante que o alertbox global apareca acima de outros elementos.
 * @returns {() => void} Funcao de cleanup do MutationObserver.
 */
const setupAlertBoxZIndex = (): (() => void) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined;
  }

  let styleElement = document.getElementById(ALERTBOX_STYLE_ID) as HTMLStyleElement | null;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = ALERTBOX_STYLE_ID;
    styleElement.innerHTML = `
      .alertBoxBody,
      .alertBoxBody *,
      div[class*="alert"],
      div[id*="alert"] {
        z-index: 2147483647 !important;
      }
    `;

    document.head.appendChild(styleElement);
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          const alertElements = [
            node.querySelector('.alertBoxBody'),
            node.querySelector('[class*="alertBox"]'),
            node.querySelector('[id*="alertBox"]'),
            node.classList.contains('alertBoxBody') ? node : null,
          ].filter(Boolean) as HTMLElement[];

          alertElements.forEach((element) => {
            element.style.zIndex = '2147483647';
            element.style.position = 'fixed';
            element.style.top = '0';
            element.style.left = '0';
            element.style.width = '100%';
            element.style.height = '100%';

            const children = element.querySelectorAll('*');
            children.forEach((child) => {
              if (child instanceof HTMLElement) {
                child.style.zIndex = '2147483647';
              }
            });
          });
        }
      });
    });
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  return () => {
    observer.disconnect();
    document.getElementById(ALERTBOX_STYLE_ID)?.remove();
  };
};

/**
 * @function showAlert
 * @description Wrapper seguro para exibir alertas com fallback nativo.
 * @param {AlertType} type - Tipo do alerta exibido.
 * @param {string} message - Mensagem exibida ao usuario.
 */
const showAlert = (type: AlertType, message: string) => {
  if (typeof window !== 'undefined' && (window as any).alertbox) {
    const config = ALERT_STYLES[type];

    (window as any).alertbox.render({
      ...config,
      message,
      btnTitle: 'Ok',
      border: true,
    });

    setTimeout(() => {
      const alertBox =
        document.querySelector('.alertBoxBody') ||
        document.querySelector('[class*="alertBox"]') ||
        document.querySelector('[id*="alertBox"]');

      if (alertBox instanceof HTMLElement) {
        alertBox.style.zIndex = '2147483647';
        alertBox.style.position = 'fixed';

        const allElements = alertBox.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.zIndex = '2147483647';
          }
        });
      }
    }, 50);
  } else {
    alert(message);
  }
};

const AccessDeniedModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600 mb-4">Apenas gestores e administradores podem aprovar chamados.</p>
        <Button onClick={onClose} variant="outline">
          Fechar
        </Button>
      </div>
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="flex justify-center items-center h-32" role="status" aria-live="polite">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
    <p className="font-semibold">Erro:</p>
    <p>{message}</p>
    <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
      Tentar novamente
    </Button>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum chamado pendente</h3>
    <p className="text-gray-500">Todos os chamados foram processados</p>
  </div>
);

const ChamadoCard: React.FC<{
  chamado: ChamadoParaAprovacao;
  onViewDetails: (chamado: ChamadoParaAprovacao) => void;
  onApprove: (id: number) => void;
  onReject: (chamado: ChamadoParaAprovacao) => void;
  isProcessing: boolean;
}> = ({ chamado, onViewDetails, onApprove, onReject, isProcessing }) => {
  const priority = getPriorityConfig(chamado.prioridade_chamado);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Chamado #{chamado.id_chamado}</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            {chamado.descricao_status_chamado}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.className}`}>
            {priority.label}
          </span>
          <Button
            onClick={() => onViewDetails(chamado)}
            variant="outline"
            size="sm"
            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
            aria-label={`Visualizar detalhes do chamado #${chamado.id_chamado}`}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-600">
            <strong>Solicitante:</strong> {chamado.usuario_abertura}
          </p>
          <p className="text-gray-600">
            <strong>Email:</strong> {chamado.email_usuario}
          </p>
        </div>
        <div>
          <p className="text-gray-600">
            <strong>Categoria:</strong> {chamado.descricao_categoria_chamado}
          </p>
          <p className="text-gray-600">
            <strong>Problema:</strong> {chamado.descricao_problema_chamado}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-gray-600 text-sm flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <strong>Aberto em:</strong> {formatDateTime(chamado.data_abertura)}
        </p>

        <div className="flex gap-2">
          <Button
            onClick={() => onApprove(chamado.id_chamado)}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Aprovar
          </Button>
          <Button
            onClick={() => onReject(chamado)}
            disabled={isProcessing}
            variant="outline"
            className="text-red-600 hover:text-red-800 hover:bg-red-50 text-sm px-3 py-1"
          >
            <Ban className="w-4 h-4 mr-1" />
            Rejeitar
          </Button>
        </div>
      </div>
    </div>
  );
};

const ChamadoDetailsModal: React.FC<{
  chamado: ChamadoParaAprovacao;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: () => void;
  isProcessing: boolean;
}> = ({ chamado, onClose, onApprove, onReject, isProcessing }) => {
  const priority = getPriorityConfig(chamado.prioridade_chamado);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Detalhes do Chamado #{chamado.id_chamado}</h3>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-white hover:bg-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Clock className="w-4 h-4" />
                {chamado.descricao_status_chamado}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${priority.className}`}>
                {priority.label}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
              <p className="text-gray-600">{chamado.usuario_abertura}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-600">{chamado.email_usuario}</p>
            </div>
          </div>

          {chamado.titulo_chamado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <p className="text-gray-600 font-medium">{chamado.titulo_chamado}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <p className="text-gray-600">{chamado.descricao_categoria_chamado}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Problema</label>
            <p className="text-gray-600">{chamado.descricao_problema_chamado}</p>
          </div>

          {chamado.descricao_detalhada && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{chamado.descricao_detalhada}</div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Abertura</label>
            <p className="text-gray-600 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDateTime(chamado.data_abertura)}
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={() => onApprove(chamado.id_chamado)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Aprovar Chamado
            </Button>
            <Button
              onClick={onReject}
              disabled={isProcessing}
              variant="outline"
              className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-1"
            >
              <Ban className="w-4 h-4 mr-2" />
              Rejeitar Chamado
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmApprovalModal: React.FC<{
  chamadoId: number;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}> = ({ chamadoId, onCancel, onConfirm, isProcessing }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
      <div className="bg-orange-600 text-white p-4 rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-bold">Confirmar Aprovação</h3>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Tem certeza que quer aprovar o chamado?</h4>
          <p className="text-gray-600">
            Esta ação aprovará o <strong>Chamado #{chamadoId}</strong> e não poderá ser desfeita.
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1" disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white flex-1">
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Aprovando...
              </div>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Sim, Aprovar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const RejectChamadoModal: React.FC<{
  chamadoId: number;
  motivo: string;
  onMotivoChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}> = ({ chamadoId, motivo, onMotivoChange, onCancel, onConfirm, isProcessing }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
      <div className="bg-red-600 text-white p-4 rounded-t-lg flex-shrink-0">
        <h3 className="text-lg font-bold">Rejeitar Chamado #{chamadoId}</h3>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1">
        <div>
          <Label htmlFor="motivo" className="text-red-600">
            Motivo da Rejeição <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(event) => onMotivoChange(event.target.value)}
            rows={4}
            className="mt-1 resize-vertical"
            placeholder={`Descreva o motivo da rejeição (mínimo ${MIN_REJECTION_REASON_LENGTH} caracteres)`}
            disabled={isProcessing}
          />
          <p className="text-gray-500 text-xs mt-1">{motivo.length}/{MIN_REJECTION_REASON_LENGTH} caracteres mínimos</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1" disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing || motivo.trim().length < MIN_REJECTION_REASON_LENGTH}
            className="bg-red-600 hover:bg-red-700 text-white flex-1"
          >
            {isProcessing ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export const AprovarChamadosPopup: React.FC<AprovarChamadosPopupProps> = ({ onClose }) => {
  const { user } = useAuth();

  const [chamados, setChamados] = useState<ChamadoParaAprovacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedChamado, setSelectedChamado] = useState<ChamadoParaAprovacao | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [chamadoToApprove, setChamadoToApprove] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canApproveChamados = useMemo(
    () => (user?.perfil?.nivel_acesso ?? 0) >= MIN_APPROVER_ACCESS_LEVEL,
    [user?.perfil?.nivel_acesso]
  );

  const userEmail = useMemo(() => user?.email || '', [user?.email]);

  useEffect(() => {
    const cleanup = setupAlertBoxZIndex();
    return cleanup;
  }, []);

  /**
   * @function fetchChamadosParaAprovacao
   * @description Recupera chamados pendentes de aprovacao para o usuario logado.
   */
  const fetchChamadosParaAprovacao = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(API_ENDPOINTS.list, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChamados(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao carregar chamados para aprovação' }));
        const errorMessage = errorData.message || 'Erro ao carregar chamados para aprovação';
        setError(errorMessage);
        showAlert('error', errorMessage);
      }
    } catch (err) {
      console.error('Erro ao buscar chamados para aprovação:', err);
      const errorMessage = 'Erro de conexão ao carregar chamados';
      setError(errorMessage);
      showAlert('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && canApproveChamados) {
      fetchChamadosParaAprovacao();
    }
  }, [userEmail, canApproveChamados, fetchChamadosParaAprovacao]);

  /**
   * @function handleApproveClick
   * @description Abre modal de confirmacao para o chamado informado.
   */
  const handleApproveClick = useCallback((idChamado: number) => {
    setChamadoToApprove(idChamado);
    setIsConfirmModalOpen(true);
  }, []);

  /**
   * @function handleRejectClick
   * @description Abre modal de rejeicao preenchendo o chamado atual.
   */
  const handleRejectClick = useCallback((chamado: ChamadoParaAprovacao) => {
    setSelectedChamado(chamado);
    setMotivoRejeicao('');
    setIsRejectModalOpen(true);
  }, []);

  const handleCloseRejectModal = useCallback(() => {
    setIsRejectModalOpen(false);
    setMotivoRejeicao('');
  }, []);

  /**
   * @function handleConfirmAprovar
   * @description Processa aprovacao do chamado selecionado.
   */
  const handleConfirmAprovar = useCallback(async () => {
    if (!chamadoToApprove) {
      return;
    }

    const currentChamadoId = chamadoToApprove;
    const closeModals = () => {
      setIsConfirmModalOpen(false);
      setChamadoToApprove(null);
      setSelectedChamado((prev) => (prev?.id_chamado === currentChamadoId ? null : prev));
    };

    setIsProcessing(true);

    try {
      const response = await fetch(API_ENDPOINTS.approve(currentChamadoId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
      });

      closeModals();

      setTimeout(async () => {
        if (response.ok) {
          showAlert('success', `Chamado #${currentChamadoId} aprovado com sucesso!`);
          fetchChamadosParaAprovacao();
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao aprovar chamado' }));
          showAlert('error', errorData.message || 'Erro ao aprovar chamado');
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao aprovar chamado:', error);
      closeModals();

      setTimeout(() => {
        showAlert('error', 'Erro de conexão ao aprovar chamado');
      }, 100);
    } finally {
      setIsProcessing(false);
    }
  }, [chamadoToApprove, userEmail, fetchChamadosParaAprovacao]);

  /**
   * @function handleConfirmRejeitar
   * @description Processa rejeicao do chamado com motivo validado.
   */
  const handleConfirmRejeitar = useCallback(async () => {
    if (!selectedChamado) {
      return;
    }

    const trimmedReason = motivoRejeicao.trim();

    if (trimmedReason.length < MIN_REJECTION_REASON_LENGTH) {
      showAlert('warning', `Motivo da rejeição deve ter pelo menos ${MIN_REJECTION_REASON_LENGTH} caracteres`);
      return;
    }

    const currentChamadoId = selectedChamado.id_chamado;
    const closeModal = () => {
      setIsRejectModalOpen(false);
      setSelectedChamado(null);
      setMotivoRejeicao('');
    };

    setIsProcessing(true);

    try {
      const response = await fetch(API_ENDPOINTS.reject(currentChamadoId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ motivo: trimmedReason }),
      });

      closeModal();

      setTimeout(async () => {
        if (response.ok) {
          showAlert('success', `Chamado #${currentChamadoId} rejeitado com sucesso!`);
          fetchChamadosParaAprovacao();
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao rejeitar chamado' }));
          showAlert('error', errorData.message || 'Erro ao rejeitar chamado');
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao rejeitar chamado:', error);
      closeModal();

      setTimeout(() => {
        showAlert('error', 'Erro de conexão ao rejeitar chamado');
      }, 100);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedChamado, motivoRejeicao, userEmail, fetchChamadosParaAprovacao]);

  if (!canApproveChamados) {
    return <AccessDeniedModal onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="bg-gray-900 text-white p-6 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Aprovar Chamados</h2>
              <span className="text-orange-400">| Painel de Aprovação</span>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-white hover:bg-gray-700">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading && <LoadingState />}

          {error && !isLoading && <ErrorState message={error} onRetry={fetchChamadosParaAprovacao} />}

          {!isLoading && !error && chamados.length === 0 && <EmptyState />}

          {!isLoading && !error && chamados.length > 0 && (
            <div className="grid gap-4">
              {chamados.map((chamado) => (
                <ChamadoCard
                  key={chamado.id_chamado}
                  chamado={chamado}
                  onViewDetails={setSelectedChamado}
                  onApprove={handleApproveClick}
                  onReject={handleRejectClick}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isConfirmModalOpen && chamadoToApprove && (
        <ConfirmApprovalModal
          chamadoId={chamadoToApprove}
          onCancel={() => {
            setIsConfirmModalOpen(false);
            setChamadoToApprove(null);
          }}
          onConfirm={handleConfirmAprovar}
          isProcessing={isProcessing}
        />
      )}

      {selectedChamado && !isRejectModalOpen && (
        <ChamadoDetailsModal
          chamado={selectedChamado}
          onClose={() => setSelectedChamado(null)}
          onApprove={handleApproveClick}
          onReject={() => {
            setIsRejectModalOpen(true);
            setMotivoRejeicao('');
          }}
          isProcessing={isProcessing}
        />
      )}

      {isRejectModalOpen && selectedChamado && (
        <RejectChamadoModal
          chamadoId={selectedChamado.id_chamado}
          motivo={motivoRejeicao}
          onMotivoChange={setMotivoRejeicao}
          onCancel={handleCloseRejectModal}
          onConfirm={handleConfirmRejeitar}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};
