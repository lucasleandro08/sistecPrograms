/**
 * @fileoverview Controller de Autenticação - Camada de Controle
 * 
 * Este módulo gerencia as operações de autenticação do sistema:
 * - Login com validação de credenciais
 * - Logout com destruição de sessão
 * - Gestão de sessões de usuário
 * 
 * Princípios aplicados:
 * - Single Responsibility: Cada função trata uma operação específica
 * - Separation of Concerns: Controller não contém lógica de negócio
 * - Keep It Simple: Validações claras e respostas padronizadas
 * 
 * @module controllers/authController
 * @requires ../models/user
 * @requires bcrypt
 */

import { getUserWithProfileService } from '../models/user.js';
import bcrypt from 'bcrypt';

// ============================================================================
// CONSTANTES DE RESPOSTA HTTP
// ============================================================================

/**
 * Mensagens de erro padronizadas para autenticação
 * Centraliza mensagens para consistência e manutenibilidade
 * @constant {Object}
 * @private
 */
const AUTH_MESSAGES = Object.freeze({
  MISSING_CREDENTIALS: 'Email e senha são obrigatórios',
  INVALID_CREDENTIALS: 'Email ou senha incorretos',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  LOGOUT_ERROR: 'Erro ao realizar logout',
  SERVER_ERROR: 'Erro interno do servidor'
});

/**
 * Status HTTP para respostas
 * @constant {Object}
 * @private
 */
const HTTP_STATUS = Object.freeze({
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500
});

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Cria objeto de resposta padrão da API
 * Garante consistência em todas as respostas
 * 
 * @param {boolean} success - Se a operação foi bem-sucedida
 * @param {number} status - Código HTTP
 * @param {string} message - Mensagem descritiva
 * @param {*} data - Dados da resposta (null se erro)
 * @returns {Object} Objeto de resposta padronizado
 * @private
 */
const createApiResponse = (success, status, message, data = null) => {
  return {
    success,
    status,
    message,
    data
  };
};

/**
 * Mapeia dados do usuário do banco para formato da API
 * Abstrai a estrutura do banco de dados do frontend
 * 
 * @param {Object} user - Dados do usuário do banco
 * @returns {Object} Dados formatados para o frontend
 * @private
 */
const mapUserToApiFormat = (user) => {
  return {
    id: user.id_usuario,
    matricula: user.matricula,
    name: user.nome_usuario,
    email: user.email,
    telefone: user.tel_usuarios,
    setor: user.setor_usuario,
    cargo: user.cargo_usuario,
    id_aprovador: user.id_aprovador_usuario,
    perfil: {
      id: user.id_perfil_usuario,
      nome: user.nome_perfil,
      nivel_acesso: user.nivel_acesso,
      descricao: user.descricao_perfil_usuario
    }
  };
};

/**
 * Cria dados de sessão para armazenamento
 * Separa dados públicos (API) de dados de sessão (servidor)
 * 
 * @param {Object} user - Dados do usuário do banco
 * @returns {Object} Dados para armazenar na sessão
 * @private
 */
const createSessionData = (user) => {
  return {
    id_usuario: user.id_usuario,
    matricula: user.matricula,
    nome_usuario: user.nome_usuario,
    email: user.email,
    telefone: user.tel_usuarios,
    setor_usuario: user.setor_usuario,
    cargo_usuario: user.cargo_usuario,
    id_perfil_usuario: user.id_perfil_usuario,
    id_aprovador_usuario: user.id_aprovador_usuario,
    perfil: {
      id: user.id_perfil_usuario,
      nome: user.nome_perfil,
      nivel_acesso: user.nivel_acesso,
      descricao: user.descricao_perfil_usuario
    }
  };
};

/**
 * Valida se as credenciais foram fornecidas
 * Guard Clause para validação de entrada
 * 
 * @param {string} email - Email fornecido
 * @param {string} password - Senha fornecida
 * @returns {boolean} true se ambos estão presentes
 * @private
 */
const areCredentialsProvided = (email, password) => {
  return Boolean(email && password);
};

// ============================================================================
// FUNÇÕES PÚBLICAS DO CONTROLLER
// ============================================================================

/**
 * Autentica um usuário no sistema
 * 
 * Fluxo de autenticação:
 * 1. Valida presença de email e senha
 * 2. Busca usuário no banco de dados
 * 3. Compara senha fornecida com hash armazenado
 * 4. Cria sessão para usuário autenticado
 * 5. Retorna dados do usuário para o frontend
 * 
 * Segurança:
 * - Usa bcrypt para comparação segura de senhas
 * - Não revela se o erro foi no email ou senha (prevent user enumeration)
 * - Armazena apenas ID e dados necessários na sessão
 * 
 * @param {Object} req - Request do Express (req.body contém { email, password })
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware (para tratamento de erros)
 * 
 * @returns {Promise<void>} Envia resposta HTTP
 * 
 * @public
 * @async
 * 
 * @example
 * // POST /api/auth/login
 * // Body: { "email": "user@example.com", "password": "senha123" }
 * // Response 200: { success: true, data: { user: {...} } }
 * // Response 401: { success: false, message: "Email ou senha incorretos" }
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Guard Clause 1: Valida presença de credenciais
    if (!areCredentialsProvided(email, password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createApiResponse(
          false,
          HTTP_STATUS.BAD_REQUEST,
          AUTH_MESSAGES.MISSING_CREDENTIALS
        )
      );
    }

    // Busca usuário com dados de perfil
    const user = await getUserWithProfileService(email);
    
    // Guard Clause 2: Valida existência do usuário
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createApiResponse(
          false,
          HTTP_STATUS.UNAUTHORIZED,
          AUTH_MESSAGES.INVALID_CREDENTIALS
        )
      );
    }

    // Compara senha fornecida com hash armazenado
    const isPasswordValid = await bcrypt.compare(password, user.senha);
    
    // Guard Clause 3: Valida senha
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createApiResponse(
          false,
          HTTP_STATUS.UNAUTHORIZED,
          AUTH_MESSAGES.INVALID_CREDENTIALS
        )
      );
    }

    // Cria dados de sessão (servidor) e API (frontend)
    const sessionData = createSessionData(user);
    const apiData = mapUserToApiFormat(user);

    // Armazena dados na sessão
    req.session.userId = user.id_usuario;
    req.session.user = sessionData;

    // Retorna dados formatados para o frontend
    res.status(HTTP_STATUS.OK).json(
      createApiResponse(
        true,
        HTTP_STATUS.OK,
        AUTH_MESSAGES.LOGIN_SUCCESS,
        { user: apiData }
      )
    );

  } catch (err) {
    // Loga erro e passa para o error handler middleware
    console.error('[AuthController] Erro no login:', err);
    next(err);
  }
};

/**
 * Desloga usuário e destroi sessão
 * 
 * Fluxo de logout:
 * 1. Destroi a sessão no servidor
 * 2. Limpa o cookie de sessão no cliente
 * 3. Retorna confirmação de sucesso
 * 
 * Segurança:
 * - Remove completamente a sessão (não apenas limpa dados)
 * - Limpa o cookie para evitar reutilização
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * 
 * @returns {Promise<void>} Envia resposta HTTP
 * 
 * @public
 * @async
 * 
 * @example
 * // POST /api/auth/logout
 * // Response 200: { success: true, message: "Logout realizado com sucesso" }
 * // Response 500: { success: false, message: "Erro ao realizar logout" }
 */
export const logoutUser = async (req, res) => {
  try {
    // Destroi sessão do lado do servidor
    req.session.destroy((err) => {
      // Se houver erro ao destruir sessão
      if (err) {
        console.error('[AuthController] Erro ao destruir sessão:', err);
        return res.status(HTTP_STATUS.INTERNAL_ERROR).json(
          createApiResponse(
            false,
            HTTP_STATUS.INTERNAL_ERROR,
            AUTH_MESSAGES.LOGOUT_ERROR
          )
        );
      }

      // Limpa cookie do lado do cliente
      res.clearCookie('connect.sid');
      
      // Retorna sucesso
      res.status(HTTP_STATUS.OK).json(
        createApiResponse(
          true,
          HTTP_STATUS.OK,
          AUTH_MESSAGES.LOGOUT_SUCCESS
        )
      );
    });
    
  } catch (err) {
    // Captura erros inesperados
    console.error('[AuthController] Erro no logout:', err);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(
      createApiResponse(
        false,
        HTTP_STATUS.INTERNAL_ERROR,
        AUTH_MESSAGES.SERVER_ERROR
      )
    );
  }
};
