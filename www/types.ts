
export enum Category {
  MUSIC = 'Music',
  TECH = 'Tech',
  ART = 'Art',
  FOOD = 'Food',
  BUSINESS = 'Business',
  SPORTS = 'Sports',
  OUTDOORS = 'Outdoors',
  NETWORKING = 'Networking'
}

export type UserRole = 'user' | 'organizer';

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  avatar: string;
  interests: Category[];
  preferredAreas: string[];
  role: UserRole;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  area: string;
  category: Category;
  price: number;
  organizer: string;
  organizerUid?: string;
  imageUrl: string;
  capacity: number;
  bookedCount: number;
}

export interface Booking {
  id: string;
  eventId: string;
  userUid: string;
  userName: string;
  userEmail: string;
  tickets: number;
  totalPrice: number;
  timestamp: any;
}
