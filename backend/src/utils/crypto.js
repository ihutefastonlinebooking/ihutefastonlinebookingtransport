import bcrypt from 'bcryptjs';
import cryptoLib from 'crypto';
import config from '../config/index.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

export const generateRandomToken = (length = 32) => {
  return cryptoLib.randomBytes(length).toString('hex');
};

export const encryptData = (data) => {
  const algorithm = 'aes-256-gcm';
  const iv = cryptoLib.randomBytes(16);
  const key = cryptoLib.scryptSync(config.encryption.key, 'salt', 32);
  
  const cipher = cryptoLib.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    data: encrypted,
    authTag: authTag.toString('hex'),
  };
};

export const decryptData = (encrypted) => {
  const algorithm = 'aes-256-gcm';
  const key = cryptoLib.scryptSync(config.encryption.key, 'salt', 32);
  
  const decipher = cryptoLib.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encrypted.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

export const generateQRSignature = (data) => {
  const hmac = cryptoLib.createHmac('sha256', config.jwt.secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
};

export const verifyQRSignature = (data, signature) => {
  const expectedSignature = generateQRSignature(data);
  return cryptoLib.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

export default {
  hashPassword,
  comparePassword,
  generateRandomToken,
  encryptData,
  decryptData,
  generateQRSignature,
  verifyQRSignature,
};
