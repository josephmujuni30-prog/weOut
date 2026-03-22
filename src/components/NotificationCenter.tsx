import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';
import { Bell, CheckCircle2, AlertCircle, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

function NotificationIcon({ type }: { type: Notification['type'] }) {
  switch (type) {
    case 'reminder':   return <AlertCircle size={15} className="text-blue-500" />;
    case 'booking':    return <CheckCircle2 size={15} className="text-green-500" />;
    case 'follow':     return <UserPlus size={15} className="text-violet-500" />;
    default:           return <Info size={15} className="text-stone-400" />;
  }
}

export default function NotificationCenter() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
    });
    return () => unsubscribe();
  }, [profile]);

  const markAsRead = async (id: string) => {
    try { await updateDoc(doc(db, 'notifications', id), { read: true }); }
    catch (error) { console.error('Error marking read:', error); }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) { console.error('Error marking all read:', error); }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/60 hover:text-white transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black" aria-live="polite">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-violet-400 transition-colors">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto" role="list">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <button key={n.id}
                        className={`w-full text-left p-4 flex gap-3 transition-colors hover:bg-white/5 ${n.read ? 'opacity-50' : ''}`}
                        onClick={() => markAsRead(n.id)}
                        role="listitem"
                      >
                        <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
                          <NotificationIcon type={n.type} />
                        </div>
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <p className="text-sm font-bold text-white">{n.title}</p>
                          <p className="text-xs text-white/60 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-white/30">
                            {format(n.createdAt.toDate(), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <Bell className="mx-auto text-white/10" size={32} />
                    <p className="text-white/30 italic text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
