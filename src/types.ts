import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'attendee' | 'organizer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  bio?: string;
  interests?: string[];
  socialLinks?: Record<string, string>;
  savedEvents?: string[];
  // Follow system
  following?: string[];       // attendee: list of organizer UIDs they follow
  followers?: string[];       // organizer: list of attendee UIDs who follow them
  followerCount?: number;     // denormalized count for display
}

export interface TicketType {
  name: string;
  price: number; // in KES
  capacity: number;
  sold: number;
}

export interface EventLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  location: EventLocation;
  category: string;
  tags?: string[];
  coverImage?: string;
  ticketTypes: TicketType[];
  organizerId: string;
  organizerName?: string;
  organizerPhoto?: string;
  status: 'draft' | 'published';
  createdAt: Timestamp;
}

export interface Booking {
  id: string;
  eventId: string;
  userId: string;
  organizerId: string;
  ticketType: string;
  quantity: number;
  totalAmount: number; // in KES
  paymentMethod: 'mpesa' | 'visa';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  qrCode?: string;
  reminderEnabled?: boolean;
  reminderSent?: boolean;
  // M-Pesa specific fields (set by server after callback)
  mpesaCheckoutRequestId?: string;
  mpesaReceiptNumber?: string;
  mpesaTransactionDate?: string;
  mpesaPhoneNumber?: string;
  mpesaAmount?: number;
  mpesaResultDesc?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'booking' | 'system' | 'follow';
  read: boolean;
  createdAt: Timestamp;
  eventId?: string;
  fromUserId?: string; // for follow notifications
}

export type EventFormData = Omit<Event, 'id' | 'createdAt' | 'organizerId' | 'organizerName' | 'organizerPhoto'>;
export type BookingFormData = Omit<Booking, 'id' | 'createdAt' | 'qrCode' | 'reminderSent'>;
