/**
 * @fileoverview Configuração do Pool de Conexões PostgreSQL (Supabase)
 * 
 * Este módulo configura e exporta o pool de conexões com o banco de dados.
 * Utiliza pg (node-postgres) para conexão com PostgreSQL via Supabase.
 * 
 * Features:
 * - Pool de conexões reutilizáveis para performance
 * - SSL configurado para Supabase
 * - Health check automático na inicialização
 * - Tratamento de erros de conexão
 * - Graceful shutdown do pool
 * 
 * Variáveis de ambiente requeridas:
 * - DATABASE_URL: Connection string completa do Supabase/PostgreSQL
 * 
 * @module config/db
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';

// Carregar variáveis de ambiente
dotenv.config();

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Configuração SSL para conexão com Supabase
 * @constant {Object}
 */
const SSL_CONFIG = Object.freeze({
  rejectUnauthorized: false
});

/**
 * Configurações de timeout e retry
 * @constant {Object}
 */
const CONNECTION_CONFIG = Object.freeze({
  connectionTimeoutMillis: 10000, // 10 segundos
  idleTimeoutMillis: 30000,       // 30 segundos
  max: 20,                        // Máximo de conexões no pool
  min: 2                          // Mínimo de conexões mantidas
});

/**
 * Mensagens de log padronizadas
 * @constant {Object}
 */
const LOG_MESSAGES = Object.freeze({
  DB_URL_CONFIGURED: '✅ [DB CONFIG] DATABASE_URL configurada',
  DB_URL_MISSING: '❌ [DB CONFIG] DATABASE_URL NÃO configurada - verifique .env',
  CONNECTION_SUCCESS: '✅ [DB CONFIG] Conectado ao Supabase com sucesso',
  CONNECTION_ERROR: '❌ [DB CONFIG] Erro ao conectar ao banco de dados',
  POOL_INITIALIZED: '🔧 [DB CONFIG] Pool de conexões inicializado',
  HEALTH_CHECK_START: '🏥 [DB CONFIG] Executando health check...',
  SHUTDOWN_START: '🔄 [DB CONFIG] Encerrando pool de conexões...',
  SHUTDOWN_SUCCESS: '✅ [DB CONFIG] Pool encerrado com sucesso'
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Valida se DATABASE_URL está configurada
 * @private
 * @returns {boolean} True se configurada
 */
const isDatabaseUrlConfigured = () => {
  return !!process.env.DATABASE_URL;
};

/**
 * Executa health check da conexão
 * @private
 * @param {Pool} pool - Pool de conexões
 * @returns {Promise<void>}
 */
const performHealthCheck = async (pool) => {
  console.log(LOG_MESSAGES.HEALTH_CHECK_START);
  
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    const { current_time, pg_version } = result.rows[0];
    
    console.log(LOG_MESSAGES.CONNECTION_SUCCESS);
    console.log('⏰ Timestamp do servidor:', current_time);
    console.log('🐘 Versão PostgreSQL:', pg_version.split(',')[0]);
    
  } catch (err) {
    console.error(LOG_MESSAGES.CONNECTION_ERROR, err.message);
    throw err;
  }
};

/**
 * Configura listeners de eventos do pool
 * @private
 * @param {Pool} pool - Pool de conexões
 */
const setupPoolEventListeners = (pool) => {
  // Evento: Erro em conexão idle
  pool.on('error', (err, client) => {
    console.error('❌ [DB POOL] Erro inesperado em cliente idle:', err.message);
  });

  // Evento: Conexão adquirida do pool
  pool.on('connect', (client) => {
    console.log('🔗 [DB POOL] Nova conexão estabelecida');
  });

  // Evento: Tentativa de conexão
  pool.on('acquire', (client) => {
    console.log('📥 [DB POOL] Cliente adquirido do pool');
  });

  // Evento: Cliente retornado ao pool
  pool.on('remove', (client) => {
    console.log('📤 [DB POOL] Cliente removido do pool');
  });
};

/**
 * Graceful shutdown do pool de conexões
 * @async
 * @returns {Promise<void>}
 */
const shutdownPool = async () => {
  console.log(LOG_MESSAGES.SHUTDOWN_START);
  
  try {
    await pool.end();
    console.log(LOG_MESSAGES.SHUTDOWN_SUCCESS);
  } catch (err) {
    console.error('❌ [DB CONFIG] Erro ao encerrar pool:', err.message);
    throw err;
  }
};

// ==========================================
// CONFIGURAÇÃO DO POOL
// ==========================================

// Validar DATABASE_URL
if (isDatabaseUrlConfigured()) {
  console.log(LOG_MESSAGES.DB_URL_CONFIGURED);
} else {
  console.error(LOG_MESSAGES.DB_URL_MISSING);
  process.exit(1); // Exit se não houver configuração
}

/**
 * Pool de conexões PostgreSQL configurado para Supabase
 * @type {Pool}
 * @exports pool
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: SSL_CONFIG,
  ...CONNECTION_CONFIG
});

console.log(LOG_MESSAGES.POOL_INITIALIZED);

// Configurar event listeners
setupPoolEventListeners(pool);

// Executar health check
performHealthCheck(pool);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

// Handler para SIGTERM (Docker, Kubernetes, etc.)
process.on('SIGTERM', async () => {
  await shutdownPool();
  process.exit(0);
});

// Handler para SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  await shutdownPool();
  process.exit(0);
});

// ==========================================
// EXPORTS
// ==========================================

export default pool;

/**
 * Função para fechar pool manualmente (útil para testes)
 * @async
 * @returns {Promise<void>}
 */
export const closePool = shutdownPool;
