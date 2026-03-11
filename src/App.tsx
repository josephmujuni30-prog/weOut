import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams
} from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp } from "firebase/firestore"; // REAL FIRESTORE
import { auth, db } from "./firebaseConfigs"; // Ensure db is exported from your config
import { Event, Category } from "../types";
import EventsMap from "./components/EventsMap";

// --- LOCAL TYPES ---
interface UserInfo {
  uid: string;
  name: string;
  email: string;
  role?: string;
}

// --- COMPONENTS (Layout & Detail) ---
const Layout: React.FC<{ children: React.ReactNode; darkMode: boolean; user: UserInfo | null; onSignIn: () => void; onSignOut: () => void }> = ({ children, darkMode, user, onSignIn, onSignOut }) => (
  <div style={{ backgroundColor: darkMode ? "#121212" : "#ffffff", color: darkMode ? "#ffffff" : "#000000", minHeight: "100vh", transition: "all 0.3s" }}>
    <nav style={{ padding: 12, borderBottom: "1px solid #ccc" }}>
      <Link to="/">Home</Link> | <Link to="/map">Map</Link> | <Link to="/tickets">Tickets</Link> | <Link to="/profile">Profile</Link>
      {!user ? (
        <button onClick={onSignIn} style={{ marginLeft: 8 }}>Sign in</button>
      ) : (
        <span style={{ marginLeft: 8 }}>
          {user.name} <button onClick={onSignOut}>Sign out</button>
        </span>
      )}
    </nav>
    {children}
  </div>
);

const Home: React.FC<{ events: Event[]; onPublish: (title: string) => void }> = ({ events, onPublish }) => {
  const [title, setTitle] = useState("");
  return (
    <div style={{ padding: 20 }}>
      <h2>Real-Time Events</h2>
      <div style={{ marginBottom: 20 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
        <button onClick={() => { onPublish(title); setTitle(""); }}>Publish to Firestore</button>
      </div>
      {events.map((ev) => (
        <div key={ev.id} style={{ padding: "10px 0" }}>
          <Link to={`/event/${ev.id}`}>{ev.title}</Link>
        </div>
      ))}
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [darkMode] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // 1. REAL-TIME AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({ uid: u.uid, name: u.displayName || "", email: u.email || "" });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. REAL-TIME FIRESTORE LISTENER
  useEffect(() => {
    // This "onSnapshot" makes the app update instantly when a new event is added
    const q = query(collection(db, "events"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventData);
    });
    return () => unsubscribe();
  }, []);

  // 3. REAL AUTH ACTIONS
  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const signOut = () => firebaseSignOut(auth);

  // 4. REAL DATABASE WRITE
  const handlePublish = async (title: string) => {
    if (!user) return alert("Must be logged in!");
    try {
      await addDoc(collection(db, "events"), {
        title: title || "New Event",
        organizerId: user.uid, // Matches your Private Rules!
        createdAt: serverTimestamp(),
        category: Category.MUSIC,
        price: 0
      });
    } catch (err) {
      console.error("Error adding event:", err);
    }
  };

  return (
    <Router>
      <Layout darkMode={darkMode} user={user} onSignIn={signIn} onSignOut={signOut}>
        <Routes>
          <Route path="/" element={<Home events={events} onPublish={handlePublish} />} />
          <Route path="/map" element={<EventsMap events={events} />} />
          <Route path="/tickets" element={<div style={{padding:20}}>Tickets coming soon...</div>} />
          <Route path="/profile" element={<div style={{padding:20}}>Profile: {user?.name}</div>} />
          <Route path="/event/:id" element={<div style={{padding:20}}>Event Details View</div>} />
        </Routes>
        <div style={{ position: "fixed", bottom: 0, width: "100%", padding: 15, backgroundColor: "#8b5cf6", color: "white", textAlign: "center" }}>
          weOut
        </div>
      </Layout>
    </Router>
  );
}