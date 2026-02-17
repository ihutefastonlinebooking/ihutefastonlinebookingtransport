import QRCode from 'qrcode';
import { generateQRSignature } from '../utils/crypto.js';

export class QRCodeService {
  async generateQRCode(data, format = 'image') {
    try {
      // Create signature for tamper-proofing
      const signature = generateQRSignature(data);
      
      const qrData = {
        ...data,
        signature,
        generatedAt: new Date().toISOString(),
      };

      if (format === 'image') {
        const imageData = await QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        return imageData;
      }

      if (format === 'svg') {
        const svgString = await QRCode.toString(JSON.stringify(qrData), {
          errorCorrectionLevel: 'H',
          type: 'image/svg+xml',
          width: 300,
        });
        return svgString;
      }

      if (format === 'json') {
        return qrData;
      }

      return qrData;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateBookingQRCode(bookingId, bookingRef, userId, routeId) {
    const data = {
      type: 'booking',
      bookingId,
      bookingRef,
      userId,
      routeId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    return this.generateQRCode(data, 'image');
  }

  async generateCardQRCode(cardId, userId) {
    const data = {
      type: 'ihute_card',
      cardId,
      userId,
      createdAt: new Date().toISOString(),
    };

    return this.generateQRCode(data, 'image');
  }

  async generateShortTripQRCode(bookingId, routeId, userId) {
    const data = {
      type: 'short_trip',
      bookingId,
      routeId,
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    return this.generateQRCode(data, 'image');
  }

  async verifyQRCode(qrData) {
    try {
      const parsed = JSON.parse(qrData);
      
      // Check expiration
      if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
        return {
          valid: false,
          reason: 'QR code expired',
        };
      }

      // Note: Signature verification should be done in the controller
      return {
        valid: true,
        data: parsed,
      };
    } catch (error) {
      return {
        valid: false,
        reason: 'Invalid QR code format',
      };
    }
  }
}

export default QRCodeService;
