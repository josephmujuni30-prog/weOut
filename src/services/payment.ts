// src/services/payment.ts

export const simulateMpesaStkPush = async (phone: string, amount: number) => {
  console.log(`Initiating STK Push to ${phone} for Ksh ${amount}...`);
  // In the future, your Daraja API logic goes here
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, checkoutRequestID: "ws_CO_24022026..." });
    }, 2000);
  });
};

export const sendBookingEmail = async (email: string, eventName: string) => {
  console.log(`Sending confirmation for ${eventName} to ${email}...`);
  // Future integration with SendGrid or EmailJS
  return true;
};