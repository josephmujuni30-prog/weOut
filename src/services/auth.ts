// src/services/auth.ts

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  photo: string;
  role: 'attendee' | 'organizer';
}

export const simulateGoogleLogin = async (): Promise<UserInfo> => {
  // This simulates the Firebase Google Auth popup
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: "user_123",
        name: "Joseph",
        email: "joseph@gmail.com",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joseph",
        role: 'organizer'
      });
    }, 1500);
  });
};