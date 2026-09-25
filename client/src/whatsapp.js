// Replace with the real business WhatsApp number, digits only, country code first, no plus or spaces.
export const WHATSAPP_PHONE = '15551234567';
export const WHATSAPP_DISPLAY = '+1 555 123 4567';

export const DEFAULT_MESSAGE =
  "Hi Shine & Sparkle Cleaning, I'd like to book a cleaning. Could you help me get started?";

export function buildWhatsAppUrl(message = DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
