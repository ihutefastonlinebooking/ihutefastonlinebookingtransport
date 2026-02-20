import Joi from 'joi';

// User Validation Schemas
export const userValidationSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().pattern(/^[\d+\-().\s]+$/).required(),
    role: Joi.string().valid('client', 'driver', 'company_admin').required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string().pattern(/^[\d+\-().\s]+$/),
    dateOfBirth: Joi.date(),
    address: Joi.string(),
    city: Joi.string(),
    country: Joi.string(),
  }),
};

// Company Validation Schemas
export const companyValidationSchemas = {
  register: Joi.object({
    name: Joi.string().required(),
    registrationNumber: Joi.string().required(),
    taxId: Joi.string(),
    phone: Joi.string().pattern(/^[\d+\-().\s]+$/).required(),
    email: Joi.string().email().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    website: Joi.string().uri().allow(null),
  }),

  update: Joi.object({
    name: Joi.string(),
    phone: Joi.string().pattern(/^[\d+\-().\s]+$/),
    email: Joi.string().email(),
    address: Joi.string(),
    city: Joi.string(),
    country: Joi.string(),
    website: Joi.string().uri().allow(null),
  }),
};

// Driver Validation Schemas
export const driverValidationSchemas = {
  register: Joi.object({
    licenseNumber: Joi.string().required(),
    licenseExpiryDate: Joi.date().required(),
    vehicleRegistrationNumber: Joi.string().required(),
  }),

  update: Joi.object({
    licenseNumber: Joi.string(),
    licenseExpiryDate: Joi.date(),
    vehicleRegistrationNumber: Joi.string(),
  }),
};

// Route Validation Schemas
export const routeValidationSchemas = {
  create: Joi.object({
    routeType: Joi.string().valid('long_distance', 'short_trip').required(),
    originCity: Joi.string().required(),
    originLatitude: Joi.number().precision(8).allow(null),
    originLongitude: Joi.number().precision(8).allow(null),
    destinationCity: Joi.string().required(),
    destinationLatitude: Joi.number().precision(8).allow(null),
    destinationLongitude: Joi.number().precision(8).allow(null),
    routeName: Joi.string(),
    distanceKm: Joi.number().positive(),
    estimatedDurationMinutes: Joi.number().positive(),
    pricePerSeat: Joi.number().positive().required(),
    discountPercentage: Joi.number().min(0).max(100),
    departureTimes: Joi.array().items(Joi.string()),
  }),

  update: Joi.object({
    routeName: Joi.string(),
    pricePerSeat: Joi.number().positive(),
    discountPercentage: Joi.number().min(0).max(100),
    departureTimes: Joi.array().items(Joi.string()),
    status: Joi.string().valid('active', 'inactive'),
  }),
};

// Booking Validation Schemas
export const bookingValidationSchemas = {
  create: Joi.object({
    routeId: Joi.string().uuid().required(),
    numberOfSeats: Joi.number().positive().required(),
    departureDate: Joi.date().required(),
    passengerNames: Joi.array().items(Joi.string()).required(),
    seatNumbers: Joi.array().items(Joi.number()),
  }),

  search: Joi.object({
    originCity: Joi.string().required(),
    destinationCity: Joi.string().required(),
    departureDate: Joi.date().required(),
    numberOfSeats: Joi.number().positive(),
  }),
};

// Booking Request Validation Schemas
export const bookingRequestValidationSchemas = {
  create: Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\d+\-().\s]+$/).required(),
    originCity: Joi.string().required(),
    destinationCity: Joi.string().required(),
    departureDate: Joi.date().required(),
    returnDate: Joi.date().when('departureDate', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('departureDate')).allow(null),
    }),
    numberOfPassengers: Joi.number().integer().min(1).max(50).required(),
    vehicleType: Joi.string().valid('bus', 'minibus', 'van', 'car').allow(null),
    specialRequirements: Joi.string().max(1000).allow(null, ''),
  }),
};

// Payment Validation Schemas
export const paymentValidationSchemas = {
  createMoMoPayment: Joi.object({
    bookingId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    phone: Joi.string().pattern(/^[\d+\-().\s]+$/).required(),
  }),

  verifyMoMoPayment: Joi.object({
    transactionId: Joi.string().required(),
    bookingId: Joi.string().uuid().required(),
  }),
};

// iHute Card Validation Schemas
export const ihuteCardValidationSchemas = {
  create: Joi.object({
    initialBalance: Joi.number().positive(),
  }),

  recharge: Joi.object({
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string().valid('momo', 'card').required(),
    phone: Joi.string().pattern(/^[\d+\-().\s]+$/).when('paymentMethod', {
      is: 'momo',
      then: Joi.required(),
    }),
  }),
};

// QR Scan Validation Schema
export const qrScanValidationSchema = Joi.object({
  qrCode: Joi.string().required(),
  vehicleId: Joi.string().uuid(),
  latitude: Joi.number(),
  longitude: Joi.number(),
});

// Short Trip Booking Schema
export const shortTripBookingSchema = Joi.object({
  routeId: Joi.string().uuid().required(),
  paymentMethod: Joi.string().valid('card', 'momo', 'ihute_card').required(),
});

export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw new ValidationError('Validation failed', messages);
  }

  return value;
};

export class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export default {
  userValidationSchemas,
  companyValidationSchemas,
  driverValidationSchemas,
  routeValidationSchemas,
  bookingValidationSchemas,
  paymentValidationSchemas,
  ihuteCardValidationSchemas,
  qrScanValidationSchema,
  shortTripBookingSchema,
  validate,
  ValidationError,
};
