// simple stub for google sign-in and user identity

type Role = 'user' | 'organizer';

export interface UserInfo {
  uid: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Simulate a Google sign-in flow. In real code you'd call
 * firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()) etc.
 * Here we just prompt the user for a name and role and return a fake uid.
 */
export async function simulateGoogleLogin(): Promise<UserInfo> {
  const name = prompt('Enter your name for login (simulated)') || 'Guest';
  const email = prompt('Enter email address (simulated)') || 'guest@example.com';
  const role: Role = confirm('Are you an organizer?  OK = yes, Cancel = no') ? 'organizer' : 'user';
  // create random id
  const uid = 'uid_' + Math.random().toString(36).slice(2);
  return { uid, name, email, role };
}
