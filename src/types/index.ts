export interface Event {
  id: string;
  title: string;
  price: number;
  area: string;
  imageUrl: string;
  category: string;
  date: string;
  organizerUid: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  role: 'organizer' | 'attendee';
}