/**
 * @fileoverview Rotas de Chamados
 * 
 * Define endpoints para gerenciamento completo de chamados:
 * - CRUD de chamados
 * - Workflow de aprovação/rejeição
 * - Triagem e resolução com IA
 * - Atribuição a analistas
 * - Escalação para gestores
 * - Feedback de soluções
 * 
 * Todas as rotas requerem autenticação via authenticateUser middleware
 * Algumas operações requerem permissões específicas (analista/gestor/admin)
 * 
 * @module routes/chamadoRoutes
 */

import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  createChamado,
  getChamados,
  getChamadoById,
  getChamadosParaAprovacao,
  aprovarChamado,
  rejeitarChamado,
  testarGemini,
  getSolucaoIA,
  feedbackSolucaoIA,
  resolverChamado,
  escalarChamado,
  getChamadosEscalados,
  getChamadosComAnalista,
  resolverChamadoEscalado,
  resolverChamadoComRelatorio
} from '../controllers/chamadoController.js';

const router = express.Router();

console.log('📋 [ROUTES] Configurando rotas de chamados');

// ==========================================
// ROTAS DE CRIAÇÃO E CONSULTA BÁSICA
// ==========================================

/**
 * POST /
 * Cria novo chamado
 * Requer: Autenticação
 * Body: { descricao_chamado, categoria, problema, prioridade, anexos }
 */
router.post('/', authenticateUser, createChamado);

/**
 * GET /
 * Lista todos os chamados (com filtros por role)
 * Requer: Autenticação
 * Filters: status, categoria, prioridade, data
 */
router.get('/', authenticateUser, getChamados);

// ==========================================
// ROTAS DE APROVAÇÃO (GESTOR/ADMIN)
// ==========================================

/**
 * GET /aprovacao
 * Lista chamados aguardando aprovação
 * Requer: Autenticação + Gestor/Admin
 */
router.get('/aprovacao', authenticateUser, getChamadosParaAprovacao);

// ==========================================
// ROTAS PARA ANALISTAS
// ==========================================

/**
 * GET /com-analista
 * Lista chamados atribuídos a analistas
 * Requer: Autenticação + Analista/Gestor/Admin
 */
router.get('/com-analista', authenticateUser, getChamadosComAnalista);

// ==========================================
// ROTAS PARA GESTORES (ESCALADOS)
// ==========================================

/**
 * GET /escalados
 * Lista chamados escalados para gestores
 * Requer: Autenticação + Gestor/Admin
 */
router.get('/escalados', authenticateUser, getChamadosEscalados);

// ==========================================
// ROTAS DE TRIAGEM E IA
// ==========================================

/**
 * GET /test/gemini
 * Testa conexão com API Gemini
 * Requer: Autenticação + Admin
 */
router.get('/test/gemini', authenticateUser, testarGemini);

/**
 * POST /resolver-com-relatorio
 * Salva relatório de resolução na tabela resposta
 * Requer: Autenticação + Analista/Gestor/Admin
 * Body: { 
 *   id_chamado, 
 *   relatorio_resposta, 
 *   id_usuario_abertura, 
 *   id_categoria_chamado, 
 *   id_problema_chamado 
 * }
 */
router.post('/resolver-com-relatorio', authenticateUser, resolverChamadoComRelatorio);

// ==========================================
// ROTAS COM PARÂMETROS DINÂMICOS (:id, :id_chamado)
// IMPORTANTE: Devem vir DEPOIS das rotas com nomes específicos
// ==========================================

/**
 * GET /:id
 * Busca chamado específico por ID
 * Requer: Autenticação + Permissão de acesso ao chamado
 */
router.get('/:id', authenticateUser, getChamadoById);

/**
 * POST /:id_chamado/aprovar
 * Aprova chamado e envia para triagem IA
 * Requer: Autenticação + Gestor/Admin
 */
router.post('/:id_chamado/aprovar', authenticateUser, aprovarChamado);

/**
 * POST /:id_chamado/rejeitar
 * Rejeita chamado com motivo
 * Requer: Autenticação + Gestor/Admin
 * Body: { motivo_rejeicao }
 */
router.post('/:id_chamado/rejeitar', authenticateUser, rejeitarChamado);

/**
 * GET /:id_chamado/solucao-ia
 * Retorna solução gerada pela IA
 * Requer: Autenticação + Dono do chamado
 */
router.get('/:id_chamado/solucao-ia', authenticateUser, getSolucaoIA);

/**
 * POST /:id_chamado/feedback-ia
 * Envia feedback sobre solução da IA (resolveu ou não)
 * Requer: Autenticação + Dono do chamado
 * Body: { tipo_feedback: 'sucesso' | 'falha' }
 */
router.post('/:id_chamado/feedback-ia', authenticateUser, feedbackSolucaoIA);

/**
 * POST /:id_chamado/resolver-escalado
 * Resolve chamado escalado (DEVE VIR ANTES DE /resolver!)
 * Requer: Autenticação + Gestor/Admin
 * Body: { solucao }
 */
router.post('/:id_chamado/resolver-escalado', authenticateUser, resolverChamadoEscalado);

/**
 * POST /:id_chamado/resolver
 * Resolve chamado com solução do analista
 * Requer: Autenticação + Analista/Gestor/Admin
 * Body: { solucao }
 */
router.post('/:id_chamado/resolver', authenticateUser, resolverChamado);

/**
 * POST /:id_chamado/escalar
 * Escala chamado para gestor
 * Requer: Autenticação + Analista
 * Body: { motivo_escalacao }
 */
router.post('/:id_chamado/escalar', authenticateUser, escalarChamado);

export default router;
