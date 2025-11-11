/**
 * @fileoverview Rotas de Usuários
 * 
 * Define endpoints para gerenciamento completo de usuários:
 * - CRUD de usuários
 * - Soft delete com backup
 * - Restauração de usuários deletados
 * - Listagem de perfis
 * 
 * Autenticação: Maioria das rotas requer authenticateUser middleware
 * Autorização: Algumas operações requerem permissões específicas (gestor/admin)
 * 
 * @module routes/userRoutes
 */

import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllPerfils,
  getDeletedUsers,   
  restoreUser  
} from '../controllers/userControllers.js';

const router = express.Router();

console.log('📋 [ROUTES] Configurando rotas de usuário');

// ==========================================
// ROTAS PÚBLICAS
// ==========================================

/**
 * GET /perfis
 * Lista todos os perfis disponíveis no sistema
 * Público - Usado no formulário de cadastro
 */
router.get('/perfis', getAllPerfils);

// ==========================================
// ROTAS AUTENTICADAS - CONSULTA
// ==========================================

/**
 * GET /
 * Lista todos os usuários ativos
 * Requer: Autenticação
 */
router.get('/', authenticateUser, getAllUsers);

/**
 * GET /deleted
 * Lista usuários deletados (backups)
 * Requer: Autenticação + Gestor/Admin
 */
router.get('/deleted', authenticateUser, getDeletedUsers); 

/**
 * GET /:id
 * Busca um usuário específico por ID
 * Requer: Autenticação
 */
router.get('/:id', authenticateUser, getUserById);

// ==========================================
// ROTAS AUTENTICADAS - MODIFICAÇÃO
// ==========================================

/**
 * POST /
 * Cria novo usuário
 * Requer: Autenticação + Gestor/Admin
 * Body: { nome_usuario, setor_usuario, cargo_usuario, email, senha, tel_usuarios, id_perfil_usuario }
 */
router.post('/', authenticateUser, createUser);

/**
 * PUT /:id
 * Atualiza dados de um usuário
 * Requer: Autenticação
 * Regras: Usuário comum edita apenas seu perfil; Gestor edita abaixo de Admin
 * Body: { nome_usuario, setor_usuario, cargo_usuario, email, tel_usuarios, id_perfil_usuario }
 */
router.put('/:id', authenticateUser, updateUser);

/**
 * DELETE /:id
 * Deleta usuário (soft delete com backup)
 * Requer: Autenticação + Gestor/Admin
 * Body: { motivo } - Mínimo 10 caracteres
 */
router.delete('/:id', authenticateUser, deleteUser);

/**
 * POST /restore/:id_backup
 * Restaura usuário deletado a partir do backup
 * Requer: Autenticação + Gestor/Admin
 */
router.post('/restore/:id_backup', authenticateUser, restoreUser); 

export default router;