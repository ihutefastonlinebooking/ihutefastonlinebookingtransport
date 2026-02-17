import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { IhuteCardController } from '../controllers/ihuteCardController.js';

const router = express.Router();
const ihuteCardController = new IhuteCardController();

// All routes require authentication
router.use(authenticate);

// Card Management
router.post('/create', asyncHandler((req, res, next) => ihuteCardController.createCard(req, res, next)));
router.get('/my-cards', asyncHandler((req, res, next) => ihuteCardController.getUserCards(req, res, next)));
router.get('/:cardId', asyncHandler((req, res, next) => ihuteCardController.getCard(req, res, next)));
router.put('/:cardId/topup', asyncHandler((req, res, next) => ihuteCardController.topupCard(req, res, next)));
router.put('/:cardId/deactivate', asyncHandler((req, res, next) => ihuteCardController.deactivateCard(req, res, next)));

// Transaction History
router.get('/:cardId/transactions', asyncHandler((req, res, next) => ihuteCardController.getTransactionHistory(req, res, next)));

// Balance Check
router.get('/:cardId/balance', asyncHandler((req, res, next) => ihuteCardController.getBalance(req, res, next)));

export default router;
