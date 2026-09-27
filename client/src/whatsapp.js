// Replace with the real business WhatsApp number, digits only, country code first, no plus or spaces.
export const WHATSAPP_PHONE = '353852850720';
export const WHATSAPP_DISPLAY = '+353 85 285 0720';

export const DEFAULT_MESSAGE =
  "Hi Shine & Sparkle Cleaning, I'd like to book a cleaning. Could you help me get started?";

export function buildWhatsAppUrl(message = DEFAULT_MESSAGE, customPhone) {
  const phone = (customPhone || WHATSAPP_PHONE).replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildQuoteWhatsAppMessage({
  serviceName,
  cadence,
  areaSqm,
  estimatedPrice,
  name,
  notes,
  brandName = 'Shine & Sparkle Cleaning',
}) {
  const parts = [`Hi ${brandName}! 🧹`, 'I would like to request a quote:'];

  if (serviceName) {
    parts.push(`• Service: ${serviceName}${cadence ? ` (${cadence})` : ''}`);
  }
  if (areaSqm) {
    const areaText = String(areaSqm).toLowerCase().includes('m') || String(areaSqm).toLowerCase().includes('room')
      ? areaSqm
      : `${areaSqm} m²`;
    parts.push(`• Space: ${areaText}`);
  }
  if (name && name.trim()) {
    parts.push(`• Name: ${name.trim()}`);
  }
  if (notes && notes.trim()) {
    parts.push(`• Details / Notes: ${notes.trim()}`);
  }

  return parts.join('\n');
}

export function buildContactWhatsAppMessage({ name, email, phone, message, brandName = 'Shine & Sparkle Cleaning' }) {
  const parts = [`Hi ${brandName}! 👋`, 'I have a question from your website:'];

  if (name && name.trim()) {
    parts.push(`• Name: ${name.trim()}`);
  }
  if (email && email.trim()) {
    parts.push(`• Email: ${email.trim()}`);
  }
  if (phone && phone.trim()) {
    parts.push(`• Phone: ${phone.trim()}`);
  }
  if (message && message.trim()) {
    parts.push(`\nMessage:\n${message.trim()}`);
  }

  return parts.join('\n');
}
