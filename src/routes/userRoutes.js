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

console.log('📋 Configurando rotas de usuário');

// Rotas públicas
router.get('/perfis', getAllPerfils);

// Rotas que precisam autenticação
router.get('/', authenticateUser, getAllUsers);
router.get('/deleted', authenticateUser, getDeletedUsers); 
router.get('/:id', authenticateUser, getUserById);
router.post('/', authenticateUser, createUser);
router.put('/:id', authenticateUser, updateUser);
router.delete('/:id', authenticateUser, deleteUser);
router.post('/restore/:id_backup', authenticateUser, restoreUser); 

export default router;