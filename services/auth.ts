import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Role = 'user' | 'organizer';

export interface UserInfo {
  uid: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Sign in with Google using Firebase Authentication
 */
export async function signInWithGoogle(): Promise<UserInfo> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user role exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let role: Role = 'user'; // default role
    
    if (userDoc.exists()) {
      role = userDoc.data().role || 'user';
    } else {
      // Create new user profile in Firestore
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        role: role,
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
    console.error('Google sign-in error:', error);
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
