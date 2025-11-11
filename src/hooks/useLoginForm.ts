/**
 * @fileoverview Hook de Formulário de Login
 * 
 * Hook customizado que gerencia o estado e lógica do formulário de login.
 * 
 * Heurísticas de Nielsen aplicadas:
 * - #1: Visibilidade do status do sistema (loading, error feedback)
 * - #5: Prevenção de erros (validação de formulário)
 * - #9: Ajudar usuários a reconhecer e recuperar de erros (mensagens claras)
 * 
 * @module hooks/useLoginForm
 */

import { useState, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Estado do formulário de login
 */
export interface LoginFormState {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  isLoading: boolean;
}

/**
 * Ações do formulário de login
 */
export interface LoginFormActions {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  togglePasswordVisibility: () => void;
  clearError: () => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

/**
 * Retorno do hook
 */
export interface UseLoginFormReturn {
  state: LoginFormState;
  actions: LoginFormActions;
}

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Mensagens de erro padronizadas
 * @constant {Object}
 */
const ERROR_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
  NETWORK_ERROR: 'Erro ao conectar ao servidor. Verifique sua conexão e tente novamente.',
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
  EMPTY_EMAIL: 'Por favor, informe seu e-mail.',
  EMPTY_PASSWORD: 'Por favor, informe sua senha.',
  INVALID_EMAIL: 'Por favor, informe um e-mail válido.'
});

/**
 * Estado inicial do formulário
 * @constant {LoginFormState}
 */
const INITIAL_STATE: LoginFormState = {
  email: '',
  password: '',
  showPassword: false,
  error: '',
  isLoading: false
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Valida se o e-mail está no formato correto
 * @private
 * @param {string} email - E-mail a validar
 * @returns {boolean} True se válido
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida os campos do formulário antes do submit
 * @private
 * @param {string} email - E-mail informado
 * @param {string} password - Senha informada
 * @returns {string} Mensagem de erro ou string vazia se válido
 */
const validateForm = (email: string, password: string): string => {
  if (!email.trim()) {
    return ERROR_MESSAGES.EMPTY_EMAIL;
  }

  if (!isValidEmail(email)) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }

  if (!password.trim()) {
    return ERROR_MESSAGES.EMPTY_PASSWORD;
  }

  return '';
};

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook que gerencia o formulário de login
 * 
 * Fornece estado e ações para o formulário de login,
 * incluindo validação, submit e feedback de erro.
 * 
 * @returns {UseLoginFormReturn} Estado e ações do formulário
 * 
 * @example
 * function LoginPage() {
 *   const { state, actions } = useLoginForm();
 *   
 *   return (
 *     <form onSubmit={actions.handleSubmit}>
 *       <input 
 *         value={state.email} 
 *         onChange={(e) => actions.setEmail(e.target.value)}
 *       />
 *       <input 
 *         type={state.showPassword ? 'text' : 'password'}
 *         value={state.password}
 *         onChange={(e) => actions.setPassword(e.target.value)}
 *       />
 *       {state.error && <Alert>{state.error}</Alert>}
 *       <button disabled={state.isLoading}>Login</button>
 *     </form>
 *   );
 * }
 */
export const useLoginForm = (): UseLoginFormReturn => {
  const [state, setState] = useState<LoginFormState>(INITIAL_STATE);
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Atualiza o e-mail e limpa erro se existir
   */
  const setEmail = useCallback((email: string): void => {
    setState(prev => ({
      ...prev,
      email,
      error: prev.error ? '' : prev.error
    }));
  }, []);

  /**
   * Atualiza a senha e limpa erro se existir
   */
  const setPassword = useCallback((password: string): void => {
    setState(prev => ({
      ...prev,
      password,
      error: prev.error ? '' : prev.error
    }));
  }, []);

  /**
   * Alterna visibilidade da senha
   */
  const togglePasswordVisibility = useCallback((): void => {
    setState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  }, []);

  /**
   * Limpa mensagem de erro
   */
  const clearError = useCallback((): void => {
    setState(prev => ({
      ...prev,
      error: ''
    }));
  }, []);

  /**
   * Processa o submit do formulário
   */
  const handleSubmit = useCallback(async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    // Validação client-side (Heurística #5: Prevenção de erros)
    const validationError = validateForm(state.email, state.password);
    if (validationError) {
      setState(prev => ({
        ...prev,
        error: validationError
      }));
      return;
    }

    // Limpa erro e inicia loading (Heurística #1: Visibilidade do status)
    setState(prev => ({
      ...prev,
      error: '',
      isLoading: true
    }));

    try {
      const success = await login(state.email, state.password);

      if (success) {
        // Sucesso: navega para dashboard
        navigate('/', { replace: true });
      } else {
        // Falha de autenticação (Heurística #9: Mensagens de erro claras)
        setState(prev => ({
          ...prev,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
          isLoading: false
        }));
      }
    } catch (err) {
      // Erro de rede ou servidor
      const errorMessage = err instanceof Error && err.message.includes('fetch')
        ? ERROR_MESSAGES.NETWORK_ERROR
        : ERROR_MESSAGES.UNKNOWN_ERROR;

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      console.error('Erro no login:', err);
    }
  }, [state.email, state.password, login, navigate]);

  return {
    state,
    actions: {
      setEmail,
      setPassword,
      togglePasswordVisibility,
      clearError,
      handleSubmit
    }
  };
};
