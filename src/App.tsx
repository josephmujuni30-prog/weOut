import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate
} from "react-router-dom";
import { Search, MapPin, Calendar, QrCode, Filter, User, Plus } from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from "firebase/auth";
import { Event, Category } from "../types";

// Paste the API key from Firebase Console here:
const FIREBASE_API_KEY = "PASTE_YOUR_API_KEY_HERE";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "event-nine-gamma.firebaseapp.com",
  projectId: "event-nine-gamma",
  storageBucket: "event-nine-gamma.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:12345:web:abc123"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

// --- LOCAL TYPES ---
interface UserInfo {
  uid: string;
  name: string;
  email: string;
  role?: string;
}

type LayoutProps = {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  userName?: string;
  currentUser?: UserInfo | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

type HomeProps = { events: Event[]; currentUser: UserInfo | null; onPublish: (e: Event) => void };
type TicketsProps = { bookedEvents: Event[]; onCancel: (id: string) => void };
type EventDetailProps = { events: Event[]; onBook: (ev: Event, method: "mpesa" | "visa") => void };

// --- LAYOUT ---
const Layout: React.FC<LayoutProps> = ({ children, darkMode }) => (
  <div
    style={{
      backgroundColor: darkMode ? "#121212" : "#ffffff",
      color: darkMode ? "#ffffff" : "#000000",
      minHeight: "100vh",
      transition: "all 0.3s"
    }}
  >
    {children}
  </div>
);

// --- EVENT WIZARD (minimal) ---
const EventWizard: React.FC<{ onPublish: (event: Event) => void }> = ({ onPublish }) => {
  const [title, setTitle] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onPublish({
      id: Date.now().toString(),
      title: title || "Untitled",
      description: "",
      date: "",
      time: "",
      location: "",
      area: "",
      category: Category.MUSIC,
      price: 0,
      organizer: "",
      imageUrl: "",
      capacity: 100,
      bookedCount: 0
    });
    setTitle("");
  };
  return (
    <form onSubmit={submit} style={{ padding: 16 }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
      <button type="submit">Publish</button>
    </form>
  );
};

// --- HOME (minimal) ---
const Home: React.FC<HomeProps> = ({ events, currentUser, onPublish }) => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Events</h2>
      {events.map((ev) => (
        <div key={ev.id}>
          <Link to={`/event/${ev.id}`}>{ev.title}</Link>
        </div>
      ))}
      <EventWizard onPublish={onPublish} />
    </div>
  );
};

// --- TICKETS (fixed ternary) ---
const Tickets: React.FC<TicketsProps> = ({ bookedEvents, onCancel }) => (
  <div style={{ padding: "20px" }}>
    {bookedEvents.length === 0 ? (
      <p>No tickets booked.</p>
    ) : (
      bookedEvents.map((ticket) => (
        <div key={ticket.id} style={{ marginBottom: 12 }}>
          <strong>{ticket.title}</strong>
          <div>
            <button onClick={() => onCancel(ticket.id)}>Cancel</button>
          </div>
        </div>
      ))
    )}
  </div>
);

// --- PROFILE (minimal) ---
const Profile: React.FC = () => {
  const [name] = useState("Alex");
  return (
    <div style={{ padding: 20 }}>
      <h3>{name}</h3>
      <p>Profile placeholder</p>
    </div>
  );
};

// --- EVENT DETAIL (fixed missing return) ---
const EventDetail: React.FC<EventDetailProps> = ({ events, onBook }) => {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);
  if (!event) return <div style={{ padding: 20 }}>Event not found</div>;
  return (
    <div style={{ padding: 20 }}>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <button onClick={() => onBook(event, "mpesa")}>Book (MPESA)</button>
    </div>
  );
};

// --- STYLES (kept) ---
const styles = {
  container: { padding: "20px" }
};

const navStyles = {
  bottomNav: {
    position: "fixed",
    bottom: 0,
    width: "100%",
    display: "flex",
    justifyContent: "space-around",
    padding: "15px",
    backgroundColor: "#8b5cf6",
    color: "white",
    fontWeight: "bold"
  }
};

// --- APP (complete return + real auth helpers) ---
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [bookedEvents, setBookedEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Sol Fest 2026",
      description: "The biggest festival in Nairobi.",
      date: "Dec 12",
      time: "",
      location: "KICC",
      area: "",
      category: Category.MUSIC,
      price: 3500,
      organizer: "",
      imageUrl: "https://via.placeholder.com/300x150",
      capacity: 1000,
      bookedCount: 0
    }
  ]);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      setUser({
        uid: u.uid,
        name: u.displayName || "",
        email: u.email || "",
        role: "attendee"
      });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed");
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed");
    }
  };

  const handlePublish = (ev: Event) => setEvents((s) => [ev, ...s]);
  const handleBook = (ev: Event, method: "mpesa" | "visa") => {
    setBookedEvents((s) => [...s, ev]);
  };
  const handleCancel = (id: string) => setBookedEvents((s) => s.filter((t) => t.id !== id));

  return (
    <Router>
      <Layout darkMode={darkMode} setDarkMode={setDarkMode} onSignIn={signIn} onSignOut={signOut} currentUser={user}>
        <nav style={{ padding: 12 }}>
          <Link to="/">Home</Link> | <Link to="/tickets">Tickets</Link> | <Link to="/profile">Profile</Link>
          {!user ? <button onClick={signIn} style={{ marginLeft: 8 }}>Sign in</button> : <button onClick={signOut} style={{ marginLeft: 8 }}>Sign out</button>}
        </nav>
        <Routes>
          <Route path="/" element={<Home events={events} currentUser={user} onPublish={handlePublish} />} />
          <Route path="/tickets" element={<Tickets bookedEvents={bookedEvents} onCancel={handleCancel} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/event/:id" element={<EventDetail events={events} onBook={handleBook} />} />
        </Routes>
        <div style={navStyles.bottomNav}>weOut</div>
      </Layout>
    </Router>
  );
}
