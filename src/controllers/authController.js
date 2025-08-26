import { getUserWithProfileService } from '../models/user.js';
import bcrypt from 'bcrypt';

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: 'Email e senha são obrigatórios',
        data: null
      });
    }
    const user = await getUserWithProfileService(email);
    
    //LOG PARA VER O QUE VEM DO BANCO  <- deixar comentário bom para debug XD
    console.log('🔍 Usuário do banco com perfil:', user);
    
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: 'Email ou senha incorretos',
        data: null
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.senha);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 401,
        message: 'Email ou senha incorretos',
        data: null
      });
    }
    res.status(200).json({
      status: 200,
      message: 'Login realizado com sucesso',
      data: {
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
      }
    });

  } catch (err) {
    console.error('Erro no controller de login:', err); //bom para debug também XD
    next(err);
  }
};
