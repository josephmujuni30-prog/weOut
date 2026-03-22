import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, db, deleteDoc, doc } from '../firebase';
import type { Event, Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, Trash2, Users, TrendingUp, DollarSign,
  X, CheckCircle2, Clock, Download, Search, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// ─── Attendee List Modal ──────────────────────────────────────────────────────
interface AttendeeModalProps {
  event: Event;
  bookings: Booking[];
  onClose: () => void;
}

function AttendeeModal({ event, bookings, onClose }: AttendeeModalProps) {
  const [search, setSearch] = useState('');
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  const eventBookings = bookings.filter((b) => b.eventId === event.id);
  const filtered = eventBookings.filter(
    (b) =>
      b.ticketType.toLowerCase().includes(search.toLowerCase()) ||
      b.userId.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCheckIn = (bookingId: string) => {
    setCheckedIn((prev) => {
      const next = new Set(prev);
      next.has(bookingId) ? next.delete(bookingId) : next.add(bookingId);
      return next;
    });
  };

  const exportCSV = () => {
    const rows = [
      ['Booking ID', 'User ID', 'Ticket Type', 'Quantity', 'Amount (KES)', 'Payment Method', 'Status', 'Checked In'],
      ...eventBookings.map((b) => [
        b.id, b.userId, b.ticketType, b.quantity, b.totalAmount,
        b.paymentMethod, b.paymentStatus, checkedIn.has(b.id) ? 'Yes' : 'No',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTickets = eventBookings.reduce((acc, b) => acc + b.quantity, 0);
  const totalRevenue = eventBookings.reduce((acc, b) => acc + b.totalAmount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">{event.title}</h2>
            <p className="text-stone-500 text-sm mt-1">
              {format(event.date.toDate(), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 p-1">
            <X size={22} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-stone-100">
          {[
            { label: 'Total Tickets', value: totalTickets },
            { label: 'Checked In', value: `${checkedIn.size} / ${eventBookings.length}` },
            { label: 'Revenue', value: `KES ${totalRevenue.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-stone-900">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Export */}
        <div className="p-4 border-b border-stone-100 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input
              type="text"
              placeholder="Search by ticket type or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-stone-900 outline-none"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            <Download size={14} /> CSV
          </button>
        </div>

        {/* Attendee list */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400 italic">
              {search ? 'No attendees match your search.' : 'No bookings yet for this event.'}
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {filtered.map((booking) => {
                const isChecked = checkedIn.has(booking.id);
                return (
                  <div
                    key={booking.id}
                    className={`flex items-center gap-4 p-4 transition-colors ${isChecked ? 'bg-green-50' : 'hover:bg-stone-50'}`}
                  >
                    {/* Check-in toggle */}
                    <button
                      onClick={() => toggleCheckIn(booking.id)}
                      aria-label={isChecked ? 'Undo check-in' : 'Mark as checked in'}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isChecked
                          ? 'bg-green-500 text-white shadow-md'
                          : 'border-2 border-stone-200 text-stone-300 hover:border-green-400 hover:text-green-400'
                      }`}
                    >
                      <CheckCircle2 size={20} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-stone-700 truncate">
                        {booking.userId.slice(0, 16)}...
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-stone-500">{booking.ticketType} × {booking.quantity}</span>
                        <span className="text-xs text-stone-500">{booking.paymentMethod.toUpperCase()}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          booking.paymentStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-stone-900 text-sm">KES {booking.totalAmount.toLocaleString()}</p>
                      <p className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 ${isChecked ? 'text-green-600' : 'text-stone-400'}`}>
                        {isChecked
                          ? <><CheckCircle2 size={10} /> Checked in</>
                          : <><Clock size={10} /> Not checked in</>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const qEvents = query(collection(db, 'events'), where('organizerId', '==', profile.uid));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Event)));
      setLoading(false);
    });

    const qBookings = query(collection(db, 'bookings'), where('organizerId', '==', profile.uid));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
    });

    return () => { unsubEvents(); unsubBookings(); };
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      await deleteDoc(doc(db, 'events', id));
    }
  };

  const exportAllCSV = () => {
    const rows = [
      ['Event', 'Booking ID', 'User ID', 'Ticket Type', 'Qty', 'Amount (KES)', 'Payment Method', 'Status'],
      ...bookings.map((b) => {
        const ev = events.find((e) => e.id === b.eventId);
        return [ev?.title || b.eventId, b.id, b.userId, b.ticketType, b.quantity, b.totalAmount, b.paymentMethod, b.paymentStatus];
      }),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weOut-all-bookings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => e.status === 'published').length,
    totalTicketsSold: bookings.reduce((acc, b) => acc + b.quantity, 0),
    totalRevenue: bookings.reduce((acc, b) => acc + b.totalAmount, 0),
  };

  return (
    <>
      <AnimatePresence>
        {selectedEvent && (
          <AttendeeModal
            event={selectedEvent}
            bookings={bookings}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-stone-900">Organizer Dashboard</h1>
            <p className="text-stone-500">Manage your events and track performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportAllCSV}
              className="flex items-center gap-2 border-2 border-stone-200 px-4 py-2.5 rounded-2xl text-sm font-bold text-stone-700 hover:border-stone-900 transition-colors"
            >
              <Download size={16} /> Export All
            </button>
            <Link
              to="/create-event"
              className="bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Create Event
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <TrendingUp size={20} />, label: 'Total Events', value: stats.totalEvents },
            { icon: <TrendingUp size={20} />, label: 'Published', value: stats.publishedEvents },
            { icon: <Users size={20} />, label: 'Tickets Sold', value: stats.totalTicketsSold },
            { icon: <DollarSign size={20} />, label: 'Revenue', value: `KES ${stats.totalRevenue.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600">{s.icon}</div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">{s.label}</p>
              <p className="text-3xl font-bold text-stone-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Your Events</h3>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-stone-400">Loading your events...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-stone-400 italic">
              You haven't created any events yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {events.map((event) => {
                const eventBookings = bookings.filter((b) => b.eventId === event.id);
                const soldCount = eventBookings.reduce((acc, b) => acc + b.quantity, 0);
                const totalCapacity = event.ticketTypes.reduce((acc, t) => acc + t.capacity, 0);
                const revenue = eventBookings.reduce((acc, b) => acc + b.totalAmount, 0);
                const fillPct = totalCapacity > 0 ? Math.min((soldCount / totalCapacity) * 100, 100) : 0;
                const isExpanded = expandedEvent === event.id;

                return (
                  <div key={event.id}>
                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/50 transition-colors">
                      <img
                        src={event.coverImage || `https://picsum.photos/seed/${event.id}/100/100`}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-900 truncate">{event.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {format(event.date.toDate(), 'MMM d, yyyy')} · {event.location.address}
                        </p>
                      </div>

                      <span className={`hidden md:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${
                        event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {event.status}
                      </span>

                      <div className="hidden md:block w-28 space-y-1 flex-shrink-0">
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-stone-900 rounded-full" style={{ width: `${fillPct}%` }} />
                        </div>
                        <p className="text-[10px] text-stone-400 font-bold">{soldCount} / {totalCapacity}</p>
                      </div>

                      <p className="hidden md:block text-sm font-bold text-stone-900 flex-shrink-0 w-28 text-right">
                        KES {revenue.toLocaleString()}
                      </p>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          title="View attendees & check-in"
                          className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                        >
                          <Users size={17} />
                        </button>
                        <button
                          onClick={() => navigate(`/edit-event/${event.id}`)}
                          title="Edit event"
                          className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          title="Delete event"
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={17} />
                        </button>
                        <button
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                          title="Ticket breakdown"
                          className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable ticket breakdown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-stone-50 border-t border-stone-100"
                        >
                          <div className="px-6 py-4 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Ticket Breakdown</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {event.ticketTypes.map((ticket) => {
                                const ticketSold = eventBookings
                                  .filter((b) => b.ticketType === ticket.name)
                                  .reduce((acc, b) => acc + b.quantity, 0);
                                const tFill = ticket.capacity > 0 ? (ticketSold / ticket.capacity) * 100 : 0;
                                return (
                                  <div key={ticket.name} className="bg-white rounded-2xl p-4 border border-stone-100">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-bold text-stone-900 text-sm">{ticket.name}</p>
                                      <p className="text-xs font-bold text-stone-500">
                                        {ticket.price === 0 ? 'Free' : `KES ${ticket.price.toLocaleString()}`}
                                      </p>
                                    </div>
                                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1">
                                      <div className="h-full bg-stone-900 rounded-full" style={{ width: `${tFill}%` }} />
                                    </div>
                                    <p className="text-[10px] text-stone-400">{ticketSold} / {ticket.capacity} sold</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
