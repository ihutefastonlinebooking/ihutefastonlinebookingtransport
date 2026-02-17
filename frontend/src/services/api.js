import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (token) => api.post('/auth/refresh', { refreshToken: token }),
  requestPasswordReset: (email) => api.post('/auth/password-reset-request', { email }),
  resetPassword: (data) => api.post('/auth/password-reset', data),
};

// User services
export const userService = {
  updateProfile: (data) => api.put('/users/profile', data),
  getProfile: () => api.get('/users/me'),
  changePassword: (data) => api.post('/users/change-password', data),
  deleteAccount: (password) => api.delete('/users/account', { data: { password } }),
  getUserStats: () => api.get('/users/stats'),
};

// Booking services
export const bookingService = {
  searchRoutes: (data) => api.post('/bookings/search', data),
  createBooking: (data) => api.post('/bookings', data),
  getBooking: (id) => api.get(`/bookings/${id}`),
  getUserBookings: (params) => api.get('/bookings', { params }),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
};

// Payment services
export const paymentService = {
  initiatePayment: (data) => api.post('/payments/initiate', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getPaymentStatus: (id) => api.get(`/payments/${id}`),
  getPaymentHistory: (params) => api.get('/payments', { params }),
  refundPayment: (id) => api.post(`/payments/${id}/refund`),
};

// Driver services
export const driverService = {
  registerDriver: (data) => api.post('/drivers/register', data),
  getProfile: () => api.get('/drivers/profile'),
  updateStatus: (data) => api.put('/drivers/status', data),
  getTodayTrips: () => api.get('/drivers/trips/today'),
  getStats: () => api.get('/drivers/stats'),
  shareLocation: (data) => api.post('/drivers/location', data),
  getReviews: (params) => api.get('/drivers/reviews', { params }),
};

// Short Trip Services
export const shortTripService = {
  getAvailableRoutes: (params) => api.get('/short-trips/routes', { params }),
  getRouteDetails: (routeId) => api.get(`/short-trips/routes/${routeId}`),
  createBooking: (data) => api.post('/short-trips/bookings', data),
  getUserBookings: (params) => api.get('/short-trips/bookings/my', { params }),
  cancelBooking: (bookingId) => api.delete(`/short-trips/bookings/${bookingId}`),
  getAllBookings: (params) => api.get('/short-trips/bookings', { params }),
};

// iHute Card Services
export const ihuteCardService = {
  createCard: (data) => api.post('/ihute-cards/create', data),
  getCard: () => api.get('/ihute-cards/my'),
  addBalance: (data) => api.post('/ihute-cards/add-balance', data),
  pay: (data) => api.post('/ihute-cards/pay', data),
  getTransactions: (params) => api.get('/ihute-cards/transactions', { params }),
  deactivateCard: () => api.put('/ihute-cards/deactivate'),
  getAllCards: (params) => api.get('/ihute-cards', { params }),
};

// Invoice Services
export const invoiceService = {
  generateInvoice: (bookingId) => api.post(`/invoices/generate/${bookingId}`),
  getInvoicePDF: (invoiceId) => api.get(`/invoices/pdf/${invoiceId}`, { responseType: 'blob' }),
  getUserInvoices: (params) => api.get('/invoices/my', { params }),
  getCompanyInvoices: (params) => api.get('/invoices/company', { params }),
  getAllInvoices: (params) => api.get('/invoices', { params }),
};

// QR Validation Services
export const qrValidationService = {
  scanTicket: (data) => api.post('/qr-validation/scan', data),
  validateTicket: (ticketId) => api.get(`/qr-validation/validate/${ticketId}`),
  getScans: (params) => api.get('/qr-validation/scans', { params }),
};

export default api;
