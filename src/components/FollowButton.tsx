import React, { useState, useEffect } from 'react';
import { db, doc, updateDoc, getDoc, addDoc, collection, Timestamp } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, UserCheck, Loader } from 'lucide-react';

interface FollowButtonProps {
  organizerId: string;
  organizerName?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FollowButton({
  organizerId,
  organizerName = 'this organizer',
  size = 'md',
  className = '',
}: FollowButtonProps) {
  const { profile, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't show the button on your own profile or if you're an organizer
  if (!profile || profile.role !== 'attendee' || profile.uid === organizerId) return null;

  useEffect(() => {
    setIsFollowing(profile.following?.includes(organizerId) ?? false);
  }, [profile.following, organizerId]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    setLoading(true);

    try {
      const attendeeRef = doc(db, 'users', profile.uid);
      const organizerRef = doc(db, 'users', organizerId);

      const currentFollowing = profile.following ?? [];

      if (isFollowing) {
        // Unfollow
        const newFollowing = currentFollowing.filter((id) => id !== organizerId);
        await updateDoc(attendeeRef, { following: newFollowing });

        // Remove from organizer's followers list
        const orgSnap = await getDoc(organizerRef);
        if (orgSnap.exists()) {
          const orgData = orgSnap.data();
          const currentFollowers: string[] = orgData.followers ?? [];
          await updateDoc(organizerRef, {
            followers: currentFollowers.filter((id) => id !== profile.uid),
            followerCount: Math.max(0, (orgData.followerCount ?? 1) - 1),
          });
        }

        setIsFollowing(false);
      } else {
        // Follow
        const newFollowing = [...currentFollowing, organizerId];
        await updateDoc(attendeeRef, { following: newFollowing });

        // Add to organizer's followers list
        const orgSnap = await getDoc(organizerRef);
        if (orgSnap.exists()) {
          const orgData = orgSnap.data();
          const currentFollowers: string[] = orgData.followers ?? [];
          if (!currentFollowers.includes(profile.uid)) {
            await updateDoc(organizerRef, {
              followers: [...currentFollowers, profile.uid],
              followerCount: (orgData.followerCount ?? 0) + 1,
            });
          }
        }

        // Send a notification to the organizer
        await addDoc(collection(db, 'notifications'), {
          userId: organizerId,
          title: 'New Follower!',
          message: `${profile.displayName || 'Someone'} started following you.`,
          type: 'follow',
          read: false,
          createdAt: Timestamp.now(),
          fromUserId: profile.uid,
        });

        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  const smClass = 'px-3 py-1.5 text-xs rounded-xl gap-1.5';
  const mdClass = 'px-5 py-2.5 text-sm rounded-2xl gap-2';

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? `Unfollow ${organizerName}` : `Follow ${organizerName}`}
      className={`
        flex items-center font-bold transition-all disabled:opacity-60
        ${size === 'sm' ? smClass : mdClass}
        ${isFollowing
          ? 'bg-violet-100 text-violet-700 hover:bg-red-50 hover:text-red-600 border border-violet-200 hover:border-red-200'
          : 'bg-violet-600 text-white hover:bg-violet-700 border border-violet-600'}
        ${className}
      `}
    >
      {loading ? (
        <Loader size={size === 'sm' ? 12 : 15} className="animate-spin" />
      ) : isFollowing ? (
        <UserCheck size={size === 'sm' ? 12 : 15} />
      ) : (
        <UserPlus size={size === 'sm' ? 12 : 15} />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
