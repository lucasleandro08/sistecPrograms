import { getUserWithProfileService } from '../models/user.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    
    console.log('Email recebido no header:', userEmail);
    console.log('Todos os headers:', req.headers);
    
    if (!userEmail) {
      console.log('Header x-user-email não encontrado');
      return res.status(401).json({
        status: 401,
        message: 'Usuário não autenticado - header x-user-email não encontrado',
        data: null
      });
    }

    // Buscar usuário completo com perfil
    const user = await getUserWithProfileService(userEmail);
    
    console.log('Usuário encontrado no middleware:', user);
    
    if (!user) {
      console.log('Usuário não encontrado no banco');
      return res.status(401).json({
        status: 401,
        message: 'Usuário não encontrado',
        data: null
      });
    }

    // Mapear todos os dados necessários para req.user
    req.user = {
      id_usuario: user.id_usuario,
      matricula: user.matricula,
      nome_usuario: user.nome_usuario,
      email: user.email,
      telefone: user.tel_usuarios,
      setor_usuario: user.setor_usuario,
      cargo_usuario: user.cargo_usuario,
      id_perfil_usuario: user.id_perfil_usuario,
      id_aprovador_usuario: user.id_aprovador_usuario,
      perfil: {
        id: user.id_perfil_usuario,
        nome: user.nome_perfil,
        nivel_acesso: user.nivel_acesso,
        descricao: user.descricao_perfil_usuario
      }
    };
    
    console.log('req.user configurado no middleware:', req.user);
    console.log('Chamando next() para continuar para o controller');
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(403).json({
      status: 403,
      message: 'Erro na autenticação: ' + error.message,
      data: null
    });
  }
};

export const checkGestorOrAdmin = (user) => {
  console.log('Verificando permissões do usuário:', user?.perfil);
  
  if (!user || !user.perfil || !user.perfil.nivel_acesso) {
    console.log(' Usuário sem perfil definido');
    return false;
  }
  
  const canCreate = user.perfil.nivel_acesso >= 4; // Gerente (4) ou Admin (5)
  
  return canCreate;
};

// Verificar se é gestor de chamados ou superior
export const checkGestorChamadosOrAdmin = (user) => {
  
  if (!user || !user.perfil || !user.perfil.nivel_acesso) {
    return false;
  }
  
  // Gestor de Chamados (3), Gerente (4) ou Admin (5) podem gerenciar chamados
  const canManageTickets = user.perfil.nivel_acesso >= 3;
  
  return canManageTickets;
};

// Verificar se é analista ou superior
export const checkAnalistaOrAdmin = (user) => {
  console.log('Verificando permissões de analista:', user?.perfil);
  
  if (!user || !user.perfil || !user.perfil.nivel_acesso) {
    return false;
  }
  
  // Analista (2) ou superior podem resolver chamados
  const canResolveTickets = user.perfil.nivel_acesso >= 2;
  
  return canResolveTickets;
};