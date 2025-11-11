/**
 * @fileoverview Rotas de Estatísticas
 * 
 * Define endpoints para métricas e relatórios do sistema:
 * - Estatísticas mensais e anuais
 * - Análise por categoria
 * - Performance de analistas
 * - Dashboard agregado
 * - Relatórios completos para export
 * 
 * Todas as rotas requerem autenticação via authenticateUser middleware
 * Algumas estatísticas podem ter permissões adicionais (gestor/admin)
 * 
 * @module routes/estatisticasRoutes
 */

import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  getChamadosMensais,
  getChamadosCategoria,
  getChamadosAnuais,
  getChamadosAnalistas,
  getDashboardStats,      
  getDashboardStatsDetalhadas,
  getRelatorioCompleto  
} from '../controllers/estatisticasController.js';

const router = express.Router();

console.log('📊 [ROUTES] Configurando rotas de estatísticas');

// ==========================================
// ROTAS DE ESTATÍSTICAS TEMPORAIS
// ==========================================

/**
 * GET /chamados-mensais
 * Retorna estatísticas dos últimos 6 meses
 * Requer: Autenticação
 */
router.get('/chamados-mensais', authenticateUser, getChamadosMensais);

/**
 * GET /chamados-anuais
 * Retorna estatísticas dos últimos 12 meses (abertos vs resolvidos)
 * Requer: Autenticação
 */
router.get('/chamados-anuais', authenticateUser, getChamadosAnuais);

// ==========================================
// ROTAS DE ESTATÍSTICAS POR CATEGORIA
// ==========================================

/**
 * GET /chamados-categoria
 * Retorna distribuição de chamados por categoria
 * Requer: Autenticação
 */
router.get('/chamados-categoria', authenticateUser, getChamadosCategoria);

// ==========================================
// ROTAS DE PERFORMANCE DE ANALISTAS
// ==========================================

/**
 * GET /chamados-analistas
 * Retorna top 10 analistas com mais chamados resolvidos
 * Requer: Autenticação
 */
router.get('/chamados-analistas', authenticateUser, getChamadosAnalistas);

// ==========================================
// ROTAS DE DASHBOARD
// ==========================================

/**
 * GET /dashboard-stats
 * Retorna estatísticas agregadas do dashboard (total por status)
 * Requer: Autenticação
 */
router.get('/dashboard-stats', authenticateUser, getDashboardStats);

/**
 * GET /dashboard-stats-detalhadas
 * Retorna estatísticas detalhadas multi-dimensionais
 * Inclui: status, chamados hoje, última semana, último mês
 * Requer: Autenticação
 */
router.get('/dashboard-stats-detalhadas', authenticateUser, getDashboardStatsDetalhadas);

// ==========================================
// ROTAS DE RELATÓRIOS
// ==========================================

/**
 * GET /relatorio-completo
 * Retorna relatório completo consolidado
 * Inclui: todos os chamados, estatísticas agregadas, top analistas
 * Requer: Autenticação + Gestor/Admin (recomendado)
 */
router.get('/relatorio-completo', authenticateUser, getRelatorioCompleto);

export default router;
