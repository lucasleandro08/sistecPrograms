import { getUserWithProfileService } from '../models/user.js';
import bcrypt from 'bcrypt';

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Email e senha são obrigatórios',
        data: null
      });
    }

    const user = await getUserWithProfileService(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Email ou senha incorretos',
        data: null
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.senha);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Email ou senha incorretos',
        data: null
      });
    }

    const userData = {
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

    req.session.userId = user.id_usuario;
    req.session.user = userData;

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id_usuario,
        matricula: user.matricula,
        name: user.nome_usuario,
        email: user.email,
        telefone: user.tel_usuarios,
        setor: user.setor_usuario,
        cargo: user.cargo_usuario,
        id_aprovador: user.id_aprovador_usuario,
        perfil: {
          id: user.id_perfil_usuario,
          nome: user.nome_perfil,           
          nivel_acesso: user.nivel_acesso,  
          descricao: user.descricao_perfil_usuario 
        }
      }
    });

  } catch (err) {
    console.error('Erro no controller de login:', err);
    next(err);
  }
};

export const logoutUser = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          status: 500,
          message: 'Erro ao realizar logout',
          data: null
        });
      }

      res.clearCookie('connect.sid');
      
      res.status(200).json({
        success: true,
        status: 200,
        message: 'Logout realizado com sucesso',
        data: null
      });
    });
  } catch (err) {
    console.error('Erro no logout:', err);
    res.status(500).json({
      success: false,
      status: 500,
      message: 'Erro interno do servidor',
      data: null
    });
  }
};
