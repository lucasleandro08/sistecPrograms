/**
 * @fileoverview Controller de usuários - Gerenciamento de CRUD de usuários
 * 
 * Este controller implementa todas as operações relacionadas a usuários:
 * - CRUD completo (Create, Read, Update, Delete)
 * - Soft delete com sistema de backup
 * - Controle de acesso por níveis (RBAC)
 * - Gestão de perfis de usuário
 * 
 * Princípios SOLID aplicados:
 * - Single Responsibility: Cada função tem responsabilidade única
 * - Dependency Inversion: Depende de abstrações (services)
 * 
 * @module controllers/userControllers
 */

import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
  getAllPerfilsService,
  getDeletedUsersService, 
  restoreUserFromBackup      
} from '../models/user.js';
import { checkGestorOrAdmin } from '../middleware/authMiddleware.js'; 

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Códigos de status HTTP padronizados
 * @constant {Object}
 */
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
});

/**
 * Mensagens de erro padronizadas
 * @constant {Object}
 */
const ERROR_MESSAGES = Object.freeze({
  NOT_AUTHENTICATED: 'Usuário não autenticado.',
  NO_PERMISSION: 'Você não tem permissão para realizar esta ação.',
  ONLY_GESTOR_CREATE: 'Apenas gestores ou administradores podem criar usuários.',
  ONLY_GESTOR_DELETE: 'Apenas gestores ou administradores podem deletar usuários.',
  ONLY_GESTOR_RESTORE: 'Apenas gestores ou administradores podem restaurar usuários.',
  ONLY_GESTOR_VIEW_DELETED: 'Apenas gestores ou administradores podem ver usuários deletados.',
  ONLY_OWN_PROFILE: 'Você só pode editar seu próprio perfil.',
  GESTOR_NO_ADMIN_EDIT: 'Gerentes não podem editar Administradores.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  PROFILE_ID_REQUIRED: 'ID do perfil é obrigatório.',
  MOTIVO_REQUIRED: 'Motivo da deleção é obrigatório (mínimo 10 caracteres).',
  DELETE_RESULT_INVALID: 'Erro interno: resultado da deleção inválido.',
  BACKUP_NOT_CREATED: 'Erro interno: backup não foi criado corretamente.'
});

/**
 * Mensagens de sucesso padronizadas
 * @constant {Object}
 */
const SUCCESS_MESSAGES = Object.freeze({
  USER_CREATED: 'Usuário criado com sucesso.',
  USER_UPDATED: 'Usuário atualizado com sucesso.',
  USER_DELETED: 'Usuário deletado e backup criado com sucesso.',
  USER_RESTORED: 'Usuário restaurado com sucesso.',
  USER_FETCHED: 'Usuário obtido com sucesso.',
  USERS_FETCHED: 'Usuários obtidos com sucesso.',
  PROFILES_FETCHED: 'Perfis obtidos com sucesso.',
  DELETED_USERS_FETCHED: 'Usuários deletados obtidos com sucesso.'
});

/**
 * Níveis de acesso do sistema
 * @constant {Object}
 */
const ACCESS_LEVELS = Object.freeze({
  USUARIO: 1,
  ANALISTA: 2,
  GESTOR: 3,
  ADMIN: 4
});

/**
 * Validações de input
 * @constant {Object}
 */
const VALIDATION = Object.freeze({
  MIN_MOTIVO_LENGTH: 10,
  DEFAULT_PASSWORD: 'senha123'
});

// ==========================================
// FUNÇÕES AUXILIARES PRIVADAS
// ==========================================

/**
 * Envia resposta JSON padronizada
 * @private
 * @param {Object} res - Objeto response do Express
 * @param {number} status - Código HTTP
 * @param {string} message - Mensagem da resposta
 * @param {*} [data=null] - Dados opcionais
 * @returns {Object} Response JSON
 */
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({ status, message, data });
};

/**
 * Valida se usuário está autenticado
 * @private
 * @param {Object} userLogado - Usuário da sessão
 * @returns {boolean} True se autenticado
 */
const isAuthenticated = (userLogado) => {
  return !!userLogado;
};

/**
 * Valida se usuário tem permissão de gestor/admin
 * @private
 * @param {Object} userLogado - Usuário da sessão
 * @returns {boolean} True se tem permissão
 */
const hasGestorPermission = (userLogado) => {
  return userLogado && userLogado.perfil?.nivel_acesso >= ACCESS_LEVELS.GESTOR;
};

/**
 * Valida se motivo de deleção é válido
 * @private
 * @param {string} motivo - Motivo da deleção
 * @returns {boolean} True se válido
 */
const isMotivoValid = (motivo) => {
  return motivo && motivo.trim().length >= VALIDATION.MIN_MOTIVO_LENGTH;
};

/**
 * Valida se usuário pode editar outro usuário
 * @private
 * @param {Object} userLogado - Usuário executando ação
 * @param {Object} targetUser - Usuário alvo
 * @returns {Object} {canEdit: boolean, reason: string}
 */
const canEditUser = (userLogado, targetUser) => {
  // Usuário comum só edita a si mesmo
  if (userLogado.nivel_acesso < ACCESS_LEVELS.GESTOR) {
    if (targetUser.id_usuario !== userLogado.id_usuario) {
      return { canEdit: false, reason: ERROR_MESSAGES.ONLY_OWN_PROFILE };
    }
  }
  
  // Gestor não pode editar Admin
  if (userLogado.nivel_acesso === ACCESS_LEVELS.GESTOR) {
    if (targetUser.nivel_acesso >= ACCESS_LEVELS.ADMIN) {
      return { canEdit: false, reason: ERROR_MESSAGES.GESTOR_NO_ADMIN_EDIT };
    }
  }
  
  return { canEdit: true };
};

/**
 * Cria objeto de resposta para deleção
 * @private
 * @param {Object} result - Resultado do service
 * @param {string} motivo - Motivo da deleção
 * @returns {Object} Dados formatados para resposta
 */
const formatDeleteResponse = (result, motivo) => {
  return {
    backup_id: result.backup.id_backup,
    deleted_user: result.deletedUser?.nome_usuario || 'Usuário',
    motivo: motivo.trim()
  };
};

/**
 * Loga operações importantes
 * @private
 * @param {string} operation - Nome da operação
 * @param {Object} details - Detalhes da operação
 */
const logOperation = (operation, details) => {
  console.log(`[USER CONTROLLER] ${operation}:`, details);
};

// ==========================================
// CONTROLLERS PÚBLICOS
// ==========================================

/**
 * Cria um novo usuário no sistema
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} req.body - Dados do usuário
 * @param {string} req.body.nome_usuario - Nome completo
 * @param {string} req.body.setor_usuario - Setor
 * @param {string} req.body.cargo_usuario - Cargo
 * @param {string} req.body.email - Email
 * @param {string} [req.body.senha] - Senha (padrão: 'senha123')
 * @param {string} req.body.tel_usuarios - Telefone
 * @param {number} req.body.id_perfil_usuario - ID do perfil
 * @param {Object} req.user - Usuário autenticado
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com status e dados do usuário criado
 * 
 * @example
 * POST /api/users
 * Body: {
 *   "nome_usuario": "João Silva",
 *   "email": "joao@example.com",
 *   "id_perfil_usuario": 1,
 *   ...
 * }
 */
export const createUser = async (req, res, next) => {
  try {
    const { nome_usuario, setor_usuario, cargo_usuario, email, senha, tel_usuarios, id_perfil_usuario } = req.body;
    const userLogado = req.user;
    
    // Guard: Validar autenticação
    if (!isAuthenticated(userLogado)) {
      return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.NOT_AUTHENTICATED);
    }

    // Guard: Validar permissões
    if (!checkGestorOrAdmin(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.ONLY_GESTOR_CREATE);
    }

    // Guard: Validar ID do perfil
    if (!id_perfil_usuario) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.PROFILE_ID_REQUIRED);
    }

    // Log da operação
    logOperation('CREATE USER', { 
      executor: userLogado.email, 
      targetEmail: email 
    });

    // Executar criação
    const user = await createUserService(
      nome_usuario, 
      setor_usuario, 
      cargo_usuario, 
      email, 
      senha || VALIDATION.DEFAULT_PASSWORD,
      tel_usuarios,
      id_perfil_usuario,
      userLogado.matricula
    );
    
    return sendResponse(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.USER_CREATED, user);
    
  } catch (err) {
    logOperation('CREATE USER ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Lista todos os perfis disponíveis no sistema
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com array de perfis
 * 
 * @example
 * GET /api/users/perfis
 * Response: {
 *   "status": 200,
 *   "message": "Perfis obtidos com sucesso.",
 *   "data": [...]
 * }
 */
export const getAllPerfils = async (req, res, next) => {
  try {
    const perfils = await getAllPerfilsService();
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILES_FETCHED, perfils);
  } catch (err) {
    next(err);
  }
};

/**
 * Lista todos os usuários ativos do sistema
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} req.user - Usuário autenticado
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com array de usuários
 * 
 * @example
 * GET /api/users
 * Response: {
 *   "status": 200,
 *   "message": "Usuários obtidos com sucesso.",
 *   "data": [...]
 * }
 */
export const getAllUsers = async (req, res, next) => {
  try {
    logOperation('LIST USERS', { 
      executor: req.user?.nome_usuario 
    });
    
    const users = await getAllUsersService();
    
    logOperation('USERS FOUND', { count: users.length });
    
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.USERS_FETCHED, users);
    
  } catch (err) {
    logOperation('LIST USERS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Busca um usuário específico por ID
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.id - ID do usuário
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com dados do usuário
 * 
 * @example
 * GET /api/users/123
 * Response: {
 *   "status": 200,
 *   "message": "Usuário obtido com sucesso.",
 *   "data": {...}
 * }
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdService(req.params.id);
    
    // Guard: Usuário não encontrado
    if (!user) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.USER_FETCHED, user);
    
  } catch (err) {
    next(err);
  }
};

/**
 * Atualiza dados de um usuário
 * 
 * Regras de negócio:
 * - Usuários comuns só podem editar seu próprio perfil
 * - Gestores podem editar usuários abaixo de Admin
 * - Admins podem editar qualquer usuário
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.id - ID do usuário a atualizar
 * @param {Object} req.body - Novos dados
 * @param {Object} req.user - Usuário autenticado
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com dados atualizados
 * 
 * @example
 * PUT /api/users/123
 * Body: {
 *   "nome_usuario": "João da Silva",
 *   "tel_usuarios": "11999999999"
 * }
 */
export const updateUser = async (req, res, next) => {
  try {
    const { nome_usuario, setor_usuario, cargo_usuario, email, tel_usuarios, id_perfil_usuario } = req.body;
    const userLogado = req.user;
    
    // Buscar usuário alvo
    const targetUser = await getUserByIdService(req.params.id);
    
    // Guard: Usuário não existe
    if (!targetUser) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    // Validar permissões de edição
    const { canEdit, reason } = canEditUser(userLogado, targetUser);
    if (!canEdit) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, reason);
    }

    // Log da operação
    logOperation('UPDATE USER', { 
      executor: userLogado.email, 
      target: targetUser.email 
    });

    // Executar atualização
    const user = await updateUserService(
      req.params.id, 
      nome_usuario, 
      setor_usuario, 
      cargo_usuario, 
      email, 
      tel_usuarios, 
      id_perfil_usuario
    );
    
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.USER_UPDATED, user);
    
  } catch (err) {
    next(err);
  }
};

/**
 * Deleta um usuário (soft delete com backup)
 * 
 * Cria backup completo antes da deleção para permitir restauração.
 * Requer permissão de Gestor ou Admin.
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.id - ID do usuário a deletar
 * @param {Object} req.body - Dados da deleção
 * @param {string} req.body.motivo - Motivo da deleção (mín. 10 chars)
 * @param {Object} req.user - Usuário autenticado
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com confirmação e ID do backup
 * 
 * @example
 * DELETE /api/users/123
 * Body: {
 *   "motivo": "Usuário solicitou remoção da conta"
 * }
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const userLogado = req.user;
    
    // Guard: Validar permissões
    if (!hasGestorPermission(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.ONLY_GESTOR_DELETE);
    }
    
    // Guard: Validar motivo
    if (!isMotivoValid(motivo)) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.MOTIVO_REQUIRED);
    }
    
    // Log da operação
    logOperation('DELETE USER', { 
      id: req.params.id,
      motivo: motivo.trim(),
      executor: userLogado.email 
    });
    
    // Executar deleção com backup
    const result = await deleteUserService(req.params.id, motivo.trim(), userLogado.email);
    
    // Guard: Validar resultado
    if (!result) {
      return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.DELETE_RESULT_INVALID);
    }
    
    // Guard: Validar backup
    if (!result.backup) {
      return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.BACKUP_NOT_CREATED);
    }
    
    // Log sucesso
    logOperation('DELETE SUCCESS', { 
      backupId: result.backup.id_backup,
      deletedUser: result.deletedUser?.nome_usuario
    });
    
    return sendResponse(
      res, 
      HTTP_STATUS.OK, 
      SUCCESS_MESSAGES.USER_DELETED, 
      formatDeleteResponse(result, motivo)
    );
    
  } catch (err) {
    logOperation('DELETE USER ERROR', { error: err.message });
    
    // Tratamento específico de erro
    if (err.message.includes('não encontrado')) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, `Erro ao deletar usuário: ${err.message}`);
  }
};

/**
 * Lista todos os usuários deletados (backups)
 * 
 * Requer permissão de Gestor ou Admin.
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} req.user - Usuário autenticado
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com array de usuários deletados
 * 
 * @example
 * GET /api/users/deleted
 * Response: {
 *   "status": 200,
 *   "message": "Usuários deletados obtidos com sucesso.",
 *   "data": [...]
 * }
 */
export const getDeletedUsers = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    // Guard: Validar permissões
    if (!hasGestorPermission(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.ONLY_GESTOR_VIEW_DELETED);
    }
    
    const deletedUsers = await getDeletedUsersService();
    
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.DELETED_USERS_FETCHED, deletedUsers);
    
  } catch (err) {
    next(err);
  }
};

/**
 * Restaura um usuário deletado a partir do backup
 * 
 * Requer permissão de Gestor ou Admin.
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.id_backup - ID do backup a restaurar
 * @param {Object} req.user - Usuário autenticado
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com dados do usuário restaurado
 * 
 * @example
 * POST /api/users/restore/456
 * Response: {
 *   "status": 200,
 *   "message": "Usuário restaurado com sucesso.",
 *   "data": {...}
 * }
 */
export const restoreUser = async (req, res, next) => {
  try {
    const { id_backup } = req.params;
    const userLogado = req.user;
    
    // Guard: Validar permissões
    if (!hasGestorPermission(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.ONLY_GESTOR_RESTORE);
    }
    
    // Log da operação
    logOperation('RESTORE USER', { 
      backupId: id_backup,
      executor: userLogado.email 
    });
    
    // Executar restauração
    const restoredUser = await restoreUserFromBackup(id_backup, userLogado.email);
    
    logOperation('RESTORE SUCCESS', { 
      restoredUser: restoredUser.email 
    });
    
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.USER_RESTORED, restoredUser);
    
  } catch (err) {
    logOperation('RESTORE USER ERROR', { error: err.message });
    next(err);
  }
};
