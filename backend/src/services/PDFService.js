import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export class PDFService {
  generateInvoicePDF(invoiceData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', reject);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('HuteFast Transportation', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Smart Transport Booking Platform', { align: 'center' });
        doc.moveDown();

        // Invoice title
        doc.fontSize(14).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice details
        doc.fontSize(10).text(`Invoice Number: ${invoiceData.invoiceNumber}`);
        doc.text(`Invoice Date: ${invoiceData.invoiceDate}`);
        doc.text(`Booking Reference: ${invoiceData.bookingReference}`);
        doc.moveDown();

        // Customer details
        doc.font('Helvetica-Bold').text('BILL TO:');
        doc.font('Helvetica').text(`${invoiceData.customerName}`);
        doc.text(`Email: ${invoiceData.customerEmail}`);
        doc.text(`Phone: ${invoiceData.customerPhone}`);
        doc.moveDown();

        // Trip details
        doc.font('Helvetica-Bold').text('TRIP DETAILS:');
        doc.font('Helvetica').text(`From: ${invoiceData.originCity}`);
        doc.text(`To: ${invoiceData.destinationCity}`);
        doc.text(`Departure: ${invoiceData.departureDate} at ${invoiceData.departureTime}`);
        doc.text(`Seats: ${invoiceData.numberOfSeats}`);
        doc.moveDown();

        // Line items table
        doc.font('Helvetica-Bold').text('CHARGES');
        doc.movDown(0.5);

        const tableTop = doc.y;
        const itemX = 50;
        const quantityX = 280;
        const unitPriceX = 350;
        const amountX = 450;

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Description', itemX, tableTop);
        doc.text('Qty', quantityX, tableTop);
        doc.text('Unit Price', unitPriceX, tableTop);
        doc.text('Amount', amountX, tableTop);

        // Horizontal line
        doc.moveTo(itemX, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Items
        let currentY = tableTop + 25;
        doc.font('Helvetica').fontSize(9);

        doc.text('Transport Fare', itemX, currentY);
        doc.text(invoiceData.numberOfSeats.toString(), quantityX, currentY);
        doc.text(`RWF ${invoiceData.pricePerSeat}`, unitPriceX, currentY);
        doc.text(`RWF ${invoiceData.subtotal}`, amountX, currentY);

        currentY += 20;

        if (invoiceData.discountAmount > 0) {
          doc.text('Discount', itemX, currentY);
          doc.text('-', quantityX, currentY);
          doc.text('-', unitPriceX, currentY);
          doc.text(`-RWF ${invoiceData.discountAmount}`, amountX, currentY);
          currentY += 20;
        }

        if (invoiceData.taxAmount > 0) {
          doc.text('Tax (18%)', itemX, currentY);
          doc.text('-', quantityX, currentY);
          doc.text('-', unitPriceX, currentY);
          doc.text(`RWF ${invoiceData.taxAmount}`, amountX, currentY);
          currentY += 20;
        }

        // Total line
        currentY += 10;
        doc.moveTo(itemX, currentY)
          .lineTo(550, currentY)
          .stroke();

        currentY += 10;
        doc.font('Helvetica-Bold').text('TOTAL:', itemX, currentY);
        doc.text(`RWF ${invoiceData.totalAmount}`, amountX, currentY);

        doc.moveDown(3);

        // Payment terms
        doc.font('Helvetica-Bold').text('PAYMENT TERMS:');
        doc.font('Helvetica').text('Payment via MoMo or Card at booking');

        doc.moveDown();

        // Notes
        if (invoiceData.notes) {
          doc.font('Helvetica-Bold').text('NOTES:');
          doc.font('Helvetica').text(invoiceData.notes);
        }

        doc.moveDown(2);

        // Footer
        doc.fontSize(8).font('Helvetica').text('Thank you for using HuteFast!', { align: 'center' });
        doc.text('info@hutefast.com | www.hutefast.com', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateTicketPDF(ticketData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', reject);

        // Header
        doc.fontSize(16).font('Helvetica-Bold').text('HuteFast Ticket', { align: 'center' });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // QR Code
        if (ticketData.qrCodeUrl) {
          doc.image(ticketData.qrCodeUrl, 200, doc.y, { width: 100, height: 100 });
          doc.moveDown(6);
        }

        // Ticket details
        doc.fontSize(12).font('Helvetica-Bold').text(`Booking Reference: ${ticketData.bookingReference}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Passenger: ${ticketData.passengerName}`);
        doc.text(`From: ${ticketData.originCity}`);
        doc.text(`To: ${ticketData.destinationCity}`);
        doc.text(`Date: ${ticketData.departureDate}`);
        doc.text(`Time: ${ticketData.departureTime}`);
        doc.text(`Seat(s): ${ticketData.seatNumbers?.join(', ')}`);
        doc.text(`Vehicle: ${ticketData.vehicleNumber}`);
        doc.text(`Driver: ${ticketData.driverName}`);
        doc.moveDown();

        // Important notes
        doc.font('Helvetica-Bold').fontSize(10).text('IMPORTANT:');
        doc.font('Helvetica').fontSize(9);
        doc.list([
          'Please arrive 15 minutes before departure',
          'Keep this ticket safe till journey completion',
          'Driver will scan the QR code at boarding',
          'In case of cancellation, cancel at least 2 hours before departure',
        ]);

        doc.moveDown(2);
        doc.fontSize(8).text('Generated: ' + new Date().toLocaleString(), { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default PDFService;
