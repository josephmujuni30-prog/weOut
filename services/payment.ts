// stubbed payment and notification utilities for weOut

import { Event } from '../types';

/**
 * Simulate an M-Pesa STK Push request. In a real app you'd call Safaricom's API.
 * Here we wait a moment and then resolve as if the push succeeded.
 */
export async function simulateMpesaStkPush(amount: number, phone: string): Promise<void> {
  console.log(`Simulating STK Push: amount=${amount}, phone=${phone}`);
  return new Promise(resolve => setTimeout(resolve, 1200));
}

/**
 * Send a confirmation email to the user. This is a stub that simply logs the
 * information; a production version would call your backend/email service.
 */
export async function sendBookingEmail(email: string, event: Event): Promise<void> {
  console.log(`Sending booking email to ${email} for event "${event.title}"`);
  // artificially delay so callers can await
  return new Promise(resolve => setTimeout(resolve, 500));
}
