import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chamadoRoutes from './routes/chamadoRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import estatisticasRoutes from './routes/estatisticasRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/estatisticas', estatisticasRoutes);


// Middleware de tratamento de erros
app.use(errorHandler);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando!', 
    routes: {
      auth: '/api/auth',
      users: '/api/users',
      chamados: '/api/chamados'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(` - Auth: http://localhost:${PORT}/api/auth`);
  console.log(` - Users: http://localhost:${PORT}/api/users`);
  console.log(` - Chamados: http://localhost:${PORT}/api/chamados`); 
});

export default app;
