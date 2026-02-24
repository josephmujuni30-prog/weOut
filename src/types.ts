export enum Category {
  TECH = 'Tech',
  MUSIC = 'Music',
  FOOD = 'Food',
  ART = 'Art',
  SPORTS = 'Sports',
  NETWORKING = 'Networking',
  NIGHTLIFE = 'Nightlife'
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: Category;
  date: string;
  time: string;
  location: string;
  area: string;
  price: number;
  imageUrl: string;
  capacity: number;
  bookedCount: number;
  organizer: string;
  organizerUid?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  interests: Category[];
  preferredAreas: string[];
  role: 'user' | 'organizer';
}

export interface Booking {
  id: string;
  eventId: string;
  userUid: string;
  timestamp: any; // Firebase Timestamp
}