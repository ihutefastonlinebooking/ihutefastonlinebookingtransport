import express from 'express';
import http from 'http';
import { Server as Socketio } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import config from './config/index.js';
import { initializeDatabase } from './db/schema.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { auditLogMiddleware } from './middleware/auditLog.js';
import setupWebSocket from './websocket/index.js';
import { apiResponse } from './utils/response.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import shortTripRoutes from './routes/shortTripRoutes.js';
import ihuteCardRoutes from './routes/ihuteCardRoutes.js';
import qrValidationRoutes from './routes/qrValidationRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Socketio(server, {
  cors: {
    origin: config.frontend.url,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Audit log middleware
app.use(auditLogMiddleware);

// WebSocket setup
setupWebSocket(io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== API ROUTES ====================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/short-trips', shortTripRoutes);
app.use('/api/v1/ihute-cards', ihuteCardRoutes);
app.use('/api/v1/qr-validation', qrValidationRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// ==================== 404 HANDLER ====================
app.use(notFoundHandler);

// ==================== ERROR HANDLER ====================
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✓ Database initialized');

    // Start listening
    server.listen(config.port, () => {
      console.log(`✓ HuteFast Backend running on port ${config.port}`);
      console.log(`✓ Environment: ${config.env}`);
      console.log(`✓ Frontend URL: ${config.frontend.url}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for testing
export { app, server, io };

// Start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
