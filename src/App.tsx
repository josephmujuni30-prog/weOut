import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Sun, Moon, MapPin, Calendar, QrCode } from 'lucide-react';
import { simulateMpesaStkPush, sendBookingEmail } from '../services/payment';
import { simulateGoogleLogin, UserInfo } from '../services/auth';
import { Event, Category } from '../types';

// --- TYPES ---
// using Event type from ../types

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  userName: string;
  currentUser: UserInfo | null;
  onSignIn: () => void;
  onSignOut: () => void;
}
interface HomeProps { events: Event[]; currentUser: UserInfo | null; onPublish: (ev: Event) => void; }
interface TicketsProps { bookedEvents: Event[]; onCancel: (id: string) => void; }
interface EventDetailProps { events: Event[]; onBook: (event: Event, method: 'mpesa'|'visa') => void; }

// --- THEME & LAYOUT WRAPPER ---
const Layout: React.FC<LayoutProps> = ({ children, darkMode, setDarkMode, userName, currentUser, onSignIn, onSignOut }) => (
  <div style={{ 
    backgroundColor: darkMode ? '#121212' : '#ffffff', 
    color: darkMode ? '#ffffff' : '#000000',
    minHeight: '100vh', transition: 'all 0.3s'
  }}>
    <header style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#8b5cf6', margin: 0 }}>weOut</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {currentUser ? (
            <button onClick={onSignOut} style={{ background: 'none', border: '1px solid #ccc', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>Sign Out</button>
          ) : (
            <button onClick={onSignIn} style={{ background: 'none', border: '1px solid #ccc', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>Log in</button>
          )}
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            {darkMode ? <Sun /> : <Moon />}
          </button>
        </div>
      </div>
      <p style={{ margin: '10px 0 5px' }}>Habari, <strong>{userName}</strong></p>
      <small style={{ color: '#888' }}>Discover the heartbeat of Nairobi</small>
    </header>
    {children}
    <nav style={navStyles.bottomNav as React.CSSProperties}>
      <Link to="/">Home</Link>
      <Link to="/tickets">Tickets</Link>
      <Link to="/profile">Profile</Link>
    </nav>
  </div>
);
interface EventWizardProps { onPublish: (event: Event) => void; }

type WizardData = { title: string; date: string; time: string; location: string; price: string; category: string; description: string; image: string };

const EventWizard: React.FC<EventWizardProps> = ({ onPublish }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WizardData>({
    title: '', date: '', time: '', location: '', price: '', category: 'Music', description: '', image: ''
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newEvent: Event = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description || '',
      date: formData.date,
      time: formData.time,
      location: formData.location,
      area: '',
      category: formData.category as any,
      price: Number(formData.price) || 0,
      organizer: '',
      imageUrl: formData.image || '',
      capacity: 100,
      bookedCount: 0
    };
    onPublish(newEvent);
  };

  return (
    <div style={styles.container}>
      <h2>Create New Event (Step {step} of 3)</h2>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={styles.wizardStep}>
            <label>Event Title</label>
            <input style={styles.input} value={formData.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Nairobi Jazz Night" />
            <label>Category</label>
            <select style={styles.input} value={formData.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, category: e.target.value})}>
              <option>Music</option><option>Tech</option><option>Food</option>
            </select>
            <button type="button" onClick={next} style={styles.button}>Next</button>
          </div>
        )}

        {step === 2 && (
          <div style={styles.wizardStep}>
            <label>Date & Time</label>
            <input type="date" style={styles.input} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, date: e.target.value})} />
            <input type="time" style={styles.input} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, time: e.target.value})} />
            <label>Location (Physical or Virtual)</label>
            <input style={styles.input} placeholder="Nairobi, Kenya" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})} />
            <div style={{display: 'flex', gap: '10px'}}>
              <button type="button" onClick={back} style={styles.backBtn}>Back</button>
              <button type="button" onClick={next} style={styles.button}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.wizardStep}>
            <label>Pricing (Ksh)</label>
            <input type="number" style={styles.input} placeholder="0 for Free" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, price: e.target.value})} />
            <label>Description</label>
            <textarea style={styles.input} rows={4} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})} />
            <div style={{display: 'flex', gap: '10px'}}>
              <button type="button" onClick={back} style={styles.backBtn}>Back</button>
              <button type="submit" style={styles.button}>Publish Event</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// --- HOME PAGE COMPONENT ---
const Home: React.FC<HomeProps> = ({ events, currentUser, onPublish }) => {
  const navigate = useNavigate();
  const categories = ["All", "Music", "Tech", "Food", "Art", "Nightlife"];
  const filterByWeekend = () => {
    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
    // Logic to filter events falling on these dates
    console.log("Filtering for weekend starting:", nextSaturday.toDateString());
  };
  
  // Local filter state
  const [showFilters, setShowFilters] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const formatToShort = (input: string) => {
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return input;
  };

  const applyFilters = (items: Event[]) => {
    return items.filter(ev => {
      if (maxPrice) {
        const cap = Number(maxPrice) || 0;
        if (ev.price > cap) return false;
      }
      if (date) {
        const desired = formatToShort(date);
        const evDate = formatToShort(ev.date);
        if (evDate !== desired) return false;
      }
      return true;
    });
  };
  
  return (
    <main style={{ padding: '20px', paddingBottom: '80px' }}>
      {/* Search & Filter */}
      {currentUser?.role === 'organizer' && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowWizard(true)} style={styles.button}>Create Event</button>
        </div>
      )}
      <div style={styles.searchContainer}>
        <div style={styles.searchBar}>
          <Search size={18} />
          <input placeholder="Search events..." style={styles.invisibleInput} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilters(s => !s)} style={styles.filterBtn}><Filter size={18} /></button>
          {showFilters && (
            <div style={{ position: 'absolute', right: 0, top: '48px', background: '#fff', border: '1px solid #eee', padding: 12, borderRadius: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', minWidth: 220 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Max Price (Ksh)</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ width: '100%', padding: 8, margin: '6px 0 10px', borderRadius: 6, border: '1px solid #ddd' }} />
              <label style={{ fontSize: 12, fontWeight: 700 }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: 8, margin: '6px 0 10px', borderRadius: 6, border: '1px solid #ddd' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowFilters(false); }} type="button" style={{ ...styles.backBtn, flex: 1 }}>Close</button>
                <button onClick={() => { /* keep panel open to show effect */ }} type="button" style={{ ...styles.button, flex: 1 }}>Apply</button>
              </div>
              <button onClick={() => { setMaxPrice(''); setDate(''); }} type="button" style={{ marginTop: 8, width: '100%', padding: 8, background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Clear</button>
            </div>
          )}
        </div>
      </div>


      {/* Category Slider */}
      <div style={styles.categorySlider as React.CSSProperties}>
        {categories.map(cat => (
          <span key={cat} style={styles.categoryChip}>{cat}</span>
        ))}
      </div>

      {showWizard && (
        <EventWizard onPublish={(ev) => { onPublish(ev); setShowWizard(false);} } />
      )}

      {/* Featured Section */}
      <section>
        <h3>Featured Events</h3>
        <div style={styles.horizontalScroll as React.CSSProperties}>
          {applyFilters(events).slice(0, 3).map(event => (
            <Link key={event.id} to={`/event/${event.id}`} style={styles.featuredCard}>
              <img src={event.imageUrl} alt={event.title} style={styles.cardImg as React.CSSProperties} />
              <h4>{event.title}</h4>
            </Link>
          ))}
        </div>
      </section>

      {/* List Section */}
      <section style={{ marginTop: '20px' }}>
        <h3>Upcoming Events</h3>
        {applyFilters(events).map(event => (
          <Link key={event.id} to={`/event/${event.id}`} style={styles.eventRow}>
            <div style={{ flex: 1 }}>
              <h4>{event.title}</h4>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>{event.date} • {event.location}</p>
            </div>
            <span style={{ color: '#8b5cf6' }}>Ksh {event.price}</span>
          </Link>
        ))}
      </section>
    </main>
  );
};

// --- TICKETS PAGE ---
const Tickets: React.FC<TicketsProps> = ({ bookedEvents, onCancel }) => (
  <div style={{ padding: '20px' }}>
    <h2>My Tickets</h2>
    {bookedEvents.length === 0 ? <p>No bookings yet.</p> : (
      bookedEvents.map(ticket => (
        <div key={ticket.id} style={styles.ticketCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h4 style={{ margin: 0 }}>{ticket.title}</h4>
              <p style={{ margin: '6px 0', color: '#666' }}><Calendar size={14} /> {ticket.date}</p>
              <p style={{ margin: 0, color: '#666' }}><MapPin size={14} /> {ticket.location}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <QrCode size={60} />
              <small>Scan at entry</small>
            </div>
          </div>
          <button onClick={() => onCancel(ticket.id)} style={styles.cancelBtn}>Cancel Booking</button>
        </div>
      ))
    )}
  </div>
);

// --- STYLES ---
const styles = {
  // wizard styles
  container: { padding: '20px' },
  wizardStep: { marginBottom: '20px' },
  input: { width: '100%', padding: '8px', margin: '6px 0', borderRadius: '6px', border: '1px solid #ccc' },
  button: { padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  backBtn: { padding: '10px 20px', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  searchContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  searchBar: { flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '10px', color: '#000' },
  invisibleInput: { border: 'none', background: 'none', marginLeft: '10px', width: '100%', outline: 'none' },
  filterBtn: { padding: '10px', borderRadius: '10px', border: '1px solid #eee', cursor: 'pointer' },
  categorySlider: { display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '10px' },
  categoryChip: { padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '20px', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  horizontalScroll: { display: 'flex', gap: '15px', overflowX: 'auto' },
  featuredCard: { minWidth: '250px', textDecoration: 'none', color: 'inherit' },
  cardImg: { width: '100%', borderRadius: '15px', height: '120px', objectFit: 'cover' },
  eventRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee', textDecoration: 'none', color: 'inherit' },
  ticketCard: { padding: '20px', borderRadius: '15px', border: '2px dashed #8b5cf6', marginBottom: '15px' },
  cancelBtn: { marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px' },
  payBtn: { flex: 1, padding: '12px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  // new styles from user

};

const navStyles = {
  bottomNav: { position: 'fixed', bottom: 0, width: '100%', display: 'flex', justifyContent: 'space-around', padding: '15px', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold' }
};



// --- PROFILE PAGE ---
const Profile: React.FC = () => {
  const [name, setName] = useState('Alex');
  const [photo, setPhoto] = useState('https://via.placeholder.com/80');
  const [bio, setBio] = useState('Enthusiast exploring Nairobi.');
  const [editing, setEditing] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhoto(url);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Welcome, {name}!</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
        <img src={photo} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
        <div style={{ flex: 1 }}>
          {editing ? (
            <>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={styles.input} />
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" style={{ ...styles.input, height: 80 }} />
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setEditing(false)} style={styles.button}>Save</button>
                <button onClick={() => setEditing(false)} style={styles.backBtn}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>{name}</p>
              <p style={{ margin: '8px 0' }}>{bio}</p>
              <button onClick={() => setEditing(true)} style={styles.button}>Edit Profile</button>
            </>
          )}
        </div>
      </div>
      <div style={{ marginTop: 40 }}>
        <button style={styles.filterBtn}>Sign Out</button>
      </div>
    </div>
  );
};

const EventDetail: React.FC<EventDetailProps> = ({ events, onBook }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const event = events.find(e => e.id === id);

  if (!event) return <div style={{padding: '20px'}}>Event not found.</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <img src={event.imageUrl} alt={event.title} style={{ width: '100%', borderRadius: '20px', height: '250px', objectFit: 'cover' }} />
      <h2 style={{ color: '#8b5cf6', marginTop: '20px' }}>{event.title}</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', margin: '20px 0', color: '#666' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={18} /> {event.date}</span>
        {event.time && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sun size={18} /> {event.time}</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={18} /> {event.location}</span>
      </div>

      <p style={{ lineHeight: '1.6' }}>{event.description}</p>

      {/* Payment Selection as per PRD */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '15px' }}>
        <h4>Secure Checkout</h4>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={() => { onBook(event, 'mpesa'); navigate('/tickets'); }} style={styles.payBtn}>Pay with M-Pesa</button>
          <button onClick={() => { onBook(event, 'visa'); navigate('/tickets'); }} style={styles.payBtn}>Pay with Visa</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [bookedEvents, setBookedEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [events, setEvents] = useState<Event[]>([
    { id: '1', title: 'Sol Fest 2026', description: 'The biggest festival in Nairobi.', date: 'Dec 12', time: '', location: 'KICC', area: '', category: Category.MUSIC, price: 3500, organizer: '', imageUrl: 'https://via.placeholder.com/300x150', capacity: 1000, bookedCount: 0 },
    { id: '2', title: 'Nairobi Tech Week', description: 'Connecting the tech ecosystem.', date: 'Mar 05', time: '', location: 'Sarit Centre', area: '', category: Category.TECH, price: 0, organizer: '', imageUrl: 'https://via.placeholder.com/300x150', capacity: 1000, bookedCount: 0 }
  ]);
  const [userEmail, setUserEmail] = useState('alex@example.com');

  const handleBook = async (event: Event, method: 'mpesa'|'visa') => {
    try {
      // simulate payment if mpesa chosen
      if (method === 'mpesa') {
        await simulateMpesaStkPush(event.price, '2547000000');
      }
      // add to bookings (avoiding duplicates)
      setBookedEvents(prev => prev.some(e => e.id === event.id) ? prev : [...prev, event]);
      // notify user via email
      await sendBookingEmail(userEmail, event);
      alert('Booking successful! Confirmation email sent.');
    } catch (err) {
      console.error('Error during booking flow:', err);
      alert('There was a problem completing your booking.');
    }
  };
  
  // login/logout helpers
  const signIn = async () => {
    const info = await simulateGoogleLogin();
    setUser(info);
    setUserEmail(info.email);
  };
  const signOut = () => setUser(null);

  const addEvent = (ev: Event) => {
    // associate organizer uid if available
    const withOrganizer = user ? { ...ev, organizerUid: user.uid, organizer: user.name } : ev;
    setEvents(prev => [...prev, withOrganizer]);
  };

  return (
    <Router>
      <Layout darkMode={darkMode} setDarkMode={setDarkMode} userName={user ? user.name : 'Guest'} currentUser={user} onSignIn={signIn} onSignOut={signOut}>
        <Routes>
          <Route path="/" element={<Home events={events} currentUser={user} onPublish={addEvent} />} />
          <Route path="/tickets" element={<Tickets bookedEvents={bookedEvents} onCancel={(id) => setBookedEvents(bookedEvents.filter(e => e.id !== id))} />} />
          <Route path="/event/:id" element={<EventDetail events={events} onBook={handleBook} />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}