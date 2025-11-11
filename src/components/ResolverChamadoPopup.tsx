/**
 * @fileoverview ResolverChamadoPopup - Modal de Resolução de Chamados
 * 
 * **SESSÃO 18 - REFATORAÇÃO COMPLETA**
 * 
 * Modal obrigatório para analistas/gestores registrarem como resolveram o problema.
 * Salva o relatório na tabela `resposta` e atualiza o status do chamado.
 * 
 * ## Melhorias Aplicadas
 * 
 * ### 1. SOLID Principles
 * - **Single Responsibility**: Sub-componentes com responsabilidades únicas
 * - **Open/Closed**: Extensível via props, fechado para modificação
 * - **Interface Segregation**: Props mínimas e específicas
 * 
 * ### 2. KISS (Keep It Simple, Stupid)
 * - Constantes centralizadas (API_ENDPOINTS, VALIDATION, UI_TEXT)
 * - Helpers para lógica complexa (validateRelatorio, buildResolverEndpoint)
 * - Sub-componentes reutilizáveis (PopupHeader, ChamadoInfo, ReportField, ErrorAlert, PopupFooter)
 * - useCallback para otimização
 * 
 * ### 3. Performance
 * - useCallback em handlers (handleSubmit, handleClose)
 * - Validação client-side antes de API calls
 * - Feedback visual durante loading
 * 
 * ### 4. Type Safety
 * - Interfaces completas (ChamadoInfo, ResolverChamadoPopupProps)
 * - Tipagem estrita em todas as funções
 * 
 * ### 5. Responsividade
 * - Layout adaptável (max-w-2xl, max-h-[90vh])
 * - Grid responsivo para informações (grid-cols-1 md:grid-cols-2)
 * - Padding ajustável (p-4 mobile, p-6 desktop)
 * 
 * ## Heurísticas de Nielsen Aplicadas
 * 
 * - **#1 - Visibility of System Status**: Loading spinner, contador de caracteres
 * - **#3 - User Control and Freedom**: Botão cancelar, validação em tempo real
 * - **#5 - Error Prevention**: Validação de 20 caracteres mínimos, botão desabilitado
 * - **#8 - Aesthetic and Minimalist Design**: Layout limpo, cores apropriadas
 * - **#9 - Help Users Recognize Errors**: Mensagens de erro claras com ícone
 * 
 * ## Acessibilidade
 * - aria-label em botões
 * - aria-required no textarea
 * - aria-invalid para estados de erro
 * - aria-describedby vinculando erro ao campo
 * - role="alert" em mensagens de erro
 * 
 * ## Estrutura (282 → 450 linhas)
 * ```
 * ├── Imports & Types (40 linhas)
 * ├── Constants (30 linhas)
 * ├── Helpers (30 linhas)
 * ├── Sub-Components (150 linhas)
 * └── Main Component (200 linhas)
 * ```
 * 
 * @module components/ResolverChamadoPopup
 * @since 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Informações do chamado a ser resolvido
 * @interface ChamadoInfo
 */
interface ChamadoInfo {
  /** ID único do chamado */
  id_chamado: number;
  /** Categoria do chamado */
  descricao_categoria_chamado: string;
  /** Descrição do problema */
  descricao_problema_chamado: string;
  /** Status atual (usado para identificar escalados) */
  descricao_status_chamado?: string;
  /** ID da categoria */
  id_categoria_chamado?: number;
  /** ID do problema */
  id_problema_chamado?: number;
  /** ID do usuário que abriu o chamado */
  id_usuario_abertura?: number;
}

/**
 * Props do componente ResolverChamadoPopup
 * @interface ResolverChamadoPopupProps
 */
interface ResolverChamadoPopupProps {
  /** Chamado a ser resolvido */
  chamado: ChamadoInfo;
  /** Callback ao fechar o popup */
  onClose: () => void;
  /** Callback ao resolver com sucesso */
  onSuccess: () => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Endpoints da API
 * @constant
 */
const API_ENDPOINTS = Object.freeze({
  RESOLVER_COM_RELATORIO: 'http://localhost:3001/api/chamados/resolver-com-relatorio',
  RESOLVER_NORMAL: (id: number) => `http://localhost:3001/api/chamados/${id}/resolver`,
  RESOLVER_ESCALADO: (id: number) => `http://localhost:3001/api/chamados/${id}/resolver-escalado`,
});

/**
 * Regras de validação
 * @constant
 */
const VALIDATION = Object.freeze({
  MIN_LENGTH: 20,
  ERROR_MESSAGE: 'O relatório deve ter no mínimo 20 caracteres',
});

/**
 * Textos da interface
 * @constant
 */
const UI_TEXT = Object.freeze({
  TITLE: 'Resolver Chamado',
  SUBTITLE: 'Como você resolveu este problema?',
  INFO_TITLE: 'Informações do Chamado',
  FIELD_LABEL: 'Relatório da Resolução *',
  FIELD_PLACEHOLDER: 'Descreva detalhadamente os passos que você seguiu para resolver este chamado...\n\nExemplo:\n1. Identifiquei que o problema era X\n2. Realizei a ação Y\n3. Testei e confirmei a resolução',
  CHAR_COUNTER: (current: number, min: number) => `${current} / ${min} caracteres mínimos`,
  CANCEL_BUTTON: 'Cancelar',
  CONFIRM_BUTTON: 'Resolver Chamado',
  LOADING_BUTTON: 'Salvando...',
  ERROR_SAVE: 'Erro ao salvar resolução. Tente novamente.',
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valida o relatório de resolução
 * 
 * @param {string} relatorio - Texto do relatório
 * @returns {string} Mensagem de erro ou string vazia se válido
 */
const validateRelatorio = (relatorio: string): string => {
  if (relatorio.trim().length < VALIDATION.MIN_LENGTH) {
    return VALIDATION.ERROR_MESSAGE;
  }
  return '';
};

/**
 * Constrói o endpoint correto baseado no status do chamado
 * 
 * @param {ChamadoInfo} chamado - Informações do chamado
 * @returns {string} URL do endpoint
 */
const buildResolverEndpoint = (chamado: ChamadoInfo): string => {
  const isEscalado = chamado.descricao_status_chamado === 'Escalado';
  return isEscalado
    ? API_ENDPOINTS.RESOLVER_ESCALADO(chamado.id_chamado)
    : API_ENDPOINTS.RESOLVER_NORMAL(chamado.id_chamado);
};

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

/**
 * Header do popup com título e botão fechar
 * @component
 */
interface PopupHeaderProps {
  onClose: () => void;
  isLoading: boolean;
}

const PopupHeader: React.FC<PopupHeaderProps> = ({ onClose, isLoading }) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
    <div className="flex items-center gap-3">
      <CheckCircle className="w-8 h-8 text-white" />
      <div>
        <h2 className="text-xl font-bold text-white">{UI_TEXT.TITLE}</h2>
        <p className="text-sm text-green-50 mt-1">{UI_TEXT.SUBTITLE}</p>
      </div>
    </div>
    <button
      onClick={onClose}
      disabled={isLoading}
      className="text-white hover:bg-green-700 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Fechar"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

/**
 * Card com informações do chamado
 * @component
 */
interface ChamadoInfoProps {
  chamado: ChamadoInfo;
}

const ChamadoInfoCard: React.FC<ChamadoInfoProps> = ({ chamado }) => (
  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
    <h3 className="font-semibold text-gray-900 text-sm">{UI_TEXT.INFO_TITLE}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-gray-600">ID:</span>{' '}
        <span className="font-medium text-gray-900">#{chamado.id_chamado}</span>
      </div>
      <div>
        <span className="text-gray-600">Categoria:</span>{' '}
        <span className="font-medium text-gray-900">{chamado.descricao_categoria_chamado}</span>
      </div>
      <div className="md:col-span-2">
        <span className="text-gray-600">Problema:</span>{' '}
        <span className="font-medium text-gray-900">{chamado.descricao_problema_chamado}</span>
      </div>
    </div>
  </div>
);

/**
 * Campo de texto para o relatório
 * @component
 */
interface ReportFieldProps {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  hasError: boolean;
}

const ReportField: React.FC<ReportFieldProps> = ({ value, onChange, isLoading, hasError }) => (
  <div className="space-y-2">
    <Label htmlFor="relatorio" className="text-base font-semibold">
      {UI_TEXT.FIELD_LABEL}
    </Label>
    <Textarea
      id="relatorio"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={UI_TEXT.FIELD_PLACEHOLDER}
      rows={12}
      className="resize-none font-mono text-sm"
      disabled={isLoading}
      aria-required="true"
      aria-invalid={hasError}
      aria-describedby={hasError ? 'relatorio-error' : undefined}
    />
    <div className="flex items-center justify-between text-xs">
      <span
        className={
          value.length < VALIDATION.MIN_LENGTH ? 'text-red-500' : 'text-green-600'
        }
      >
        {UI_TEXT.CHAR_COUNTER(value.length, VALIDATION.MIN_LENGTH)}
      </span>
    </div>
  </div>
);

/**
 * Alert de erro
 * @component
 */
interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => (
  <div
    id="relatorio-error"
    className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 animate-shake"
    role="alert"
  >
    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-red-800">{message}</p>
  </div>
);

/**
 * Footer com botões de ação
 * @component
 */
interface PopupFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const PopupFooter: React.FC<PopupFooterProps> = ({
  onCancel,
  onConfirm,
  isLoading,
  isDisabled,
}) => (
  <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
    <Button onClick={onCancel} variant="outline" disabled={isLoading} className="min-w-[120px]">
      {UI_TEXT.CANCEL_BUTTON}
    </Button>
    <Button
      onClick={onConfirm}
      disabled={isDisabled}
      className="min-w-[120px] bg-green-600 hover:bg-green-700"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          {UI_TEXT.LOADING_BUTTON}
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          {UI_TEXT.CONFIRM_BUTTON}
        </>
      )}
    </Button>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Modal para resolver chamados com relatório detalhado
 * 
 * Permite que analistas/gestores registrem como resolveram o problema,
 * salvando na tabela `resposta` e atualizando o status do chamado.
 * 
 * @param {ResolverChamadoPopupProps} props - Props do componente
 * @returns {JSX.Element} Popup de resolução
 * 
 * @example
 * ```tsx
 * <ResolverChamadoPopup
 *   chamado={chamadoData}
 *   onClose={() => setShowPopup(false)}
 *   onSuccess={() => refreshChamados()}
 * />
 * ```
 */
export const ResolverChamadoPopup: React.FC<ResolverChamadoPopupProps> = ({
  chamado,
  onClose,
  onSuccess,
}) => {
  // ========== STATE ==========
  const [relatorio, setRelatorio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // ========== HANDLERS ==========

  /**
   * Handler: Submeter resolução
   * 
   * @async
   * @description Valida e envia relatório + resolução do chamado
   */
  const handleSubmit = useCallback(async () => {
    // Validação client-side
    const validationError = validateRelatorio(relatorio);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // 1. Salvar relatório de resolução
      const responseRelatorio = await fetch(API_ENDPOINTS.RESOLVER_COM_RELATORIO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          id_chamado: chamado.id_chamado,
          relatorio_resposta: relatorio.trim(),
          id_usuario_abertura: chamado.id_usuario_abertura || null,
          id_categoria_chamado: chamado.id_categoria_chamado || null,
          id_problema_chamado: chamado.id_problema_chamado || null,
        }),
      });

      if (!responseRelatorio.ok) {
        const errorData = await responseRelatorio.json();
        throw new Error(errorData.message || UI_TEXT.ERROR_SAVE);
      }

      // 2. Marcar chamado como resolvido (endpoint varia conforme status)
      const resolverEndpoint = buildResolverEndpoint(chamado);

      const responseResolver = await fetch(resolverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          solucao: relatorio.trim(),
        }),
      });

      if (!responseResolver.ok) {
        const errorData = await responseResolver.json();
        throw new Error(errorData.message || UI_TEXT.ERROR_SAVE);
      }

      // Sucesso!
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao resolver chamado:', err);
      setError(err.message || UI_TEXT.ERROR_SAVE);
    } finally {
      setIsLoading(false);
    }
  }, [relatorio, chamado, user?.email, onSuccess, onClose]);

  /**
   * Handler: Fechar popup
   * 
   * @description Fecha o popup se não estiver carregando
   */
  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  // ========== DERIVED STATE ==========

  const isDisabled = isLoading || relatorio.trim().length < VALIDATION.MIN_LENGTH;
  const hasError = Boolean(error);

  // ========== RENDER ==========

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <PopupHeader onClose={handleClose} isLoading={isLoading} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Informações do Chamado */}
          <ChamadoInfoCard chamado={chamado} />

          {/* Campo: Relatório */}
          <ReportField
            value={relatorio}
            onChange={setRelatorio}
            isLoading={isLoading}
            hasError={hasError}
          />

          {/* Mensagem de Erro */}
          {error && <ErrorAlert message={error} />}
        </div>

        {/* Footer */}
        <PopupFooter
          onCancel={handleClose}
          onConfirm={handleSubmit}
          isLoading={isLoading}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  );
};
