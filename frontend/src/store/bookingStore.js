import { create } from 'zustand';
import { bookingService } from '../services/api';

export const useBookingStore = create((set) => ({
  bookings: [],
  searchResults: [],
  currentBooking: null,
  isLoading: false,
  error: null,

  searchRoutes: async (searchData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingService.searchRoutes(searchData);
      set({ searchResults: response.data || [], isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error?.message, isLoading: false });
      throw error;
    }
  },

  createBooking: async (bookingData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingService.createBooking(bookingData);
      set({ currentBooking: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error?.message, isLoading: false });
      throw error;
    }
  },

  getBooking: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingService.getBooking(bookingId);
      set({ currentBooking: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error?.message, isLoading: false });
      throw error;
    }
  },

  getUserBookings: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingService.getUserBookings(params);
      set({ bookings: response.data || [], isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error?.message, isLoading: false });
      throw error;
    }
  },

  cancelBooking: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingService.cancelBooking(bookingId);
      set(state => ({
        bookings: state.bookings.filter(b => b.id !== bookingId),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error?.message, isLoading: false });
      throw error;
    }
  },

  clearBooking: () => set({ currentBooking: null }),
  clearSearchResults: () => set({ searchResults: [] }),
}));

export default useBookingStore;
