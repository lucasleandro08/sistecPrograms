/**
 * @fileoverview Contexto de Autenticação
 * 
 * Gerencia estado global de autenticação da aplicação.
 * Fornece login, logout, persistência em localStorage e auto-login.
 * 
 * Features:
 * - Login com email e senha via API REST
 * - Persistência automática em localStorage
 * - Auto-login na inicialização
 * - Type-safe com TypeScript
 * - Error boundaries
 * - Separação de responsabilidades (API, Storage, State)
 * 
 * @module contexts/AuthContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Interface do perfil do usuário
 */
export interface UserProfile {
  id: number;
  nome: string;
  nivel_acesso: number;
  descricao?: string;
}

/**
 * Interface do usuário autenticado
 */
export interface User {
  id: string;
  matricula: number;
  name: string;
  email: string;
  telefone: string;
  setor: string;
  cargo: string;
  id_aprovador: number;
  perfil: UserProfile;
}

/**
 * Resposta da API de login
 */
interface LoginApiResponse {
  status: number;
  data: {
    user: {
      id: number;
      matricula: number;
      name: string;
      email: string;
      telefone: string;
      setor: string;
      cargo: string;
      id_aprovador: number;
      perfil: UserProfile;
    }
  }
}

/**
 * Interface do contexto de autenticação
 */
export interface AuthContextType {
  /** Usuário autenticado (null se não logado) */
  user: User | null;
  /** Função de login */
  login: (email: string, password: string) => Promise<boolean>;
  /** Função de logout */
  logout: () => void;
  /** Status de autenticação */
  isAuthenticated: boolean;
  /** Loading state durante operações */
  isLoading: boolean;
}

/**
 * Props do provider
 */
interface AuthProviderProps {
  children: ReactNode;
}

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Configurações da API
 * @constant {Object}
 */
const API_CONFIG = Object.freeze({
  BASE_URL: 'http://localhost:3001',
  LOGIN_ENDPOINT: '/api/auth/login',
  TIMEOUT: 10000
});

/**
 * Configurações do localStorage
 * @constant {Object}
 */
const STORAGE_CONFIG = Object.freeze({
  USER_KEY: 'sistec_user',
  TOKEN_KEY: 'sistec_token'
});

/**
 * Mensagens de log
 * @constant {Object}
 */
const LOG_MESSAGES = Object.freeze({
  LOGIN_SUCCESS: '✅ Login realizado com sucesso',
  LOGIN_ERROR: '❌ Erro no login:',
  LOGOUT: '🚪 Logout realizado',
  AUTO_LOGIN_SUCCESS: '🔄 Auto-login realizado com sucesso',
  AUTO_LOGIN_ERROR: '⚠️ Erro ao recuperar usuário do localStorage:',
  STORAGE_CLEARED: '🗑️ localStorage limpo'
});

// ==========================================
// FUNÇÕES AUXILIARES - API
// ==========================================

/**
 * Realiza chamada à API de login
 * @private
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<LoginApiResponse | null>} Resposta da API ou null em erro
 */
const callLoginApi = async (
  email: string, 
  password: string
): Promise<LoginApiResponse | null> => {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.LOGIN_ENDPOINT}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data as LoginApiResponse;
  } catch (error) {
    console.error(LOG_MESSAGES.LOGIN_ERROR, error);
    return null;
  }
};

/**
 * Valida resposta da API de login
 * @private
 * @param {LoginApiResponse | null} response - Resposta da API
 * @returns {boolean} True se válida
 */
const isValidLoginResponse = (response: LoginApiResponse | null): boolean => {
  return !!(
    response && 
    response.status === 200 && 
    response.data?.user
  );
};

/**
 * Transforma resposta da API em objeto User
 * @private
 * @param {LoginApiResponse} response - Resposta da API
 * @returns {User} Objeto User formatado
 */
const transformApiUser = (response: LoginApiResponse): User => {
  const apiUser = response.data.user;
  
  return {
    id: apiUser.id.toString(),
    matricula: apiUser.matricula,
    name: apiUser.name,
    email: apiUser.email,
    telefone: apiUser.telefone,
    setor: apiUser.setor,
    cargo: apiUser.cargo,
    id_aprovador: apiUser.id_aprovador,
    perfil: {
      id: apiUser.perfil.id,
      nome: apiUser.perfil.nome,
      nivel_acesso: apiUser.perfil.nivel_acesso,
      descricao: apiUser.perfil.descricao
    }
  };
};

// ==========================================
// FUNÇÕES AUXILIARES - STORAGE
// ==========================================

/**
 * Salva usuário no localStorage
 * @private
 * @param {User} user - Usuário a salvar
 */
const saveUserToStorage = (user: User): void => {
  try {
    localStorage.setItem(STORAGE_CONFIG.USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('❌ Erro ao salvar usuário no localStorage:', error);
  }
};

/**
 * Recupera usuário do localStorage
 * @private
 * @returns {User | null} Usuário salvo ou null
 */
const getUserFromStorage = (): User | null => {
  try {
    const savedUser = localStorage.getItem(STORAGE_CONFIG.USER_KEY);
    
    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser) as User;
  } catch (error) {
    console.error(LOG_MESSAGES.AUTO_LOGIN_ERROR, error);
    clearStorage();
    return null;
  }
};

/**
 * Remove dados do localStorage
 * @private
 */
const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_CONFIG.USER_KEY);
    localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
    console.log(LOG_MESSAGES.STORAGE_CLEARED);
  } catch (error) {
    console.error('❌ Erro ao limpar localStorage:', error);
  }
};

// ==========================================
// CONTEXTO
// ==========================================

/**
 * Contexto de autenticação
 * @private
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// HOOK PERSONALIZADO
// ==========================================

/**
 * Hook para acessar contexto de autenticação
 * 
 * Deve ser usado dentro de um AuthProvider.
 * Lança erro se usado fora do provider.
 * 
 * @returns {AuthContextType} Contexto de autenticação
 * @throws {Error} Se usado fora do AuthProvider
 * 
 * @example
 * // Uso básico
 * function LoginPage() {
 *   const { login, isLoading } = useAuth();
 *   
 *   const handleSubmit = async (email, password) => {
 *     const success = await login(email, password);
 *     if (success) {
 *       navigate('/dashboard');
 *     }
 *   };
 *   
 *   return <LoginForm onSubmit={handleSubmit} loading={isLoading} />
 * }
 * 
 * @example
 * // Verificar autenticação
 * function ProtectedRoute() {
 *   const { isAuthenticated, user } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" />
 *   }
 *   
 *   return <Dashboard user={user} />
 * }
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

// ==========================================
// PROVIDER
// ==========================================

/**
 * Provider do contexto de autenticação
 * 
 * Envolve a aplicação e fornece contexto de autenticação para todos os componentes.
 * Gerencia estado do usuário, login, logout e persistência.
 * 
 * @param {AuthProviderProps} props - Props do provider
 * @returns {JSX.Element} Provider component
 * 
 * @example
 * // Envolver aplicação
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes />
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Realiza login do usuário
   */
  const login = useCallback(async (
    email: string, 
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Chamar API
      const response = await callLoginApi(email, password);
      
      // Validar resposta
      if (!isValidLoginResponse(response)) {
        return false;
      }

      // Transformar e salvar
      const userData = transformApiUser(response!);
      setUser(userData);
      saveUserToStorage(userData);
      
      console.log(LOG_MESSAGES.LOGIN_SUCCESS);
      return true;
    } catch (error) {
      console.error(LOG_MESSAGES.LOGIN_ERROR, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Realiza logout do usuário
   */
  const logout = useCallback((): void => {
    setUser(null);
    clearStorage();
    console.log(LOG_MESSAGES.LOGOUT);
  }, []);

  /**
   * Effect: Auto-login na inicialização
   */
  useEffect(() => {
    const savedUser = getUserFromStorage();
    
    if (savedUser) {
      setUser(savedUser);
      console.log(LOG_MESSAGES.AUTO_LOGIN_SUCCESS);
    }
    
    setIsLoading(false);
  }, []);

  /**
   * Valor do contexto
   */
  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
