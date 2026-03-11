import { auth, db } from "../firebaseConfigs";
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { Category, UserRole } from "../../types";

export interface UserInfo {
  uid: string;
  name: string;
  email: string;
  photo: string;
  role: UserRole;
}

/**
 * Real Google sign-in using Firebase (signInWithPopup).
 * - Loads existing role (attendee/organizer) from Firestore if present.
 * - On first login, creates a full user profile document in Firestore.
 */
export const signInWithGoogle = async (): Promise<UserInfo> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userDocRef = doc(db, "users", user.uid);
  const snap = await getDoc(userDocRef);

  let role: UserRole = "attendee";
  if (snap.exists()) {
    const data = snap.data() as { role?: unknown };
    role = data.role === "organizer" ? "organizer" : "attendee";
  } else {
    const defaultInterests: Category[] = [];
    const defaultPreferredAreas: string[] = [];
    await setDoc(userDocRef, {
      uid: user.uid,
      name: user.displayName || "User",
      email: user.email || "",
      avatar: user.photoURL || "",
      interests: defaultInterests,
      preferredAreas: defaultPreferredAreas,
      role,
      createdAt: serverTimestamp(),
    });
  }

  return {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email || "",
    photo: user.photoURL || "",
    role,
  };
};

/**
 * Sign out from Firebase.
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};
