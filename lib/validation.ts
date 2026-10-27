import { z } from 'zod';
const text = z.string().trim().max(300);
const mapUrl = z.union([z.literal(''), z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol))]);
export const settingsSchema = z.object({
  time: z.object({ hour: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/), meridiem: z.enum(['AM', 'PM', '']), activityLabel: text }),
  venue: z.object({ placeLabel: text, ceremonyLabel: text, churchName: text, address: text, mapUrl }),
  whatsapp: z.object({ defaultRecipientPhone: z.string().regex(/^[+\d\s()-]{0,25}$/), bryanPhone: z.string().regex(/^[+\d\s()-]{0,25}$/), lyndelPhone: z.string().regex(/^[+\d\s()-]{0,25}$/) }),
  itinerary: z.array(z.object({ id: text, time: z.string().trim().min(1).max(40), title: text.min(1), description: z.string().max(2000), icon: z.enum(['reception', 'ceremony', 'worship', 'dinner', 'closing-worship']) })).min(1).max(30),
});
export const guestSchema = z.object({
  id: z.uuid(), fullName: z.string().trim().min(2).max(160), attendance: z.enum(['yes', 'no']),
  guestCount: z.number().int().min(1).max(12), message: z.string().trim().max(2000), recipientTarget: z.enum(['any', 'bryan', 'lyndel']),
});
