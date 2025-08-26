// Middleware de tratamento de erros personalizado
export const errorHandler = (err, req, res, next) => {
  console.error('Erro capturado:', err.message);
  console.error('Stack trace:', err.stack);
  
  // Status do erro (padrão 500 se não especificado)
  const status = err.status || err.statusCode || 500;
  
  // Mensagem do erro
  const message = err.message || 'Erro interno do servidor';
  
  // Log da requisição que causou o erro
  console.error(`${req.method} ${req.url} - Status: ${status}`);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  
  // Resposta estruturada
  res.status(status).json({
    status,
    message,
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err
    } : undefined,
    timestamp: new Date().toISOString(),
    path: req.url
  });
};

// Middleware para rotas não encontradas (404)
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Rota não encontrada: ${req.method} ${req.url}`);
  error.status = 404;
  next(error);
};

// Middleware para tratar erros assíncronos
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
