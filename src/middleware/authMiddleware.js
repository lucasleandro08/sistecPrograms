/**
 * @fileoverview Middleware de Autenticação e Autorização
 * 
 * Este módulo gerencia:
 * - Autenticação de usuários (sessão ou header)
 * - Autorização baseada em níveis de acesso
 * - Validação de permissões por papel (role)
 * 
 * Hierarquia de Acesso:
 * - Nível 1: Usuário comum
 * - Nível 2: Analista
 * - Nível 3: Gestor de Chamados
 * - Nível 4: Gerente/Admin
 * 
 * Princípios SOLID aplicados:
 * - Single Responsibility: Cada função valida uma coisa específica
 * - Open/Closed: Níveis configuráveis via constantes
 * - Interface Segregation: Middlewares específicos por papel
 * - Keep It Simple: Lógica clara e direta
 * 
 * @module middleware/authMiddleware
 * @requires ../models/user
 */

import { getUserWithProfileService } from '../models/user.js';

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Níveis de acesso do sistema
 * Centraliza a hierarquia para facilitar mudanças
 * @constant {Object}
 * @readonly
 */
const ACCESS_LEVELS = Object.freeze({
  USER: 1,          // Usuário comum
  ANALYST: 2,       // Analista de TI
  MANAGER_TICKETS: 3, // Gestor de Chamados
  MANAGER: 4        // Gerente/Administrador
});

/**
 * Mensagens de erro padronizadas
 * @constant {Object}
 * @private
 */
const AUTH_MESSAGES = Object.freeze({
  UNAUTHORIZED: 'Acesso negado. Faça login primeiro.',
  SERVER_ERROR: 'Erro interno na autenticação',
  FORBIDDEN_MANAGER: 'Acesso negado. Permissão de Gerente ou superior necessária.',
  FORBIDDEN_MANAGER_TICKETS: 'Acesso negado. Permissão de Gestor de Chamados ou superior necessária.',
  FORBIDDEN_ANALYST: 'Acesso negado. Permissão de Analista ou superior necessária.'
});

/**
 * Status HTTP para respostas
 * @constant {Object}
 * @private
 */
const HTTP_STATUS = Object.freeze({
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500
});

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Cria objeto de resposta de erro padronizado
 * 
 * @param {number} status - Código HTTP
 * @param {string} message - Mensagem de erro
 * @returns {Object} Resposta de erro formatada
 * @private
 */
const createErrorResponse = (status, message) => {
  return {
    success: false,
    status,
    message,
    data: null
  };
};

/**
 * Mapeia dados do usuário do banco para formato da sessão
 * Abstrai estrutura do banco de dados
 * 
 * @param {Object} userData - Dados do usuário do banco
 * @returns {Object} Dados formatados para req.user
 * @private
 */
const mapUserDataToSession = (userData) => {
  return {
    id_usuario: userData.id_usuario,
    matricula: userData.matricula,
    nome_usuario: userData.nome_usuario,
    email: userData.email,
    telefone: userData.tel_usuarios,
    setor_usuario: userData.setor_usuario,
    cargo_usuario: userData.cargo_usuario,
    id_perfil_usuario: userData.id_perfil_usuario,
    id_aprovador_usuario: userData.id_aprovador_usuario,
    perfil: {
      id: userData.id_perfil_usuario,
      nome: userData.nome_perfil,
      nivel_acesso: userData.nivel_acesso,
      descricao: userData.descricao_perfil_usuario
    }
  };
};

/**
 * Extrai usuário da sessão se existir
 * 
 * @param {Object} req - Request do Express
 * @returns {Object|null} Dados do usuário ou null
 * @private
 */
const getUserFromSession = (req) => {
  if (req.session?.userId && req.session?.user) {
    return req.session.user;
  }
  return null;
};

/**
 * Extrai e valida usuário do header (compatibilidade com sistema legado)
 * 
 * @param {Object} req - Request do Express
 * @returns {Promise<Object|null>} Dados do usuário ou null
 * @private
 * @async
 */
const getUserFromHeader = async (req) => {
  const userEmail = req.headers['x-user-email'];
  
  // Guard Clause: Se não há email no header
  if (!userEmail) {
    return null;
  }
  
  try {
    const userData = await getUserWithProfileService(userEmail);
    
    // Guard Clause: Se usuário não existe
    if (!userData) {
      return null;
    }
    
    return mapUserDataToSession(userData);
  } catch (error) {
    console.error('[AuthMiddleware] Erro ao buscar usuário do header:', error);
    return null;
  }
};

/**
 * Valida se o usuário tem nível de acesso mínimo necessário
 * 
 * @param {Object} user - Objeto do usuário
 * @param {number} requiredLevel - Nível mínimo necessário
 * @returns {boolean} true se tem permissão
 * @private
 */
const hasMinimumAccessLevel = (user, requiredLevel) => {
  // Guard Clause: Valida estrutura do usuário
  if (!user?.perfil?.nivel_acesso) {
    return false;
  }
  
  return user.perfil.nivel_acesso >= requiredLevel;
};

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================================

/**
 * Middleware principal de autenticação
 * 
 * Verifica se o usuário está autenticado através de:
 * 1. Sessão (prioridade)
 * 2. Header x-user-email (compatibilidade com sistema legado)
 * 
 * Se autenticado, anexa dados do usuário em req.user
 * Se não autenticado, retorna 401 Unauthorized
 * 
 * Fluxo:
 * 1. Tenta extrair usuário da sessão
 * 2. Se não encontrar, tenta extrair do header
 * 3. Se não encontrar em nenhum lugar, retorna 401
 * 4. Se encontrar, anexa em req.user e passa para próximo middleware
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * 
 * @public
 * @async
 * @middleware
 * 
 * @example
 * router.get('/protected', authenticateUser, (req, res) => {
 *   console.log(req.user); // Dados do usuário autenticado
 * });
 */
export const authenticateUser = async (req, res, next) => {
  try {
    // Estratégia 1: Buscar usuário da sessão (prioridade)
    let user = getUserFromSession(req);

    // Estratégia 2: Buscar usuário do header (fallback/compatibilidade)
    if (!user) {
      user = await getUserFromHeader(req);
    }

    // Guard Clause: Se não encontrou usuário autenticado
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          AUTH_MESSAGES.UNAUTHORIZED
        )
      );
    }

    // Anexa usuário ao request para uso nos próximos middlewares
    req.user = user;
    next();

  } catch (error) {
    console.error('[AuthMiddleware] Erro na autenticação:', error);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_ERROR,
        AUTH_MESSAGES.SERVER_ERROR
      )
    );
  }
};

// ============================================================================
// FUNÇÕES DE VERIFICAÇÃO DE PERMISSÃO (Helpers)
// ============================================================================

/**
 * Verifica se usuário é Gerente ou superior (nível 4+)
 * 
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} true se é gerente ou admin
 * 
 * @public
 * 
 * @example
 * if (checkGestorOrAdmin(req.user)) {
 *   // Pode acessar funcionalidade administrativa
 * }
 */
export const checkGestorOrAdmin = (user) => {
  return hasMinimumAccessLevel(user, ACCESS_LEVELS.MANAGER);
};

/**
 * Verifica se usuário é Gestor de Chamados ou superior (nível 3+)
 * 
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} true se é gestor de chamados ou superior
 * 
 * @public
 * 
 * @example
 * if (checkGestorChamadosOrAdmin(req.user)) {
 *   // Pode aprovar/rejeitar chamados
 * }
 */
export const checkGestorChamadosOrAdmin = (user) => {
  return hasMinimumAccessLevel(user, ACCESS_LEVELS.MANAGER_TICKETS);
};

/**
 * Verifica se usuário é Analista ou superior (nível 2+)
 * 
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} true se é analista ou superior
 * 
 * @public
 * 
 * @example
 * if (checkAnalistaOrAdmin(req.user)) {
 *   // Pode resolver chamados
 * }
 */
export const checkAnalistaOrAdmin = (user) => {
  return hasMinimumAccessLevel(user, ACCESS_LEVELS.ANALYST);
};

// ============================================================================
// MIDDLEWARES DE AUTORIZAÇÃO (Por Papel/Role)
// ============================================================================

/**
 * Middleware que exige permissão de Gerente (nível 4+)
 * 
 * Deve ser usado APÓS authenticateUser
 * Retorna 403 Forbidden se usuário não tem permissão
 * 
 * @param {Object} req - Request do Express (deve conter req.user)
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * 
 * @public
 * @middleware
 * 
 * @example
 * router.delete('/users/:id', 
 *   authenticateUser, 
 *   requireGestor, 
 *   deleteUserController
 * );
 */
export const requireGestor = (req, res, next) => {
  // Guard Clause: Verifica permissão
  if (!checkGestorOrAdmin(req.user)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        AUTH_MESSAGES.FORBIDDEN_MANAGER
      )
    );
  }
  
  next();
};

/**
 * Middleware que exige permissão de Gestor de Chamados (nível 3+)
 * 
 * Deve ser usado APÓS authenticateUser
 * Retorna 403 Forbidden se usuário não tem permissão
 * 
 * @param {Object} req - Request do Express (deve conter req.user)
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * 
 * @public
 * @middleware
 * 
 * @example
 * router.post('/chamados/:id/aprovar', 
 *   authenticateUser, 
 *   requireGestorChamados, 
 *   aprovarChamadoController
 * );
 */
export const requireGestorChamados = (req, res, next) => {
  // Guard Clause: Verifica permissão
  if (!checkGestorChamadosOrAdmin(req.user)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        AUTH_MESSAGES.FORBIDDEN_MANAGER_TICKETS
      )
    );
  }
  
  next();
};

/**
 * Middleware que exige permissão de Analista (nível 2+)
 * 
 * Deve ser usado APÓS authenticateUser
 * Retorna 403 Forbidden se usuário não tem permissão
 * 
 * @param {Object} req - Request do Express (deve conter req.user)
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * 
 * @public
 * @middleware
 * 
 * @example
 * router.post('/chamados/:id/resolver', 
 *   authenticateUser, 
 *   requireAnalista, 
 *   resolverChamadoController
 * );
 */
export const requireAnalista = (req, res, next) => {
  // Guard Clause: Verifica permissão
  if (!checkAnalistaOrAdmin(req.user)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        AUTH_MESSAGES.FORBIDDEN_ANALYST
      )
    );
  }
  
  next();
};
