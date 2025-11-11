/**
 * @fileoverview Rotas de Autenticação
 * 
 * Define endpoints públicos para:
 * - Login de usuários (POST /api/auth/login)
 * - Logout de usuários (POST /api/auth/logout)
 * 
 * Rotas públicas - Não requerem autenticação
 * 
 * @module routes/authRoutes
 */

import express from 'express';
import { loginUser, logoutUser } from '../controllers/authController.js';

const router = express.Router();

// ==========================================
// ROTAS PÚBLICAS DE AUTENTICAÇÃO
// ==========================================

/**
 * POST /login
 * Autentica usuário e cria sessão
 * Body: { email, senha }
 */
router.post('/login', loginUser);

/**
 * POST /logout
 * Destrói sessão do usuário
 */
router.post('/logout', logoutUser);

export default router;