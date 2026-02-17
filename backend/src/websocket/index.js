import { query } from '../db/connection.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const setupWebSocket = (io) => {
  // Store active connections
  const activeConnections = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication failed'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    activeConnections.set(socket.userId, socket.id);

    // Driver goes online
    socket.on('driver_online', async (data) => {
      try {
        const driverResult = await query(
          'SELECT id FROM drivers WHERE user_id = $1',
          [socket.userId]
        );

        if (driverResult.rows.length > 0) {
          const driverId = driverResult.rows[0].id;
          
          // Update driver status
          await query(
            'UPDATE drivers SET online_status = $1 WHERE id = $2',
            ['online', driverId]
          );

          // Join driver room
          socket.join(`driver_${driverId}`);
          socket.emit('status', { message: 'Driver online' });
        }
      } catch (error) {
        console.error('Driver online error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Driver goes offline
    socket.on('driver_offline', async (data) => {
      try {
        const driverResult = await query(
          'SELECT id FROM drivers WHERE user_id = $1',
          [socket.userId]
        );

        if (driverResult.rows.length > 0) {
          const driverId = driverResult.rows[0].id;
          
          // Update driver status
          await query(
            'UPDATE drivers SET online_status = $1 WHERE id = $2',
            ['offline', driverId]
          );

          socket.emit('status', { message: 'Driver offline' });
        }
      } catch (error) {
        console.error('Driver offline error:', error);
      }
    });

    // Share GPS location
    socket.on('share_location', async (data) => {
      try {
        const { lat, lng, accuracy, speed, heading, bookingId } = data;

        const driverResult = await query(
          'SELECT id FROM drivers WHERE user_id = $1',
          [socket.userId]
        );

        if (driverResult.rows.length > 0) {
          const driverId = driverResult.rows[0].id;

          // Save location
          await query(
            `INSERT INTO driver_locations (driver_id, booking_id, latitude, longitude, accuracy, speed, heading, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [driverId, bookingId, lat, lng, accuracy, speed, heading]
          );

          // Broadcast to booking clients
          io.to(`booking_${bookingId}`).emit('driver_location', {
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            speed: speed,
            heading: heading,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Location sharing error:', error);
      }
    });

    // Client joins booking room
    socket.on('join_booking', (data) => {
      const { bookingId } = data;
      socket.join(`booking_${bookingId}`);
      socket.emit('joined_booking', { bookingId });
    });

    // Client leaves booking room
    socket.on('leave_booking', (data) => {
      const { bookingId } = data;
      socket.leave(`booking_${bookingId}`);
    });

    // Scan QR code event
    socket.on('qr_scanned', async (data) => {
      try {
        const { qrData, bookingId, vehicleId } = data;

        const driverResult = await query(
          'SELECT id FROM drivers WHERE user_id = $1',
          [socket.userId]
        );

        if (driverResult.rows.length === 0) {
          socket.emit('scan_result', { success: false, message: 'Driver not found' });
          return;
        }

        const driverId = driverResult.rows[0].id;

        // Record ticket scan
        const scanResult = await query(
          `INSERT INTO ticket_scans (booking_id, driver_id, vehicle_id, scan_type, status, scanned_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           RETURNING *`,
          [bookingId, driverId, vehicleId, 'boarding', 'success']
        );

        // Update booking status
        await query(
          'UPDATE bookings SET status = $1 WHERE id = $2',
          ['completed', bookingId]
        );

        // Emit success to driver
        socket.emit('scan_result', { success: true, message: 'Ticket scanned successfully' });

        // Notify client
        io.to(`booking_${bookingId}`).emit('ticket_scanned', { scannedAt: new Date() });
      } catch (error) {
        console.error('QR scan error:', error);
        socket.emit('scan_result', { success: false, message: 'Failed to process scan' });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);
      activeConnections.delete(socket.userId);

      // Update driver status if driver
      try {
        await query(
          'UPDATE drivers SET online_status = $1 WHERE user_id = $2',
          ['offline', socket.userId]
        );
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });

  return io;
};

export default setupWebSocket;
