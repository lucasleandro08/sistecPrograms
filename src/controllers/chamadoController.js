/**
 * @fileoverview Controller de Chamados (Tickets)
 * 
 * Gerencia todas as operações relacionadas a chamados de suporte:
 * - CRUD de chamados (criar, listar, buscar por ID)
 * - Fluxo de aprovação (aprovar, rejeitar)
 * - Integração com IA (soluções automáticas, feedback)
 * - Gestão de analistas (resolver, escalar)
 * - Controle de acesso (baseado em perfis)
 * 
 * Princípios aplicados:
 * - Single Responsibility: Cada função faz uma coisa
 * - Keep It Simple: Guard clauses e validações claras
 * - DRY: Helpers reutilizáveis
 * - Fail-Fast: Validações antecipadas
 * 
 * @module controllers/chamadoController
 */

import {
  createChamadoService,
  getChamadosComDetalhesService,
  getChamadoByIdService,
  aprovarChamadoService,
  rejeitarChamadoService,
  getChamadosParaAprovacaoService,
  updateStatusChamadoService,
  resolverChamadoService,
  escalarChamadoService,
  getChamadosParaAnalistasService
} from '../models/chamado.js';
import { checkGestorChamadosOrAdmin, checkAnalistaOrAdmin } from '../middleware/authMiddleware.js';
import { testarConexaoGemini } from '../services/geminiService.js';
import { convertPrioridadeToNumber } from '../utils/chamadoUtils.js';
import pool from '../config/db.js';

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Status HTTP utilizados nas respostas
 * @constant {Object}
 * @readonly
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
 * Níveis de acesso mínimos por operação
 * @constant {Object}
 * @readonly
 */
const ACCESS_LEVELS = Object.freeze({
  USUARIO: 1,
  ANALISTA: 2,
  GESTOR: 3,
  ADMIN: 4
});

/**
 * Status válidos de chamados
 * @constant {Object}
 * @readonly
 */
const CHAMADO_STATUS = Object.freeze({
  ABERTO: 'Aberto',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  TRIAGEM_IA: 'Triagem IA',
  COM_ANALISTA: 'Com Analista',
  ESCALADO: 'Escalado',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado'
});

/**
 * Tipos de feedback do usuário sobre soluções IA
 * @constant {Object}
 * @readonly
 */
const FEEDBACK_TIPOS = Object.freeze({
  SUCESSO: 'DEU_CERTO',
  FALHA: 'DEU_ERRADO'
});

/**
 * Comprimento mínimo para textos descritivos
 * @constant {Object}
 * @readonly
 */
const MIN_LENGTH = Object.freeze({
  MOTIVO_REJEICAO: 10,
  MOTIVO_ESCALACAO: 10
});

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Cria resposta padronizada para o cliente
 * 
 * @param {Object} res - Response do Express
 * @param {number} status - Código HTTP
 * @param {string} message - Mensagem descritiva
 * @param {*} [data=null] - Dados opcionais
 * @returns {Object} Resposta JSON
 * @private
 */
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({ 
    status, 
    message, 
    data 
  });
};

/**
 * Valida se usuário está autenticado
 * 
 * @param {Object} user - Objeto do usuário da sessão
 * @param {Object} res - Response do Express
 * @returns {boolean} true se autenticado, false e envia resposta se não
 * @private
 */
const validateAuthentication = (user, res) => {
  if (!user) {
    sendResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Usuário não autenticado.');
    return false;
  }
  return true;
};

/**
 * Valida se usuário tem permissão para ver um chamado
 * 
 * @param {Object} chamado - Dados do chamado
 * @param {Object} user - Usuário logado
 * @param {Object} res - Response do Express
 * @returns {boolean} true se autorizado
 * @private
 */
const validateChamadoAccess = (chamado, user, res) => {
  // Usuário comum só pode ver seus próprios chamados
  if (user.perfil.nivel_acesso === ACCESS_LEVELS.USUARIO && 
      chamado.id_usuario_abertura !== user.id_usuario) {
    sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Você não tem permissão para ver este chamado.');
    return false;
  }
  return true;
};

/**
 * Valida se o motivo tem comprimento mínimo
 * 
 * @param {string} motivo - Texto do motivo
 * @param {number} minLength - Comprimento mínimo
 * @param {string} fieldName - Nome do campo (para mensagem)
 * @param {Object} res - Response do Express
 * @returns {boolean} true se válido
 * @private
 */
const validateMotivo = (motivo, minLength, fieldName, res) => {
  if (!motivo || motivo.trim().length < minLength) {
    sendResponse(
      res, 
      HTTP_STATUS.BAD_REQUEST, 
      `${fieldName} é obrigatório (mínimo ${minLength} caracteres).`
    );
    return false;
  }
  return true;
};

/**
 * Valida se chamado existe
 * 
 * @param {Object} chamado - Objeto do chamado
 * @param {Object} res - Response do Express
 * @returns {boolean} true se existe
 * @private
 */
const validateChamadoExists = (chamado, res) => {
  if (!chamado) {
    sendResponse(res, HTTP_STATUS.NOT_FOUND, 'Chamado não encontrado.');
    return false;
  }
  return true;
};

/**
 * Valida se chamado está no status correto para a operação
 * 
 * @param {Object} chamado - Objeto do chamado
 * @param {string} expectedStatus - Status esperado
 * @param {string} operation - Nome da operação (para mensagem)
 * @param {Object} res - Response do Express
 * @returns {boolean} true se status correto
 * @private
 */
const validateChamadoStatus = (chamado, expectedStatus, operation, res) => {
  if (chamado.descricao_status_chamado !== expectedStatus) {
    sendResponse(
      res, 
      HTTP_STATUS.BAD_REQUEST, 
      `Apenas chamados "${expectedStatus}" podem ser ${operation}.`
    );
    return false;
  }
  return true;
};

/**
 * Valida tipo de feedback do usuário
 * 
 * @param {string} feedback - Tipo de feedback
 * @param {Object} res - Response do Express
 * @returns {boolean} true se válido
 * @private
 */
const validateFeedbackType = (feedback, res) => {
  const validTypes = Object.values(FEEDBACK_TIPOS);
  if (!validTypes.includes(feedback)) {
    sendResponse(
      res, 
      HTTP_STATUS.BAD_REQUEST, 
      `Feedback deve ser ${validTypes.join(' ou ')}.`
    );
    return false;
  }
  return true;
};

/**
 * Busca solução IA do banco de dados
 * 
 * @param {number} idChamado - ID do chamado
 * @returns {Promise<Object|null>} Solução ou null
 * @private
 */
const getSolucaoIAFromDB = async (idChamado) => {
  const result = await pool.query(`
    SELECT * FROM respostas_ia 
    WHERE fk_chamados_id_chamado = $1 AND tipo_resposta = 'SOLUCAO'
    ORDER BY data_resposta DESC 
    LIMIT 1
  `, [idChamado]);

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Atualiza feedback do usuário sobre solução IA
 * 
 * @param {number} idChamado - ID do chamado
 * @param {string} feedback - Tipo de feedback
 * @returns {Promise<void>}
 * @private
 */
const updateFeedbackSolucaoIA = async (idChamado, feedback) => {
  await pool.query(`
    UPDATE respostas_ia 
    SET feedback_usuario = $1, data_feedback = NOW()
    WHERE fk_chamados_id_chamado = $2 AND tipo_resposta = 'SOLUCAO'
  `, [feedback, idChamado]);
};

/**
 * Processa feedback positivo (solução funcionou)
 * 
 * @param {number} idChamado - ID do chamado
 * @param {number} idUsuario - ID do usuário
 * @param {Object} res - Response do Express
 * @returns {Promise<void>}
 * @private
 */
const handleSuccessFeedback = async (idChamado, idUsuario, res) => {
  await updateStatusChamadoService(idChamado, CHAMADO_STATUS.RESOLVIDO, idUsuario);
  sendResponse(res, HTTP_STATUS.OK, 'Ótimo! Chamado marcado como resolvido.');
};

/**
 * Processa feedback negativo (solução não funcionou)
 * 
 * @param {number} idChamado - ID do chamado
 * @param {Object} res - Response do Express
 * @returns {Promise<void>}
 * @private
 */
const handleFailureFeedback = async (idChamado, res) => {
  await updateStatusChamadoService(idChamado, CHAMADO_STATUS.COM_ANALISTA);
  sendResponse(res, HTTP_STATUS.OK, 'Chamado encaminhado para analista humano.');
};

/**
 * Log estruturado de operação
 * 
 * @param {string} operation - Nome da operação
 * @param {Object} details - Detalhes da operação
 * @private
 */
const logOperation = (operation, details) => {
  console.log(`[ChamadoController] ${operation}:`, details);
};

// ============================================================================
// CONTROLLERS PÚBLICOS - CRUD
// ============================================================================

/**
 * Cria um novo chamado
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const createChamado = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;
    
    logOperation('createChamado', {
      usuario: userLogado.nome_usuario,
      dados: req.body
    });
    
    // Preparar dados do chamado
    const dadosChamado = {
      ...req.body,
      id_usuario_abertura: userLogado.id_usuario,
      prioridade_chamado: convertPrioridadeToNumber(req.body.prioridade_chamado)
    };
    
    // Criar chamado via service
    const chamado = await createChamadoService(dadosChamado);
    
    sendResponse(res, HTTP_STATUS.CREATED, 'Chamado criado com sucesso.', chamado);
    
  } catch (err) {
    console.error('Erro ao criar chamado:', err);
    next(err);
  }
};

/**
 * Lista chamados (filtra por usuário se nível 1)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const getChamados = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;
    
    // Filtrar por usuário se for nível 1 (comum)
    const filters = userLogado.perfil.nivel_acesso === ACCESS_LEVELS.USUARIO
      ? { id_usuario: userLogado.id_usuario }
      : {};
    
    const chamados = await getChamadosComDetalhesService(filters);
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamados obtidos com sucesso.', chamados);
    
  } catch (err) {
    console.error('Erro ao buscar chamados:', err);
    next(err);
  }
};

/**
 * Busca chamado por ID (com controle de acesso)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const getChamadoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userLogado = req.user;
    
    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;
    
    const chamado = await getChamadoByIdService(id);
    
    // Validação: Chamado existe
    if (!validateChamadoExists(chamado, res)) return;
    
    // Validação: Permissão de acesso
    if (!validateChamadoAccess(chamado, userLogado, res)) return;
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamado obtido com sucesso.', chamado);
    
  } catch (err) {
    console.error('Erro ao buscar chamado:', err);
    next(err);
  }
};

// ============================================================================
// CONTROLLERS PÚBLICOS - APROVAÇÃO
// ============================================================================

/**
 * Lista chamados pendentes de aprovação (apenas gestores)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const getChamadosParaAprovacao = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    // Validação: Apenas gestores
    if (!checkGestorChamadosOrAdmin(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas gestores podem aprovar chamados.');
    }
    
    const chamados = await getChamadosParaAprovacaoService();
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamados para aprovação obtidos com sucesso.', chamados);
    
  } catch (err) {
    console.error('Erro ao buscar chamados para aprovação:', err);
    next(err);
  }
};

/**
 * Aprova um chamado e envia para triagem IA
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const aprovarChamado = async (req, res, next) => {
  try {
    const userLogado = req.user;
    const { id_chamado } = req.params;
    
    logOperation('aprovarChamado', {
      chamado: id_chamado,
      gestor: userLogado?.nome_usuario
    });
    
    // Validação: Apenas gestores
    if (!checkGestorChamadosOrAdmin(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas gestores podem aprovar chamados.');
    }
    
    await aprovarChamadoService(id_chamado, userLogado.id_usuario);
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamado aprovado e encaminhado para triagem IA.');
    
  } catch (err) {
    console.error('Erro ao aprovar chamado:', err);
    next(err);
  }
};

/**
 * Rejeita um chamado com motivo
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const rejeitarChamado = async (req, res, next) => {
  try {
    const userLogado = req.user;
    const { id_chamado } = req.params;
    const { motivo } = req.body;
    
    logOperation('rejeitarChamado', { chamado: id_chamado, motivo });
    
    // Validação: Apenas gestores
    if (!checkGestorChamadosOrAdmin(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas gestores podem rejeitar chamados.');
    }
    
    // Validação: Motivo válido
    if (!validateMotivo(motivo, MIN_LENGTH.MOTIVO_REJEICAO, 'Motivo da rejeição', res)) return;
    
    await rejeitarChamadoService(id_chamado, motivo, userLogado.id_usuario);
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamado rejeitado com sucesso.');
    
  } catch (err) {
    console.error('Erro ao rejeitar chamado:', err);
    next(err);
  }
};

// ============================================================================
// CONTROLLERS PÚBLICOS - INTEGRAÇÃO COM IA
// ============================================================================

/**
 * Busca solução gerada pela IA para um chamado
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const getSolucaoIA = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const userLogado = req.user;

    logOperation('getSolucaoIA', {
      chamado: id_chamado,
      usuario: userLogado?.nome_usuario
    });

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    const chamado = await getChamadoByIdService(id_chamado);
    
    // Validação: Chamado existe
    if (!validateChamadoExists(chamado, res)) return;

    // Validação: Permissão de acesso
    if (userLogado.perfil.nivel_acesso < ACCESS_LEVELS.ANALISTA && 
        chamado.id_usuario_abertura !== userLogado.id_usuario) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Sem permissão para ver este chamado.');
    }

    // Buscar solução IA do banco
    const solucao = await getSolucaoIAFromDB(id_chamado);

    if (!solucao) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, 'Solução da IA não encontrada para este chamado.');
    }

    logOperation('getSolucaoIA - Encontrada', {
      id: solucao.id_resposta_ia,
      tamanho: solucao.solucao_ia?.length || 0,
      data: solucao.data_resposta
    });

    sendResponse(res, HTTP_STATUS.OK, 'Solução da IA obtida com sucesso.', solucao);

  } catch (err) {
    console.error('Erro ao buscar solução IA:', err);
    next(err);
  }
};

/**
 * Processa feedback do usuário sobre solução da IA
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const feedbackSolucaoIA = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const { feedback } = req.body;
    const userLogado = req.user;

    logOperation('feedbackSolucaoIA', {
      chamado: id_chamado,
      feedback,
      usuario: userLogado?.nome_usuario
    });

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    // Validação: Tipo de feedback
    if (!validateFeedbackType(feedback, res)) return;

    const chamado = await getChamadoByIdService(id_chamado);
    
    // Validação: Apenas dono do chamado pode dar feedback
    if (!chamado || chamado.id_usuario_abertura !== userLogado.id_usuario) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Você só pode dar feedback nos seus próprios chamados.');
    }

    // Atualizar feedback no banco
    await updateFeedbackSolucaoIA(id_chamado, feedback);

    // Processar feedback conforme tipo
    if (feedback === FEEDBACK_TIPOS.SUCESSO) {
      await handleSuccessFeedback(id_chamado, userLogado.id_usuario, res);
    } else {
      await handleFailureFeedback(id_chamado, res);
    }

  } catch (err) {
    console.error('Erro ao processar feedback:', err);
    next(err);
  }
};

/**
 * Testa conectividade com Google Gemini (admin only)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const testarGemini = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    // Validação: Apenas administradores
    if (!userLogado || userLogado.perfil.nivel_acesso < ACCESS_LEVELS.ADMIN) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas administradores podem testar a IA.');
    }
    
    console.log('Testando conexão Gemini...');
    const resultado = await testarConexaoGemini();
    
    const status = resultado.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_ERROR;
    const message = resultado.success ? 'Conexão com Gemini funcionando!' : 'Erro na conexão com Gemini.';
    
    sendResponse(res, status, message, resultado);
    
  } catch (err) {
    console.error('Erro ao testar Gemini:', err);
    next(err);
  }
};

// ============================================================================
// CONTROLLERS PÚBLICOS - GESTÃO DE ANALISTAS
// ============================================================================

/**
 * Lista chamados que estão com analistas
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const getChamadosComAnalista = async (req, res, next) => {
  try {
    const userLogado = req.user;

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    // Validação: Apenas analistas
    if (!checkAnalistaOrAdmin(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas analistas podem ver esta lista.');
    }

    const chamados = await getChamadosParaAnalistasService();
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamados com analista obtidos com sucesso.', chamados);

  } catch (err) {
    console.error('Erro ao buscar chamados com analista:', err);
    next(err);
  }
};

/**
 * Resolve um chamado (marca como resolvido)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const resolverChamado = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const userLogado = req.user;

    logOperation('resolverChamado', {
      chamado: id_chamado,
      analista: userLogado?.nome_usuario
    });

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    // Validação: Apenas analistas
    if (!checkAnalistaOrAdmin(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas analistas podem resolver chamados.');
    }

    const chamado = await getChamadoByIdService(id_chamado);
    
    // Validação: Chamado existe
    if (!validateChamadoExists(chamado, res)) return;

    // Validação: Status correto
    if (!validateChamadoStatus(chamado, CHAMADO_STATUS.COM_ANALISTA, 'resolvidos', res)) return;

    await resolverChamadoService(id_chamado, userLogado.id_usuario);
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamado marcado como resolvido com sucesso.');

  } catch (err) {
    console.error('Erro ao resolver chamado:', err);
    next(err);
  }
};

/**
 * Escala um chamado para gerente
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const escalarChamado = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const { motivo } = req.body;
    const userLogado = req.user;

    logOperation('escalarChamado', {
      chamado: id_chamado,
      analista: userLogado?.nome_usuario
    });

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    // Validação: Apenas analistas
    if (!checkAnalistaOrAdmin(userLogado)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas analistas podem escalar chamados.');
    }

    // Validação: Motivo válido
    if (!validateMotivo(motivo, MIN_LENGTH.MOTIVO_ESCALACAO, 'Motivo do escalonamento', res)) return;

    const chamado = await getChamadoByIdService(id_chamado);
    
    // Validação: Chamado existe
    if (!validateChamadoExists(chamado, res)) return;

    // Validação: Status correto
    if (!validateChamadoStatus(chamado, CHAMADO_STATUS.COM_ANALISTA, 'escalados', res)) return;

    await escalarChamadoService(id_chamado, userLogado.id_usuario, motivo.trim());
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamado escalado para gerente com sucesso.');

  } catch (err) {
    console.error('Erro ao escalar chamado:', err);
    next(err);
  }
};

/**
 * Lista chamados escalados (apenas gerentes)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const getChamadosEscalados = async (req, res, next) => {
  try {
    const userLogado = req.user;

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    // Validação: Apenas gerentes
    if (userLogado.perfil.nivel_acesso < ACCESS_LEVELS.ADMIN) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas gerentes podem ver chamados escalados.');
    }

    const chamados = await getChamadosComDetalhesService({ status: CHAMADO_STATUS.ESCALADO });
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamados escalados obtidos com sucesso.', chamados);

  } catch (err) {
    console.error('Erro ao buscar chamados escalados:', err);
    next(err);
  }
};

/**
 * Resolve um chamado com relatório obrigatório
 * 
 * Salva o relatório de resolução na tabela `resposta` e mantém vínculo com o chamado.
 * Essa função NÃO muda o status para resolvido, apenas salva o relatório.
 * O status será alterado posteriormente pela função aprovarChamado.
 * 
 * @param {Object} req - Request do Express
 * @param {Object} req.body.id_chamado - ID do chamado
 * @param {Object} req.body.relatorio_resposta - Relatório detalhado da resolução
 * @param {Object} req.body.id_usuario_abertura - ID do usuário que abriu
 * @param {Object} req.body.id_categoria_chamado - ID da categoria
 * @param {Object} req.body.id_problema_chamado - ID do problema
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const resolverChamadoComRelatorio = async (req, res, next) => {
  try {
    const { 
      id_chamado, 
      relatorio_resposta,
      id_usuario_abertura,
      id_categoria_chamado,
      id_problema_chamado
    } = req.body;
    
    const userLogado = req.user;

    logOperation('resolverChamadoComRelatorio', {
      chamado: id_chamado,
      analista: userLogado?.nome_usuario,
      relatorio_length: relatorio_resposta?.length
    });

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    // Validação: Campos obrigatórios
    if (!id_chamado) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, 'ID do chamado é obrigatório.');
    }

    if (!relatorio_resposta || relatorio_resposta.trim().length < 20) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, 'Relatório deve ter no mínimo 20 caracteres.');
    }

    // Verificar se chamado existe
    const chamado = await getChamadoByIdService(id_chamado);
    if (!validateChamadoExists(chamado, res)) return;

    // Inserir relatório na tabela resposta
    const insertQuery = `
      INSERT INTO resposta (
        relatorio_resposta,
        id_usuario_abertura,
        id_usuario_resolucao,
        id_categoria_chamado,
        id_categoria_problema,
        fk_chamados_id_chamado
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_resposta;
    `;

    const values = [
      relatorio_resposta.trim(),
      id_usuario_abertura || null,
      userLogado.id_usuario,
      id_categoria_chamado || null,
      id_problema_chamado || null,
      id_chamado
    ];

    const result = await pool.query(insertQuery, values);

    logOperation('RESPOSTA_SALVA', {
      id_resposta: result.rows[0].id_resposta,
      id_chamado,
      analista: userLogado.nome_usuario
    });

    sendResponse(res, HTTP_STATUS.CREATED, 'Relatório de resolução salvo com sucesso.', {
      id_resposta: result.rows[0].id_resposta
    });

  } catch (err) {
    console.error('Erro ao salvar relatório de resolução:', err);
    next(err);
  }
};

/**
 * Resolve um chamado escalado (apenas gerentes)
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @public
 * @async
 */
export const resolverChamadoEscalado = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const userLogado = req.user;

    logOperation('resolverChamadoEscalado', {
      chamado: id_chamado,
      gerente: userLogado?.nome_usuario
    });

    // Validação: Usuário autenticado
    if (!validateAuthentication(userLogado, res)) return;

    // Validação: Apenas gerentes
    if (userLogado.perfil.nivel_acesso < ACCESS_LEVELS.GESTOR) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, 'Apenas gerentes podem resolver chamados escalados.');
    }

    const chamado = await getChamadoByIdService(id_chamado);
    
    // Validação: Chamado existe
    if (!validateChamadoExists(chamado, res)) return;

    // Validação: Status correto
    if (!validateChamadoStatus(chamado, CHAMADO_STATUS.ESCALADO, 'resolvidos por gerentes', res)) return;

    await resolverChamadoService(id_chamado, userLogado.id_usuario);
    
    sendResponse(res, HTTP_STATUS.OK, 'Chamado escalado resolvido com sucesso.');

  } catch (err) {
    console.error('Erro ao resolver chamado escalado:', err);
    next(err);
  }
};
