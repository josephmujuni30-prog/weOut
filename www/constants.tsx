
import { Category, Event } from './types';

export const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Nairobi Tech Week 2024',
    description: 'The largest gathering of tech enthusiasts, startups, and innovators in East Africa. Join us for keynote speeches, workshops, and networking.',
    date: '2024-11-15',
    time: '09:00 AM',
    location: 'Sarit Expo Centre',
    area: 'Westlands',
    category: Category.TECH,
    price: 1500,
    organizer: 'Nairobi Tech Hub',
    imageUrl: 'https://images.unsplash.com/photo-1540575861501-7ad060e39fe1?auto=format&fit=crop&q=80&w=800',
    capacity: 500,
    bookedCount: 124
  },
  {
    id: '2',
    title: 'Kasarani Gospel Concert',
    description: 'An evening of praise and worship featuring top gospel artists from across Kenya. A family-friendly event for all.',
    date: '2024-11-20',
    time: '04:00 PM',
    location: 'Kasarani Stadium',
    area: 'Kasarani',
    category: Category.MUSIC,
    price: 500,
    organizer: 'Faith Productions',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    capacity: 20000,
    bookedCount: 4500
  },
  {
    id: '3',
    title: 'Karen Farmers Market',
    description: 'Discover the freshest organic produce, artisanal cheeses, and handmade crafts in the heart of Karen. Support local farmers!',
    date: '2024-11-10',
    time: '08:00 AM',
    location: 'Karen Blixen Museum Grounds',
    area: 'Karen',
    category: Category.FOOD,
    price: 0,
    organizer: 'Karen Community Board',
    imageUrl: 'https://images.unsplash.com/photo-1488459711635-de52563d047b?auto=format&fit=crop&q=80&w=800',
    capacity: 300,
    bookedCount: 45
  },
  {
    id: '4',
    title: 'Art at Alchemist',
    description: 'Live painting sessions, art exhibitions, and soulful music at the heart of Westlands nightlife. Join the creative revolution.',
    date: '2024-11-18',
    time: '07:00 PM',
    location: 'The Alchemist Bar',
    area: 'Westlands',
    category: Category.ART,
    price: 1000,
    organizer: 'Creative Vibes Kenya',
    imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecea8f82?auto=format&fit=crop&q=80&w=800',
    capacity: 150,
    bookedCount: 88
  },
  {
    id: '5',
    title: 'Nairobi National Park Hike',
    description: 'Experience the wild on foot. A guided nature walk through the only park within a city. Spot giraffes, zebras, and diverse birdlife.',
    date: '2024-11-12',
    time: '06:30 AM',
    location: 'Nairobi National Park',
    area: 'Langata',
    category: Category.OUTDOORS,
    price: 2500,
    organizer: 'Wild Walks KE',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
    capacity: 30,
    bookedCount: 15
  }
];

export const NAIROBI_AREAS = [
  'Westlands',
  'Karen',
  'Langata',
  'Kasarani',
  'Kilimani',
  'Lavington',
  'Nairobi CBD',
  'Parklands',
  'Embakasi',
  'Gigiri',
  'Runda'
];
