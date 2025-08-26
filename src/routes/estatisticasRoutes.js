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

console.log('📊 Configurando rotas de estatísticas');

// Rotas de estatísticas existentes
router.get('/chamados-mensais', authenticateUser, getChamadosMensais);
router.get('/chamados-categoria', authenticateUser, getChamadosCategoria);
router.get('/chamados-anuais', authenticateUser, getChamadosAnuais);
router.get('/chamados-analistas', authenticateUser, getChamadosAnalistas);
router.get('/dashboard-stats', authenticateUser, getDashboardStats);
router.get('/dashboard-stats-detalhadas', authenticateUser, getDashboardStatsDetalhadas);
router.get('/relatorio-completo', authenticateUser, getRelatorioCompleto);
export default router;
