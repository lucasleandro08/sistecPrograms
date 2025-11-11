/**
 * @fileoverview Middleware de Tratamento de Erros
 * 
 * Este módulo centraliza o tratamento de erros da aplicação:
 * - Captura erros síncronos e assíncronos
 * - Formata respostas de erro consistentes
 * - Loga erros para debug
 * - Trata rotas não encontradas (404)
 * 
 * Princípios aplicados:
 * - Single Responsibility: Cada middleware trata um tipo de erro
 * - Keep It Simple: Lógica clara e direta
 * - Fail-Safe: Sempre retorna resposta válida
 * - Security: Não expõe detalhes em produção
 * 
 * @module middleware/errorHandler
 */

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Status HTTP padrão quando não especificado
 * @constant {number}
 * @private
 */
const DEFAULT_ERROR_STATUS = 500;

/**
 * Mensagem padrão quando não especificada
 * @constant {string}
 * @private
 */
const DEFAULT_ERROR_MESSAGE = 'Erro interno do servidor';

/**
 * Status para rota não encontrada
 * @constant {number}
 * @private
 */
const NOT_FOUND_STATUS = 404;

/**
 * Ambientes onde detalhes de erro devem ser expostos
 * @constant {Array<string>}
 * @private
 */
const DEBUG_ENVIRONMENTS = ['development', 'dev', 'local'];

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Verifica se está em ambiente de desenvolvimento
 * Em dev, pode expor stack trace e detalhes para debug
 * 
 * @returns {boolean} true se é ambiente de desenvolvimento
 * @private
 */
const isDevelopmentEnvironment = () => {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  return DEBUG_ENVIRONMENTS.includes(env);
};

/**
 * Extrai status HTTP do erro
 * Suporta múltiplas propriedades (status, statusCode)
 * 
 * @param {Error} err - Objeto de erro
 * @returns {number} Status HTTP
 * @private
 */
const extractErrorStatus = (err) => {
  return err.status || err.statusCode || DEFAULT_ERROR_STATUS;
};

/**
 * Extrai mensagem de erro segura
 * Remove informações sensíveis em produção
 * 
 * @param {Error} err - Objeto de erro
 * @returns {string} Mensagem de erro
 * @private
 */
const extractErrorMessage = (err) => {
  return err.message || DEFAULT_ERROR_MESSAGE;
};

/**
 * Cria objeto de detalhes de erro (apenas para dev)
 * Inclui stack trace e informações completas do erro
 * 
 * @param {Error} err - Objeto de erro
 * @returns {Object|undefined} Detalhes ou undefined
 * @private
 */
const createErrorDetails = (err) => {
  if (!isDevelopmentEnvironment()) {
    return undefined;
  }

  return {
    stack: err.stack,
    name: err.name,
    details: err
  };
};

/**
 * Loga informações do erro de forma estruturada
 * Facilita debug e monitoramento
 * 
 * @param {Error} err - Objeto de erro
 * @param {Object} req - Request do Express
 * @param {number} status - Status HTTP
 * @private
 */
const logError = (err, req, status) => {
  const timestamp = new Date().toISOString();
  
  console.error('═══════════════════════════════════════════════════════');
  console.error(`[ErrorHandler] ${timestamp}`);
  console.error(`Request: ${req.method} ${req.url}`);
  console.error(`Status: ${status}`);
  console.error(`Message: ${err.message}`);
  
  // Informações adicionais da requisição
  if (req.user) {
    console.error(`User: ${req.user.email || req.user.id_usuario}`);
  }
  
  if (req.ip) {
    console.error(`IP: ${req.ip}`);
  }
  
  // Stack trace (apenas em dev ou para erros 500)
  if (isDevelopmentEnvironment() || status >= 500) {
    console.error('Stack:', err.stack);
  }
  
  console.error('═══════════════════════════════════════════════════════');
};

/**
 * Cria resposta de erro padronizada
 * Formato consistente em toda a aplicação
 * 
 * @param {number} status - Status HTTP
 * @param {string} message - Mensagem de erro
 * @param {string} path - URL da requisição
 * @param {Object} errorDetails - Detalhes do erro (opcional, apenas dev)
 * @returns {Object} Resposta formatada
 * @private
 */
const createErrorResponse = (status, message, path, errorDetails = undefined) => {
  return {
    success: false,
    status,
    message,
    error: errorDetails,
    timestamp: new Date().toISOString(),
    path
  };
};

// ============================================================================
// MIDDLEWARES PÚBLICOS
// ============================================================================

/**
 * Middleware principal de tratamento de erros
 * 
 * Captura todos os erros lançados na aplicação e formata uma resposta
 * consistente. Este middleware deve ser registrado POR ÚLTIMO na cadeia
 * de middlewares do Express.
 * 
 * Funcionalidades:
 * - Extrai status e mensagem do erro
 * - Loga informações para debug
 * - Formata resposta padronizada
 * - Protege informações sensíveis em produção
 * - Inclui stack trace apenas em desenvolvimento
 * 
 * Comportamento por ambiente:
 * - Development: Expõe stack trace e detalhes completos
 * - Production: Apenas status e mensagem genérica
 * 
 * @param {Error} err - Erro capturado
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware (não usado, mas necessário para Express)
 * 
 * @public
 * @middleware
 * 
 * @example
 * // No app.js / index.js (ÚLTIMO middleware)
 * app.use(errorHandler);
 * 
 * @example
 * // Em um controller
 * export const myController = async (req, res, next) => {
 *   try {
 *     // código...
 *   } catch (error) {
 *     next(error); // Será capturado pelo errorHandler
 *   }
 * };
 */
export const errorHandler = (err, req, res, next) => {
  // Extrai informações do erro
  const status = extractErrorStatus(err);
  const message = extractErrorMessage(err);
  const errorDetails = createErrorDetails(err);
  
  // Loga o erro para monitoramento
  logError(err, req, status);
  
  // Cria resposta padronizada
  const response = createErrorResponse(
    status,
    message,
    req.url,
    errorDetails
  );
  
  // Envia resposta
  res.status(status).json(response);
};

/**
 * Middleware para capturar rotas não encontradas (404)
 * 
 * Este middleware deve ser registrado ANTES do errorHandler,
 * mas DEPOIS de todas as rotas válidas. Ele captura qualquer
 * requisição que não foi tratada por nenhuma rota anterior.
 * 
 * Cria um erro 404 e passa para o errorHandler
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware (errorHandler)
 * 
 * @public
 * @middleware
 * 
 * @example
 * // No app.js / index.js (ANTES do errorHandler)
 * app.use('/api/users', userRoutes);
 * app.use('/api/chamados', chamadoRoutes);
 * // ... outras rotas
 * app.use(notFoundHandler); // Captura 404
 * app.use(errorHandler);    // Trata todos os erros
 */
export const notFoundHandler = (req, res, next) => {
  // Cria erro customizado para rota não encontrada
  const error = new Error(`Rota não encontrada: ${req.method} ${req.url}`);
  error.status = NOT_FOUND_STATUS;
  
  // Passa erro para o errorHandler
  next(error);
};

/**
 * Wrapper para funções assíncronas em rotas
 * 
 * O Express não captura automaticamente erros de funções async/await.
 * Este wrapper garante que erros assíncronos sejam capturados e
 * passados para o errorHandler.
 * 
 * Elimina a necessidade de try/catch em cada função async
 * 
 * @param {Function} fn - Função assíncrona do controller/middleware
 * @returns {Function} Função wrapped que captura erros
 * 
 * @public
 * 
 * @example
 * // Sem asyncHandler (precisa de try/catch)
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await getUsersService();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * 
 * @example
 * // Com asyncHandler (sem try/catch)
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersService();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Resolve a promise e captura qualquer erro
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
