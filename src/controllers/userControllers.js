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

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

export const createUser = async (req, res, next) => {
  try {
    const { nome_usuario, setor_usuario, cargo_usuario, email, senha, tel_usuarios, id_perfil_usuario } = req.body;
    
    const userLogado = req.user;
    console.log('Usuário logado no controller:', userLogado);
    
    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    if (!checkGestorOrAdmin(userLogado)) {
      return handleResponse(res, 403, 'Apenas gestores ou administradores podem criar usuários.');
    }

    const matricula_aprovador = userLogado.matricula;
    console.log('Matrícula do aprovador:', matricula_aprovador);

    if (!id_perfil_usuario) {
      return handleResponse(res, 400, 'ID do perfil é obrigatório.');
    }

    const user = await createUserService(
      nome_usuario, 
      setor_usuario, 
      cargo_usuario, 
      email, 
      senha || 'senha123',
      tel_usuarios,
      id_perfil_usuario,
      matricula_aprovador
    );
    
    handleResponse(res, 201, 'Usuário criado com sucesso.', user);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    next(err);
  }
};

export const getAllPerfils = async (req, res, next) => {
  try {
    const perfils = await getAllPerfilsService();
    handleResponse(res, 200, 'Perfis obtidos com sucesso.', perfils);
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    console.log('Listando todos os usuários');
    console.log('Usuário logado:', req.user?.nome_usuario);
    
    const users = await getAllUsersService();
    console.log('Usuários encontrados:', users.length);
    
    handleResponse(res, 200, 'Usuários obtidos com sucesso.', users);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
    try{
        const users = await getUserByIdService(req.params.id);
        if (!user) return handleresponse(res, 404, 'usuario nao encontrado.');
        handleresponse(res, 200, 'Usuario obtido com sucesso!', user);
    }
    catch(err){
        next(err);
    }
}

export const updateUser = async (req, res, next) => {
  try {
    const { nome_usuario, setor_usuario, cargo_usuario, email, tel_usuarios, id_perfil_usuario } = req.body;
    const userLogado = req.user;
    
    const targetUser = await getUserByIdService(req.params.id);
    
    if (!targetUser) {
      return handleResponse(res, 404, 'Usuário não encontrado.');
    }
    
    if (userLogado.nivel_acesso < 3) { 
      if (targetUser.id_usuario !== userLogado.id_usuario) {
        return handleResponse(res, 403, 'Você só pode editar seu próprio perfil.');
      }
    } else if (userLogado.nivel_acesso === 3) { 
      if (targetUser.nivel_acesso >= 4) {
        return handleResponse(res, 403, 'Gerentes não podem editar Administradores.');
      }
    }

    const user = await updateUserService(req.params.id, nome_usuario, setor_usuario, cargo_usuario, email, tel_usuarios, id_perfil_usuario);
    handleResponse(res, 200, 'Usuário atualizado com sucesso.', user);
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const userLogado = req.user;
    
    console.log('Iniciando deleção do usuário ID:', req.params.id);
    console.log('Motivo recebido:', motivo);
    console.log('Usuário que está deletando:', userLogado?.email);
    
    if (!userLogado || userLogado.perfil.nivel_acesso < 3) {
      return handleResponse(res, 403, 'Apenas gestores ou administradores podem deletar usuários.');
    }
    
    if (!motivo || motivo.trim().length < 10) {
      return handleResponse(res, 400, 'Motivo da deleção é obrigatório (mínimo 10 caracteres).');
    }
    
    const result = await deleteUserService(req.params.id, motivo.trim(), userLogado.email);
    
    console.log('Resultado da deleção:', result);
    
    if (!result) {
      return handleResponse(res, 500, 'Erro interno: resultado da deleção inválido.');
    }
    
    if (!result.backup) {
      return handleResponse(res, 500, 'Erro interno: backup não foi criado corretamente.');
    }
    
    handleResponse(res, 200, 'Usuário deletado e backup criado com sucesso.', {
      backup_id: result.backup.id_backup,
      deleted_user: result.deletedUser?.nome_usuario || 'Usuário',
      motivo: motivo.trim()
    });
    
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    
    if (err.message.includes('não encontrado')) {
      return handleResponse(res, 404, 'Usuário não encontrado.');
    }
    
    handleResponse(res, 500, `Erro ao deletar usuário: ${err.message}`);
  }
};

export const getDeletedUsers = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    if (!userLogado || userLogado.perfil.nivel_acesso < 3) {
      return handleResponse(res, 403, 'Apenas gestores ou administradores podem ver usuários deletados.');
    }
    
    const deletedUsers = await getDeletedUsersService();
    handleResponse(res, 200, 'Usuários deletados obtidos com sucesso.', deletedUsers);
  } catch (err) {
    next(err);
  }
};

export const restoreUser = async (req, res, next) => {
  try {
    const { id_backup } = req.params;
    const userLogado = req.user;
    
    if (!userLogado || userLogado.perfil.nivel_acesso < 3) {
      return handleResponse(res, 403, 'Apenas gestores ou administradores podem restaurar usuários.');
    }
    
    console.log('Restaurando usuário do backup ID:', id_backup);
    console.log('Usuário que restaurou:', userLogado.email);
    
    const restoredUser = await restoreUserFromBackup(id_backup, userLogado.email);
    
    handleResponse(res, 200, 'Usuário restaurado com sucesso.', restoredUser);
  } catch (err) {
    console.error('Erro ao restaurar usuário:', err);
    next(err);
  }
};
