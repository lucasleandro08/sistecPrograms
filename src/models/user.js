/**
 * @fileoverview Model de Usuários - Camada de Dados
 * 
 * Este módulo gerencia todas as operações de banco de dados relacionadas a usuários.
 * Implementa princípios SOLID:
 * - Single Responsibility: Cada função tem uma responsabilidade clara
 * - Open/Closed: Extensível via composição
 * - Dependency Inversion: Depende de abstrações (pool de conexão)
 * 
 * @module models/user
 * @requires ../config/db
 * @requires bcrypt
 */

import pool from '../config/db.js';
import bcrypt from 'bcrypt';

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Número de rounds para o salt do bcrypt
 * Quanto maior, mais seguro mas mais lento
 * @constant {number}
 * @private
 */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Status possíveis para registros de backup
 * @constant {Object}
 * @private
 */
const BACKUP_STATUS = Object.freeze({
  ATIVO: 'ATIVO',
  RESTAURADO: 'RESTAURADO'
});

// ============================================================================
// QUERIES SQL - Single Source of Truth (DRY Principle)
// ============================================================================

/**
 * Query base para selecionar usuário com perfil
 * Centraliza a lógica de JOIN para evitar duplicação
 * @constant {string}
 * @private
 */
const SELECT_USER_WITH_PROFILE_SQL = `
  SELECT 
    u.*,
    p.descricao_perfil_usuario as nome_perfil,
    p.nivel_acesso,
    p.descricao_perfil_usuario
  FROM usuarios u
  LEFT JOIN perfil_usuario p ON u.id_perfil_usuario = p.id_perfil_usuario
`;

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS - Helper Functions
// ============================================================================

/**
 * Valida se um resultado de query retornou dados
 * @param {Object} result - Resultado da query
 * @returns {boolean} true se há dados, false caso contrário
 * @private
 */
const hasQueryResults = (result) => {
  return result && result.rows && result.rows.length > 0;
};

/**
 * Extrai o primeiro registro de um resultado de query
 * @param {Object} result - Resultado da query
 * @returns {Object|undefined} Primeiro registro ou undefined
 * @private
 */
const getFirstRow = (result) => {
  return hasQueryResults(result) ? result.rows[0] : undefined;
};

/**
 * Loga informações de debug de forma consistente
 * @param {string} message - Mensagem a ser logada
 * @param {*} data - Dados adicionais (opcional)
 * @private
 */
const logDebug = (message, data = null) => {
  if (data !== null) {
    console.log(`[UserModel] ${message}:`, data);
  } else {
    console.log(`[UserModel] ${message}`);
  }
};

/**
 * Criptografa uma senha usando bcrypt
 * @param {string} senha - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 * @private
 */
const hashPassword = async (senha) => {
  const senhaHash = await bcrypt.hash(senha, BCRYPT_SALT_ROUNDS);
  
  // Log para debug (remover em produção por segurança)
  logDebug('Senha criptografada', { 
    original: senha, 
    hash: senhaHash.substring(0, 20) + '...' 
  });
  
  return senhaHash;
};

// ============================================================================
// FUNÇÕES PÚBLICAS DE CONSULTA - Read Operations
// ============================================================================

/**
 * Busca usuário por email incluindo informações de perfil
 * 
 * Esta é a função principal para autenticação e verificação de usuário.
 * Retorna todos os dados do usuário + informações do perfil via JOIN.
 * 
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|undefined>} Dados do usuário ou undefined se não encontrado
 * 
 * @public
 * @async
 * @example
 * const usuario = await getUserWithProfileService('user@example.com');
 * if (usuario) {
 *   console.log(usuario.nome_perfil); // 'Analista', 'Gestor', etc.
 * }
 */
export const getUserWithProfileService = async (email) => {
  const result = await pool.query(
    `${SELECT_USER_WITH_PROFILE_SQL} WHERE u.email = $1`,
    [email]
  );
  
  const user = getFirstRow(result);
  logDebug('Query getUserWithProfile', user ? user.email : 'não encontrado');
  
  return user;
};

/**
 * Retorna todos os usuários do sistema com seus perfis
 * 
 * Ordenado por ID de usuário de forma crescente.
 * Útil para listagens administrativas.
 * 
 * @returns {Promise<Array<Object>>} Array com todos os usuários
 * 
 * @public
 * @async
 * @example
 * const usuarios = await getAllUsersService();
 * console.log(`Total: ${usuarios.length} usuários`);
 */
export const getAllUsersService = async () => {
  const result = await pool.query(
    `${SELECT_USER_WITH_PROFILE_SQL} ORDER BY u.id_usuario`
  );
  
  logDebug('Total de usuários retornados', result.rows.length);
  return result.rows;
};

/**
 * Busca usuário por ID incluindo informações de perfil
 * 
 * @param {number} id - ID do usuário
 * @returns {Promise<Object|undefined>} Dados do usuário ou undefined
 * 
 * @public
 * @async
 * @example
 * const usuario = await getUserByIdService(123);
 */
export const getUserByIdService = async (id) => {
  const result = await pool.query(
    `${SELECT_USER_WITH_PROFILE_SQL} WHERE u.id_usuario = $1`,
    [id]
  );
  
  return getFirstRow(result);
};

/**
 * Busca usuário por email (apenas tabela usuarios, sem JOIN)
 * 
 * Versão mais leve para verificações rápidas de existência.
 * Use getUserWithProfileService quando precisar de dados de perfil.
 * 
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|undefined>} Dados básicos do usuário
 * 
 * @public
 * @async
 * @example
 * const existe = await getUserByEmailService('user@example.com');
 * if (existe) {
 *   console.log('Usuário já cadastrado');
 * }
 */
export const getUserByEmailService = async (email) => {
  const result = await pool.query(
    'SELECT * FROM usuarios WHERE email = $1',
    [email]
  );
  
  return getFirstRow(result);
};

/**
 * Retorna todos os perfis de usuário disponíveis
 * 
 * Ordenado por nível de acesso (hierarquia).
 * Usado para popular dropdowns de seleção de perfil.
 * 
 * @returns {Promise<Array<Object>>} Array de perfis
 * 
 * @public
 * @async
 * @example
 * const perfis = await getAllPerfilsService();
 * perfis.forEach(p => console.log(p.descricao_perfil_usuario));
 */
export const getAllPerfilsService = async () => {
  const result = await pool.query(
    'SELECT * FROM perfil_usuario ORDER BY nivel_acesso'
  );
  
  return result.rows;
};

// ============================================================================
// FUNÇÕES PÚBLICAS DE MODIFICAÇÃO - Write Operations
// ============================================================================

/**
 * Cria um novo usuário no sistema
 * 
 * A senha é automaticamente criptografada com bcrypt antes de salvar.
 * Todos os parâmetros são obrigatórios exceto matricula_aprovador.
 * 
 * @param {string} nome_usuario - Nome completo do usuário
 * @param {string} setor_usuario - Setor/departamento
 * @param {string} cargo_usuario - Cargo/função
 * @param {string} email - Email único
 * @param {string} senha - Senha em texto plano (será criptografada)
 * @param {string} tel_usuarios - Telefone de contato
 * @param {number} id_perfil_usuario - ID do perfil (1=User, 2=Analista, etc)
 * @param {number|null} matricula_aprovador - Matrícula do aprovador (opcional)
 * @returns {Promise<Object>} Dados do usuário criado (sem a senha)
 * 
 * @public
 * @async
 * @throws {Error} Se email já existir ou dados inválidos
 * 
 * @example
 * const novoUsuario = await createUserService(
 *   'João Silva',
 *   'TI',
 *   'Analista',
 *   'joao@example.com',
 *   'senha123',
 *   '11999999999',
 *   2,
 *   null
 * );
 */
export const createUserService = async (
  nome_usuario,
  setor_usuario,
  cargo_usuario,
  email,
  senha,
  tel_usuarios,
  id_perfil_usuario,
  matricula_aprovador
) => {
  // Criptografa a senha antes de salvar
  const senhaHash = await hashPassword(senha);
  
  const result = await pool.query(
    `INSERT INTO usuarios (
      nome_usuario, setor_usuario, cargo_usuario, email, senha, 
      tel_usuarios, id_perfil_usuario, id_aprovador_usuario
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING *`,
    [
      nome_usuario,
      setor_usuario,
      cargo_usuario,
      email,
      senhaHash,
      tel_usuarios,
      id_perfil_usuario,
      matricula_aprovador
    ]
  );
  
  return getFirstRow(result);
};

/**
 * Atualiza dados de um usuário existente
 * 
 * NOTA: Esta função NÃO atualiza a senha. Use uma função específica para isso.
 * Princípio: Interface Segregation (funções específicas para cada operação).
 * 
 * @param {number} id - ID do usuário a ser atualizado
 * @param {string} nome_usuario - Novo nome
 * @param {string} setor_usuario - Novo setor
 * @param {string} cargo_usuario - Novo cargo
 * @param {string} email - Novo email
 * @param {string} tel_usuarios - Novo telefone
 * @param {number} id_perfil_usuario - Novo perfil
 * @returns {Promise<Object>} Dados atualizados do usuário
 * 
 * @public
 * @async
 * @throws {Error} Se usuário não existir
 * 
 * @example
 * const atualizado = await updateUserService(
 *   123, 'João Silva Jr', 'TI', 'Gerente', 
 *   'joao@example.com', '11988888888', 3
 * );
 */
export const updateUserService = async (
  id,
  nome_usuario,
  setor_usuario,
  cargo_usuario,
  email,
  tel_usuarios,
  id_perfil_usuario
) => {
  const result = await pool.query(
    `UPDATE usuarios 
    SET nome_usuario = $1, setor_usuario = $2, cargo_usuario = $3, 
        email = $4, tel_usuarios = $5, id_perfil_usuario = $6 
    WHERE id_usuario = $7 
    RETURNING *`,
    [nome_usuario, setor_usuario, cargo_usuario, email, tel_usuarios, id_perfil_usuario, id]
  );
  
  return getFirstRow(result);
};

// ============================================================================
// FUNÇÕES DE DELEÇÃO E BACKUP - Soft Delete Pattern
// ============================================================================

/**
 * Deleta um usuário com backup automático
 * 
 * Implementa o padrão Soft Delete com auditoria completa.
 * Antes de deletar, cria um backup completo dos dados na tabela de backup.
 * 
 * @param {number} id - ID do usuário a ser deletado
 * @param {string} motivo - Motivo da deleção (auditoria)
 * @param {string} usuarioQueDeletou - Nome/email de quem executou a ação
 * @returns {Promise<Object>} Objeto com dados do backup e usuário deletado
 * 
 * @public
 * @async
 * @throws {Error} Se usuário não existir ou ocorrer erro na transação
 * 
 * @example
 * const resultado = await deleteUserService(
 *   123, 
 *   'Desligamento', 
 *   'admin@example.com'
 * );
 * console.log('Backup ID:', resultado.backup.id_backup);
 */
export const deleteUserService = async (id, motivo, usuarioQueDeletou) => {
  return await backupUserBeforeDelete(id, motivo, usuarioQueDeletou);
};

/**
 * Realiza backup e deleção de usuário em transação atômica
 * 
 * Esta função garante que ou ambas as operações (backup + delete) 
 * acontecem com sucesso, ou nenhuma delas acontece (atomicidade).
 * 
 * Fluxo:
 * 1. Inicia transação
 * 2. Busca dados completos do usuário
 * 3. Cria registro na tabela de backup
 * 4. Deleta usuário da tabela principal
 * 5. Commit (ou rollback em caso de erro)
 * 
 * @param {number} id - ID do usuário
 * @param {string} motivo - Motivo da deleção
 * @param {string} usuarioQueDeletou - Identificação de quem deletou
 * @returns {Promise<Object>} { backup, deletedUser }
 * 
 * @private
 * @async
 * @throws {Error} Se usuário não existir ou falhar transação
 */
export const backupUserBeforeDelete = async (id, motivo, usuarioQueDeletou) => {
  const client = await pool.connect();
  
  try {
    // Inicia transação para garantir atomicidade
    await client.query('BEGIN');
    
    logDebug('Iniciando backup do usuário ID', id);
    
    // Busca dados completos do usuário (com perfil)
    const userResult = await client.query(
      `${SELECT_USER_WITH_PROFILE_SQL} WHERE u.id_usuario = $1`,
      [id]
    );
    
    // Guard Clause: Valida existência do usuário
    if (!hasQueryResults(userResult)) {
      throw new Error(`Usuário ID ${id} não encontrado para backup`);
    }
    
    const user = userResult.rows[0];
    logDebug('Usuário encontrado para backup', user.nome_usuario);
    
    // Cria registro de backup com todos os dados + auditoria
    const backupResult = await client.query(
      `INSERT INTO usuarios_deletados_backup (
        id_usuario_original, matricula, nome_usuario, setor_usuario, 
        cargo_usuario, email, senha, tel_usuarios, id_perfil_usuario,
        id_aprovador_usuario, fk_chamados_id_chamado, nome_perfil, 
        nivel_acesso, motivo_delecao, usuario_que_deletou
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id_backup`,
      [
        user.id_usuario,
        user.matricula,
        user.nome_usuario,
        user.setor_usuario,
        user.cargo_usuario,
        user.email,
        user.senha,
        user.tel_usuarios,
        user.id_perfil_usuario,
        user.id_aprovador_usuario,
        user.fk_chamados_id_chamado,
        user.nome_perfil,
        user.nivel_acesso,
        motivo,
        usuarioQueDeletou
      ]
    );
    
    const backupId = backupResult.rows[0].id_backup;
    logDebug('Backup criado com ID', backupId);
    
    // Deleta usuário da tabela principal
    const deleteResult = await client.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *',
      [id]
    );
    
    // Guard Clause: Valida que a deleção ocorreu
    if (!hasQueryResults(deleteResult)) {
      throw new Error('Falha ao deletar usuário após backup');
    }
    
    // Commit da transação
    await client.query('COMMIT');
    
    logDebug('Usuário deletado com sucesso', deleteResult.rows[0].nome_usuario);
    
    return {
      backup: backupResult.rows[0],
      deletedUser: deleteResult.rows[0]
    };
    
  } catch (error) {
    // Rollback em caso de qualquer erro
    await client.query('ROLLBACK');
    logDebug('Erro no backup e deleção', error.message);
    throw error;
  } finally {
    // Sempre libera a conexão
    client.release();
  }
};

// ============================================================================
// FUNÇÕES DE RECUPERAÇÃO E RESTAURAÇÃO
// ============================================================================

/**
 * Lista todos os usuários deletados (backups)
 * 
 * Retorna apenas os campos relevantes para exibição administrativa.
 * Ordenado por data de deleção (mais recentes primeiro).
 * 
 * @returns {Promise<Array<Object>>} Array de backups
 * 
 * @public
 * @async
 * @throws {Error} Se ocorrer erro na consulta
 * 
 * @example
 * const deletados = await getDeletedUsersService();
 * deletados.forEach(d => {
 *   console.log(`${d.nome_usuario} - deletado em ${d.data_delecao}`);
 * });
 */
export const getDeletedUsersService = async () => {
  try {
    logDebug('Buscando usuários deletados');
    
    const result = await pool.query(
      `SELECT 
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
      ORDER BY data_delecao DESC`
    );
    
    logDebug('Usuários deletados encontrados', result.rows.length);
    return result.rows;
    
  } catch (error) {
    logDebug('Erro ao buscar usuários deletados', error.message);
    throw error;
  }
};

/**
 * Restaura um usuário deletado a partir do backup
 * 
 * Recria o usuário na tabela principal e marca o backup como RESTAURADO.
 * Valida que o email não está em uso antes de restaurar.
 * 
 * NOTA: O usuário receberá uma nova matrícula (ID), mas mantém todos
 * os outros dados originais incluindo a senha criptografada.
 * 
 * Fluxo:
 * 1. Inicia transação
 * 2. Busca backup ATIVO
 * 3. Valida que email não está em uso
 * 4. Recria usuário na tabela principal
 * 5. Marca backup como RESTAURADO
 * 6. Commit
 * 
 * @param {number} idBackup - ID do registro de backup
 * @param {string} usuarioQueRestaurou - Identificação de quem restaurou
 * @returns {Promise<Object>} Dados do usuário restaurado
 * 
 * @public
 * @async
 * @throws {Error} Se backup não existir, já foi restaurado ou email duplicado
 * 
 * @example
 * const restaurado = await restoreUserFromBackup(456, 'admin@example.com');
 * console.log('Nova matrícula:', restaurado.matricula);
 */
export const restoreUserFromBackup = async (idBackup, usuarioQueRestaurou) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    logDebug('Restaurando usuário do backup ID', idBackup);
    
    // Busca backup ativo (não restaurado)
    const backupResult = await client.query(
      `SELECT * FROM usuarios_deletados_backup 
      WHERE id_backup = $1 AND status_backup = $2`,
      [idBackup, BACKUP_STATUS.ATIVO]
    );
    
    // Guard Clause: Valida existência do backup
    if (!hasQueryResults(backupResult)) {
      throw new Error('Backup não encontrado ou já foi restaurado');
    }
    
    const backup = backupResult.rows[0];
    
    // Guard Clause: Valida que email não está em uso
    const existingUser = await client.query(
      'SELECT id_usuario FROM usuarios WHERE email = $1',
      [backup.email]
    );
    
    if (hasQueryResults(existingUser)) {
      throw new Error(`Já existe um usuário ativo com o email: ${backup.email}`);
    }
    
    // Recria usuário com todos os dados originais
    const restoreResult = await client.query(
      `INSERT INTO usuarios (
        matricula, nome_usuario, setor_usuario, cargo_usuario, 
        email, senha, tel_usuarios, id_perfil_usuario, id_aprovador_usuario,
        fk_chamados_id_chamado
      ) 
      OVERRIDING SYSTEM VALUE
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
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
      ]
    );
    
    // Marca backup como restaurado
    await client.query(
      `UPDATE usuarios_deletados_backup 
      SET status_backup = $1, 
          data_restauracao = NOW(),
          usuario_que_restaurou = $2
      WHERE id_backup = $3`,
      [BACKUP_STATUS.RESTAURADO, usuarioQueRestaurou, idBackup]
    );
    
    await client.query('COMMIT');
    
    const restoredUser = restoreResult.rows[0];
    logDebug('Usuário restaurado', {
      matricula: restoredUser.matricula,
      nome: restoredUser.nome_usuario
    });
    
    return restoredUser;
    
  } catch (error) {
    await client.query('ROLLBACK');
    logDebug('Erro na restauração', error.message);
    throw error;
  } finally {
    client.release();
  }
};
