import { auth, db } from './firebase';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Role = 'attendee' | 'organizer';

export interface UserInfo {
  uid: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Sign in with Google using redirect (works when popups are blocked).
 * Call getRedirectResult(auth) on app load to complete sign-in after return.
 */
export async function signInWithGoogle(): Promise<UserInfo> {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
  // Page redirects to Google; after sign-in, app must handle getRedirectResult on load
  return new Promise(() => {}); // never resolves (page unloads)
}

/**
 * Call this on app load to complete sign-in after redirect. Returns user if they just signed in.
 */
export async function getGoogleRedirectUser(): Promise<UserInfo | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    let role: Role = 'attendee';
    if (userDoc.exists()) {
      const data = userDoc.data() as { role?: unknown };
      role = data.role === 'organizer' ? 'organizer' : 'attendee';
    } else {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        role,
        createdAt: new Date(),
      });
    }
    return {
      uid: user.uid,
      name: user.displayName || 'User',
      email: user.email || '',
      role: role,
    };
  } catch (error) {
    console.error('Google redirect sign-in error:', error);
    throw error;
  }
}

/**
 * Sign out from Firebase
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}

/**
 * For backward compatibility - alias for signInWithGoogle
 */
export async function simulateGoogleLogin(): Promise<UserInfo> {
  return signInWithGoogle();
}
