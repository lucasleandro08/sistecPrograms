import express from 'express';
import cors from 'cors';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chamadoRoutes from './routes/chamadoRoutes.js';
import estatisticasRoutes from './routes/estatisticasRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'sua-chave-secreta-super-segura-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/estatisticas', estatisticasRoutes);

app.use(errorHandler);

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
