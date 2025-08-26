import pool from '../config/db.js';
import bcrypt from 'bcrypt';


export const getUserWithProfileService = async (email) => {
  const result = await pool.query(`
    SELECT 
      u.*,
      p.descricao_perfil_usuario as nome_perfil,
      p.nivel_acesso,
      p.descricao_perfil_usuario
    FROM usuarios u
    LEFT JOIN perfil_usuario p ON u.id_perfil_usuario = p.id_perfil_usuario
    WHERE u.email = $1
  `, [email]);
  
  console.log('Query result:', result.rows[0]);
  
  return result.rows[0];
};

export const getAllUsersService = async () => {
  const result = await pool.query(`
    SELECT 
      u.*,
      p.descricao_perfil_usuario as nome_perfil,
      p.nivel_acesso
    FROM usuarios u
    LEFT JOIN perfil_usuario p ON u.id_perfil_usuario = p.id_perfil_usuario
    ORDER BY u.id_usuario
  `);
  
  console.log('Usuários do banco:', result.rows.length);
  return result.rows;
};


export const getUserByIdService = async (id) => {
  const result = await pool.query(`
    SELECT 
      u.*,
      p.descricao_perfil_usuario as nome_perfil,
      p.nivel_acesso
    FROM usuarios u
    LEFT JOIN perfil_usuario p ON u.id_perfil_usuario = p.id_perfil_usuario
    WHERE u.id_usuario = $1
  `, [id]);
  return result.rows[0];
};


export const getUserByEmailService = async (email) => {
  const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return result.rows[0];
};


export const createUserService = async (nome_usuario, setor_usuario, cargo_usuario, email, senha, tel_usuarios, id_perfil_usuario, matricula_aprovador) => {
  const senhaHash = await bcrypt.hash(senha, 10);
  console.log('Senha original:', senha);
  console.log('Senha criptografada:', senhaHash);
  
  const result = await pool.query(
    'INSERT INTO usuarios (nome_usuario, setor_usuario, cargo_usuario, email, senha, tel_usuarios, id_perfil_usuario, id_aprovador_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [nome_usuario, setor_usuario, cargo_usuario, email, senhaHash, tel_usuarios, id_perfil_usuario, matricula_aprovador]
  );
  
  return result.rows[0];
};

export const updateUserService = async (id, nome_usuario, setor_usuario, cargo_usuario, email, tel_usuarios, id_perfil_usuario) => {
  const result = await pool.query(
    'UPDATE usuarios SET nome_usuario = $1, setor_usuario = $2, cargo_usuario = $3, email = $4, tel_usuarios = $5, id_perfil_usuario = $6 WHERE id_usuario = $7 RETURNING *',
    [nome_usuario, setor_usuario, cargo_usuario, email, tel_usuarios, id_perfil_usuario, id]
  );
  return result.rows[0];
};


export const getAllPerfilsService = async () => {
  const result = await pool.query('SELECT * FROM perfil_usuario ORDER BY nivel_acesso');
  return result.rows;
};


export const deleteUserService = async (id, motivo, usuarioQueDeletou) => {
  return await backupUserBeforeDelete(id, motivo, usuarioQueDeletou);
};


export const backupUserBeforeDelete = async (id, motivo, usuarioQueDeletou) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Iniciando backup do usuário ID:', id);
    
    const userResult = await client.query(`
      SELECT 
        u.*,
        p.descricao_perfil_usuario as nome_perfil,
        p.nivel_acesso
      FROM usuarios u
      LEFT JOIN perfil_usuario p ON u.id_perfil_usuario = p.id_perfil_usuario
      WHERE u.id_usuario = $1
    `, [id]);
    
    if (userResult.rows.length === 0) {
      throw new Error('Usuário não encontrado para backup');
    }
    
    const user = userResult.rows[0];
    console.log('Usuário encontrado para backup:', user.nome_usuario);
    
    const backupResult = await client.query(`
      INSERT INTO usuarios_deletados_backup (
        id_usuario_original, matricula, nome_usuario, setor_usuario, 
        cargo_usuario, email, senha, tel_usuarios, id_perfil_usuario,
        id_aprovador_usuario, fk_chamados_id_chamado, nome_perfil, 
        nivel_acesso, motivo_delecao, usuario_que_deletou
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id_backup
    `, [
      user.id_usuario, user.matricula, user.nome_usuario, user.setor_usuario,
      user.cargo_usuario, user.email, user.senha, user.tel_usuarios,
      user.id_perfil_usuario, user.id_aprovador_usuario, user.fk_chamados_id_chamado,
      user.nome_perfil, user.nivel_acesso, motivo, usuarioQueDeletou
    ]);
    
    console.log('Backup criado com ID:', backupResult.rows[0].id_backup);
    
    const deleteResult = await client.query('DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *', [id]);
    
    if (deleteResult.rows.length === 0) {
      throw new Error('Falha ao deletar usuário');
    }
    
    await client.query('COMMIT');
    
    console.log('Usuário deletado:', deleteResult.rows[0].nome_usuario);
    
    return {
      backup: backupResult.rows[0],
      deletedUser: deleteResult.rows[0]
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro no backup e deleção:', error);
    throw error;
  } finally {
    client.release();
  }
};


export const getDeletedUsersService = async () => {
  try {
    console.log('Buscando usuários deletados...');
    
    const result = await pool.query(`
      SELECT 
        id_backup,
        id_usuario_original,
        matricula,
        nome_usuario,
        email,
        cargo_usuario,
        setor_usuario,
        nome_perfil,
        nivel_acesso,
        motivo_delecao,
        usuario_que_deletou,
        data_delecao,
        status_backup,
        data_restauracao,
        usuario_que_restaurou
      FROM usuarios_deletados_backup
      ORDER BY data_delecao DESC
    `);
    
    console.log('Usuários deletados encontrados:', result.rows.length);
    return result.rows;
    
  } catch (error) {
    console.error('Erro ao buscar usuários deletados:', error);
    throw error;
  }
};


export const restoreUserFromBackup = async (idBackup, usuarioQueRestaurou) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Restaurando usuário do backup ID:', idBackup);
    
    const backupResult = await client.query(`
      SELECT * FROM usuarios_deletados_backup 
      WHERE id_backup = $1 AND status_backup = 'ATIVO'
    `, [idBackup]);
    
    if (backupResult.rows.length === 0) {
      throw new Error('Backup não encontrado ou já foi restaurado');
    }
    
    const backup = backupResult.rows[0];
    
    const existingUser = await client.query('SELECT id_usuario FROM usuarios WHERE email = $1', [backup.email]);
    
    if (existingUser.rows.length > 0) {
      throw new Error('Já existe um usuário ativo com este email');
    }
    
    const restoreResult = await client.query(`
      INSERT INTO usuarios (
        matricula, nome_usuario, setor_usuario, cargo_usuario, 
        email, senha, tel_usuarios, id_perfil_usuario, id_aprovador_usuario,
        fk_chamados_id_chamado
      ) 
      OVERRIDING SYSTEM VALUE
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      backup.matricula,
      backup.nome_usuario, 
      backup.setor_usuario, 
      backup.cargo_usuario,
      backup.email, 
      backup.senha, 
      backup.tel_usuarios, 
      backup.id_perfil_usuario,
      backup.id_aprovador_usuario, 
      backup.fk_chamados_id_chamado
    ]);
    
    await client.query(`
      UPDATE usuarios_deletados_backup 
      SET status_backup = 'RESTAURADO', 
          data_restauracao = NOW(),
          usuario_que_restaurou = $1
      WHERE id_backup = $2
    `, [usuarioQueRestaurou, idBackup]);
    
    await client.query('COMMIT');
    
    console.log('Usuário restaurado com nova matrícula:', restoreResult.rows[0].matricula);
    console.log('Mas mantendo outros dados originais');
    
    return restoreResult.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na restauração:', error);
    throw error;
  } finally {
    client.release();
  }
};
