import { getUserWithProfileService } from '../models/user.js';

export const authenticateUser = async (req, res, next) => {
  try {
    let user = null;

    // Prioridade 1: Verificar sessão
    if (req.session && req.session.userId) {
      user = req.session.user;
    }
    // Prioridade 2: Verificar header (compatibilidade)
    else if (req.headers['x-user-email']) {
      const userEmail = req.headers['x-user-email'];
      const userData = await getUserWithProfileService(userEmail);
      
      if (userData) {
        user = {
          id_usuario: userData.id_usuario,
          matricula: userData.matricula,
          nome_usuario: userData.nome_usuario,
          email: userData.email,
          telefone: userData.tel_usuarios,
          setor_usuario: userData.setor_usuario,
          cargo_usuario: userData.cargo_usuario,
          id_perfil_usuario: userData.id_perfil_usuario,
          id_aprovador_usuario: userData.id_aprovador_usuario,
          perfil: {
            id: userData.id_perfil_usuario,
            nome: userData.nome_perfil,
            nivel_acesso: userData.nivel_acesso,
            descricao: userData.descricao_perfil_usuario
          }
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Acesso negado. Faça login primeiro.',
        data: null
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Erro interno na autenticação',
      data: null
    });
  }
};

export const checkGestorOrAdmin = (user) => {
  if (!user?.perfil?.nivel_acesso) {
    return false;
  }
  
  return user.perfil.nivel_acesso >= 4;
};

export const checkGestorChamadosOrAdmin = (user) => {
  if (!user?.perfil?.nivel_acesso) {
    return false;
  }
  
  return user.perfil.nivel_acesso >= 3;
};

export const checkAnalistaOrAdmin = (user) => {
  if (!user?.perfil?.nivel_acesso) {
    return false;
  }
  
  return user.perfil.nivel_acesso >= 2;
};

export const requireGestor = (req, res, next) => {
  if (!checkGestorOrAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Acesso negado. Permissão de Gerente ou superior necessária.',
      data: null
    });
  }
  next();
};

export const requireGestorChamados = (req, res, next) => {
  if (!checkGestorChamadosOrAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Acesso negado. Permissão de Gestor de Chamados ou superior necessária.',
      data: null
    });
  }
  next();
};

export const requireAnalista = (req, res, next) => {
  if (!checkAnalistaOrAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Acesso negado. Permissão de Analista ou superior necessária.',
      data: null
    });
  }
  next();
};
