import express from 'express';
import cors from 'cors';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chamadoRoutes from './routes/chamadoRoutes.js';
import estatisticasRoutes from './routes/estatisticasRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Importar configuração do Swagger
import setupSwagger from './swagger/setup.js';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email']
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

// ===== CONFIGURAR SWAGGER (antes das rotas) =====
setupSwagger(app);

// ===== ROTAS DA API =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/estatisticas', estatisticasRoutes);

// Middleware de erro (sempre por último)
app.use(errorHandler);

// Rota raiz com informações da API
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Sistema de Chamados com IA - Sistec', 
    version: '1.0.0',
    documentation: {
      swagger_ui: `http://localhost:${PORT}/api-docs`,
      openapi_json: `http://localhost:${PORT}/api-docs.json`
    },
    routes: {
      auth: '/api/auth',
      users: '/api/users',
      chamados: '/api/chamados',
      estatisticas: '/api/estatisticas'
    }
  });
});

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   Servidor rodando na porta ${PORT}`);
  console.log('========================================');
  console.log('\n📚 Documentação:');
  console.log(`   Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`   OpenAPI JSON: http://localhost:${PORT}/api-docs.json`);
  console.log('\n📋 Rotas da API:');
  console.log(`   Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   Users: http://localhost:${PORT}/api/users`);
  console.log(`   Chamados: http://localhost:${PORT}/api/chamados`);
  console.log(`   Estatísticas: http://localhost:${PORT}/api/estatisticas`);
  console.log('\n========================================\n');
});

export default app;
