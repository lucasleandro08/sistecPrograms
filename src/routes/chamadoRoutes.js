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
  resolverChamadoEscalado  
} from '../controllers/chamadoController.js';

const router = express.Router();

console.log('📋 Configurando rotas de chamados');

// Rotas existentes
router.post('/', authenticateUser, createChamado);
router.get('/', authenticateUser, getChamados);
router.get('/aprovacao', authenticateUser, getChamadosParaAprovacao);

// Rotas para analistas e gerentes
router.get('/escalados', authenticateUser, getChamadosEscalados);
router.get('/com-analista', authenticateUser, getChamadosComAnalista);
router.post('/:id_chamado/resolver', authenticateUser, resolverChamado);
router.post('/:id_chamado/escalar', authenticateUser, escalarChamado);
router.post('/:id_chamado/resolver-escalado', authenticateUser, resolverChamadoEscalado);

// Rotas de aprovação
router.post('/:id_chamado/aprovar', authenticateUser, aprovarChamado);
router.post('/:id_chamado/rejeitar', authenticateUser, rejeitarChamado);

// Rotas de IA
router.get('/:id_chamado/solucao-ia', authenticateUser, getSolucaoIA);
router.post('/:id_chamado/feedback-ia', authenticateUser, feedbackSolucaoIA);

// Rotas gerais
router.get('/:id', authenticateUser, getChamadoById);
router.get('/test/gemini', authenticateUser, testarGemini);

export default router;
