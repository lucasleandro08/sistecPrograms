/**
 * @fileoverview Servidor Express Principal - Sistema de Chamados SISTEC
 * 
 * Este módulo configura e inicia o servidor Express com:
 * - Middleware de segurança (CORS, sessões)
 * - Rotas da API (auth, users, chamados, estatísticas)
 * - Documentação Swagger
 * - Health check endpoint
 * - Graceful shutdown
 * - Error handling centralizado
 * 
 * Variáveis de ambiente requeridas:
 * - PORT: Porta do servidor (default: 3001)
 * - SESSION_SECRET: Chave secreta para sessões
 * - DATABASE_URL: Connection string do banco (via db.js)
 * 
 * @module index
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chamadoRoutes from './routes/chamadoRoutes.js';
import estatisticasRoutes from './routes/estatisticasRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import setupSwagger from './swagger/setup.js';

// ==========================================
// CONSTANTES DE CONFIGURAÇÃO
// ==========================================

/**
 * Configuração do servidor
 * @constant {Object}
 */
const SERVER_CONFIG = Object.freeze({
  PORT: process.env.PORT || 3001,
  VERSION: '1.0.0',
  NAME: 'API Sistema de Chamados com IA - Sistec',
  ENV: process.env.NODE_ENV || 'development'
});

/**
 * Origens permitidas para CORS
 * @constant {Array<string>}
 */
const ALLOWED_ORIGINS = Object.freeze([
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174', // Vite alternativo
  'http://127.0.0.1:5173'  // IP local
]);

/**
 * Métodos HTTP permitidos
 * @constant {Array<string>}
 */
const ALLOWED_METHODS = Object.freeze([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS'
]);

/**
 * Headers permitidos
 * @constant {Array<string>}
 */
const ALLOWED_HEADERS = Object.freeze([
  'Content-Type',
  'Authorization',
  'x-user-email'
]);

/**
 * Configuração de sessão
 * @constant {Object}
 */
const SESSION_CONFIG = Object.freeze({
  SECRET: process.env.SESSION_SECRET || 'sua-chave-secreta-super-segura-aqui',
  RESAVE: false,
  SAVE_UNINITIALIZED: false,
  COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 horas
  COOKIE_SECURE: process.env.NODE_ENV === 'production',
  COOKIE_HTTP_ONLY: true
});

/**
 * Rotas da API
 * @constant {Object}
 */
const API_ROUTES = Object.freeze({
  AUTH: '/api/auth',
  USERS: '/api/users',
  CHAMADOS: '/api/chamados',
  ESTATISTICAS: '/api/estatisticas'
});

/**
 * Mensagens de log
 * @constant {Object}
 */
const LOG_MESSAGES = Object.freeze({
  SERVER_STARTING: '🚀 Iniciando servidor...',
  SERVER_RUNNING: '✅ Servidor rodando com sucesso',
  SERVER_SHUTDOWN: '🔄 Encerrando servidor...',
  SHUTDOWN_COMPLETE: '✅ Servidor encerrado com sucesso',
  MIDDLEWARE_LOADED: '✅ Middlewares carregados',
  ROUTES_LOADED: '✅ Rotas configuradas',
  SWAGGER_LOADED: '✅ Documentação Swagger configurada'
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Cria configuração CORS
 * @private
 * @returns {Object} Configuração CORS
 */
const createCorsOptions = () => ({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS
});

/**
 * Cria configuração de sessão
 * @private
 * @returns {Object} Configuração de sessão
 */
const createSessionConfig = () => ({
  secret: SESSION_CONFIG.SECRET,
  resave: SESSION_CONFIG.RESAVE,
  saveUninitialized: SESSION_CONFIG.SAVE_UNINITIALIZED,
  cookie: {
    secure: SESSION_CONFIG.COOKIE_SECURE,
    httpOnly: SESSION_CONFIG.COOKIE_HTTP_ONLY,
    maxAge: SESSION_CONFIG.COOKIE_MAX_AGE
  }
});

/**
 * Cria objeto de informações da API
 * @private
 * @returns {Object} Informações da API
 */
const createApiInfo = () => ({
  message: SERVER_CONFIG.NAME,
  version: SERVER_CONFIG.VERSION,
  environment: SERVER_CONFIG.ENV,
  status: 'running',
  timestamp: new Date().toISOString(),
  documentation: {
    swagger_ui: `http://localhost:${SERVER_CONFIG.PORT}/api-docs`,
    openapi_json: `http://localhost:${SERVER_CONFIG.PORT}/api-docs.json`
  },
  routes: API_ROUTES
});

/**
 * Cria objeto de health check
 * @private
 * @returns {Object} Status de saúde do servidor
 */
const createHealthCheck = () => ({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  version: SERVER_CONFIG.VERSION
});

/**
 * Loga informações de inicialização do servidor
 * @private
 */
const logServerStartup = () => {
  console.log('\n🚀 ========================================');
  console.log(`   ${SERVER_CONFIG.NAME}`);
  console.log(`   Versão: ${SERVER_CONFIG.VERSION}`);
  console.log(`   Ambiente: ${SERVER_CONFIG.ENV}`);
  console.log(`   Porta: ${SERVER_CONFIG.PORT}`);
  console.log('========================================');
  console.log('\n📚 Documentação:');
  console.log(`   Swagger UI: http://localhost:${SERVER_CONFIG.PORT}/api-docs`);
  console.log(`   OpenAPI JSON: http://localhost:${SERVER_CONFIG.PORT}/api-docs.json`);
  console.log('\n📋 Rotas da API:');
  console.log(`   Auth: http://localhost:${SERVER_CONFIG.PORT}${API_ROUTES.AUTH}`);
  console.log(`   Users: http://localhost:${SERVER_CONFIG.PORT}${API_ROUTES.USERS}`);
  console.log(`   Chamados: http://localhost:${SERVER_CONFIG.PORT}${API_ROUTES.CHAMADOS}`);
  console.log(`   Estatísticas: http://localhost:${SERVER_CONFIG.PORT}${API_ROUTES.ESTATISTICAS}`);
  console.log('\n🏥 Endpoints de Monitoramento:');
  console.log(`   Root: http://localhost:${SERVER_CONFIG.PORT}/`);
  console.log(`   Health: http://localhost:${SERVER_CONFIG.PORT}/health`);
  console.log('\n========================================\n');
};

/**
 * Configura middlewares globais
 * @private
 * @param {Express} app - Instância do Express
 */
const setupMiddlewares = (app) => {
  app.use(cors(createCorsOptions()));
  app.use(express.json());
  app.use(session(createSessionConfig()));
  console.log(LOG_MESSAGES.MIDDLEWARE_LOADED);
};

/**
 * Configura rotas da API
 * @private
 * @param {Express} app - Instância do Express
 */
const setupRoutes = (app) => {
  // Rotas da API
  app.use(API_ROUTES.AUTH, authRoutes);
  app.use(API_ROUTES.USERS, userRoutes);
  app.use(API_ROUTES.CHAMADOS, chamadoRoutes);
  app.use(API_ROUTES.ESTATISTICAS, estatisticasRoutes);
  
  console.log(LOG_MESSAGES.ROUTES_LOADED);
};

/**
 * Configura endpoints de monitoramento
 * @private
 * @param {Express} app - Instância do Express
 */
const setupMonitoringEndpoints = (app) => {
  /**
   * GET /
   * Rota raiz com informações da API
   */
  app.get('/', (req, res) => {
    res.json(createApiInfo());
  });

  /**
   * GET /health
   * Health check endpoint para monitoramento
   */
  app.get('/health', (req, res) => {
    res.status(200).json(createHealthCheck());
  });
};

/**
 * Configura error handling
 * @private
 * @param {Express} app - Instância do Express
 */
const setupErrorHandling = (app) => {
  app.use(errorHandler);
};

/**
 * Graceful shutdown handler
 * @private
 * @param {http.Server} server - Servidor HTTP
 */
const gracefulShutdown = (server) => {
  console.log(LOG_MESSAGES.SERVER_SHUTDOWN);
  
  server.close(() => {
    console.log(LOG_MESSAGES.SHUTDOWN_COMPLETE);
    process.exit(0);
  });

  // Força encerramento após 10 segundos
  setTimeout(() => {
    console.error('❌ Forçando encerramento após timeout');
    process.exit(1);
  }, 10000);
};

// ==========================================
// CONFIGURAÇÃO DO APP
// ==========================================

console.log(LOG_MESSAGES.SERVER_STARTING);

const app = express();

// 1. Middlewares globais
setupMiddlewares(app);

// 2. Documentação Swagger
setupSwagger(app);
console.log(LOG_MESSAGES.SWAGGER_LOADED);

// 3. Rotas da API
setupRoutes(app);

// 4. Endpoints de monitoramento
setupMonitoringEndpoints(app);

// 5. Error handling (sempre por último)
setupErrorHandling(app);

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================

/**
 * Servidor HTTP
 * @type {http.Server}
 */
const server = app.listen(SERVER_CONFIG.PORT, () => {
  console.log(LOG_MESSAGES.SERVER_RUNNING);
  logServerStartup();
});

// ==========================================
// GRACEFUL SHUTDOWN HANDLERS
// ==========================================

// SIGTERM (Docker, Kubernetes, etc.)
process.on('SIGTERM', () => gracefulShutdown(server));

// SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown(server));

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown(server);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown(server);
});

// ==========================================
// EXPORTS
// ==========================================

export default app;
