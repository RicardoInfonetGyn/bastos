const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const i18nRoutes = require('./routes/i18n');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const usuarioRoutes = require('./routes/usuario');
const opcoesRoutes = require('./routes/opcoes');

const app = express();
const PORT = process.env.PORT || 3080;

// ✅ Corrige o problema com X-Forwarded-For
app.set('trust proxy', 1);

// ✅ Middleware para parsing JSON deve vir ANTES das rotas
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ CORS configurado para produção
const whitelist = [
  'https://cadastro.ntsinformatica.com.br',
  'http://localhost:3008'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Rate limiting global
const limiter = rateLimit({
  windowMs: 35 * 60 * 1000,
  max: 100,
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutos
  max: 30,                  // ⬅️ novo limite
  message: 'Muitas tentativas de login, tente novamente em 1 minutos',
  skipSuccessfulRequests: false
});

app.use(helmet());
app.use(limiter);

// ✅ Aplica rate limit apenas no login
app.use('/api/auth/login', loginLimiter);

// ✅ Rotas (após o JSON parser)
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/usuarios', usuarioRoutes); // <-- Movido para depois do express.json()
app.use('/api', opcoesRoutes);
app.use('/api/i18n', i18nRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Inicializa servidor
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

// Shutdown graceful
process.on('SIGTERM', () => {
  console.log('🛑 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  process.exit(0);
});
