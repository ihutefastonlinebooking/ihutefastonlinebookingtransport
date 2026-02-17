import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../utils/validation.js';
import { apiResponse, errors } from '../utils/response.js';
import { auditLog } from '../middleware/auditLog.js';
import QRCodeService from '../services/QRCodeService.js';

const qrService = new QRCodeService();

export class IhuteCardController {
  // Create new iHute card
  async createCard(req, res, next) {
    try {
      const { initialBalance } = req.body;

      const cardId = uuidv4();
      const cardNumber = `Card_${Date.now()}`.substring(0, 20);

      // Generate QR code for card
      const qrData = {
        type: 'ihute_card',
        cardId,
        cardNumber,
        userId: req.user.userId,
        createdAt: new Date().toISOString(),
      };

      const qrCode = await qrService.generateCardQRCode(cardId, req.user.userId);

      const result = await query(
        `INSERT INTO ihute_cards (id, card_id, user_id, balance, status, qr_code_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          cardId,
          cardNumber,
          req.user.userId,
          initialBalance || 0,
          'active',
          qrCode,
        ]
      );

      await auditLog(req.user.userId, 'IHUTE_CARD_CREATED', 'ihute_card', cardId, null, result.rows[0], 'success');

      res.status(201).json(apiResponse.success(
        {
          cardId: result.rows[0].id,
          cardNumber: result.rows[0].card_id,
          balance: result.rows[0].balance,
          qrCode: result.rows[0].qr_code_data,
          status: 'active',
        },
        'iHute Card created successfully',
        201
      ));
    } catch (error) {
      next(error);
    }
  }

  // Get user's iHute cards
  async getUserCards(req, res, next) {
    try {
      const result = await query(
        `SELECT id, card_id, balance, status, last_used_at, created_at
         FROM ihute_cards
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.userId]
      );

      res.json(apiResponse.success(result.rows, 'Cards retrieved'));
    } catch (error) {
      next(error);
    }
  }

  // Get card details
  async getCardDetails(req, res, next) {
    try {
      const { cardId } = req.params;

      const result = await query(
        'SELECT * FROM ihute_cards WHERE id = $1',
        [cardId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Card not found');
      }

      const card = result.rows[0];

      // Authorization
      if (card.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('Unauthorized access');
      }

      res.json(apiResponse.success(card, 'Card details retrieved'));
    } catch (error) {
      next(error);
    }
  }

  // Recharge card
  async rechargeCard(req, res, next) {
    try {
      const { cardId, amount, paymentMethod, phoneNumber } = req.body;

      const cardResult = await query(
        'SELECT * FROM ihute_cards WHERE id = $1 AND user_id = $2',
        [cardId, req.user.userId]
      );

      if (cardResult.rows.length === 0) {
        throw errors.notFound('Card not found');
      }

      const card = cardResult.rows[0];

      if (card.status !== 'active') {
        throw errors.badRequest('Card is not active');
      }

      // Process payment based on method
      if (paymentMethod === 'momo') {
        // Initiate MoMo payment
        // This would connect to MoMo API
        const transactionId = `MX${Date.now()}`;

        // Create pending transaction record
        await query(
          `INSERT INTO payments (user_id, amount, currency, payment_method, status, transaction_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [req.user.userId, amount, 'RWF', 'momo', 'pending', transactionId]
        );

        return res.json(apiResponse.success(
          { transactionId, statusUrl: `/payments/verify/${transactionId}` },
          'MoMo payment initiated'
        ));
      }

      // Direct card recharge (for testing)
      const newBalance = card.balance + amount;
      const updateResult = await query(
        'UPDATE ihute_cards SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newBalance, cardId]
      );

      // Record transaction
      await query(
        `INSERT INTO card_transactions (card_id, user_id, transaction_type, amount, previous_balance, new_balance, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          cardId,
          req.user.userId,
          'credit',
          amount,
          card.balance,
          newBalance,
          `Card recharge - ${paymentMethod}`,
        ]
      );

      await auditLog(req.user.userId, 'CARD_RECHARGED', 'ihute_card', cardId, null, { amount, newBalance }, 'success');

      res.json(apiResponse.success(
        {
          cardId,
          previousBalance: card.balance,
          newBalance,
          amount,
          transactionType: 'credit',
        },
        'Card recharged successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  // Get card transactions
  async getCardTransactions(req, res, next) {
    try {
      const { cardId, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Verify card ownership
      const cardResult = await query(
        'SELECT user_id FROM ihute_cards WHERE id = $1',
        [cardId]
      );

      if (cardResult.rows.length === 0) {
        throw errors.notFound('Card not found');
      }

      if (cardResult.rows[0].user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('Unauthorized access');
      }

      const result = await query(
        `SELECT * FROM card_transactions
         WHERE card_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [cardId, limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) FROM card_transactions WHERE card_id = $1',
        [cardId]
      );

      res.json(apiResponse.paginated(result.rows, page, limit, parseInt(countResult.rows[0].count)));
    } catch (error) {
      next(error);
    }
  }

  // Block/Unblock card
  async toggleCardStatus(req, res, next) {
    try {
      const { cardId } = req.params;
      const { newStatus } = req.body;

      if (!['active', 'blocked'].includes(newStatus)) {
        throw errors.badRequest('Invalid status');
      }

      const cardResult = await query(
        'SELECT * FROM ihute_cards WHERE id = $1',
        [cardId]
      );

      if (cardResult.rows.length === 0) {
        throw errors.notFound('Card not found');
      }

      const card = cardResult.rows[0];

      if (card.user_id !== req.user.userId && req.user.role !== 'super_admin') {
        throw errors.forbidden('Unauthorized action');
      }

      const result = await query(
        'UPDATE ihute_cards SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newStatus, cardId]
      );

      await auditLog(req.user.userId, 'CARD_STATUS_CHANGED', 'ihute_card', cardId, null, { status: newStatus }, 'success');

      res.json(apiResponse.success(result.rows[0], `Card ${newStatus}`));
    } catch (error) {
      next(error);
    }
  }

  // Get card balance
  async getCardBalance(req, res, next) {
    try {
      const { cardId } = req.params;

      const result = await query(
        'SELECT id, card_id, balance, status FROM ihute_cards WHERE id = $1',
        [cardId]
      );

      if (result.rows.length === 0) {
        throw errors.notFound('Card not found');
      }

      const card = result.rows[0];

      if (card.status !== 'active') {
        throw errors.badRequest('Card is not active');
      }

      res.json(apiResponse.success(
        { cardId: card.id, balance: card.balance },
        'Balance retrieved'
      ));
    } catch (error) {
      next(error);
    }
  }
}

export default IhuteCardController;
