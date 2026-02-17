import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Database
  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRY || '7d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  },

  // MoMo Payment
  momo: {
    apiKey: process.env.MOMO_API_KEY,
    apiSecret: process.env.MOMO_API_SECRET,
    apiUrl: process.env.MOMO_API_URL,
  },

  // Twilio SMS
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Security
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  // WebSocket
  websocket: {
    url: process.env.WEBSOCKET_URL || 'http://localhost:5000',
  },
};

// Validate required env vars
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
];

function validateConfig() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(
      `Warning: Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

export default config;
